import React from 'react';
import { CheckIcon } from 'lucide-react';
import type { PackageEvent, PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { fmtDateTime } from '../../utils/format';

/** Packed → Out for delivery → Delivered / Received at store, with when and who under each step. */
export function ShipmentTracker({
  p


}: {p: PackageRecord;}) {
  const h = p.history;
  const last = (fn: (e: PackageEvent) => boolean) => [...h].reverse().find(fn);
  const store = p.destination.kind === 'store';
  const steps: {
    label: string;
    ev?: PackageEvent;
    who?: string;
  }[] = [{
    label: 'Sent to packing',
    ev: h[0]
  }, {
    label: 'Packed',
    ev: last((e) => e.to === 'Ready for dispatch')
  }, {
    label: 'Out for delivery',
    ev: p.runner ? last((e) => e.to === 'Assigned to runner' || e.to === 'Picked up') : undefined,
    who: p.runner
  }, {
    label: store ? 'Received at store' : 'Delivered · OTP confirmed',
    ev: last((e) => e.to === 'Delivered'),
    who: store ? p.receivedBy : p.deliveredBy
  }];
  const current = steps.findIndex((s) => !s.ev);
  return <ol className="grid gap-4 sm:grid-cols-4 sm:gap-2" aria-label="Shipment progress">
      {steps.map((s, i) => {
      const done = !!s.ev;
      const isCurrent = i === current;
      return <li key={s.label} className="relative flex gap-3 sm:block">
            <div className="flex items-center sm:mb-3">
              <span aria-hidden className={cn('relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', done ? 'bg-brand text-white' : isCurrent ? 'bg-surface ring-2 ring-inset ring-brand text-brand' : 'bg-surface ring-1 ring-inset ring-line-strong text-ink-subtle')}>
                {done ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              {i < steps.length - 1 && <span aria-hidden className={cn('ml-2 hidden h-0.5 flex-1 sm:block', done ? 'bg-brand' : 'bg-line')} />}
            </div>
            <div className="min-w-0 text-sm">
              <p className={cn('text-[15px] font-medium', done || isCurrent ? 'text-ink' : 'text-ink-subtle')}>
                {s.label}<span className="sr-only"> — {done ? 'done' : isCurrent ? 'next' : 'not yet'}</span>
              </p>
              {s.ev && <p className="text-ink-muted">{fmtDateTime(s.ev.at)}</p>}
              {s.ev && (s.who ?? s.ev.by) && <p className="text-ink-subtle">{s.who ?? s.ev.by}</p>}
              {!s.ev && isCurrent && i === 3 && <p className="text-ink-muted">{store ? 'Updates when the store scans it' : 'Updates when the customer gives the OTP'}</p>}
            </div>
          </li>;
    })}
    </ol>;
}