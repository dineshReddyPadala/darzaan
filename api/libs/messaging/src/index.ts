import { Kafka, logLevel, type Consumer, type Producer, type SASLOptions } from 'kafkajs';
import type { DomainEvent } from '../../common/src/events';
import { deadTopic, retryTopic, topicFor } from '../../common/src/events';
import { planRetry } from '../../common/src/retry';
import { createLogger } from '../../observability/src/logger';
import { publishCounter } from '../../observability/src/metrics';

const logger = createLogger('kafka');

export interface ConsumedMessage {
  event: DomainEvent;
  attempt: number;
  topic: string;
}

export class KafkaBus {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private consumers: Consumer[] = [];

  enabled(): boolean {
    return Boolean(process.env.KAFKA_BROKERS);
  }

  private client(): Kafka {
    if (this.kafka) return this.kafka;
    const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
    const username = process.env.KAFKA_USERNAME;
    const password = process.env.KAFKA_PASSWORD;
    const sasl: SASLOptions | undefined = username && password ? { mechanism: 'plain', username, password } : undefined;
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? 'darzaan',
      brokers,
      ssl: process.env.KAFKA_SSL === 'true',
      sasl,
      logLevel: logLevel.NOTHING,
    });
    return this.kafka;
  }

  async connectProducer(): Promise<void> {
    if (!this.enabled() || this.producer) return;
    this.producer = this.client().producer({ idempotent: true, allowAutoTopicCreation: true });
    await this.producer.connect();
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.enabled()) {
      logger.info({ type: event.type, eventId: event.eventId }, 'kafka not configured; event left in the outbox');
      return;
    }
    await this.connectProducer();
    await this.producer!.send({
      topic: topicFor(event.type, event.version),
      acks: -1,
      messages: [{ key: event.aggregateId, value: JSON.stringify(event), headers: { eventId: event.eventId, type: event.type } }],
    });
    publishCounter.inc({ result: 'ok' });
  }

  async publishRaw(topic: string, key: string, value: unknown, headers: Record<string, string> = {}): Promise<void> {
    if (!this.enabled()) return;
    await this.connectProducer();
    await this.producer!.send({
      topic,
      acks: -1,
      messages: [{ key, value: JSON.stringify(value), headers }],
    });
  }

  async consume(groupId: string, topics: string[], handler: (message: ConsumedMessage) => Promise<void>): Promise<void> {
    if (!this.enabled()) return;
    await this.ensureTopics(topics);
    const consumer = this.client().consumer({ groupId });
    await consumer.connect();
    for (const topic of topics) await consumer.subscribe({ topic, fromBeginning: true });
    this.consumers.push(consumer);
    await consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        const raw = message.value?.toString('utf8') ?? '{}';
        const event = JSON.parse(raw) as DomainEvent;
        const attemptHeader = message.headers?.attempt;
        const attempt = Number((Buffer.isBuffer(attemptHeader) ? attemptHeader.toString() : attemptHeader) ?? '0');
        try {
          await handler({ event, attempt, topic });
          await consumer.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);
        } catch (error) {
          logger.error({ err: error, topic, eventId: event.eventId }, 'consumer failed');
          await this.fail({ event, attempt: attempt + 1, topic: topicFor(event.type, event.version) });
          await consumer.commitOffsets([{ topic, partition, offset: (BigInt(message.offset) + 1n).toString() }]);
        }
        await heartbeat();
      },
    });
  }

  /** Record a failure onto a delay topic or the dead-letter topic. */
  async fail(input: { event: DomainEvent; attempt: number; topic: string }): Promise<{ dead: boolean; delayMs?: number }> {
    const plan = planRetry(input.attempt);
    if (plan.dead) {
      await this.publishRaw(deadTopic(input.event.type, input.event.version), input.event.aggregateId, input.event, { attempt: String(input.attempt) });
      publishCounter.inc({ result: 'dlq' });
      return { dead: true };
    }
    await this.publishRaw(retryTopic(input.event.type, plan.suffix, input.event.version), input.event.aggregateId, input.event, {
      attempt: String(input.attempt),
      nextAttemptAt: new Date(Date.now() + plan.delayMs).toISOString(),
    });
    return { dead: false, delayMs: plan.delayMs };
  }

  private async ensureTopics(topics: string[]): Promise<void> {
    const admin = this.client().admin();
    await admin.connect();
    try {
      await admin.createTopics({
        waitForLeaders: true,
        topics: topics.map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 })),
      });
    } finally {
      await admin.disconnect();
    }
  }

  async health(): Promise<boolean> {
    if (!this.enabled()) return true;
    const admin = this.client().admin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();
    return true;
  }

  async disconnect(): Promise<void> {
    await Promise.all(this.consumers.map((consumer) => consumer.disconnect().catch(() => undefined)));
    if (this.producer) await this.producer.disconnect().catch(() => undefined);
  }
}

export const kafkaBus = new KafkaBus();
