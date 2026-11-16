import React, { useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { minutesWaiting, REMIND_AFTER_MIN, usePriceRequests } from '../../contexts/PriceRequestsContext';
import { cn } from '../../utils/cn';
import { fmtDate, fmtDateTime, inr } from '../../utils/format';
import { isActive } from '../../utils/orders';
import { orderListPanelClass } from '../../utils/styles';
import { buttonClass } from '../ui/Button';
import { Tabs } from '../ui/Tabs';
type View = 'waiting' | 'confirmed';
const headClass = 'hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid';
const waitCols = 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_100px_130px_110px_auto]';
const doneCols = 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_170px_110px]';

/**
 * The Production Head's pricing queue, laid out like the other lists: one table per tab,
 * oldest request first. A confirmed price leaves this screen once its order is delivered;
 * the record itself is kept.
 */
export function PricesToConfirm({
  onOpen


}: {onOpen: (id: string) => void;}) {
  const {
    open,
    requests
  } = usePriceRequests();
  const {
    getOrder
  } = useApp();
  const [view, setView] = useState<View>('waiting');
  const waiting = [...open].sort((a, b) => minutesWaiting(b) - minutesWaiting(a));
  const confirmed = requests.filter((r) => {
    if (r.status !== 'Confirmed') return false;
    const o = r.orderId ? getOrder(r.orderId) : undefined;
    return !o || isActive(o);
  }).sort((a, b) => (b.answeredAt ?? '').localeCompare(a.answeredAt ?? ''));
  return <div>
      <Tabs<View> className="mb-5" value={view} onChange={setView} tabs={[{
      key: 'waiting',
      label: 'To confirm',
      count: waiting.length
    }, {
      key: 'confirmed',
      label: 'Confirmed',
      count: confirmed.length
    }]} />

      {view === 'waiting' ? <div className={orderListPanelClass}>
          <div className={cn(headClass, waitCols)}>
            <span>Garment · customer</span><span>Fabric</span><span>Due</span><span>Asked by</span><span>Waiting</span><span />
          </div>
          <ul className="divide-y divide-line">
            {waiting.map((r) => {
          const mins = minutesWaiting(r);
          const late = mins >= REMIND_AFTER_MIN;
          return <li key={r.id}>
                  <button type="button" onClick={() => onOpen(r.id)} className={cn('flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors duration-150 ease-out hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand lg:grid lg:items-center lg:gap-4', waitCols)}>
                    <div className="flex min-w-0 items-center gap-3">
                      {r.sketch ? <img src={r.sketch} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-line" /> : <span className="h-11 w-11 shrink-0 rounded-lg bg-sunken" aria-hidden />}
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold">{r.garmentLabel}</p>
                        <p className="truncate text-sm text-ink-muted">{r.customerName}</p>
                      </div>
                    </div>
                    <p className="truncate text-[15px] text-ink-muted">{r.fabric}</p>
                    <p className="text-sm tabular text-ink-muted">{fmtDate(r.dueDate, 'd MMM')}</p>
                    <p className="truncate text-sm text-ink-muted">{r.requestedBy}</p>
                    <p className={cn('text-sm tabular', late ? 'font-semibold text-critical' : 'text-ink-muted')}>{mins < 1 ? 'Just now' : `${mins} min`}</p>
                    <span className={cn(buttonClass('primary', 'sm'), 'w-fit lg:justify-self-end')}>Price it</span>
                  </button>
                </li>;
        })}
            {waiting.length === 0 && <li className="px-5 py-16 text-center text-ink-muted">No prices waiting.</li>}
          </ul>
        </div> : <div className={orderListPanelClass}>
          <div className={cn(headClass, doneCols)}>
            <span>Garment · customer</span><span>Order</span><span>Due</span><span>Confirmed</span><span className="text-right">Price</span>
          </div>
          <ul className="divide-y divide-line">
            {confirmed.map((r) => <li key={r.id} className={cn('flex flex-col gap-1 px-5 py-4 lg:grid lg:items-center lg:gap-4', doneCols)}>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold">{r.garmentLabel}</p>
                  <p className="truncate text-sm text-ink-muted">{r.customerName}</p>
                </div>
                <p className="truncate font-mono text-sm text-ink-muted">{r.orderId ?? 'Not placed yet'}</p>
                <p className="text-sm tabular text-ink-muted">{fmtDate(r.dueDate, 'd MMM')}</p>
                <p className="text-sm tabular text-ink-muted">{r.answeredAt ? fmtDateTime(r.answeredAt) : '—'}</p>
                <p className="flex items-center gap-1 text-[15px] font-semibold tabular lg:justify-end">{inr(r.amount ?? 0)}<ChevronRightIcon className="hidden h-4 w-4 text-transparent lg:block" aria-hidden /></p>
              </li>)}
            {confirmed.length === 0 && <li className="px-5 py-16 text-center text-ink-muted">No confirmed prices yet.</li>}
          </ul>
        </div>}
    </div>;
}