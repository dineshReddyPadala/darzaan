import { asArray, label, text } from './scope';

export interface EventDraft {
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
}

export function diffOrder(prev: Record<string, unknown> | null, next: Record<string, unknown>): EventDraft[] {
  const id = label(next.id);
  const events: EventDraft[] = [];
  if (!prev) {
    events.push({ type: 'order.created', aggregateId: id, payload: { orderId: id, status: next.status } });
    return events;
  }
  if (text(prev.status) !== text(next.status)) {
    if (next.status === 'Confirmed') events.push({ type: 'order.confirmed', aggregateId: id, payload: { orderId: id } });
    else if (next.status === 'Cancelled') events.push({ type: 'order.cancelled', aggregateId: id, payload: { orderId: id } });
  }
  const previousPayments = new Set(asArray(prev.payments).map((row) => label(row.id)));
  for (const payment of asArray(next.payments)) {
    if (!previousPayments.has(label(payment.id))) {
      events.push({
        type: 'payment.recorded',
        aggregateId: id,
        payload: { orderId: id, paymentId: payment.id, amount: payment.amount, kind: payment.kind, method: payment.method },
      });
    }
  }
  const previousGarments = new Map(asArray(prev.garments).map((row) => [label(row.id), row]));
  for (const garment of asArray(next.garments)) {
    const before = previousGarments.get(label(garment.id));
    if (before && text(before.stage) !== text(garment.stage)) {
      events.push({
        type: 'garment.stage_changed',
        aggregateId: label(garment.id) || id,
        payload: { orderId: id, garmentId: garment.id, from: before.stage, to: garment.stage },
      });
    }
    const beforeQc = before && typeof before.qc === 'object' && before.qc ? (before.qc as Record<string, unknown>) : {};
    const afterQc = typeof garment.qc === 'object' && garment.qc ? (garment.qc as Record<string, unknown>) : {};
    if (!beforeQc.passedAt && afterQc.passedAt) {
      events.push({ type: 'qc.passed', aggregateId: label(garment.id) || id, payload: { orderId: id, garmentId: garment.id } });
    }
    if (!beforeQc.reworkOpen && afterQc.reworkOpen) {
      events.push({ type: 'qc.failed', aggregateId: label(garment.id) || id, payload: { orderId: id, garmentId: garment.id } });
    }
  }
  const beforeTrial = prev.trial && typeof prev.trial === 'object' ? (prev.trial as Record<string, unknown>) : null;
  const afterTrial = next.trial && typeof next.trial === 'object' ? (next.trial as Record<string, unknown>) : null;
  if (afterTrial && text(beforeTrial?.date) !== text(afterTrial.date)) {
    events.push({ type: 'trial.booked', aggregateId: id, payload: { orderId: id, date: afterTrial.date, time: afterTrial.time } });
  }
  const previousAlterations = new Set(asArray(prev.alterations).map((row) => label(row.id)));
  for (const alteration of asArray(next.alterations)) {
    if (!previousAlterations.has(label(alteration.id))) {
      events.push({ type: 'alteration.opened', aggregateId: id, payload: { orderId: id, alterationId: alteration.id, status: alteration.status } });
    }
  }
  return events;
}

export function diffPriceRequests(prev: Record<string, unknown>[], next: Record<string, unknown>[]): EventDraft[] {
  const before = new Map(prev.map((row) => [label(row.id), row]));
  const events: EventDraft[] = [];
  for (const row of next) {
    const prior = before.get(label(row.id));
    if (!prior) {
      events.push({ type: 'price_request.created', aggregateId: label(row.id), payload: { requestId: row.id, status: row.status } });
      continue;
    }
    if (text(prior.status) !== 'Confirmed' && row.status === 'Confirmed') {
      events.push({ type: 'price_request.answered', aggregateId: label(row.id), payload: { requestId: row.id, status: row.status, amount: row.amount } });
    }
  }
  return events;
}
