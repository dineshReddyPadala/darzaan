import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import type { Alteration, Order, StageKey } from '../../types';
import { cn } from '../../utils/cn';
import { inr, nowIso, uid } from '../../utils/format';
import { nextAlterationRound } from '../../utils/pricing';
import { stageOwnerLabel } from '../../utils/roles';
import { chipClass, inputClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Segmented } from '../ui/Segmented';
interface Props {
  order: Order;
  /** Extra changes saved with the alteration, e.g. completing the trial it came from. */
  extra?: (o: Order) => Order;
  submitLabel?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}

/** Record an alteration as Free or Paid. Paid needs a price and the customer's request. */
export function AlterationForm({
  order,
  extra,
  submitLabel = 'Log alteration',
  onSaved,
  onCancel
}: Props) {
  const {
    updateOrder,
    logActivity,
    user,
    roleDef
  } = useApp();
  const [garmentId, setGarmentId] = useState(order.garments[0].id);
  const [type, setType] = useState<'Small' | 'Major'>('Small');
  // Fit: charged by round on this garment (#1 free, #2 50%, #3+ 100%). Request: the customer asked for a change — priced by hand.
  const [kind, setKind] = useState<'Fit' | 'Request'>('Fit');
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const tier = nextAlterationRound(order, garmentId);
  const amount = kind === 'Fit' ? tier.amount : Number(price) || 0;
  const billing: 'Free' | 'Paid' = amount > 0 ? 'Paid' : 'Free';
  const canPrice = roleDef.scope.prices;
  const valid = kind === 'Fit' || amount > 0 && reason.trim().length > 0;
  const issue = kind === 'Fit' ? 'Fit fix' : 'Customer request';
  const tierText = tier.pct === 0 ? 'Free' : `${tier.pct * 100}% · ${inr(tier.amount)}`;
  const save = () => {
    if (!valid) return;
    const g = order.garments.find((x) => x.id === garmentId)!;
    const storeTailor = 'Ramesh Yadav';
    const alt: Alteration = {
      id: uid('ALT'),
      at: nowIso(),
      issue,
      notes: kind === 'Request' ? [reason.trim(), notes.trim()].filter(Boolean).join(' — ') : notes.trim(),
      type,
      status: type === 'Small' ? 'Open' : 'In workshop',
      charge: amount,
      billing,
      round: kind === 'Fit' ? tier.round : undefined,
      garmentId,
      recordedBy: user.name
    };
    const ok = updateOrder(order.id, (o) => {
      const base: Order = {
        ...o,
        status: 'Alteration',
        garments: o.garments.map((x) => x.id === garmentId ? {
          ...x,
          stage: 'alteration' as StageKey,
          assignee: type === 'Major' ? undefined : storeTailor
        } : x),
        alterations: [...o.alterations, alt],
        nextAction: {
          label: type === 'Small' ? 'Fix in store' : 'Workshop alteration',
          owner: type === 'Small' ? storeTailor : stageOwnerLabel('alteration')
        }
      };
      return extra ? extra(base) : base;
    }, {
      entity: 'alteration',
      action: 'create'
    });
    if (!ok) return;
    logActivity(order.id, `Alteration on ${g.subCategory}: ${issue} (${type.toLowerCase()}) · ${kind === 'Fit' ? `#${tier.round}, ${tierText.toLowerCase()}` : `${inr(amount)} — ${reason.trim()}`}`, 'alteration');
    toast.success(type === 'Small' ? 'Alteration logged for the store tailor' : 'Sent back to the workshop', {
      description: amount > 0 ? `${inr(amount)} added to the balance` : 'Free alteration'
    });
    onSaved?.();
  };
  return <div className="space-y-4">
      {order.garments.length > 1 && <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">Garment</p>
          <div className="flex flex-wrap gap-2">
            {order.garments.map((g) => <button key={g.id} type="button" onClick={() => setGarmentId(g.id)} className={chipClass(garmentId === g.id)}>{g.subCategory}</button>)}
          </div>
        </div>}
      <Segmented fullWidth size="lg" value={type} onChange={setType} options={[{
      value: 'Small',
      label: 'Small — fix in store'
    }, {
      value: 'Major',
      label: 'Major — send to workshop'
    }]} />

      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Alteration type">
        {(['Fit', 'Request'] as const).map((k) => {
        const on = kind === k;
        const disabled = k === 'Request' && !canPrice;
        const free = k === 'Fit' && tier.pct === 0;
        return <button key={k} type="button" role="radio" aria-checked={on} disabled={disabled} onClick={() => setKind(k)} className={cn('rounded-xl px-4 py-3.5 text-left transition-[background-color,box-shadow] duration-150 ease-out disabled:opacity-40', on ? free ? 'bg-success-soft ring-2 ring-inset ring-success' : 'bg-warning-soft ring-2 ring-inset ring-warning' : 'bg-surface ring-1 ring-inset ring-line-strong hover:bg-canvas')}>
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-semibold">{k === 'Fit' ? `Fit fix · #${tier.round}` : 'Customer’s request'}</span>
                {k === 'Fit' && <span className={cn('text-[15px] font-semibold tabular', free ? 'text-success' : 'text-warning')}>{tierText}</span>}
              </span>
            </button>;
      })}
      </div>

      {kind === 'Request' && <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
          <Field label="Price">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
              <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className={`${inputClass} pl-8 tabular`} aria-invalid={billing === 'Paid' && amount <= 0} />
            </div>
          </Field>
          <Field label="What the customer asked for">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Shorten sleeves to elbow length" className={inputClass} />
          </Field>
        </div>}
      <Field label="Notes for the tailor">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Where to take in, how much, pins placed…" className={textareaClass} />
      </Field>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {amount > 0 && <p className="mr-auto text-sm font-medium text-warning">{inr(amount)} will be added to the order total</p>}
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button onClick={save} disabled={!valid}>{submitLabel}</Button>
      </div>
    </div>;
}