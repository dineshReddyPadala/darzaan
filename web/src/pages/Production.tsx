import React, { useMemo, useState } from 'react';
// The Production Head plans, assigns and moves cards; everyone else sees a view-only board.
import { Link, useSearchParams } from 'react-router-dom';
import { ProductionBoard } from '../components/production/ProductionBoard';
import { BoardDatePicker } from '../components/production/BoardDatePicker';
import { PageHeader } from '../components/ui/PageHeader';
import { PriceRequestModal } from '../components/production/PriceRequestModal';
import { PricesToConfirm } from '../components/production/PricesToConfirm';
import { Segmented } from '../components/ui/Segmented';
import { useApp } from '../contexts/AppContext';
import { PRICER, usePriceRequests } from '../contexts/PriceRequestsContext';
import { useQc } from '../contexts/QcContext';
import { cn } from '../utils/cn';
import { daysUntil, nowIso, TODAY_ISO } from '../utils/format';
import { seedTasks } from '../hooks/useOrderWorkflow';
import { garmentDue, isActive, isWorkshopAlteration, stageIndex } from '../utils/orders';
import { namesMatch } from '../utils/roles';
import { isBehind, startsAfter } from '../utils/production';
import { pageClass, statTileClass } from '../utils/styles';
type Filter = 'all' | 'review' | 'express' | 'behind' | 'rework' | 'alteration' | 'dispatch';
type View = 'board' | 'prices';
export function Production() {
  const {
    orders,
    role,
    roleDef,
    user
  } = useApp();
  const [params, setParams] = useSearchParams();
  /** Production Assistants see only their own garments and change status from the Workflow tab. */
  const assistantView = role === 'production_assistant';
  const readOnly = !!roleDef.boardReadOnly || assistantView;
  const [filter, setFilter] = useState<Filter>('all');
  const [day, setDay] = useState(TODAY_ISO);
  const pricing = usePriceRequests();
  const { reworks } = useQc();
  const isPricer = role === PRICER;
  const [view, setView] = useState<View>(params.get('price') ? 'prices' : 'board');
  const all = useMemo(() => orders.filter(isActive).flatMap((order) => order.garments.map((garment, index) => {
    const d = daysUntil(garmentDue(order, garment));
    const score = (isBehind(order, garment) ? 1000 : 0) + (garment.urgency !== 'Regular' ? 100 : 0) + Math.max(0, 30 - d) + (order.risk ? 10 : 0);
    return {
      order,
      garment,
      index,
      score
    };
  }).filter((x) => stageIndex(x.garment.stage) <= stageIndex('logistics') || isWorkshopAlteration(x.order, x.garment.id))).filter((x) => !assistantView || x.garment.productionAssistant === user.name), [orders, assistantView, user.name]);
  // Scheduled garments stay off the board until their start date.
  const later = all.filter((i) => startsAfter(i.garment, day));
  const items = all.filter((i) => !startsAfter(i.garment, day));
  // ?price=<id> opens a price request — the pop-up, the bell and the inbox all link here.
  const priceRequest = pricing.get(params.get('price') ?? undefined);
  const openPrice = (id: string) => setParams((p) => {
    p.set('price', id);
    return p;
  }, {
    replace: true
  });
  const closePrice = () => setParams((p) => {
    p.delete('price');
    return p;
  }, {
    replace: true
  });
  const openReworks = new Set(reworks.filter((r) => !r.closedAt).map((r) => `${r.orderId}-${r.garmentId}`));
  const tests: Record<Filter, (i: typeof items[number]) => boolean> = {
    all: () => true,
    review: (i) => i.garment.stage === 'review' || i.garment.stage === 'acknowledgement',
    express: (i) => i.garment.urgency !== 'Regular',
    behind: (i) => isBehind(i.order, i.garment),
    rework: (i) => openReworks.has(`${i.order.id}-${i.garment.id}`),
    alteration: (i) => i.garment.stage === 'alteration',
    dispatch: (i) => i.garment.stage === 'packaging' || i.garment.stage === 'logistics'
  };
  const counts: {
    key: Filter;
    label: string;
    tone?: string;
  }[] = [{
    key: 'all',
    label: assistantView ? 'My garments' : 'In workshop'
  }, {
    key: 'review',
    label: 'Awaiting review'
  }, {
    key: 'behind',
    label: 'Behind',
    tone: 'text-critical'
  }, {
    key: 'express',
    label: 'Express',
    tone: 'text-critical'
  }, {
    key: 'rework',
    label: 'Sent back by QC'
  }, {
    key: 'alteration',
    label: 'Alterations'
  }, {
    key: 'dispatch',
    label: 'Ready to dispatch'
  }];
  const filtered = items.filter(tests[filter]);
  const showPrices = isPricer && view === 'prices';
  if (role === 'tailor') return <TailorTasks />;
  return <div className={pageClass}>
      <PageHeader title={readOnly ? 'Workshop board' : 'Production'} subtitle={readOnly ? 'Okhla Workshop · view only' : 'Okhla Workshop'} actions={!showPrices ? <BoardDatePicker value={day} onChange={setDay} laterCount={later.length} /> : undefined} />

      {isPricer && <div className="mb-6">
          <Segmented<View> value={view} onChange={setView} ariaLabel="Production view" options={[{
        value: 'board',
        label: 'Board'
      }, {
        value: 'prices',
        label: pricing.open.length ? `Prices to confirm · ${pricing.open.length}` : 'Prices to confirm'
      }]} />
        </div>}

      {showPrices ? <PricesToConfirm onOpen={openPrice} /> : <>
          <nav className="no-scrollbar -mx-4 mb-6 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:px-0 xl:grid-cols-7" aria-label="Filters">
            {counts.map((c) => {
          const on = filter === c.key;
          const value = items.filter(tests[c.key]).length;
          return <button key={c.key} onClick={() => setFilter(on && c.key !== 'all' ? 'all' : c.key)} aria-pressed={on} className={cn(statTileClass, 'text-left', on && 'border-brand bg-brand-soft hover:border-brand')}>
                  <span className={cn('whitespace-nowrap text-sm', on ? 'font-medium text-brand-hover' : 'text-ink-muted')}>{c.label}</span>
                  <span className={cn('mt-1 text-[28px] font-semibold leading-none tabular', value > 0 && c.tone ? c.tone : 'text-ink')}>{value}</span>
                </button>;
        })}
          </nav>
          <ProductionBoard items={filtered} readOnly={readOnly} />
        </>}
      {isPricer && <PriceRequestModal request={priceRequest?.status === 'Pending' || priceRequest?.status === 'Question' ? priceRequest : undefined} onClose={closePrice} />}
    </div>;
}

