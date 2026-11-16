import { randomUUID } from 'crypto';

export interface DomainEvent {
  eventId: string;
  type: string;
  version: number;
  occurredAt: string;
  correlationId: string;
  causationId: string | null;
  aggregateId: string;
  payload: Record<string, unknown>;
}

export function topicFor(type: string, version = 1): string {
  return `darzaan.${type}.v${version}`;
}

export function retryTopic(type: string, suffix: string, version = 1): string {
  return `${topicFor(type, version)}.${suffix}`;
}

export function deadTopic(type: string, version = 1): string {
  return `${topicFor(type, version)}.dlq`;
}

export function createEvent(input: {
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  causationId?: string | null;
  version?: number;
}): DomainEvent {
  return {
    eventId: randomUUID(),
    type: input.type,
    version: input.version ?? 1,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId,
    causationId: input.causationId ?? null,
    aggregateId: input.aggregateId,
    payload: input.payload,
  };
}
