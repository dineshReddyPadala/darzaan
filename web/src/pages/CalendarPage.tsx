import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon, ZapIcon } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { DeliveryHeatmap } from '../components/ui/DeliveryHeatmap';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import type { StageKey } from '../types';
import { levelFor, levelMeta, loadForDate } from '../utils/capacity';
import { cn } from '../utils/cn';
import { fmtDate, TODAY_ISO, todayPlus } from '../utils/format';
import { garmentsSummary, isActive, stageIndex, stageLabel } from '../utils/orders';
import { deliveryState, deliveryStates, type DeliveryState } from '../utils/packages';
import { DeliveryStateBadge } from '../components/delivery/DeliveryStateBadge';
import { usePackages } from '../contexts/PackagesContext';
import type { Order } from '../types';
import { isStoreRole } from '../utils/roles';
import { pageClass, panelClass } from '../utils/styles';
type Tab = 'delivery' | 'production' | 'trials';
export function CalendarPage() {
  const {
    orders,
    customerName,
    getOrder,
    role
  } = useApp();
  const {
    packages
  } = usePackages();
  const [params] = useSearchParams();
  /** The workshop only plans production here; deliveries and trials belong to the store. */
  const workshopOnly = role === 'production_head' || role === 'production_assistant';
  /** Store staff plan around customers: what's going out and who's coming in for a fitting. */
  const storeOnly = isStoreRole(role);
  const [chosen, setTab] = useState<Tab>('delivery');
  const tab: Tab = workshopOnly ? 'production' : storeOnly && chosen === 'production' ? 'delivery' : chosen;
  const [date, setDate] = useState(params.get('date') ?? TODAY_ISO);
  const active = orders.filter(isActive);
  const markers = active.reduce<Record<string, number>>((m, o) => ({
    ...m,
    [o.deliveryDate]: (m[o.deliveryDate] ?? 0) + 1
  }), {});
  const due = active.filter((o) => o.deliveryDate === date);
  /** The least-advanced package decides the order's tag; no package yet → by garment stage. */
  const stateFor = (o: Order): DeliveryState | null => {
    const own = packages.filter((p) => p.orderId === o.id).map(deliveryState);
    if (own.length) return own.includes('attention') ? 'attention' : deliveryStates.find((s) => own.includes(s)) ?? null;
    const stages = o.garments.map((g) => stageIndex(g.stage));
    if (Math.min(...stages) >= stageIndex('store')) return 'delivered';
    if (o.garments.some((g) => g.stage === 'packaging')) return 'ready';
    return null;
  };
  // Production calendar: step a week at a time, show one or two weeks.
  const [offset, setOffset] = useState(0);
  const span = 7;
  const week = Array.from({
    length: span
  }, (_, i) => todayPlus(offset + i));
  const rangeLabel = `${fmtDate(week[0], 'd MMM')} – ${fmtDate(week[week.length - 1], 'd MMM')}`;
  const boardTasks = orders.flatMap((o) => o.garments.map((g) => ({
    id: `${o.id}-${g.id}`,
    orderId: o.id,
    garmentId: g.id,
    due: o.deliveryDate.slice(0, 10),
    status: stageIndex(g.stage) >= stageIndex('store') ? 'Done' : 'Open',
    title: g.subCategory,
    stage: g.stage as StageKey,
    assignee: g.productionAssistant || g.assignee || '',
    priority: o.priority
  })));
  const weekTasks = boardTasks.filter((t) => week.includes(t.due));
  const weekLabel = offset === 0 ? 'This week' : offset === 7 ? 'Next week' : offset === -7 ? 'Last week' : `Week of ${fmtDate(week[0], 'd MMM')}`;
  // Today's trials first, then upcoming, then missed, then completed (most recent first).
  const trialRank = (o: Order) => {
    const t = o.trial!;
    if (t.status === 'Scheduled') return t.date === TODAY_ISO ? 0 : t.date > TODAY_ISO ? 1 : 2;
    return t.status === 'Missed' ? 2 : 3;
  };
  const trials = orders.filter((o) => o.trial).sort((a, b) => {
    const r = trialRank(a) - trialRank(b);
    if (r) return r;
    const ka = `${a.trial!.date}${a.trial!.time}`;
    const kb = `${b.trial!.date}${b.trial!.time}`;
    return trialRank(a) >= 2 ? kb.localeCompare(ka) : ka.localeCompare(kb);
  });
  // Trials calendar: same layout as Delivery — a month on the left, the chosen day's fittings on the right.
  const trialMarkers = trials.reduce<Record<string, number>>((m, o) => ({
    ...m,
    [o.trial!.date]: (m[o.trial!.date] ?? 0) + 1
  }), {});
  const trialsOnDay = trials.filter((o) => o.trial!.date === date).sort((a, b) => a.trial!.time.localeCompare(b.trial!.time));
  const trialBadge = (o: Order) => {
    const t = o.trial!;
    if (t.status === 'Completed') return <Badge tone="success">Done</Badge>;
    if (t.status === 'Missed' || t.date < TODAY_ISO && t.status === 'Scheduled') return <Badge tone="critical">Missed</Badge>;
    return <Badge tone="info">Booked</Badge>;
  };
  return <div className={pageClass}>
      <PageHeader title={workshopOnly ? 'Production calendar' : 'Calendar'} />
      {!workshopOnly && <Tabs<Tab> value={tab} onChange={setTab} tabs={[{
      key: 'delivery' as Tab,
      label: 'Delivery'
    }, {
      key: 'production' as Tab,
      label: 'Production'
    }, {
      key: 'trials' as Tab,
      label: 'Trials',
      count: trials.filter((o) => o.trial!.status === 'Scheduled').length
    }].filter((t) => !(storeOnly && t.key === 'production'))} />}
      <div className={workshopOnly ? '' : 'pt-6'}>
        {tab === 'delivery' && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className={`${panelClass} p-5`}>
              <DeliveryHeatmap selected={date} onSelect={setDate} markers={markers} size="large" minDate="2026-10-01" />
            </section>
            <section className={`${panelClass} h-fit`}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
                <h2 className="text-xl font-semibold">{fmtDate(date, 'EEE, d MMMM')}</h2>
                <span className="text-sm tabular text-ink-muted">{due.length} {due.length === 1 ? 'delivery' : 'deliveries'}</span>
              </div>
              <ul className="divide-y divide-line">
                {due.map((o) => <li key={o.id}>
                    <Link to={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{customerName(o.customerId)}</p>
                        <p className="truncate text-sm text-ink-subtle"><span className="tabular">{o.id}</span> · {o.deliveryMode === 'Home delivery' ? 'Home' : o.store}</p>
                      </div>
                      {(() => {
                  const s = stateFor(o);
                  return s ? <DeliveryStateBadge state={s} /> : <Badge tone="neutral">In workshop</Badge>;
                })()}
                    </Link>
                  </li>)}
                {due.length === 0 && <li className="px-5 py-8 text-center text-ink-muted">Nothing scheduled.</li>}
              </ul>
            </section>
          </div>}

        {tab === 'production' && <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{weekLabel}</h2>
                <p className="text-sm text-ink-muted tabular">{weekTasks.length} {weekTasks.length === 1 ? 'task' : 'tasks'} due</p>
              </div>
              <div className="flex items-center gap-2">
                {offset !== 0 && <button type="button" onClick={() => setOffset(0)} className="h-10 px-2 text-sm font-medium text-brand hover:underline">Today</button>}
                <div className="flex items-center rounded-lg bg-surface ring-1 ring-inset ring-line-strong">
                  <button type="button" onClick={() => setOffset((o) => o - span)} aria-label="Previous week" className="flex h-10 w-10 items-center justify-center rounded-l-lg text-ink-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="min-w-[140px] border-x border-line px-3 text-center text-sm font-medium tabular">{rangeLabel}</span>
                  <button type="button" onClick={() => setOffset((o) => o + span)} aria-label="Next week" className="flex h-10 w-10 items-center justify-center rounded-r-lg text-ink-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="no-scrollbar overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-7 gap-3">
              {week.map((d) => {
              const tasks = boardTasks.filter((t) => t.due === d);
              const l = loadForDate(d) ?? 0;
              const isToday = d === TODAY_ISO;
              return <section key={d} aria-current={isToday ? 'date' : undefined} className={cn(panelClass, 'min-h-[320px]')}>
                    <header className="border-b border-line p-3">
                      <p className={cn('text-xs', isToday ? 'font-semibold text-brand' : 'text-ink-subtle')}>{isToday ? 'Today' : fmtDate(d, 'EEE')}</p>
                      <p className="text-[15px] font-semibold">{fmtDate(d, 'd MMM')}</p>
                      <span className={cn('mt-1 inline-block rounded px-1.5 text-xs font-medium tabular', levelMeta[levelFor(l)].cell)}>{l}%</span>
                    </header>
                    <ul className="space-y-2 p-2">
                      {tasks.map((t) => {
                    // Same identity as a board card: whose order, which garment, what step, who's on it.
                    const o = getOrder(t.orderId);
                    const g = o?.garments.find((x) => x.id === t.garmentId);
                    const late = t.status !== 'Done' && t.due < TODAY_ISO;
                    const tag = t.stage === 'alteration' ? 'Alteration' : /^rework/i.test(t.title) ? 'Rework' : null;
                    return <li key={t.id}>
                          <Link to={`/orders/${t.orderId}?tab=workflow`} className={cn('block rounded-lg p-2.5 transition-colors duration-150 ease-out', late ? 'bg-critical-soft ring-1 ring-inset ring-critical/50' : 'bg-canvas hover:bg-sunken')}>
                            <p className="flex items-center justify-between gap-1 font-mono text-xs text-ink-muted">
                              {t.orderId}
                              {t.priority === 'Express' && <ZapIcon className="h-3.5 w-3.5 text-critical" aria-label="Express" />}
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold">{o ? customerName(o.customerId) : '—'}</p>
                            <p className="truncate text-xs text-ink-muted">{g?.subCategory ?? '—'} · {stageLabel(t.stage)}</p>
                            {tag && <Badge tone={tag === 'Rework' ? 'critical' : 'attention'} className="mt-1.5">{tag}</Badge>}
                            <p className="mt-2 flex items-center justify-between gap-1 border-t border-line pt-1.5 text-xs">
                              <span className="truncate text-ink">{t.assignee}</span>
                              {t.status === 'In progress' && <span className="shrink-0 font-medium text-brand">Started</span>}
                              {late && <span className="shrink-0 font-medium text-critical">Late</span>}
                            </p>
                          </Link>
                        </li>;
                  })}
                      {tasks.length === 0 && <li className="px-1 py-4 text-center text-xs text-ink-subtle">No tasks</li>}
                    </ul>
                  </section>;
            })}
            </div>
            </div>
          </div>}

        {tab === 'trials' && <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className={`${panelClass} p-5`}>
              <DeliveryHeatmap selected={date} onSelect={setDate} markers={trialMarkers} size="large" minDate="2026-09-01" showLoad={false} />
            </section>
            <section className={`${panelClass} h-fit`}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4">
                <h2 className="text-xl font-semibold">{fmtDate(date, 'EEE, d MMMM')}</h2>
                <span className="text-sm tabular text-ink-muted">{trialsOnDay.length} {trialsOnDay.length === 1 ? 'trial' : 'trials'}</span>
              </div>
              <ul className="divide-y divide-line">
                {trialsOnDay.map((o) => <li key={o.id}>
                    <Link to={`/orders/${o.id}?trial=start`} className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-canvas">
                      <span className="w-16 shrink-0 text-[15px] font-semibold tabular">{o.trial!.time}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{customerName(o.customerId)}</p>
                        <p className="truncate text-sm text-ink-subtle"><span className="tabular">{o.id}</span> · {garmentsSummary(o)}</p>
                      </div>
                      {trialBadge(o)}
                    </Link>
                  </li>)}
                {trialsOnDay.length === 0 && <li className="px-5 py-8 text-center text-ink-muted">No trials booked.</li>}
              </ul>
            </section>
          </div>}
      </div>
    </div>;
}