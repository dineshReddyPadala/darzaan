import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, SearchIcon, ZapIcon } from 'lucide-react';
import { PriorityBadge } from '../../components/qc/QcStatus';
import { Badge } from '../../components/ui/Badge';
import { FilterMenu } from '../../components/ui/FilterMenu';
import { PageHeader } from '../../components/ui/PageHeader';
import { useApp } from '../../contexts/AppContext';
import { useQc } from '../../contexts/QcContext';
import { qcPath, qcPriority, qcState, type QcState } from '../../hooks/useQcGarment';
import type { QcRework } from '../../types';
import { cn } from '../../utils/cn';
import { daysUntil, dueLabel, fmtDate } from '../../utils/format';
import { garmentDue, isActive } from '../../utils/orders';
import { orderLink } from '../../utils/roles';
import { inputClass, kpiTileClass, orderListClass, orderListPanelClass, pageClass } from '../../utils/styles';
type FilterKey = 'all' | 'pending' | 'ready' | 'failed' | 'overdue';
const cols = 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_120px_24px]';
const rank = {
  High: 0,
  Medium: 1,
  Low: 2
};

/** Same layout as the Dashboard's Active orders: count tiles, heading with search + Filter, ruled rows with a chevron. */
export function QcQueuePage() {
  const {
    orders,
    customerName,
    role
  } = useApp();
  const {
    reworks
  } = useQc();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [q, setQ] = useState('');
  const rows = useMemo(() => orders.filter(isActive).flatMap((o) => o.garments.filter((g) => g.stage === 'qc').map((g) => {
    const rework = reworks.find((r) => r.orderId === o.id && r.garmentId === g.id && !r.closedAt);
    const due = garmentDue(o, g);
    return {
      o,
      g,
      rework,
      due,
      days: daysUntil(due),
      priority: qcPriority(o, g),
      state: qcState(g, rework),
      customer: customerName(o.customerId)
    };
  })).sort((a, b) => a.days - b.days || rank[a.priority] - rank[b.priority]), [orders, reworks, customerName]);
  const tests: Record<FilterKey, (r: (typeof rows)[number]) => boolean> = {
    all: () => true,
    pending: (r) => r.state === 'waiting',
    ready: (r) => r.state === 'reinspect',
    failed: (r) => r.state === 'rework',
    overdue: (r) => r.days < 0 && r.state !== 'rework'
  };
  const labels: Record<FilterKey, string> = {
    all: 'All',
    pending: 'Pending QC',
    ready: 'Ready for QC',
    failed: 'Failed QC',
    overdue: 'Overdue'
  };
  const count = (k: FilterKey) => rows.filter(tests[k]).length;
  const tiles: FilterKey[] = ['overdue', 'pending', 'ready', 'failed'];
  const term = q.trim().toLowerCase();
  const list = rows.filter(tests[filter]).filter((r) => !term || `${r.o.id} ${r.g.subCategory} ${r.customer}`.toLowerCase().includes(term));
  const badge = (s: QcState) => s === 'reinspect' ? <Badge tone="attention" dot>Ready for QC</Badge> : s === 'rework' ? <Badge tone="critical" dot>Failed QC</Badge> : <Badge tone="brand" dot>Pending QC</Badge>;
  const note = (s: QcState, rw?: QcRework) => s === 'rework' ? `In repair · ${rw?.assignee ?? 'team'}` : s === 'reinspect' ? `Repaired by ${rw?.assignee ?? 'team'}` : 'From Finishing';
  const dueTone = (d: number) => d < 0 ? 'text-critical' : d <= 1 ? 'text-warning' : 'text-ink-muted';
  const to = (s: QcState, orderId: string, garmentId: string) => s === 'rework' ? orderLink(role, orderId, 'workflow') ?? '/qc' : qcPath(orderId, garmentId, 'inspect');
  return <div className={pageClass}>
      <PageHeader title="Quality Check" />

      <section aria-label="At a glance" className="no-scrollbar -mx-4 mb-8 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:px-0">
        {tiles.map((k) => {
        const n = count(k);
        const alert = k === 'overdue' && n > 0;
        const on = filter === k;
        return <button key={k} type="button" aria-pressed={on} onClick={() => setFilter(on ? 'all' : k)} className={cn(kpiTileClass, 'text-left transition-colors duration-150 ease-out hover:border-line-strong', alert && 'border-critical/30', on && 'border-brand bg-brand-soft hover:border-brand')}>
              <span className="whitespace-nowrap text-sm text-ink-muted">{labels[k]}</span>
              <span className={cn('mt-1 text-[28px] font-semibold leading-none tabular', alert ? 'text-critical' : 'text-ink')}>{n}</span>
            </button>;
      })}
      </section>

      <div className="mb-4 flex min-h-10 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold leading-10">
          Waiting for inspection <span className="ml-1 text-[15px] font-normal tabular text-ink-subtle">{list.length}</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 md:w-64 md:flex-none">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, customer or garment" className={cn(inputClass, 'h-10 pl-10')} aria-label="Search" />
          </div>
          <FilterMenu<FilterKey> value={filter} defaultValue="all" onChange={setFilter} options={(['all', 'pending', 'ready', 'failed', 'overdue'] as FilterKey[]).map((k) => ({
          value: k,
          label: labels[k],
          count: count(k)
        }))} />
        </div>
      </div>

      <div className={orderListPanelClass}>
        <div className={cn('hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid', cols)}>
          <span>Order</span><span>QC status</span><span>Due</span><span>Priority</span><span />
        </div>
        <ul className={orderListClass}>
          {list.map((r) => {
          const href = to(r.state, r.o.id, r.g.id);
          const express = r.o.priority === 'Express' || r.g.urgency !== 'Regular';
          const overdue = r.days < 0;
          return <li key={`${r.o.id}:${r.g.id}`}>
                {/* Phone & tablet: card */}
                <Link to={href} className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface p-4 shadow-soft transition-[border-color] duration-150 ease-out hover:border-ink-subtle lg:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-2 pt-0.5 font-mono text-sm text-ink-muted">
                      {overdue && <span className="h-2 w-2 shrink-0 rounded-full bg-critical" aria-label="Overdue" />}
                      {r.o.id}
                    </span>
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {express && <Badge tone="critical"><ZapIcon className="h-3 w-3" />Express</Badge>}
                      {badge(r.state)}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-[17px] font-semibold text-ink">{r.customer}</p>
                  <p className="truncate text-[15px] text-ink-muted">{r.g.subCategory}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <span className={cn('text-[15px]', dueTone(r.days))}>{dueLabel(r.due)} · {fmtDate(r.due, 'd MMM')}</span>
                    <PriorityBadge p={r.priority} />
                  </div>
                </Link>

                {/* Desktop: ruled row */}
                <Link to={href} className={cn('group hidden items-center gap-x-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-canvas lg:grid', cols)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {overdue && <span className="h-2 w-2 shrink-0 rounded-full bg-critical" aria-label="Overdue" />}
                      <span className="font-mono text-sm font-medium text-ink-muted">{r.o.id}</span>
                      {express && <Badge tone="critical"><ZapIcon className="h-3 w-3" />Express</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-[15px] font-semibold text-ink">{r.customer}</p>
                    <p className="truncate text-sm text-ink-subtle">{r.g.subCategory}</p>
                  </div>
                  <div className="min-w-0">
                    {badge(r.state)}
                    <p className="mt-1 truncate text-sm text-ink-subtle">{note(r.state, r.rework)}</p>
                  </div>
                  <div>
                    <p className="text-[15px] font-medium tabular">{fmtDate(r.due, 'd MMM')}</p>
                    <p className={cn('text-sm', dueTone(r.days))}>{dueLabel(r.due)}</p>
                  </div>
                  <div><PriorityBadge p={r.priority} /></div>
                  <ChevronRightIcon className="h-5 w-5 text-ink-subtle transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                </Link>
              </li>;
        })}
          {list.length === 0 && <li className="px-5 py-12 text-center text-ink-muted sm:col-span-2">Nothing matches.</li>}
        </ul>
      </div>
    </div>;
}