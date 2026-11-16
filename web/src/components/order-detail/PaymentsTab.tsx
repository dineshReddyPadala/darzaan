import React from 'react';
import { useApp } from '../../contexts/AppContext';
import type { Order } from '../../types';
import { fmtDateTime, inr } from '../../utils/format';
import { orderTotals } from '../../utils/pricing';
import { panelClass } from '../../utils/styles';
import { PriceBreakdown } from '../new-order/PriceBreakdown';
import { Button } from '../ui/Button';
export function PaymentsTab({
  order,
  onRecord



}: {order: Order;onRecord: () => void;}) {
  const {
    can
  } = useApp();
  const t = orderTotals(order);
  const pct = order.discount > 0 ? Math.round(order.discount / t.subtotal * 100) : 0;
  return <div className="grid gap-6 xl:grid-cols-2">
      <section className={`${panelClass} p-5`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">Balance due</p>
            <p className={`text-3xl font-semibold tabular ${t.balance > 0 ? '' : 'text-success'}`}>{t.balance > 0 ? inr(t.balance) : 'Paid in full'}</p>
            <p className="text-sm text-ink-subtle">{inr(t.paid)} received of {inr(t.total)}</p>
          </div>
          {t.balance > 0 && can('payment', 'create') && <Button onClick={onRecord}>Record payment</Button>}
        </div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-sunken">
          <div className="h-full rounded-full bg-success" style={{
          width: `${Math.min(100, t.paidPct)}%`
        }} />
        </div>
        <h3 className="mb-2 text-[15px] font-semibold">Payments</h3>
        <ul className="divide-y divide-line">
          {order.payments.map((p) => <li key={p.id} className="flex items-center gap-4 py-3">
              <div className="flex-1">
                <p className="text-[15px] font-medium">{p.kind} · {p.method}</p>
                <p className="text-sm text-ink-subtle">{p.reference} · {p.by} · {fmtDateTime(p.at)}</p>
              </div>
              <span className="text-[15px] font-semibold tabular">{inr(p.amount)}</span>
            </li>)}
        </ul>
        {order.alterations.some((a) => a.charge > 0) && <p className="mt-3 text-sm text-ink-muted">Includes alteration charges of {inr(order.alterations.reduce((s, a) => s + a.charge, 0))}.</p>}
      </section>
      <section className={`${panelClass} p-5`}>
        <h3 className="mb-2 text-[15px] font-semibold">How the price was built</h3>
        <PriceBreakdown garments={order.garments} totals={{
        ...t,
        total: t.total - order.alterations.reduce((s, a) => s + a.charge, 0)
      }} discountPct={pct} />
      </section>
    </div>;
}