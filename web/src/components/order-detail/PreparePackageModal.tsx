import React, { useEffect, useMemo, useState } from 'react';
import { CheckIcon, SendIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { usePackages } from '../../contexts/PackagesContext';
import { customerAddresses, defaultInstructions, STORES } from '../../data/packages';
import type { Order } from '../../types';
import type { Destination } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { stageLabel, garmentDue } from '../../utils/orders';
import { readyToPackage, storeDestination } from '../../utils/packages';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
const HOME = '__home__';
interface Props {
  order: Order;
  open: boolean;
  onClose: () => void;
}

/** Production sends finished garments to Logistics, who pack, label and dispatch them. */
export function PreparePackageModal({
  order,
  open,
  onClose
}: Props) {
  const {
    customerName
  } = useApp();
  const {
    createPackage
  } = usePackages();
  const ready = useMemo(() => order.garments.filter(readyToPackage), [order]);
  const [picked, setPicked] = useState<string[]>([]);
  const [dest, setDest] = useState('');
  const [deadline, setDeadline] = useState('');
  const [instructions, setInstructions] = useState('');
  useEffect(() => {
    if (!open) return;
    setPicked(ready.map((g) => g.id));
    setDest(order.deliveryMode === 'Home delivery' ? HOME : `${order.store} Store`);
    setDeadline(ready.length ? ready.map((g) => garmentDue(order, g)).sort()[0] : order.deliveryDate);
    const notes = ready.map((g) => g.notes).filter(Boolean).join(' ');
    setInstructions([defaultInstructions, notes].filter(Boolean).join(' '));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const customer = customerName(order.customerId);
  const destination: Destination = dest === HOME ? {
    kind: 'customer',
    name: customer,
    detail: customerAddresses[order.customerId] ?? 'Address on file'
  } : storeDestination(dest);
  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const submit = () => {
    createPackage({
      order,
      garmentIds: picked,
      destination,
      deadline,
      instructions: instructions.trim()
    });
    onClose();
  };
  return <Modal open={open} onClose={onClose} title="Send to packing" size="lg" footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button icon={<SendIcon className="h-4 w-4" />} disabled={!picked.length || !deadline} onClick={submit}>Send to Logistics</Button>
    </>}>
      <div className="space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-muted">Garments in this box</legend>
          <ul className="divide-y divide-line rounded-xl ring-1 ring-line">
            {order.garments.map((g) => {
            const can = readyToPackage(g);
            const on = picked.includes(g.id);
            const reason = g.packageId ? `In ${g.packageId}` : `At ${stageLabel(g.stage)}`;
            return <li key={g.id}>
                  <button type="button" disabled={!can} onClick={() => toggle(g.id)} aria-pressed={on} className="flex w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed">
                    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1 ring-inset', on ? 'bg-brand text-white ring-brand' : 'bg-surface ring-line-strong', !can && 'bg-sunken')}>
                      {on && <CheckIcon className="h-4 w-4" strokeWidth={3} />}
                    </span>
                    {g.photos[0] && <img src={g.photos[0]} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
                    <span className={cn('min-w-0 flex-1 text-[15px] font-medium', !can && 'text-ink-subtle')}>{g.subCategory}</span>
                    <span className={cn('shrink-0 text-sm', can ? 'text-success' : 'text-ink-subtle')}>{can ? 'Ready' : reason}</span>
                  </button>
                </li>;
          })}
          </ul>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destination" required>
            <select value={dest} onChange={(e) => setDest(e.target.value)} className={inputClass}>
              {STORES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              <option value={HOME}>Customer's home</option>
            </select>
          </Field>
          <Field label="Deliver by" required>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <p className="-mt-3 text-sm text-ink-muted">{destination.kind === 'customer' ? `${customer} · ` : ''}{destination.detail}</p>

        <Field label="Packing instructions">
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} className={cn(inputClass, 'h-auto py-3')} />
        </Field>
      </div>
    </Modal>;
}