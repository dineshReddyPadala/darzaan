import React, { useRef } from 'react';
import { CameraIcon, CheckIcon, XIcon } from 'lucide-react';
import type { QcResult } from '../../types';
import { cn } from '../../utils/cn';
import type { MeasureFinding } from '../../utils/qc';
const choices: {
  v: QcResult;
  label: string;
  on: string;
  icon: string;
  Icon?: typeof CheckIcon;
}[] = [{
  v: 'pass',
  label: 'Pass',
  on: 'bg-success text-white shadow-sm',
  icon: 'text-success',
  Icon: CheckIcon
}, {
  v: 'fail',
  label: 'Fail',
  on: 'bg-critical text-white shadow-sm',
  icon: 'text-critical',
  Icon: XIcon
}, {
  v: 'na',
  label: 'N/A',
  on: 'bg-ink-muted text-white shadow-sm',
  icon: ''
}];

/** Pass / Fail / N/A — one segmented control, touch-sized, one tap. */
export function PassFailButtons({
  value,
  onChange,
  label,
  allowNa = true





}: {value?: QcResult;onChange: (v: QcResult) => void;label: string;allowNa?: boolean;}) {
  return <div role="radiogroup" aria-label={label} className="flex w-full gap-1 rounded-xl bg-sunken p-1">
      {choices.filter((c) => allowNa || c.v !== 'na').map((c) => {
      const on = value === c.v;
      return <button key={c.v} type="button" role="radio" aria-checked={on} onClick={() => onChange(c.v)} className={cn('inline-flex h-11 items-center justify-center gap-1.5 rounded-lg text-[15px] font-semibold transition-[background-color,color] duration-150 ease-out', c.v === 'na' ? 'w-16 shrink-0' : 'flex-1', on ? c.on : 'text-ink-muted hover:bg-surface hover:text-ink')}>
            {c.Icon && <c.Icon className={cn('h-4 w-4', on ? 'text-white' : c.icon)} strokeWidth={2.5} />}
            {c.label}
          </button>;
    })}
    </div>;
}
export function PhotoButton({
  photos,
  onChange,
  label




}: {photos: string[];onChange: (p: string[]) => void;label: string;}) {
  const ref = useRef<HTMLInputElement>(null);
  return <>
      <button type="button" onClick={() => ref.current?.click()} aria-label={`Add photo for ${label}`} className="relative inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-surface px-4 text-[15px] font-medium text-ink-muted ring-1 ring-inset ring-line-strong transition-colors duration-150 ease-out hover:text-ink">
        <CameraIcon className="h-5 w-5" /> Photo
        {photos.length > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">{photos.length}</span>}
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
      const files = e.target.files;
      if (files?.length) onChange([...photos, ...Array.from(files).map((f) => URL.createObjectURL(f))]);
      e.target.value = '';
    }} />
    </>;
}
export function PhotoStrip({
  photos,
  onChange,
  label




}: {photos: string[];onChange: (p: string[]) => void;label: string;}) {
  if (!photos.length) return null;
  return <div className="flex flex-wrap gap-2">
      {photos.map((src) => <span key={src} className="relative h-16 w-16 overflow-hidden rounded-lg">
          <img src={src} alt={`${label} photo`} className="h-full w-full object-cover" />
          <button type="button" onClick={() => onChange(photos.filter((p) => p !== src))} aria-label="Remove photo" className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white"><XIcon className="h-3.5 w-3.5" /></button>
        </span>)}
    </div>;
}

/** Ordered size beside an input; each box turns green (OK), amber (close) or red (off). */
export function MeasureGrid({
  findings,
  actuals,
  onChange




}: {findings: MeasureFinding[];actuals: Record<string, string>;onChange: (name: string, v: string) => void;}) {
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {findings.map((f) => <label key={f.name} className={cn('flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ring-inset transition-colors duration-150 ease-out', f.state === 'off' ? 'bg-critical-soft ring-critical/40' : f.state === 'borderline' ? 'bg-attention-soft ring-attention/40' : f.state === 'ok' ? 'bg-success-soft ring-success/30' : 'bg-surface ring-line-strong')}>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-ink">{f.name}</span>
            <span className={cn('block text-sm tabular', f.state === 'off' ? 'text-critical' : f.state === 'borderline' ? 'text-attention' : f.state === 'ok' ? 'text-success' : 'text-ink-muted')}>
              {f.state === 'empty' ? `Should be ${f.ordered}″` : f.state === 'off' ? `${Math.abs(f.diff)}″ too ${f.diff > 0 ? 'big' : 'small'}` : f.state === 'borderline' ? `${Math.abs(f.diff)}″ off · OK, but close` : 'OK'}
            </span>
          </span>
          <input value={actuals[f.name] ?? ''} onChange={(e) => onChange(f.name, e.target.value)} inputMode="decimal" placeholder={String(f.ordered)} aria-label={`${f.name}, measured in inches`} className="h-12 w-[84px] rounded-lg border border-line-strong bg-surface px-3 text-right text-[16px] tabular focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </label>)}
    </div>;
}