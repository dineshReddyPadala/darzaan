import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRightIcon, MessageCircleIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { ChangeDiff } from '../components/orders/ChangeDiff';
import { OrderRow, orderRowCols } from '../components/orders/OrderRow';
import { Badge } from '../components/ui/Badge';
import { Button, buttonClass } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import { fmtDate, fmtDateTime, inr } from '../utils/format';
import { garmentsSummary, isActive } from '../utils/orders';
import { orderTotals } from '../utils/pricing';
import { canApproveChanges, ordersView, type OrdersTab } from '../utils/roles';
import { cn } from '../utils/cn';
import { chipClass, inputClass, orderListClass, orderListPanelClass, pageClass, panelClass } from '../utils/styles';
type Tab = OrdersTab;
const quoteCols = 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_110px_110px_auto]';
const filters = [{
  key: 'active',
  label: 'Active'
}, {
  key: 'attention',
  label: 'Needs attention'
}, {
  key: 'production',
  label: 'In production'
}, {
  key: 'ready',
  label: 'Ready'
}, {
  key: 'closed',
  label: 'Closed'
}, {
  key: 'all',
  label: 'All'
}] as const;
type FilterKey = (typeof filters)[number]['key'];
export function Orders() {
  const {
    orders,
    quotes,
    customerName,
    updateOrder,
    logActivity,
    can,
    role,
    roleDef
  } = useApp();
  const [params] = useSearchParams();
  const view = ordersView(role);
  const roleFilters = filters.filter((f) => view.filters.includes(f.key));
  const [chosenTab, setTab] = useState<Tab>(params.get('tab') as Tab || 'all');
  const tab: Tab = view.tabs.includes(chosenTab) ? chosenTab : 'all';
  const [chosenFilter, setFilter] = useState<FilterKey>(params.get('filter') as FilterKey || 'active');
  const filter: FilterKey = view.filters.includes(chosenFilter) ? chosenFilter : 'active';
  const [q, setQ] = useState(params.get('q') ?? '');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders.filter((o) => {
      const f = filter === 'all' || filter === 'active' && isActive(o) || filter === 'attention' && isActive(o) && !!o.risk || filter === 'production' && (o.status === 'In Production' || o.status === 'Confirmed') || filter === 'ready' && (o.status === 'Ready for Trial' || o.status === 'Ready for Pickup') || filter === 'closed' && (o.status === 'Closed' || o.status === 'Cancelled');
      const m = !s || String(o.id).toLowerCase().includes(s) || customerName(o.customerId).toLowerCase().includes(s) || garmentsSummary(o).toLowerCase().includes(s);
      return f && m;
    }).sort((a, b) => (a.deliveryDate ?? '').localeCompare(b.deliveryDate ?? ''));
  }, [orders, filter, q, customerName]);
  // Waiting for approval first, newest first — the ones that need a decision lead.
  const changes = orders.flatMap((o) => (o.changeRequests ?? []).map((c) => ({
    c,
    o
  }))).sort((a, b) => Number(b.c.status === 'Awaiting approval') - Number(a.c.status === 'Awaiting approval') || b.c.at.localeCompare(a.c.at));
  const cancelled = orders.filter((o) => o.status === 'Cancelled');
  const decide = (orderId: string, crId: string, approve: boolean) => {
    if (!canApproveChanges(role)) {
      toast.error('Not part of your role', {
        description: 'Change requests are approved by the store manager or designer.'
      });
      return;
    }
    if (!updateOrder(orderId, (o) => ({
      ...o,
      changeRequests: o.changeRequests.map((c) => c.id === crId ? {
        ...c,
        status: approve ? 'Approved' : 'Rejected'
      } : c)
    }))) return;
    logActivity(orderId, `${approve ? 'Approved' : 'Rejected'} change request ${crId}${approve ? ' — updated copies reissued' : ''}`, 'change');
    toast.success(approve ? 'Change approved' : 'Change rejected', {
      description: approve ? 'Customer, sales and production copies reissued.' : undefined
    });
  };
  return <div className={pageClass}>
      <PageHeader title="Orders" actions={can('order', 'create') ? <Link to="/orders/new" className={buttonClass('primary', 'lg')}><PlusIcon className="h-5 w-5" /> New order</Link> : undefined} />
      {view.tabs.length > 1 && <Tabs<Tab> value={tab} onChange={setTab} tabs={[{
      key: 'all' as Tab,
      label: 'All orders',
      count: orders.filter(isActive).length
    }, {
      key: 'quotes' as Tab,
      label: 'Draft quotes',
      count: quotes.length
    }, {
      key: 'changes' as Tab,
      label: 'Change requests',
      count: changes.filter((x) => x.c.status === 'Awaiting approval').length
    }, {
      key: 'cancellations' as Tab,
      label: 'Cancellations',
      count: cancelled.length
    }].filter((t) => view.tabs.includes(t.key))} />}
      <div className={view.tabs.length > 1 ? 'pt-5' : ''}>
        {tab === 'all' && <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative lg:w-96">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, customer, garment" className={`${inputClass} pl-12`} aria-label="Search orders" />
              </div>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {roleFilters.map((f) => <button key={f.key} onClick={() => setFilter(f.key)} className={chipClass(filter === f.key)}>{f.label}</button>)}
              </div>
            </div>
            <div className={orderListPanelClass}>
              <div className={cn('hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid', orderRowCols(roleDef.scope.payments))}>
                <span>Order</span><span>{view.showStage ? 'Status · stage' : 'Status'}</span><span>Delivery</span>{roleDef.scope.payments && <span>Payment</span>}<span />
              </div>
              <ul className={orderListClass}>
                {list.map((o) => <li key={o.id}><OrderRow order={o} /></li>)}
                {list.length === 0 && <li className="px-5 py-16 text-center text-ink-muted sm:col-span-2">No orders match these filters.</li>}
              </ul>
            </div>
          </>}

        {tab === 'quotes' && <div className={cn(panelClass, 'overflow-hidden')}>
            <div className={cn('hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid', quoteCols)}>
              <span>Quote</span><span>Garments · fabric</span><span>Valid until</span><span className="text-right">Estimate</span><span />
            </div>
            <ul className="divide-y divide-line">
              {quotes.map((qt) => <li key={qt.id} className={cn('flex flex-col gap-3 px-5 py-4 lg:grid lg:items-center lg:gap-4', quoteCols)}>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-mono text-sm text-ink-muted">{qt.id}<Badge tone={qt.status === 'Draft' ? 'neutral' : 'info'}>{qt.status}</Badge></p>
                    <p className="truncate text-[15px] font-semibold">{customerName(qt.customerId)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px]">{qt.items.join(', ')}</p>
                    <p className="truncate text-sm text-ink-subtle">{qt.note ?? qt.fabrics.join(' · ')}</p>
                  </div>
                  <p className="text-sm text-ink-muted tabular">{fmtDate(qt.validUntil)}</p>
                  <p className="text-[15px] font-semibold tabular lg:text-right">{inr(qt.estimate)}</p>
                  <div className="flex gap-2 lg:justify-end">
                    <Button variant="ghost" icon={<MessageCircleIcon className="h-4 w-4" />} onClick={() => toast.success('Quote shared on WhatsApp')} aria-label="Share on WhatsApp" />
                    <Link to={`/orders/new?quote=${qt.id}`} className={buttonClass('secondary', 'md')}>Resume</Link>
                    <Link to={`/orders/new?quote=${qt.id}&step=pricing`} className={buttonClass('primary', 'md')}>Convert <ArrowRightIcon className="h-4 w-4" /></Link>
                  </div>
                </li>)}
              {quotes.length === 0 && <li className="px-5 py-16 text-center text-ink-muted">No draft quotes.</li>}
            </ul>
          </div>}

        {tab === 'changes' && <div className="space-y-4">
            {changes.map(({
          c,
          o
        }) => <article key={c.id} className={`${panelClass} p-5`}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-ink-muted">{c.id} · <Link className="hover:underline" to={`/orders/${o.id}`}>{o.id}</Link></p>
                    <h3 className="text-[16px] font-semibold">{c.field}</h3>
                    <p className="text-sm text-ink-subtle">Requested by {c.requestedBy} · {fmtDateTime(c.at)}</p>
                  </div>
                  <Badge tone={c.status === 'Approved' ? 'success' : c.status === 'Rejected' ? 'critical' : 'attention'}>{c.status}</Badge>
                </div>
                <ChangeDiff change={c} />
                {c.status === 'Awaiting approval' && (canApproveChanges(role) ? <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => decide(o.id, c.id, true)}>Customer approved & signed</Button>
                    <Button variant="secondary" onClick={() => decide(o.id, c.id, false)}>Reject</Button>
                  </div> : <p className="mt-4 text-sm text-ink-muted">Waiting for the store manager or designer to approve the price and date impact.</p>)}
              </article>)}
          </div>}

        {tab === 'cancellations' && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className={orderListPanelClass}>
              {cancelled.length > 0 && <div className={cn('hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid', orderRowCols(roleDef.scope.payments))}>
                  <span>Order</span><span>Status · stage</span><span>Delivery</span>{roleDef.scope.payments && <span>Payment</span>}<span />
                </div>}
              {cancelled.length ? <ul className={orderListClass}>{cancelled.map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul> : <p className="px-5 py-16 text-center text-ink-muted">No cancellations.</p>}
            </div>
            <aside className={`${panelClass} p-5`}>
              <h3 className="mb-3 text-[15px] font-semibold">Cancellation policy</h3>
              <ul className="space-y-3 text-sm text-ink-muted">
                <li><span className="font-medium text-ink">Regular orders:</span> full refund minus material cost within 48 hours; 50% after production starts.</li>
                <li><span className="font-medium text-ink">Express orders:</span> non-refundable once confirmed.</li>
                <li><span className="font-medium text-ink">Customer fabric:</span> must be returned and signed for.</li>
                <li><span className="font-medium text-ink">Approval:</span> store manager approval required for any refund.</li>
              </ul>
              <p className="mt-4 text-xs text-ink-subtle">Outstanding balance across active orders: {inr(orders.filter(isActive).reduce((s, o) => s + orderTotals(o).balance, 0))}</p>
            </aside>
          </div>}
      </div>
    </div>;
}