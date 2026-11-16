import React, { useEffect, useState } from 'react';
import { AlertTriangleIcon, CheckIcon, ClockIcon, PencilIcon, PercentIcon, PhoneIcon, RotateCcwIcon, SendIcon, XIcon } from 'lucide-react';
import { minutesWaiting, REMIND_AFTER_MIN, usePriceRequests } from '../../contexts/PriceRequestsContext';
import type { Garment } from '../../types';
import { cn } from '../../utils/cn';
import { inr } from '../../utils/format';
import { designNet } from '../../utils/pricing';
import { chipClass, inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
const DISCOUNTS = [0, 10, 12, 15];
interface Props {
  g: Garment;
  hasDesign: boolean;
  canEdit: boolean;
  onAsk: () => void;
  onReconfirm: () => void;
  onEdit: (amount: number) => void;
  onDiscount: (pct: number) => void;
}

/** The workshop's price for a custom design, as the store sees it while filling the order. */
export function DesignPriceStatus({
  g,
  hasDesign,
  canEdit,
  onAsk,
  onReconfirm,
  onEdit,
  onDiscount
}: Props) {
  const {
    get
  } = usePriceRequests();
  const q = g.customQuote;
  const r = get(q?.requestId);
  const [editing, setEditing] = useState(false);
  const [showDiscount, setShowDiscount] = useState((q?.discountPct ?? 0) > 0);
  const [draft, setDraft] = useState('');
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);
  if (!q || !r) {
    return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3">
        <p className="min-w-0 flex-1 text-[15px] font-semibold">Price from the workshop</p>
        <Button onClick={onAsk} disabled={!hasDesign} icon={<SendIcon className="h-4 w-4" />}>Ask workshop for a price</Button>
      </div>;
  }
  if (q.status === 'Confirmed') {
    const gross = q.editedAmount ?? q.amount ?? 0;
    const net = designNet(q);
    const save = () => {
      const n = Number(draft);
      if (n > 0) onEdit(n);
      setEditing(false);
    };
    return <div className="rounded-xl border border-line" aria-live="polite">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <CheckIcon className="h-5 w-5 text-success" strokeWidth={3} />
          {editing ? <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative w-40">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
                <input type="number" min={0} step={100} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} className={cn(inputClass, 'pl-8 tabular')} aria-label="Design price" />
              </div>
              <Button size="sm" onClick={save} disabled={!(Number(draft) > 0)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div> : <p className="min-w-0 flex-1 text-[15px]">
              <span className="font-semibold tabular">{inr(net)}</span>
              {net !== (q.amount ?? 0) && <span className="ml-2 text-sm tabular text-ink-subtle line-through">{inr(q.amount ?? 0)}</span>}
              <span className="text-ink-muted"> · {q.editedAmount ? `edited by ${q.editedBy}` : `confirmed by ${q.confirmedBy}`}</span>
            </p>}
          {!editing && canEdit && <button type="button" onClick={() => {
          setDraft(String(gross));
          setEditing(true);
        }} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
              <PencilIcon className="h-3.5 w-3.5" /> Edit price
            </button>}
        </div>
        <div className="border-t border-line px-4 py-3">
          {showDiscount ? <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-muted">Discount</p>
                <button type="button" onClick={() => {
              onDiscount(0);
              setShowDiscount(false);
            }} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-ink-muted hover:bg-sunken hover:text-ink">
                  <XIcon className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Design discount">
                {DISCOUNTS.map((d) => <button key={d} type="button" role="radio" aria-checked={(q.discountPct ?? 0) === d} onClick={() => onDiscount(d)} className={chipClass((q.discountPct ?? 0) === d)}>{d === 0 ? 'None' : `${d}%`}</button>)}
              </div>
            </div> : <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => setShowDiscount(true)} className="inline-flex h-9 items-center gap-1.5 text-[15px] font-medium text-brand hover:underline">
                <PercentIcon className="h-4 w-4" /> Apply discount
              </button>
              <button type="button" onClick={onReconfirm} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink">
                <RotateCcwIcon className="h-3.5 w-3.5" /> Send back to reconfirm
              </button>
            </div>}
          {showDiscount && <div className="mt-3 flex justify-end border-t border-line pt-2">
              <button type="button" onClick={onReconfirm} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-muted hover:bg-sunken hover:text-ink">
                <RotateCcwIcon className="h-3.5 w-3.5" /> Send back to reconfirm
              </button>
            </div>}
        </div>
      </div>;
  }
  if (q.status === 'Declined') {
    const why = [...r.messages].reverse().find((m) => m.from === 'workshop');
    return <div className="rounded-xl bg-critical-soft px-4 py-3" aria-live="polite">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-critical"><AlertTriangleIcon className="h-4 w-4" />Workshop can’t make this design</p>
        {why && <p className="mt-1 text-[15px] text-ink">“{why.text}” <span className="text-sm text-ink-muted">— {why.who}</span></p>}
        <Button className="mt-3" variant="secondary" onClick={onAsk} disabled={!hasDesign}>Ask again</Button>
      </div>;
  }
  const mins = minutesWaiting(r);
  const late = mins >= REMIND_AFTER_MIN;
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-4 py-3" aria-live="polite">
      <ClockIcon className="h-5 w-5 text-attention" />
      <p className="min-w-0 flex-1 text-[15px]">
        <span className="font-semibold text-attention">{late ? 'Still waiting' : 'Price pending'}</span>
        <span className="text-ink-muted"> · sent {mins < 1 ? 'just now' : `${mins} min ago`}</span>
      </p>
      {late && <span className="flex items-center gap-1.5 text-sm font-medium text-attention"><PhoneIcon className="h-4 w-4" />Call the workshop</span>}
    </div>;
}