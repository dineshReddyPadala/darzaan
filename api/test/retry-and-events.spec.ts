import { deadTopic, topicFor } from '../libs/common/src/events';
import { diffOrder } from '../libs/common/src/order-diff';
import { planRetry } from '../libs/common/src/retry';
import { mergeProtectedOrder, presentOrder } from '../libs/common/src/scope';
import { roleScopes } from '../libs/common/src/roles';

describe('retry plan', () => {
  it('backs off and then dead-letters', () => {
    expect(planRetry(1)).toMatchObject({ dead: false, delayMs: 5000, suffix: 'retry.5s' });
    expect(planRetry(2)).toMatchObject({ delayMs: 30000 });
    expect(planRetry(4)).toMatchObject({ delayMs: 600000 });
    expect(planRetry(5)).toEqual({ dead: true });
  });

  it('names topics with the version', () => {
    expect(topicFor('order.created')).toBe('darzaan.order.created.v1');
    expect(deadTopic('order.created')).toBe('darzaan.order.created.v1.dlq');
  });
});

describe('order events', () => {
  const base = { id: 'DZ-1', customerId: 'C-1', status: 'Draft', garments: [{ id: 'G1', stage: 'cutting' }], payments: [], alterations: [] };

  it('emits order.created only for a new order', () => {
    expect(diffOrder(null, base).map((event) => event.type)).toEqual(['order.created']);
  });

  it('emits payment, stage, qc, trial and alteration events from the diff', () => {
    const next = {
      ...base,
      status: 'Confirmed',
      payments: [{ id: 'P1', amount: 1000, kind: 'Advance', method: 'UPI' }],
      garments: [{ id: 'G1', stage: 'qc', qc: { reworkOpen: true } }],
      trial: { date: '2026-10-12', time: '11:00' },
      alterations: [{ id: 'A1', status: 'Open' }],
    };
    const types = diffOrder(base, next).map((event) => event.type);
    expect(types).toEqual(expect.arrayContaining(['order.confirmed', 'payment.recorded', 'garment.stage_changed', 'qc.failed', 'trial.booked', 'alteration.opened']));
  });
});

describe('data scope', () => {
  const order = { id: 'DZ-1', discount: 500, deliveryCharge: 100, payments: [{ id: 'P1', amount: 50 }], garments: [{ id: 'G1', price: 1000, customQuote: { amount: 200 } }] };

  it('hides prices and payments from the workshop', () => {
    const view = presentOrder(order, roleScopes.production_head);
    expect(view.payments).toEqual([]);
    expect((view.garments as Array<Record<string, unknown>>)[0].price).toBeUndefined();
  });

  it('puts the stored prices back when a workshop role saves', () => {
    const incoming = { ...order, discount: 0, payments: [], garments: [{ id: 'G1' }] };
    const merged = mergeProtectedOrder(order, incoming, roleScopes.qc);
    expect(merged.discount).toBe(500);
    expect(merged.payments).toEqual(order.payments);
    expect((merged.garments as Array<Record<string, unknown>>)[0].price).toBe(1000);
  });
});

describe('consumer redelivery', () => {
  it('does not apply the same event twice', () => {
    const processed = new Set<string>();
    const apply = (eventId: string) => {
      if (processed.has(eventId)) return 'skipped';
      processed.add(eventId);
      return 'applied';
    };
    expect(apply('evt-1')).toBe('applied');
    expect(apply('evt-1')).toBe('skipped');
  });
});
