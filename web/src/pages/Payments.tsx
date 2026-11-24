import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RecordPaymentModal } from '../components/order-detail/RecordPaymentModal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import type { Order } from '../types';
import { cn } from '../utils/cn';
import { fmtDate, fmtDateTime, inr, TODAY_ISO } from '../utils/format';
import { isActive } from '../utils/orders';
import { formatOrderId } from '../utils/displayIds';
import { paymentReferenceLabel } from '../utils/payments';
import { orderTotals } from '../utils/pricing';
import { pageClass, panelClass, statTileClass } from '../utils/styles';
const tileClass = (on: boolean) => cn(statTileClass, 'text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand', on && 'border-brand bg-brand-soft hover:border-brand');
const headClass = 'hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid';
const rowClass = 'flex flex-wrap items-center gap-x-4 gap-y-2 px-5 lg:grid';
export function Payments() {
  const {
    orders,
    customerName,
    can
  } = useApp();
  const [tab, setTab] = useState<'outstanding' | 'ledger'>('outstanding');
  const [recording, setRecording] = useState<Order | null>(null);
  const ledger = orders.flatMap((o) => o.payments.map((p) => ({
    p,
    o
  }))).sort((a, b) => b.p.at.localeCompare(a.p.at));
  const outstanding = orders.filter((o) => isActive(o) && orderTotals(o).balance > 0).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
  const today = ledger.filter((x) => x.p.at.startsWith(TODAY_ISO) && x.p.kind !== 'Refund').reduce((s, x) => s + x.p.amount, 0);
  const totalOutstanding = outstanding.reduce((s, o) => s + orderTotals(o).balance, 0);
  const shortAdvance = outstanding.filter((o) => o.status === 'Confirmed' && orderTotals(o).paidPct < 70);
  const recordingOrder = recording ? orders.find((o) => o.id === recording.id) ?? null : null;
  const [shortOnly, setShortOnly] = useState(false);
  const pick = (t: 'outstanding' | 'ledger', short: boolean) => {
    setTab(t);
    setShortOnly(short);
  };
  const outstandingList = shortOnly ? shortAdvance : outstanding;
  const canRecord = can('payment', 'create');
  const outCols = canRecord ? 'lg:grid-cols-[minmax(0,1fr)_120px_150px_120px_96px]' : 'lg:grid-cols-[minmax(0,1fr)_120px_150px_120px]';
  const ledgerCols = 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_100px_120px]';
  return <div className={pageClass}>
      <PageHeader title="Payments" />
      <div className="mb-6 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <button type="button" aria-pressed={tab === 'outstanding' && !shortOnly} onClick={() => pick('outstanding', false)} className={tileClass(tab === 'outstanding' && !shortOnly)}>
          <span className="text-sm text-ink-muted">Outstanding across active orders</span>
          <span className="mt-1 text-3xl font-semibold tabular">{inr(totalOutstanding)}</span>
          <span className="text-sm text-ink-subtle">{outstanding.length} orders</span>
        </button>
        <button type="button" aria-pressed={tab === 'ledger'} onClick={() => pick('ledger', false)} className={tileClass(tab === 'ledger')}>
          <span className="text-sm text-ink-muted">Collected today</span>
          <span className="mt-1 text-xl font-semibold tabular">{inr(today)}</span>
        </button>
        <button type="button" aria-pressed={shortOnly} onClick={() => pick('outstanding', !shortOnly)} className={tileClass(shortOnly)}>
          <span className="text-sm text-ink-muted">Advance below 70%</span>
          <span className={cn('mt-1 text-xl font-semibold tabular', shortAdvance.length > 0 && 'text-attention')}>{shortAdvance.length} order{shortAdvance.length === 1 ? '' : 's'}</span>
        </button>
      </div>
      <Tabs value={tab} onChange={(t) => pick(t, false)} tabs={[{
      key: 'outstanding',
      label: 'Outstanding',
      count: outstanding.length
    }, {
      key: 'ledger',
      label: 'Ledger',
      count: ledger.length
    }]} />
      <div className="pt-5">
        {tab === 'outstanding' ? <div className={cn(panelClass, 'overflow-hidden')}>
            {outstandingList.length > 0 && <div className={cn(headClass, outCols)} aria-hidden>
                <span>Order · customer</span><span>Delivery</span><span>Paid</span><span className="text-right">Balance</span>{canRecord && <span />}
              </div>}
            <ul className="divide-y divide-line">
              {outstandingList.length === 0 && <li className="px-5 py-6 text-ink-muted">Nothing here.</li>}
              {outstandingList.map((o) => {
            const t = orderTotals(o);
            return <li key={o.id} className={cn(rowClass, 'py-4', outCols)}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold"><Link to={`/orders/${o.id}?tab=more`} className="hover:underline">{formatOrderId(o.id)}</Link> · {customerName(o.customerId)}</p>
                      <p className="text-sm text-ink-subtle">{o.status}<span className="lg:hidden"> · delivery {fmtDate(o.deliveryDate)}</span></p>
                    </div>
                    <p className="hidden text-[15px] tabular text-ink-muted lg:block">{fmtDate(o.deliveryDate, 'd MMM')}</p>
                    <div className="w-36 lg:w-full">
                      <div className="h-1.5 overflow-hidden rounded-full bg-sunken"><div className={cn('h-full rounded-full', t.paidPct < 70 ? 'bg-attention' : 'bg-brand')} style={{
                    width: `${t.paidPct}%`
                  }} /></div>
                      <p className="mt-1 text-xs text-ink-subtle tabular">{t.paidPct}% paid</p>
                    </div>
                    <span className="w-28 text-right text-[16px] font-semibold tabular lg:w-auto">{inr(t.balance)}</span>
                    {canRecord && <div className="lg:text-right"><Button variant="secondary" onClick={() => setRecording(o)}>Record</Button></div>}
                  </li>;
          })}
            </ul>
          </div> : <div className={cn(panelClass, 'overflow-hidden')}>
            {ledger.length > 0 && <div className={cn(headClass, ledgerCols)} aria-hidden>
                <span>Customer · order</span><span>Method · reference</span><span>Recorded</span><span>Type</span><span className="text-right">Amount</span>
              </div>}
            <ul className="divide-y divide-line">
              {ledger.length === 0 && <li className="px-5 py-6 text-ink-muted">No payments recorded yet.</li>}
              {ledger.map(({
            p,
            o
          }) => <li key={`${o.id}-${p.id}`} className={cn(rowClass, 'py-3.5', ledgerCols)}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{customerName(o.customerId)}</p>
                    <p className="font-mono text-sm text-ink-muted">{formatOrderId(o.id)}</p>
                  </div>
                  <div className="min-w-0 basis-full text-sm text-ink-subtle lg:basis-auto">
                    {(() => {
                      const { primary, secondary } = paymentReferenceLabel(p.method, p.reference, p.by);
                      return <>
                        <p className="truncate text-ink-muted">{primary}</p>
                        <p className="truncate">{secondary}<span className="lg:hidden"> · {fmtDateTime(p.at)}</span></p>
                      </>;
                    })()}
                  </div>
                  <p className="hidden text-sm tabular text-ink-muted lg:block">{fmtDateTime(p.at)}</p>
                  <div><Badge tone={p.kind === 'Refund' ? 'critical' : p.kind === 'Advance' ? 'info' : 'success'}>{p.kind}</Badge></div>
                  <span className={cn('ml-auto text-right text-[15px] font-semibold tabular lg:ml-0', p.kind === 'Refund' && 'text-critical')}>{p.kind === 'Refund' ? '−' : ''}{inr(p.amount)}</span>
                </li>)}
            </ul>
          </div>}
      </div>
      {recordingOrder && <RecordPaymentModal order={recordingOrder} open={!!recording} onClose={() => setRecording(null)} />}
    </div>;
}