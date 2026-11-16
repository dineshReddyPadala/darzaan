import { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLogistics } from '../contexts/LogisticsContext';
import { useStore } from '../contexts/StoreContext';
import { COLLECTION_REMINDERS } from '../data/store';
import type { Order } from '../types';
import { daysUntil, nowIso, TODAY_ISO } from '../utils/format';
import { orderTotals } from '../utils/pricing';

export interface AgendaItem {
  id: string;
  /** "14:30" for booked trials; "Ready" / "Arriving" otherwise. */
  time: string;
  kind: 'trial' | 'pickup' | 'bag';
  /** Customer name, or "Bag MV-7710". */
  who: string;
  /** Garments, or what's in the bag. */
  what: string;
  /** One short amber note when money or a wait is involved. */
  flag?: string;
  /** Booked time has passed. */
  late?: boolean;
  orderId?: string;
  customerId?: string;
  bagId?: string;
}

export interface FollowUp {
  id: string;
  kind: 'no-show' | 'uncollected' | 'swatch' | 'draft';
  title: string;
  detail: string;
  orderId?: string;
  loanId?: string;
}

/** Everything the store floor needs for today in one time-ordered list, plus what's carried over. */
export function useTodayAgenda() {
  const { orders, customerName, user } = useApp();
  const { movements } = useLogistics();
  const { loans, requests, drafts } = useStore();
  const here = `${user.store ?? 'Khan Market'} Store`;

  return useMemo(() => {
    const now = nowIso().slice(11, 16);
    const first = (o: Order) => customerName(o.customerId);

    const trials: AgendaItem[] = orders.
    filter((o) => o.trial?.date === TODAY_ISO && o.trial.status === 'Scheduled').
    map((o) => {
      const atStore = o.garments.every((x) => x.stage === 'store' || x.stage === 'trial' || x.stage === 'delivery');
      return {
        id: `${o.id}-trial`, time: o.trial!.time, kind: 'trial' as const, orderId: o.id, customerId: o.customerId,
        who: first(o), what: 'Trial',
        flag: atStore ? undefined : 'Not at the store yet',
        late: o.trial!.time < now
      };
    });

    const pickups: AgendaItem[] = orders.
    filter((o) => o.status === 'Ready for Pickup' && o.deliveryMode === 'Store pickup').
    map((o) => {
      const bal = orderTotals(o).balance;
      return {
        id: `${o.id}-pickup`, time: 'Ready', kind: 'pickup' as const, orderId: o.id, customerId: o.customerId,
        who: first(o), what: 'Pickup',
        flag: bal > 0 ? `₹${bal.toLocaleString('en-IN')} due` : undefined
      };
    });

    const bags: AgendaItem[] = movements.
    filter((m) => m.to === here && m.status !== 'Received').
    map((m) => ({
      id: m.id, time: m.eta ?? (m.status === 'Awaiting pickup' ? 'Later' : 'Arriving'), kind: 'bag' as const, bagId: m.id,
      who: `Bag ${m.id}`,
      what: 'From the workshop',
      flag: m.status === 'Awaiting pickup' ? 'Not picked up yet' : undefined
    }));

    const rank = (t: string) => /^\d/.test(t) ? `0${t}` : t === 'Arriving' ? '1' : t === 'Later' ? '2' : '3';
    const agenda = [...trials, ...bags, ...pickups].sort((a, b) => rank(a.time).localeCompare(rank(b.time)));

    const followUps: FollowUp[] = [
    ...orders.filter((o) => o.trial?.status === 'Missed').map<FollowUp>((o) => ({
      id: `${o.id}-ns`, kind: 'no-show', orderId: o.id,
      title: `${first(o)} — missed trial`,
      detail: `${o.trial?.contactAttempts ?? 0} of 3 reschedule messages sent`
    })),
    ...orders.filter((o) => o.status === 'Ready for Pickup' && o.trial?.date).flatMap<FollowUp>((o) => {
      const days = -daysUntil(o.trial!.date);
      const due = [...COLLECTION_REMINDERS].reverse().find((d) => days >= d);
      return due ? [{ id: `${o.id}-unc`, kind: 'uncollected', orderId: o.id, title: `${first(o)} — not collected (${days} days)`, detail: `Ready ${days} days · ${due}-day reminder due` }] : [];
    }),
    ...loans.filter((l) => !l.returnedAt && daysUntil(l.due) < 0).map<FollowUp>((l) => ({
      id: l.id, kind: 'swatch', loanId: l.id,
      title: `${customerName(l.customerId)} — swatch ${-daysUntil(l.due)}d overdue`,
      detail: `${l.label} · ${-daysUntil(l.due)}d overdue`
    })),
    ...drafts.filter((d) => d.status === 'Customer undecided').map<FollowUp>((d) => ({
      id: d.id, kind: 'draft', title: `${customerName(d.customerId)} — still deciding`, detail: `${d.garments.join(', ')}${d.followUp ? ` · follow up ${d.followUp}` : ''}`
    }))];


    const waiting = [
    ...requests.filter((r) => r.status === 'Waiting' || r.at.slice(0, 10) === TODAY_ISO),
    ...orders.flatMap((o) => o.changeRequests.filter((c) => c.status === 'Awaiting approval').map((c) => ({ id: c.id, kind: 'Change request' as const, orderId: o.id, reason: c.field, status: 'Waiting' as const, at: c.at, by: c.requestedBy })))];


    return { agenda, followUps, waiting, counts: { trials: trials.length, pickups: pickups.length, bags: bags.length } };
  }, [orders, customerName, movements, here, loans, requests, drafts]);
}