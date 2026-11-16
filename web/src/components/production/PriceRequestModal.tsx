import React, { useEffect, useState } from 'react';
import { usePriceRequests } from '../../contexts/PriceRequestsContext';
import type { PriceRequest } from '../../types';
import { cn } from '../../utils/cn';
import { fmtDate, fmtDateTime } from '../../utils/format';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
type Mode = 'price' | 'decline';

/** The Production Head prices a custom design: one number, one button — or says it can't be made. */
export function PriceRequestModal({
  request,
  onClose



}: {request?: PriceRequest;onClose: () => void;}) {
  const {
    confirm,
    decline
  } = usePriceRequests();
  const [mode, setMode] = useState<Mode>('price');
  const [amount, setAmount] = useState('');
  const [text, setText] = useState('');
  useEffect(() => {
    setMode('price');
    setAmount('');
    setText('');
  }, [request?.id]);
  if (!request) return null;
  const r = request;
  const value = Number(amount);
  const footer = mode === 'price' ? <div className="flex w-full flex-wrap items-center justify-end gap-2">
      <Button variant="ghost" onClick={() => setMode('decline')}>Can’t do this</Button>
      <Button disabled={!(value > 0)} onClick={() => {
      confirm(r.id, value, 0);
      onClose();
    }}>Confirm price</Button>
    </div> : <div className="flex w-full flex-wrap items-center justify-end gap-2">
      <Button variant="secondary" onClick={() => setMode('price')}>Back</Button>
      <Button variant="danger" disabled={!text.trim()} onClick={() => {
      decline(r.id, text.trim());
      onClose();
    }}>Send to store</Button>
    </div>;
  return <Modal open onClose={onClose} title={`Price this design · ${r.garmentLabel}`} description={`${r.customerName} · sent by ${r.requestedBy}, ${fmtDateTime(r.requestedAt)}`} footer={footer} size="lg">
      <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-sunken text-sm text-ink-subtle">
          {r.sketch ? <img src={r.sketch} alt="Custom design sketch" className="h-full w-full object-cover" /> : 'No sketch — see description'}
        </div>
        <div className="min-w-0">
          <p className="text-[16px] leading-relaxed">{r.description}</p>
          <dl className="mt-4 divide-y divide-line border-y border-line text-[15px]">
            {([['Placement', r.placement || '—'], ['Garment', r.garmentLabel], ['Fabric', r.fabric], ['Due', fmtDate(r.dueDate, 'EEE d MMM')]] as const).map(([k, v]) => <div key={k} className="flex gap-4 py-2">
                <dt className="w-24 shrink-0 text-ink-muted">{k}</dt>
                <dd className="min-w-0">{v}</dd>
              </div>)}
          </dl>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        {mode === 'price' ? <Field label="Design price" required>
            <div className="relative max-w-[280px]">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
              <input type="number" inputMode="numeric" min={0} step={100} autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={cn(inputClass, 'pl-8 text-[18px] font-semibold tabular')} aria-label="Design price in rupees" />
            </div>
          </Field> : <Field label="Why it can’t be made" required>
            <textarea autoFocus rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Zardozi this dense won’t sit on georgette — suggest silk." className={inputClass} />
          </Field>}
      </div>
    </Modal>;
}