import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { BagPanel } from '../components/store/BagPanel';
import { CheckInDrawer, type TodaySelection } from '../components/store/CheckInDrawer';
import { CheckInSearch } from '../components/store/CheckInSearch';
import { DraftOrderModal } from '../components/store/DraftOrderModal';
import { EndOfDayModal } from '../components/store/EndOfDayModal';
import { FollowUpsDisclosure } from '../components/store/FollowUpsDisclosure';
import { StockIssueModal } from '../components/store/StockIssueModal';
import { TodayMoreMenu } from '../components/store/TodayMoreMenu';
import { VisitPanel } from '../components/store/VisitPanel';
import { useStore } from '../contexts/StoreContext';
import { type AgendaItem, useTodayAgenda } from '../hooks/useTodayAgenda';
import { cn } from '../utils/cn';
import { TODAY } from '../utils/format';
import { pageClass, panelClass } from '../utils/styles';
const isWide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
const toSelection = (a: AgendaItem): TodaySelection | null => a.bagId ? {
  type: 'bag',
  bagId: a.bagId
} : a.customerId ? {
  type: 'customer',
  customerId: a.customerId,
  orderId: a.orderId
} : null;
const isSelected = (a: AgendaItem, s: TodaySelection | null) => !!s && (s.type === 'bag' ? a.bagId === s.bagId : a.customerId === s.customerId && (!s.orderId || a.orderId === s.orderId));

/**
 * Front desk for the store assistant. Find the customer, see why they're here, do the one thing.
 * Left: today in time order. Right: the selected visit with one main button.
 */
export function Today() {
  const {
    managerName,
    managerInStore
  } = useStore();
  const {
    agenda,
    followUps,
    waiting
  } = useTodayAgenda();
  const [selection, setSelection] = useState<TodaySelection | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftFor, setDraftFor] = useState<string | undefined>(undefined);
  const [draftOpen, setDraftOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  // Start on whoever is next, so the right side is never empty at the start of the day.
  useEffect(() => {
    if (!selection && agenda[0]) setSelection(toSelection(agenda[0]));
  }, [agenda, selection]);
  const select = (s: TodaySelection | null) => {
    if (!s) return;
    setSelection(s);
    if (!isWide()) setDrawerOpen(true);
  };
  const openDraft = (customerId?: string) => {
    setDrawerOpen(false);
    setDraftFor(customerId);
    setDraftOpen(true);
  };
  return <div className={pageClass}>
      <header className="mb-6">
        {!managerInStore && <p className="mb-3 text-sm font-medium text-attention">{managerName.split(' ')[0]} is away — you can confirm bag receipts today.</p>}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 [&>div]:w-full [&_input]:h-12 [&_input]:text-base">
            <CheckInSearch onPick={(customerId) => select({
            type: 'customer',
            customerId
          })} />
          </div>
          <TodayMoreMenu onDraft={() => openDraft()} onStock={() => setStockOpen(true)} onClose={() => setCloseOpen(true)} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <section className={panelClass} aria-labelledby="today-h">
          <div className="flex items-baseline justify-between gap-3 px-6 pb-3 pt-5">
            <h1 id="today-h" className="font-display text-[28px] font-medium leading-tight tracking-tight">Today</h1>
            <p className="text-sm text-ink-subtle">{format(TODAY, 'EEE, d MMM')}</p>
          </div>

          {agenda.length === 0 ? <p className="border-t border-line px-6 py-10 text-ink-muted">Nothing booked yet.</p> : <ul className="border-t border-line" role="listbox" aria-label="Today’s visits">
              {agenda.map((a) => {
            const active = isSelected(a, selection);
            return <li key={a.id} role="option" aria-selected={active} className="border-b border-line last:border-b-0">
                    <button onClick={() => select(toSelection(a))} className={cn('relative grid w-full grid-cols-[64px_minmax(0,1fr)] items-baseline gap-x-4 px-6 py-3.5 text-left transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40', active ? 'bg-brand-soft' : 'hover:bg-canvas')}>
                      {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-brand" aria-hidden />}
                      <span className={cn('text-sm tabular', a.late ? 'font-medium text-critical' : 'text-ink-subtle')}>{a.time}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-ink">{a.who}</span>
                        <span className="block truncate text-sm text-ink-muted">
                          {a.what}
                          {a.flag && <span className="text-attention"> · {a.flag}</span>}
                        </span>
                      </span>
                    </button>
                  </li>;
          })}
            </ul>}

          <div className="border-t border-line">
            <FollowUpsDisclosure followUps={followUps} waiting={waiting} />
          </div>
        </section>

        <aside className={cn(panelClass, 'sticky top-6 hidden lg:block')} aria-label="Selected visit">
          {selection?.type === 'customer' && <VisitPanel key={`${selection.customerId}-${selection.orderId ?? ''}`} customerId={selection.customerId} focusOrderId={selection.orderId} onDraft={openDraft} />}
          {selection?.type === 'bag' && <BagPanel bagId={selection.bagId} />}
          {!selection && <p className="px-6 py-10 text-ink-muted">Pick someone from the list, or search for a walk-in.</p>}
        </aside>
      </div>

      <CheckInDrawer selection={selection} open={drawerOpen} onClose={() => setDrawerOpen(false)} onDraft={openDraft} />
      <DraftOrderModal open={draftOpen} onClose={() => setDraftOpen(false)} customerId={draftFor} />
      <StockIssueModal open={stockOpen} onClose={() => setStockOpen(false)} />
      <EndOfDayModal open={closeOpen} onClose={() => setCloseOpen(false)} />
    </div>;
}