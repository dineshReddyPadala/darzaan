import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { DomainEvent } from '../../../libs/common/src/events';
import { deadTopic, retryTopic, topicFor } from '../../../libs/common/src/events';
import { RETRY_DELAYS_MS } from '../../../libs/common/src/retry';
import { kafkaBus } from '../../../libs/messaging/src';
import { createLogger } from '../../../libs/observability/src/logger';
import { outboxGaugeHelp } from '../../../libs/observability/src/metrics';
import { PrismaService } from './prisma.service';

const logger = createLogger('worker');
const TYPES = ['order.created', 'order.confirmed', 'order.cancelled', 'payment.recorded', 'price_request.created', 'price_request.answered', 'garment.stage_changed', 'qc.failed', 'qc.passed', 'trial.booked', 'alteration.opened'];
const SUFFIXES = ['retry.5s', 'retry.30s', 'retry.2m', 'retry.10m'];

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastRiskLog = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const retryTopics = TYPES.flatMap((type) => SUFFIXES.map((suffix) => retryTopic(type, suffix)));
    const deadTopics = TYPES.map((type) => deadTopic(type));
    await kafkaBus.consume('worker-retry', [...retryTopics, ...deadTopics], async ({ event, topic, attempt }) => {
      if (topic.endsWith('.dlq')) {
        logger.error({ eventId: event.eventId, type: event.type, attempt }, 'event landed on the dead-letter topic');
        return;
      }
      const delay = RETRY_DELAYS_MS[Math.max(0, attempt - 1)] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      await this.prisma.retryJob.upsert({
        where: { id: `${event.eventId}:${attempt}` },
        create: {
          id: `${event.eventId}:${attempt}`,
          topic: topicFor(event.type, event.version),
          payload: event as object,
          attempt,
          nextAttemptAt: new Date(Date.now() + delay),
        },
        update: { nextAttemptAt: new Date(Date.now() + delay) },
      });
    });
    this.timer = setInterval(() => void this.tick().catch((error) => logger.error({ err: error }, 'worker tick failed')), 2000);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await kafkaBus.disconnect();
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.publishOutbox();
      await this.publishRetries();
      await this.cleanup();
      await this.scanRisk();
    } finally {
      this.running = false;
    }
  }

  private async publishOutbox(): Promise<void> {
    const rows = await this.prisma.$queryRaw<Array<{ id: string; payload: DomainEvent }>>`
      UPDATE outbox_events SET locked_at = NOW(), attempts = attempts + 1
      WHERE id IN (
        SELECT id FROM outbox_events
        WHERE published_at IS NULL AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '30 seconds')
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 20
      )
      RETURNING id, payload
    `;
    for (const row of rows) {
      const event = row.payload;
      try {
        await kafkaBus.publish(event);
        await this.prisma.outboxEvent.update({ where: { id: row.id }, data: { publishedAt: new Date(), lockedAt: null } });
        outboxGaugeHelp.inc();
      } catch (error) {
        logger.warn({ err: error, id: row.id }, 'publish failed; row stays unpublished');
        await this.prisma.outboxEvent.update({ where: { id: row.id }, data: { lockedAt: null } });
      }
    }
  }

  private async publishRetries(): Promise<void> {
    const due = await this.prisma.retryJob.findMany({ where: { nextAttemptAt: { lte: new Date() } }, take: 20 });
    for (const job of due) {
      const event = job.payload as unknown as DomainEvent;
      await kafkaBus.publish(event);
      await this.prisma.retryJob.delete({ where: { id: job.id } });
    }
  }

  private async cleanup(): Promise<void> {
    const now = new Date();
    await this.prisma.idempotencyKey.deleteMany({ where: { expiresAt: { lt: now } } });
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await this.prisma.processedEvent.deleteMany({ where: { processedAt: { lt: monthAgo } } });
  }

  private async scanRisk(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = await this.prisma.order.count({
      where: { deletedAt: null, deliveryDate: { lt: today }, status: { notIn: ['Closed', 'Cancelled'] } },
    });
    if (overdue > 0 && Date.now() - this.lastRiskLog > 60_000) {
      this.lastRiskLog = Date.now();
      logger.info({ overdue }, 'overdue orders still open');
    }
  }
}