function TailorTasks() {
  const { orders, updateOrder, user } = useApp();
  const rows = orders.flatMap((order) => (order.tasks ?? seedTasks(order)).filter((task) => namesMatch(task.assignee, user.name)).map((task) => ({ order, task })));
  const open = rows.filter((row) => row.task.status !== 'Done');
  const done = rows.filter((row) => row.task.status === 'Done');
  const toggle = (orderId: string, taskId: string, finished: boolean) => {
    updateOrder(orderId, (order) => ({
      ...order,
      tasks: (order.tasks ?? seedTasks(order)).map((task) => task.id === taskId ? { ...task, status: finished ? 'Done' : 'In progress', updatedAt: nowIso(), updatedBy: user.name } : task),
    }), { entity: 'production_task', action: 'update' });
  };
  const list = (items: typeof rows, empty: string) => items.length === 0 ? <p className="px-5 py-4 text-sm text-ink-muted">{empty}</p> : <ul className="divide-y divide-line">
    {items.map(({ order, task }) => <li key={task.id} className="flex items-center gap-3 px-5 py-3">
      <input type="checkbox" checked={task.status === 'Done'} aria-label={`Mark ${task.name} done`} onChange={() => toggle(String(order.id), task.id, task.status !== 'Done')} className="h-5 w-5 shrink-0 rounded accent-brand" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{task.name}</p>
        <p className="truncate text-sm text-ink-muted">{order.id} · {order.garments.find((garment) => garment.id === task.garmentId)?.subCategory ?? 'Garment'}</p>
      </div>
      <Link to={`/orders/${order.id}?tab=workflow`} className="shrink-0 text-sm font-medium text-brand">Open</Link>
    </li>)}
  </ul>;
  return <div className={pageClass}>
    <h1 className="font-display text-[28px] font-medium tracking-tight">My tasks</h1>
    <p className="mb-6 mt-1 text-sm text-ink-muted">Tasks assigned to {user.name}.</p>
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-3 text-sm font-medium">To do · {open.length}</h2>
      {list(open, 'Nothing is assigned to you right now.')}
    </section>
    {done.length > 0 && <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-3 text-sm font-medium">Done · {done.length}</h2>
      {list(done, '')}
    </section>}
  </div>;
}