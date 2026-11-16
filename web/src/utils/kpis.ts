import type { Order, QcIssue, Role } from '../types';
import { firstPassRate } from './qc';
import { daysUntil, TODAY_ISO } from './format';
import { isActive } from './orders';
import { orderTotals } from './pricing';
import { actsOnGarment, ordersView, roleDefFor, type KpiKey } from './roles';

export interface Kpi {
  key: KpiKey;
  label: string;
  value: number | string;
  to: string;
  emphasis?: boolean;
}

/** Role-relevant headline numbers. Each role only gets the keys listed in its definition. */
export function kpisFor(role: Role, userName: string, orders: Order[], issues: QcIssue[] = []): Kpi[] {
  const active = orders.filter(isActive);
  const garments = active.flatMap((o) => o.garments.map((g) => ({ o, g })));
  const mine = garments.filter(({ g }) => actsOnGarment(role, userName, g));
  const queuePath = roleDefFor(role).home;
  const inr = (n: number) => `₹${Math.round(n / 1000)}k`;

  const all: Record<KpiKey, Omit<Kpi, 'key'>> = {
    atRisk: { label: 'At risk', value: active.filter((o) => o.risk && (o.risk.severity === 'critical' || o.risk.severity === 'warning')).length, to: '/orders?filter=attention', emphasis: true },
    awaitingPayment: { label: 'Advance pending', value: active.filter((o) => o.status === 'Confirmed' && orderTotals(o).paidPct < 70).length, to: '/payments' },
    inProduction: { label: ordersView(role).showStage ? 'In production' : 'In workshop', value: active.filter((o) => o.status === 'In Production' || o.status === 'Confirmed').length, to: '/orders?filter=production' },
    readyTrial: { label: 'Ready for trial', value: active.filter((o) => o.status === 'Ready for Trial').length, to: '/orders' },
    readyPickup: { label: 'Ready for pickup', value: active.filter((o) => o.status === 'Ready for Pickup').length, to: '/orders?filter=ready' },
    overdue: { label: 'Overdue', value: active.filter((o) => daysUntil(o.deliveryDate) < 0).length, to: '/orders', emphasis: true },
    trialsToday: { label: 'Trials today', value: active.filter((o) => o.trial?.date === TODAY_ISO && o.trial.status === 'Scheduled').length, to: '/calendar' },
    ordersToday: { label: 'Orders today', value: orders.filter((o) => o.createdAt.slice(0, 10) === TODAY_ISO).length, to: '/orders' },
    balanceDue: { label: 'Balance to collect', value: inr(active.reduce((s, o) => s + orderTotals(o).balance, 0)), to: '/payments' },
    collectedToday: { label: 'Collected today', value: inr(orders.flatMap((o) => o.payments).filter((p) => p.at.slice(0, 10) === TODAY_ISO).reduce((s, p) => s + p.amount, 0)), to: '/payments' },
    openAlterations: { label: 'Open alterations', value: active.flatMap((o) => o.alterations).filter((a) => a.status !== 'Resolved').length, to: '/orders' },
    toVerify: { label: 'Measurements to verify', value: garments.filter(({ g }) => !g.measurementVerified).length, to: '/orders', emphasis: true },
    deliveriesToday: { label: 'Due today', value: active.filter((o) => o.deliveryDate === TODAY_ISO).length, to: '/orders' },
    myQueue: { label: 'In my queue', value: mine.length, to: queuePath },
    myExpress: { label: 'Express', value: mine.filter(({ o, g }) => g.urgency !== 'Regular' || o.priority === 'Express').length, to: queuePath, emphasis: true },
    myDueSoon: { label: 'Due in 2 days', value: mine.filter(({ o }) => daysUntil(o.deliveryDate) <= 2).length, to: queuePath },
    awaitingReview: { label: 'Awaiting review', value: garments.filter(({ g }) => g.stage === 'review').length, to: '/production' },
    express: { label: 'Express in workshop', value: garments.filter(({ g }) => g.urgency !== 'Regular').length, to: '/production', emphasis: true },
    inQc: { label: 'Waiting for QC', value: garments.filter(({ g }) => g.stage === 'qc').length, to: '/qc' },
    dispatch: { label: 'Ready to dispatch', value: garments.filter(({ g }) => g.stage === 'packaging' || g.stage === 'logistics').length, to: '/production' },
    firstPassRate: { label: 'QC first-time pass', value: `${firstPassRate(orders, issues)}%`, to: '/reports' },
    openReworks: { label: 'Open reworks', value: issues.filter((i) => i.status !== 'Resolved' && !i.fixedAtQc).length, to: '/qc', emphasis: true }
  };
  return roleDefFor(role).kpis.map((key) => ({ key, ...all[key] }));
}