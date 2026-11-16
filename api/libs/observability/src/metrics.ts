import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpCounter = new Counter({
  name: 'darzaan_http_requests_total',
  help: 'HTTP requests handled by this process',
  labelNames: ['service', 'status'] as const,
  registers: [registry],
});

export const publishCounter = new Counter({
  name: 'darzaan_kafka_publish_total',
  help: 'Kafka publishes and dead-letter sends',
  labelNames: ['result'] as const,
  registers: [registry],
});

export const outboxGaugeHelp = new Counter({
  name: 'darzaan_outbox_published_total',
  help: 'Outbox rows published by the worker',
  registers: [registry],
});
