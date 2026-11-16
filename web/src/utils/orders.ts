import { stages } from '../data/production';
import { urgencyOptions } from '../data/catalog';
import type { Customer, Garment, Order, Severity, StageKey } from '../types';
import { isoPlusDays, TODAY_ISO } from './format';
import { orderTotals } from './pricing';
import { severityRank } from './status';

export function stageIndex(key: StageKey): number {
  return stages.findIndex((s) => s.key === key);
}

/** The latest alteration on a garment, if it was sent back to the workshop and isn't finished yet. */
export function workshopAlteration(o: Order, garmentId: string) {
  const g = o.garments.find((x) => x.id === garmentId);
  if (!g || g.stage !== 'alteration') return undefined;
  const latest = [...o.alterations].reverse().find((a) => a.garmentId === garmentId || !a.garmentId && o.garments.length === 1);
  return latest && latest.type === 'Major' && latest.status === 'In workshop' ? latest : undefined;
}

export function isWorkshopAlteration(o: Order, garmentId: string): boolean {
  return !!workshopAlteration(o, garmentId);
}

export function stageLabel(key: StageKey): string {
  return stages.find((s) => s.key === key)?.label ?? key;
}

export function orderStage(o: Order): StageKey {
  return o.garments.reduce<StageKey>((min, g) => stageIndex(g.stage) < stageIndex(min) ? g.stage : min, o.garments[0]?.stage ?? 'review');
}

export function garmentTitle(g: Garment): string {
  return g.subCategory || g.category || 'New garment';
}

export function garmentsSummary(o: Order): string {
  return o.garments.map(garmentTitle).join(' · ');
}

export function garmentDue(o: Order, g: Garment): string {
  const opt = urgencyOptions.find((u) => u.value === g.urgency);
  return opt?.days ? isoPlusDays(o.createdAt.slice(0, 10), opt.days) : g.deliveryDate ?? o.deliveryDate;
}

export function isActive(o: Order): boolean {
  return o.status !== 'Closed' && o.status !== 'Cancelled' && o.status !== 'Draft';
}

export interface ActionItem {
  id: string;
  severity: Severity;
  type: string;
  title: string;
  detail: string;
  orderId: string;
  owner: string;
}

export function buildActionItems(orders: Order[], customerName: (id: string) => string): ActionItem[] {
  const items: ActionItem[] = [];
  orders.filter(isActive).forEach((o) => {
    const name = customerName(o.customerId);
    if (o.risk) {
      items.push({ id: `${o.id}-risk`, severity: o.risk.severity, type: 'Exception', title: o.risk.message, detail: `${o.id} · ${name}`, orderId: o.id, owner: o.risk.owner });
    } else {
      const t = orderTotals(o);
      if (o.status === 'Confirmed' && t.paidPct < 70) {
        items.push({ id: `${o.id}-pay`, severity: 'attention', type: 'Payment pending', title: `Advance incomplete — ${t.paidPct}% paid`, detail: `${o.id} · ${name}`, orderId: o.id, owner: o.designer });
      }
      if (o.garments.some((g) => !g.measurementVerified)) {
        items.push({ id: `${o.id}-meas`, severity: 'attention', type: 'Measurement incomplete', title: 'Measurements not verified', detail: `${o.id} · ${name}`, orderId: o.id, owner: o.designer });
      }
      if (o.status === 'Ready for Pickup' && t.balance > 0) {
        items.push({ id: `${o.id}-pickup`, severity: 'info', type: 'Ready for pickup', title: `Ready for pickup — collect balance`, detail: `${o.id} · ${name}`, orderId: o.id, owner: 'Store' });
      }
    }
    o.changeRequests.
    filter((c) => c.status === 'Awaiting approval').
    forEach((c) => items.push({ id: c.id, severity: 'attention', type: 'Customer approval pending', title: `Approve change: ${c.field}`, detail: `${o.id} · ${name}`, orderId: o.id, owner: name }));
    if (o.trial && o.trial.date === TODAY_ISO && o.trial.status === 'Scheduled') {
      items.push({ id: `${o.id}-trial`, severity: 'info', type: 'Trial due', title: `Trial today at ${o.trial.time}`, detail: `${o.id} · ${name}`, orderId: o.id, owner: o.designer });
    }
  });
  return items.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

export interface TrackerStep {
  key: string;
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'skipped';
  detail: string;
}

export function trackerSteps(o: Order): TrackerStep[] {
  const stage = orderStage(o);
  const idx = stageIndex(stage);
  const closed = o.status === 'Closed';
  const hadAlteration = o.alterations.length > 0;
  const progress = closed ? 99 : idx;
  const defs: {key: string;label: string;from: number;to: number;detail: string;}[] = [
  { key: 'confirmed', label: 'Order confirmed', from: -1, to: -1, detail: 'Your order and measurements are locked in.' },
  { key: 'production', label: 'In production', from: 0, to: 7, detail: 'Cutting, embroidery and stitching at our Okhla workshop.' },
  { key: 'qc', label: 'Quality check', from: 8, to: 9, detail: 'Every seam, measurement and detail is inspected.' },
  { key: 'ready', label: 'Ready at store', from: 10, to: 12, detail: 'Your garment is packed and travelling to the store.' },
  { key: 'trial', label: 'Trial', from: 13, to: 13, detail: o.trial ? `Trial booked for ${o.trial.date} at ${o.trial.time}.` : 'We will invite you for a fitting.' },
  { key: 'alteration', label: 'Alteration', from: 14, to: 14, detail: hadAlteration ? `${o.alterations.length} alteration(s) so far.` : 'Only if the fit needs adjusting.' },
  { key: 'pickup', label: 'Ready for pickup', from: 15, to: 15, detail: o.deliveryMode === 'Home delivery' ? 'Out for home delivery.' : 'Collect from Khan Market store.' },
  { key: 'delivered', label: 'Delivered', from: 99, to: 99, detail: 'Enjoy your occasion.' }];

  return defs.map((d) => {
    let state: TrackerStep['state'];
    if (d.key === 'confirmed') state = 'done';else
    if (d.key === 'alteration' && !hadAlteration && progress > 14) state = 'skipped';else
    if (o.status === 'Ready for Pickup' && d.key === 'pickup') state = 'current';else
    if (o.status === 'Ready for Pickup' && d.from < 15) state = d.key === 'alteration' && !hadAlteration ? 'skipped' : 'done';else
    if (progress > d.to) state = 'done';else
    if (progress >= d.from && progress <= d.to) state = 'current';else
    state = 'upcoming';
    return { key: d.key, label: d.label, state, detail: d.detail };
  });
}

export function deriveStatus(o: Order): Order['status'] {
  if (o.status === 'Closed' || o.status === 'Cancelled') return o.status;
  if (o.garments.some((g) => g.stage === 'alteration')) return 'Alteration';
  const min = stageIndex(orderStage(o));
  if (min === 0) return 'Confirmed';
  if (min < stageIndex('store')) return 'In Production';
  if (o.trial?.status === 'Completed') return 'Ready for Pickup';
  return 'Ready for Trial';
}

export function customerOrders(orders: Order[], c: Customer): Order[] {
  return orders.filter((o) => String(o.customerId) === String(c.id));
}