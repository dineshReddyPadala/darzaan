import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, ZapIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Order } from '../../types';
import { cn } from '../../utils/cn';
import { daysUntil, dueLabel, fmtDate, inr } from '../../utils/format';
import { garmentsSummary, isActive, orderStage, stageLabel } from '../../utils/orders';
import { orderTotals } from '../../utils/pricing';
import { ordersView, storeStatusLabel } from '../../utils/roles';
import { orderStatusTone, severityTone, toneBar } from '../../utils/status';
import { Badge } from '../ui/Badge';
/** Desktop column template — the Payment column only exists for roles that see payments. */
export const orderRowCols = (payments: boolean) => payments ? 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_120px_24px]' : 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_24px]';
export function OrderRow({
  order,
  showCustomer = true



}: {order: Order;showCustomer?: boolean;}) {
  const {
    customerName,
    roleDef,
    role
  } = useApp();
  const {
    showStage
  } = ordersView(role);
  // Store staff see the status only; anything still being made is simply "In workshop".
  const storeLabel = !showStage ? storeStatusLabel(order.status) : null;
  const statusBadge = storeLabel ? <Badge tone="neutral" dot>{storeLabel}</Badge> : <Badge tone={orderStatusTone[order.status]} dot>{order.status}</Badge>;
  const t = orderTotals(order);
  const d = daysUntil(order.deliveryDate);
  const active = isActive(order);
  const title = showCustomer ? customerName(order.customerId) : garmentsSummary(order);
  const sub = showCustomer ? garmentsSummary(order) : order.occasion;
  const dueTone = !active ? 'text-ink-muted' : d < 0 ? 'text-critical' : d <= 2 ? 'text-warning' : 'text-ink-muted';
  return <>
      {/* Phone & tablet: stand-alone card */}
      <Link to={`/orders/${order.id}`} className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface p-4 shadow-soft transition-[border-color] duration-150 ease-out hover:border-ink-subtle lg:hidden">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 pt-0.5 font-mono text-sm text-ink-muted">
            {order.risk && <span className={cn('h-2 w-2 shrink-0 rounded-full', toneBar[severityTone[order.risk.severity]])} aria-label="Has exception" />}
            {order.id}
          </span>
          <span className="flex flex-wrap justify-end gap-1.5">
            {order.priority === 'Express' && <Badge tone="critical"><ZapIcon className="h-3 w-3" />Express</Badge>}
            {showStage && active ? <Badge tone="brand" dot>{stageLabel(orderStage(order))}</Badge> : statusBadge}
          </span>
        </div>
        <p className="mt-2 truncate text-[17px] font-semibold text-ink">{title}</p>
        <p className="truncate text-[15px] text-ink-muted">{sub}</p>
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-4">
          <span className={cn('text-[15px]', dueTone)}>
            {active ? `${dueLabel(order.deliveryDate)} · ` : ''}{fmtDate(order.deliveryDate, 'd MMM')}
          </span>
          {roleDef.scope.prices && <span className="text-[15px] font-semibold tabular text-ink">{inr(t.total)}</span>}
        </div>
      </Link>

      {/* Desktop: ruled table row */}
      <Link to={`/orders/${order.id}`} className={cn('group hidden items-center gap-x-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-canvas lg:grid', orderRowCols(roleDef.scope.payments))}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {order.risk && <span className={cn('h-2 w-2 shrink-0 rounded-full', toneBar[severityTone[order.risk.severity]])} aria-label="Has exception" />}
            <span className="font-mono text-sm font-medium text-ink-muted">{order.id}</span>
            {order.priority === 'Express' && <Badge tone="critical"><ZapIcon className="h-3 w-3" />Express</Badge>}
          </div>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-ink">{title}</p>
          <p className="truncate text-sm text-ink-subtle">{sub}</p>
        </div>
        <div className="min-w-0">
          {statusBadge}
          {active && showStage && <p className="mt-1 truncate text-sm text-ink-subtle">{stageLabel(orderStage(order))}</p>}
        </div>
        <div>
          <p className="text-[15px] font-medium tabular">{fmtDate(order.deliveryDate, 'd MMM')}</p>
          {active && <p className={cn('text-sm', dueTone)}>{dueLabel(order.deliveryDate)}</p>}
        </div>
        {roleDef.scope.payments && <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
              <div className={cn('h-full rounded-full', t.paidPct >= 100 ? 'bg-success' : t.paidPct >= 70 ? 'bg-brand' : 'bg-attention')} style={{
            width: `${Math.min(100, t.paidPct)}%`
          }} />
            </div>
            <p className="mt-1 text-sm text-ink-subtle tabular">{t.paidPct}% paid</p>
          </div>}
        <ChevronRightIcon className="h-5 w-5 text-ink-subtle transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
      </Link>
    </>;
}