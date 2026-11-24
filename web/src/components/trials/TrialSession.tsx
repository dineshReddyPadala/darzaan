import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon, UserXIcon, XIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Order } from '../../types';
import { cn } from '../../utils/cn';
import { nowIso, uid } from '../../utils/format';
import { deriveStatus } from '../../utils/orders';
import { orderTotals } from '../../utils/pricing';
import { stageOwnerLabel } from '../../utils/roles';
import { inputClass, textareaClass } from '../../utils/styles';
import { AlterationForm } from '../order-detail/AlterationForm';
import { Button } from '../ui/Button';
import { PhotoCapture } from '../ui/PhotoCapture';
const TRIAL = {
  entity: 'trial',
  action: 'update'
} as const;

/** The trial, run inline on the order page: arrived → photos & notes → fits, or log an alteration. */
export function TrialSession({
  order,
  onDone,
  bare = false




}: {order: Order;onDone: () => void; /** Inside a popup: no frame or header of its own. */bare?: boolean;}) {
  const {
    customerName,
    updateOrder,
    logActivity,
    can
  } = useApp();
  const [attended, setAttended] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState<'fits' | 'alter' | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const [design, setDesign] = useState({
    field: '',
    after: ''
  });
  const completeTrial = (o: Order, n: string): Order => ({
    ...o,
    trial: {
      ...(o.trial ?? {
        date: nowIso().slice(0, 10),
        time: '—'
      }),
      status: 'Completed',
      notes: n
    }
  });
  const noShow = () => {
    if (!updateOrder(order.id, (o) => ({
      ...o,
      trial: o.trial ? {
        ...o.trial,
        status: 'Missed',
        contactAttempts: 1
      } : o.trial,
      messages: [...o.messages, {
        id: uid('M'),
        channel: 'WhatsApp',
        template: 'Reschedule link',
        at: nowIso(),
        status: 'Delivered'
      }],
      risk: {
        severity: 'attention',
        message: 'Customer missed trial — reschedule needed',
        owner: o.designer
      }
    }), TRIAL)) return;
    logActivity(order.id, 'Customer did not attend trial — reschedule link sent', 'trial');
    toast.success('Marked as missed', {
      description: 'Reschedule link sent on WhatsApp.'
    });
    onDone();
  };
  const fits = () => {
    const ok = updateOrder(order.id, (o) => {
      const updated = {
        ...completeTrial(o, notes || 'Fits well'),
        risk: undefined,
        nextAction: {
          label: orderTotals(o).balance > 0 ? 'Collect balance and hand over' : 'Ready for pickup',
          owner: stageOwnerLabel('delivery')
        }
      };
      return {
        ...updated,
        status: deriveStatus(updated)
      };
    }, TRIAL);
    if (!ok) return;
    logActivity(order.id, `Trial completed — fits${notes ? `. ${notes}` : ''}`, 'trial');
    toast.success('Ready for pickup', {
      description: 'Customer notified with pickup details.'
    });
    onDone();
  };
  const sendDesignChange = () => {
    if (!design.field.trim() || !design.after.trim()) return;
    if (!updateOrder(order.id, (o) => ({
      ...o,
      changeRequests: [...o.changeRequests, {
        id: uid('CR'),
        field: design.field.trim(),
        before: 'As ordered',
        after: design.after.trim(),
        priceImpact: 0,
        dateImpact: 'To be confirmed',
        status: 'Awaiting approval',
        requestedBy: customerName(o.customerId),
        at: nowIso()
      }]
    }))) return;
    logActivity(order.id, `Design change asked for at trial: ${design.field.trim()} → ${design.after.trim()}`, 'change');
    toast.success('Design change sent for approval');
    setDesign({
      field: '',
      after: ''
    });
    setDesignOpen(false);
  };
  return <section className={bare ? '' : 'rounded-2xl bg-surface ring-2 ring-brand'} aria-label="Trial in progress">
      <header className={cn('flex items-center justify-between gap-3 border-b border-line px-5 py-4', bare && 'hidden')}>
        <div>
          <h2 className="text-lg font-semibold">Trial · {customerName(order.customerId)}</h2>
          <p className="text-sm text-ink-muted">{order.garments.map((g) => g.subCategory).join(' · ')}</p>
        </div>
        <button onClick={onDone} aria-label="Close trial" className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-subtle hover:bg-sunken"><XIcon className="h-5 w-5" /></button>
      </header>
      <div className={cn('space-y-5', !bare && 'p-5')}>
        {!can('trial', 'update') ? <p className="text-[15px] text-ink-muted">Trial outcomes are recorded by the store team.</p> : attended === null ? <div>
            <p className="mb-3 text-[15px] font-medium">Did the customer arrive?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" icon={<CheckIcon className="h-5 w-5" />} onClick={() => {
            setAttended(true);
            logActivity(order.id, 'Customer arrived for trial', 'trial');
          }}>Arrived</Button>
              <Button size="lg" variant="secondary" icon={<UserXIcon className="h-5 w-5" />} onClick={noShow}>No-show</Button>
            </div>
          </div> : <>
            <div className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)]">
              <PhotoCapture photos={photos} onChange={setPhotos} label="Capture fit" />
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaClass} placeholder="Fit notes — what did you observe?" aria-label="Fit notes" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setOutcome('fits')} className={cn('rounded-xl px-4 py-4 text-left transition-[background-color,box-shadow] duration-150 ease-out', outcome === 'fits' ? 'bg-success-soft ring-2 ring-inset ring-success' : 'ring-1 ring-inset ring-line-strong hover:bg-canvas')}>
                <span className="block text-[15px] font-semibold">Fits — ready</span>
                <span className="block text-sm text-ink-muted">Move to pickup</span>
              </button>
              <button onClick={() => setOutcome('alter')} className={cn('rounded-xl px-4 py-4 text-left transition-[background-color,box-shadow] duration-150 ease-out', outcome === 'alter' ? 'bg-attention-soft ring-2 ring-inset ring-attention' : 'ring-1 ring-inset ring-line-strong hover:bg-canvas')}>
                <span className="block text-[15px] font-semibold">Needs alteration</span>
                <span className="block text-sm text-ink-muted">Free or paid</span>
              </button>
            </div>
            {outcome === 'fits' && <Button size="lg" fullWidth onClick={fits}>Complete trial</Button>}
            {outcome === 'alter' && <div className="rounded-2xl bg-canvas p-4">
                <AlterationForm order={order} extra={(o) => completeTrial(o, notes)} submitLabel="Log alteration & finish trial" onSaved={onDone} />
              </div>}
            <div className="border-t border-line pt-4">
              {!designOpen ? <button onClick={() => setDesignOpen(true)} className="text-sm font-medium text-brand hover:underline">Customer wants a design change, not a fit fix?</button> : <div className="space-y-3">
                  <p className="text-sm font-medium">Design change <span className="font-normal text-ink-muted">— goes to the designer or manager for approval</span></p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={design.field} onChange={(e) => setDesign({
                ...design,
                field: e.target.value
              })} className={inputClass} placeholder="What should change? e.g. Neckline" aria-label="What should change" />
                    <input value={design.after} onChange={(e) => setDesign({
                ...design,
                after: e.target.value
              })} className={inputClass} placeholder="Customer wants" aria-label="Requested design" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={!design.field.trim() || !design.after.trim()} onClick={sendDesignChange}>Send for approval</Button>
                    <Button variant="ghost" onClick={() => setDesignOpen(false)}>Cancel</Button>
                  </div>
                </div>}
            </div>
          </>}
      </div>
    </section>;
}