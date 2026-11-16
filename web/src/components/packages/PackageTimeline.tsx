import React from 'react';
import { CheckIcon, KeyboardIcon, ScanLineIcon, TriangleAlertIcon } from 'lucide-react';
import type { PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { fmtDateTime } from '../../utils/format';
import { packageStatusLabel, progressSteps } from '../../utils/packages';
const shortLabel: Record<string, string> = {
  'Packaging assigned': 'Packing',
  'Ready for dispatch': 'Packed',
  'Assigned to runner': 'Out for delivery',
  Delivered: 'Delivered'
};

/** Compact horizontal progress for one package. */
export function PackageProgress({
  p


}: {p: PackageRecord;}) {
  const raw = p.status === 'Problem' ? p.problem?.from ?? 'Assigned to runner' : p.status;
  const status = raw === 'Picked up' || raw === 'In transit' ? 'Assigned to runner' : raw;
  const idx = progressSteps.indexOf(status);
  const closed = idx === progressSteps.length - 1;
  return <ol className="grid grid-cols-4 gap-1" aria-label="Package progress">
      {progressSteps.map((s, i) => {
      const done = i < idx || closed && i === idx;
      const current = i === idx && !closed;
      return <li key={s} className="min-w-0">
            <span className={cn('block h-1.5 rounded-full', done ? 'bg-success' : current ? p.status === 'Problem' ? 'bg-critical' : 'bg-info' : 'bg-sunken')} />
            <span className={cn('mt-1.5 block truncate text-xs', done || current ? 'font-medium text-ink' : 'text-ink-subtle')}>{shortLabel[s]}</span>
          </li>;
    })}
    </ol>;
}

/** Every scan and status change, newest first — nothing is overwritten. */
export function PackageHistory({
  p


}: {p: PackageRecord;}) {
  return <ol className="space-y-3">
      {[...p.history].reverse().map((h, i) => <li key={i} className="flex gap-3 text-sm">
          <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', h.exception ? 'bg-critical-soft text-critical' : h.scanOnly ? 'bg-sunken text-ink-muted' : 'bg-success-soft text-success')} aria-hidden>
            {h.exception ? <TriangleAlertIcon className="h-3.5 w-3.5" /> : h.scanOnly ? h.typed ? <KeyboardIcon className="h-3.5 w-3.5" /> : <ScanLineIcon className="h-3.5 w-3.5" /> : <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-ink">{h.to ? packageStatusLabel[h.to] : h.typed ? 'Code typed in' : 'Scanned'}{h.typed && h.to ? ' · typed in' : ''}</p>
            <p className="text-ink-muted">{fmtDateTime(h.at)} · {h.by} · {h.where}</p>
            {h.note && <p className="text-ink-subtle">{h.note}</p>}
          </div>
        </li>)}
    </ol>;
}