import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '../../../../generated/notification';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import type { DomainEvent } from '../../../../libs/common/src/events';
import { entityId } from '../../../../libs/common/src/scope';
import { topicFor } from '../../../../libs/common/src/events';
import { kafkaBus } from '../../../../libs/messaging/src';
import { LogNotificationChannel } from './channel';
import { PrismaService } from '../shared/prisma.service';

const RECENT_MS = 15_000;

const COPY: Record<string, { title: string; category: string }> = {
  'order.created': { title: 'Order created', category: 'Order Updates' },
  'order.confirmed': { title: 'Order confirmed', category: 'Order Updates' },
  'order.cancelled': { title: 'Order cancelled', category: 'Order Updates' },
  'payment.recorded': { title: 'Payment recorded', category: 'Payments' },
  'price_request.created': { title: 'Design to price', category: 'Action Required' },
  'price_request.answered': { title: 'Design price is in', category: 'Order Updates' },
  'garment.stage_changed': { title: 'Garment moved', category: 'Production' },
  'qc.failed': { title: 'Quality check failed', category: 'Production' },
  'qc.passed': { title: 'Quality check passed', category: 'Production' },
  'trial.booked': { title: 'Trial booked', category: 'Customer' },
  'alteration.opened': { title: 'Alteration opened', category: 'Order Updates' },
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly channel: LogNotificationChannel,
  ) {}

  async onModuleInit(): Promise<void> {
    const topics = Object.keys(COPY).map((type) => topicFor(type));
    await kafkaBus.consume('notification-service', topics, async ({ event }) => {
      await this.consume(event);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await kafkaBus.disconnect();
  }

  async consume(event: DomainEvent): Promise<{ created: boolean }> {
    const already = await this.prisma.processedEvent.findUnique({ where: { consumer_eventId: { consumer: 'notification-service', eventId: event.eventId } } });
    if (already) return { created: false };
    const orderId = entityId(event.payload.orderId) ?? entityId(event.aggregateId);
    const recent = await this.prisma.notification.findFirst({
      where: { orderId, createdAt: { gt: new Date(Date.now() - RECENT_MS) }, eventId: null },
    });
    const copy = COPY[event.type] ?? { title: event.type, category: 'System' };
    await this.prisma.$transaction(async (tx) => {
      await tx.processedEvent.create({ data: { consumer: 'notification-service', eventId: event.eventId } });
      if (!recent) {
        await tx.notification.create({
          data: {
            category: copy.category,
            severity: event.type === 'qc.failed' ? 'warning' : 'info',
            title: copy.title,
            body: orderId ? `${orderId}` : copy.title,
            orderId,
            at: event.occurredAt,
            eventId: event.eventId,
            audience: audienceFor(event.type) as Prisma.InputJsonValue,
          },
        });
      }
      await tx.messageLog.create({
        data: { channel: 'log', to: 'staff', body: `${copy.title} · ${orderId}`, status: 'logged', eventId: event.eventId },
      });
    });
    return { created: !recent };
  }

  async list(user: AuthUser) {
    const rows = await this.prisma.notification.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 200 });
    return rows.filter((row) => visible(row.audience, user.role)).map(toAlert);
  }

  async create(alert: Record<string, unknown>) {
    const id = entityId(alert.id);
    const data = {
      category: String(alert.category ?? 'System'),
      severity: String(alert.severity ?? 'info'),
      title: String(alert.title ?? ''),
      body: String(alert.body ?? ''),
      orderId: entityId(alert.orderId),
      href: typeof alert.href === 'string' ? alert.href : null,
      hrefLabel: typeof alert.hrefLabel === 'string' ? alert.hrefLabel : null,
      audience: (alert.audience ?? null) as Prisma.InputJsonValue,
      at: typeof alert.at === 'string' ? alert.at : new Date().toISOString(),
      read: Boolean(alert.read),
    };
    const row = id
      ? await this.prisma.notification.upsert({
        where: { id },
        create: { id, ...data },
        update: { title: data.title, body: data.body, read: data.read },
      })
      : await this.prisma.notification.create({ data });
    return toAlert(row);
  }

  async markRead(id: string) {
    const notificationId = entityId(id);
    if (notificationId) await this.prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
    return { ok: true };
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({ data: { read: true } });
    return { ok: true };
  }

  async remove(id: string) {
    const notificationId = entityId(id);
    if (notificationId) await this.prisma.notification.update({ where: { id: notificationId }, data: { deletedAt: new Date() } }).catch(() => undefined);
    return { ok: true };
  }

  async send(message: { to: string; channel: 'WhatsApp' | 'SMS' | 'Email'; body: string }) {
    const result = await this.channel.send(message);
    await this.prisma.messageLog.create({ data: { channel: message.channel, to: message.to, body: message.body, status: result.status } });
    return result;
  }
}

function audienceFor(type: string): string[] | null {
  if (type.startsWith('qc') || type.startsWith('garment') || type.startsWith('price_request')) return ['admin', 'production_head', 'production_assistant', 'qc'];
  if (type.startsWith('payment')) return ['admin', 'accountant', 'store_manager', 'salesperson'];
  return null;
}

function visible(audience: Prisma.JsonValue, role: string): boolean {
  if (!Array.isArray(audience) || audience.length === 0) return true;
  return audience.includes(role);
}

function toAlert(row: {
  id: number;
  category: string;
  severity: string;
  title: string;
  body: string;
  orderId: number | null;
  href: string | null;
  hrefLabel: string | null;
  audience: Prisma.JsonValue;
  at: string;
  read: boolean;
}) {
  return {
    id: row.id,
    category: row.category,
    severity: row.severity,
    title: row.title,
    body: row.body,
    orderId: row.orderId ?? undefined,
    href: row.href ?? undefined,
    hrefLabel: row.hrefLabel ?? undefined,
    audience: Array.isArray(row.audience) ? row.audience : undefined,
    at: row.at,
    read: row.read,
  };
}
