import React from 'react';
import { CalendarIcon, ClockIcon, ZapIcon } from 'lucide-react';
import { urgencyOptions } from '../../data/catalog';
import type { NewOrderState } from '../../hooks/useNewOrder';
import { fmtDate, inr } from '../../utils/format';
import { garmentBreakdown } from '../../utils/pricing';
import { Avatar } from '../ui/Avatar';
export function OrderSummaryPanel({
  o


}: {o: NewOrderState;}) {
  return <aside aria-label="Order summary" className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line p-5">
        <p className="font-mono text-sm text-ink-subtle">{o.orderNumber}</p>
        {o.customer ? <div className="mt-2 flex items-center gap-3">
            <Avatar name={o.customer.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{o.customer.name}</p>
              <p className="truncate text-sm text-ink-subtle">Designer {o.basics.designer}</p>
            </div>
          </div> : <p className="mt-2 text-[15px] text-ink-subtle">No customer selected</p>}
      </div>
      <ul className="divide-y divide-line px-5">
        {o.garments.map((g, i) => {
        const b = garmentBreakdown(g);
        return <li key={g.id} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 text-xs tabular text-ink-subtle">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">{g.subCategory || g.category}</p>
                <p className="text-xs text-ink-muted">Ready {fmtDate(o.dateFor(g), 'EEE d MMM')}</p>
                {g.urgency !== 'Regular' && <p className="flex items-center gap-1 text-xs font-medium text-warning">
                    <ZapIcon className="h-3 w-3" /> {urgencyOptions.find((u) => u.value === g.urgency)?.label} · +{inr(b.express)}
                  </p>}
                {b.pricePending && <p className="flex items-center gap-1 text-xs font-medium text-attention"><ClockIcon className="h-3 w-3" /> Design price pending</p>}
              </div>
              <span className="text-sm font-medium tabular">{inr(b.total)}</span>
            </li>;
      })}
      </ul>
      <div className="space-y-2 border-t border-line p-5 text-sm">
        <p className="flex items-center gap-2 text-ink-muted">
          <CalendarIcon className="h-4 w-4" /> Delivery {fmtDate(o.deliveryDate, 'EEE, d MMM')}
        </p>
        {o.totals.urgency > 0 && <div className="flex justify-between text-ink-muted">
            <span>Urgency charges</span>
            <span className="tabular">{inr(o.totals.urgency)}</span>
          </div>}
        {o.totals.discount > 0 && <div className="flex justify-between text-ink-muted">
            <span>Discount</span>
            <span className="tabular text-success">−{inr(o.totals.discount)}</span>
          </div>}
        <div className="flex justify-between text-ink-muted">
          <span>GST</span>
          <span className="tabular">{inr(o.totals.gst)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-[15px] font-semibold">Total</span>
          <span className="text-xl font-semibold tabular">{inr(o.totals.total)}</span>
        </div>
        {o.totals.pending > 0 && <p className="text-xs text-attention">+ custom design price to come</p>}
        <div className="flex justify-between text-ink-muted">
          <span>Advance (70%)</span>
          <span className="tabular">{inr(o.advanceRequired)}</span>
        </div>
      </div>
    </aside>;
}