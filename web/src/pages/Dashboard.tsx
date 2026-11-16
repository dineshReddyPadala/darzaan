import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRightIcon, FilePlus2Icon, PlusIcon, SearchIcon } from 'lucide-react';
import { OrderRow, orderRowCols } from '../components/orders/OrderRow';
import { FloorDraftsPanel } from '../components/store/FloorDraftsPanel';
import { FloorRequestsPanel } from '../components/store/FloorRequestsPanel';
import { Badge } from '../components/ui/Badge';
import { buttonClass } from '../components/ui/Button';
import { FilterMenu } from '../components/ui/FilterMenu';
import { SeverityIcon } from '../components/ui/SeverityIcon';
import { useApp } from '../contexts/AppContext';
import { useQc } from '../contexts/QcContext';
import type { Garment, Order } from '../types';
import { cn } from '../utils/cn';
import { daysUntil, fmtDate, TODAY, TODAY_ISO } from '../utils/format';
import { kpisFor } from '../utils/kpis';
import { buildActionItems, garmentsSummary, isActive, stageLabel } from '../utils/orders';
import { actsOnGarment, ordersView, workPathFor } from '../utils/roles';
import { severityLabel } from '../utils/status';
import { orderTotals } from '../utils/pricing';
import type { KpiKey } from '../utils/roles';
import { inputClass, kpiTileClass, statTileClass, orderListClass, orderListPanelClass, pageClass, panelClass } from '../utils/styles';
const ATTENTION_LIMIT = 4;
const TABLE_LIMIT = 8;
type OrderFilter = 'all' | 'risk' | 'express' | 'week' | 'trial' | 'pickup';
const orderFilters: {
  key: OrderFilter;
  label: string;
  test: (o: Order) => boolean;
}[] = [{
  key: 'all',
  label: 'All active',
  test: () => true
}, {
  key: 'risk',
  label: 'At risk',
  test: (o) => !!o.risk && (o.risk.severity === 'warning' || o.risk.severity === 'critical')
}, {
  key: 'express',
  label: 'Express',
  test: (o) => o.priority === 'Express'
}, {
  key: 'week',
  label: 'Due in 7 days',
  test: (o) => daysUntil(o.deliveryDate) <= 7
}, {
  key: 'trial',
  label: 'Trial & alteration',
  test: (o) => o.status === 'Ready for Trial' || o.status === 'Alteration'
}, {
  key: 'pickup',
  label: 'Ready for pickup',
  test: (o) => o.status === 'Ready for Pickup'
}];
/** What each headline number counts, so tapping it filters the list on this page. */
const kpiOrderTest: Partial<Record<KpiKey, (o: Order) => boolean>> = {
  atRisk: (o) => !!o.risk && (o.risk.severity === 'critical' || o.risk.severity === 'warning'),
  awaitingPayment: (o) => o.status === 'Confirmed' && orderTotals(o).paidPct < 70,
  inProduction: (o) => o.status === 'In Production' || o.status === 'Confirmed',
  readyTrial: (o) => o.status === 'Ready for Trial',
  readyPickup: (o) => o.status === 'Ready for Pickup',
  overdue: (o) => daysUntil(o.deliveryDate) < 0,
  trialsToday: (o) => o.trial?.date === TODAY_ISO && o.trial.status === 'Scheduled',
  ordersToday: (o) => o.createdAt.slice(0, 10) === TODAY_ISO,
  balanceDue: (o) => orderTotals(o).balance > 0,
  collectedToday: (o) => o.payments.some((p) => p.at.slice(0, 10) === TODAY_ISO),
  openAlterations: (o) => o.alterations.some((a) => a.status !== 'Resolved'),
  toVerify: (o) => o.garments.some((g) => !g.measurementVerified),
  deliveriesToday: (o) => o.deliveryDate === TODAY_ISO
};
const kpiGarmentTest: Partial<Record<KpiKey, (o: Order, g: Garment) => boolean>> = {
  myExpress: (o, g) => g.urgency !== 'Regular' || o.priority === 'Express',
  myDueSoon: (o) => daysUntil(o.deliveryDate) <= 2,
  awaitingReview: (_, g) => g.stage === 'review',
  express: (_, g) => g.urgency !== 'Regular',
  inQc: (_, g) => g.stage === 'qc',
  dispatch: (_, g) => g.stage === 'packaging' || g.stage === 'logistics',
  openReworks: (_, g) => !!g.qc?.reworkOpen
};
/** Active-orders table: what's ready to hand over first, then what's furthest along. */
const STATUS_ORDER: Order['status'][] = ['Ready for Pickup', 'Ready for Trial', 'Alteration', 'In Production', 'Confirmed', 'Draft'];
const statusRank = (o: Order) => {
  const i = STATUS_ORDER.indexOf(o.status);
  return i < 0 ? STATUS_ORDER.length : i;
};
export function Dashboard() {
  const {
    role,
    roleDef,
    orders,
    customerName,
    user,
    can
  } = useApp();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [q, setQ] = useState('');
  const isStore = roleDef.group === 'Store' || role === 'admin';
  const items = useMemo(() => {
    const all = buildActionItems(orders, customerName);
    if (isStore) return all;
    return all.filter((it) => orders.find((o) => o.id === it.orderId)?.garments.some((g) => actsOnGarment(role, user.name, g)));
  }, [orders, customerName, isStore, role, user.name]);
  const [kpi, setKpi] = useState<KpiKey | null>(null);
  const garmentTest = kpi ? kpiGarmentTest[kpi] : undefined;
  const myWork = useMemo(() => orders.filter(isActive).flatMap((o) => o.garments.filter((g) => garmentTest ? garmentTest(o, g) && (kpi?.startsWith('my') ? actsOnGarment(role, user.name, g) : true) : actsOnGarment(role, user.name, g)).map((g) => ({
    o,
    g
  }))).sort((a, b) => Number(b.g.urgency !== 'Regular') - Number(a.g.urgency !== 'Regular')).slice(0, garmentTest ? 20 : 6), [orders, role, user.name, garmentTest, kpi]);
  const active = orders.filter(isActive);
  const {
    issues
  } = useQc();
  const pulse = kpisFor(role, user.name, orders, issues).slice(0, 5);
  const s = q.trim().toLowerCase();
  const filterDef = orderFilters.find((f) => f.key === filter)!;
  const orderTest = kpi ? kpiOrderTest[kpi] : undefined;
  const kpiLabel = kpi ? pulse.find((p) => p.key === kpi)?.label : undefined;
  const clickable = (k: KpiKey) => isStore ? !!kpiOrderTest[k] : !!kpiGarmentTest[k] || k === 'myQueue';
  const pickKpi = (k: KpiKey) => {
    setKpi(kpi === k || k === 'myQueue' ? null : k);
    setFilter('all');
  };
  const tableRows = active.filter((o) => !orderTest || orderTest(o)).filter(filterDef.test).filter((o) => !s || String(o.id).toLowerCase().includes(s) || customerName(o.customerId).toLowerCase().includes(s) || garmentsSummary(o).toLowerCase().includes(s)).sort((a, b) => statusRank(a) - statusRank(b) || a.deliveryDate.localeCompare(b.deliveryDate));
  const visible = showAll ? items : items.slice(0, ATTENTION_LIMIT);
  const hour = TODAY.getHours();
  const attention = <section className={panelClass} aria-labelledby="attention-h">
      <div className="flex items-center justify-between px-5 pb-2 pt-5">
        <h2 id="attention-h" className="text-lg font-semibold">Needs attention</h2>
        {items.length > 0 && <Badge tone="critical">{items.length} open</Badge>}
      </div>
      {items.length === 0 ? <p className="px-5 pb-6 text-ink-muted">All clear.</p> : <ul className="divide-y divide-line">
          {visible.map((it) => <li key={it.id}>
              <button onClick={() => navigate(`/orders/${it.orderId}`)} className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors duration-150 ease-out hover:bg-canvas">
                <SeverityIcon severity={it.severity} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">{it.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">
                    <span className="sr-only">{severityLabel[it.severity]}. </span>
                    {it.detail} · next: {it.owner}
                  </p>
                </div>
              </button>
            </li>)}
        </ul>}
      {items.length > ATTENTION_LIMIT && <button onClick={() => setShowAll(!showAll)} className="w-full border-t border-line py-3 text-sm font-medium text-brand transition-colors duration-150 ease-out hover:bg-canvas">
          {showAll ? 'Show fewer' : `Show all ${items.length}`}
        </button>}
    </section>;
  return <div className={pageClass}>
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[15px] text-ink-muted">{format(TODAY, 'EEEE, d MMMM')} · {user.location}</p>
          <h1 className="mt-1 font-display text-[30px] font-medium leading-tight tracking-tight md:text-[34px]">
            Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}
          </h1>
        </div>
        {can('order', 'create') && <div className="flex gap-2">
            <Link to="/orders/new?mode=quote" className={buttonClass('secondary', 'lg')}>
              <FilePlus2Icon className="h-5 w-5" /> Draft quote
            </Link>
            <Link to="/orders/new" className={buttonClass('primary', 'lg')}>
              <PlusIcon className="h-5 w-5" /> New order
            </Link>
          </div>}
      </header>

      <section aria-label="Today at a glance" className="no-scrollbar -mx-4 mb-8 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:px-0" style={{
      gridTemplateColumns: `repeat(${pulse.length}, minmax(0, 1fr))`
    }}>
        {pulse.map((p) => {
        const alert = p.emphasis && typeof p.value === 'number' && p.value > 0;
        const on = kpi === p.key;
        const body = <>
              <span className={cn('whitespace-nowrap text-sm', on ? 'font-medium text-brand-hover' : 'text-ink-muted')}>{p.label}</span>
              <span className={cn('mt-1 text-[28px] font-semibold leading-none tabular', alert ? 'text-critical' : 'text-ink')}>{p.value}</span>
            </>;
        return clickable(p.key) ? <button key={p.key} type="button" aria-pressed={on} onClick={() => pickKpi(p.key)} className={cn(statTileClass, 'text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand', alert && 'border-critical/30', on && 'border-brand bg-brand-soft hover:border-brand')}>
              {body}
            </button> : <div key={p.key} className={cn(kpiTileClass, alert && 'border-critical/30')}>{body}</div>;
      })}
      </section>

      {isStore ? <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-labelledby="orders-h" className="min-w-0">
            <div className="mb-4 flex min-h-10 flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 id="orders-h" className="text-lg font-semibold leading-10">
                {kpiLabel ?? 'Active orders'} <span className="ml-1 text-[15px] font-normal tabular text-ink-subtle">{tableRows.length}</span>
                {kpi && <button type="button" onClick={() => setKpi(null)} className="ml-3 text-sm font-medium text-brand hover:underline">Show all</button>}
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1 md:w-64 md:flex-none">
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, customer or garment" className={cn(inputClass, 'h-10 pl-10')} aria-label="Search active orders" />
                </div>
                <FilterMenu value={filter} defaultValue="all" onChange={(f) => {
              setFilter(f);
              setKpi(null);
            }} options={orderFilters.map((f) => ({
              value: f.key,
              label: f.label,
              count: active.filter(f.test).length
            }))} />
              </div>
            </div>
            <div className={orderListPanelClass}>
              <div className={cn('hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid', orderRowCols(roleDef.scope.payments))}>
                <span>Order</span><span>{ordersView(role).showStage ? 'Status · stage' : 'Status'}</span><span>Delivery</span>{roleDef.scope.payments && <span>Payment</span>}<span />
              </div>
              <ul className={orderListClass}>
                {tableRows.slice(0, TABLE_LIMIT).map((o) => <li key={o.id}><OrderRow order={o} /></li>)}
                {tableRows.length === 0 && <li className="px-5 py-12 text-center text-ink-muted sm:col-span-2">No orders match.</li>}
              </ul>
              <Link to="/orders" className="mt-3 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-brand hover:underline lg:mt-0 lg:border-t lg:border-line">
                {tableRows.length > TABLE_LIMIT ? `View all ${tableRows.length} orders` : 'Open orders'} <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Offset by the table's header row (h-10 + mb-4) so both columns' panels start on the same line. */}
          <aside className="space-y-6 xl:mt-14">
            {roleDef.oversight && <FloorRequestsPanel />}
            {role === 'salesperson' && <FloorDraftsPanel />}
            {attention}
          </aside>
        </div> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className={panelClass} aria-labelledby="mywork-h">
            <div className="flex items-center justify-between px-5 pb-2 pt-5">
              <h2 id="mywork-h" className="text-lg font-semibold">{garmentTest ? kpiLabel : 'My work'}</h2>
              {garmentTest ? <button type="button" onClick={() => setKpi(null)} className="text-sm font-medium text-brand hover:underline">Show my work</button> : <Link to={roleDef.home} className="text-sm font-medium text-brand hover:underline">Open my queue</Link>}
            </div>
            {myWork.length === 0 ? <p className="px-5 pb-6 text-ink-muted">{garmentTest ? 'Nothing here.' : 'Nothing waiting for you.'}</p> : <ul className="divide-y divide-line">
                {myWork.map(({
            o,
            g
          }) => <li key={`${o.id}-${g.id}`}>
                    <Link to={workPathFor(g.stage, o.id)} className="flex items-center gap-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[15px] font-semibold">{g.subCategory}{g.urgency !== 'Regular' && <Badge tone="critical">Express</Badge>}</p>
                        <p className="text-sm text-ink-subtle">{o.id} · {stageLabel(g.stage)} · due {fmtDate(o.deliveryDate, 'd MMM')}</p>
                      </div>
                      <ArrowRightIcon className="h-5 w-5 text-ink-subtle" />
                    </Link>
                  </li>)}
              </ul>}
          </section>
          <div className="space-y-6">
            {attention}
          </div>
        </div>}
    </div>;
}