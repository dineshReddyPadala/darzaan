import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useStore } from '../../contexts/StoreContext';
import { cn } from '../../utils/cn';
import { fmtDateTime, inr } from '../../utils/format';
import { panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';

/** Store Manager: requests from the floor, in-store status and the day's cash. */
export function FloorRequestsPanel() {
  const {
    customerName
  } = useApp();
  const {
    requests,
    decideRequest,
    managerInStore,
    setManagerInStore,
    isEscalated,
    closes,
    confirmClose
  } = useStore();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const open = requests.filter((r) => r.status === 'Waiting');
  const cash = closes.filter((c) => c.status === 'Waiting for manager');
  return <section className={panelClass} aria-labelledby="floor-h">
      <div className="px-5 pb-3 pt-5">
        <h2 id="floor-h" className="text-lg font-semibold">Requests from the floor</h2>
        <div className="mt-3 rounded-xl bg-canvas px-4 py-3">
          <Toggle checked={managerInStore} onChange={setManagerInStore} label="I’m in the store" description={managerInStore ? 'Receipts come to you.' : 'The assistant confirms receipts; you get a summary.'} />
        </div>
      </div>
      {open.length === 0 && cash.length === 0 ? <p className="px-5 pb-6 text-ink-muted">Nothing waiting.</p> : <ul className="divide-y divide-line border-t border-line">
          {cash.map((c) => {
        const diff = c.cashCounted - c.cashRecorded;
        return <li key={c.id} className="space-y-2 px-5 py-4">
                <p className="text-[15px] font-semibold">Day close — {inr(c.cashCounted)} cash from {c.by.split(' ')[0]}</p>
                <p className={cn('text-sm', diff ? 'text-critical' : 'text-ink-muted')}>{diff ? `${diff < 0 ? 'Short' : 'Over'} by ${inr(Math.abs(diff))}${c.note ? ` — ${c.note}` : ''}` : 'Matches the recorded cash.'}</p>
                <Button size="sm" onClick={() => confirmClose(c.id)}>Cash received</Button>
              </li>;
      })}
          {open.map((r) => <li key={r.id} className="space-y-2 px-5 py-4">
              <div>
                <p className="text-[15px] font-semibold">
                  {r.kind}{r.amount ? ` ${inr(r.amount)}` : ''}
                  {r.orderId && <Link to={`/orders/${r.orderId}`} className="ml-1.5 font-mono text-xs font-normal text-ink-subtle hover:underline">{r.orderId}</Link>}
                </p>
                <p className="text-sm text-ink-muted">{r.reason}</p>
                <p className={cn('text-xs', isEscalated(r) ? 'text-attention' : 'text-ink-subtle')}>
                  {r.by} · {fmtDateTime(r.at)}{r.customerId ? ` · ${customerName(r.customerId)}` : ''}{r.callback ? ` · call back by ${r.callback}` : ''}{isEscalated(r) ? ' · waiting over 2 h' : ''}
                </p>
              </div>
              <input value={notes[r.id] ?? ''} onChange={(e) => setNotes({
          ...notes,
          [r.id]: e.target.value
        })} placeholder="Note (optional)" aria-label={`Note for ${r.kind}`} className="h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-brand/30" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decideRequest(r.id, true, notes[r.id] ?? '')}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => decideRequest(r.id, false, notes[r.id] ?? '')}>Decline</Button>
              </div>
            </li>)}
        </ul>}
    </section>;
}