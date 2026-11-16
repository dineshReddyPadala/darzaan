import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCheckIcon, CheckIcon, MinusIcon, XIcon } from 'lucide-react';
import { qcChecklist } from '../../data/production';
import type { QcGarmentState } from '../../hooks/useQcGarment';
import type { QcResult } from '../../types';
import { cn } from '../../utils/cn';
import { inputClass, panelClass } from '../../utils/styles';
import { Badge } from '../ui/Badge';
import { PassFailButtons, PhotoButton, PhotoStrip } from './QcInputs';
const ease = [0.23, 1, 0.32, 1] as const;
/** Shared columns so every item's text and buttons line up. */
const row = 'grid gap-3 md:grid-cols-[minmax(0,1fr)_280px] md:items-center md:gap-6';

/** Step 3 — the pass/fail checklist. A failed item asks for a short note and a photo. */
export function InspectQualityStep({
  qc


}: {qc: QcGarmentState;}) {
  const {
    draft
  } = qc;
  const lastFailed = qc.openRework?.defect.category;
  const items = qcChecklist.filter((c) => c.key !== 'measurements').sort((a, b) => Number(b.key === lastFailed) - Number(a.key === lastFailed));
  const answered = items.filter((c) => draft.results[c.key]).length;
  const set = (key: string, v: QcResult) => qc.setDraft((d) => ({
    ...d,
    results: {
      ...d.results,
      [key]: v
    }
  }));
  const setNote = (key: string, v: string) => qc.setDraft((d) => ({
    ...d,
    notes: {
      ...d.notes,
      [key]: v
    }
  }));
  const setPhotos = (key: string, p: string[]) => qc.setDraft((d) => ({
    ...d,
    photos: {
      ...d.photos,
      [key]: p
    }
  }));
  const allPass = () => qc.setDraft((d) => ({
    ...d,
    results: {
      ...d.results,
      ...Object.fromEntries(items.filter((c) => !d.results[c.key]).map((c) => [c.key, 'pass' as QcResult]))
    }
  }));
  return <div className="space-y-5">
      <div>
        <h2 className="font-display text-[26px] font-medium leading-tight text-ink">Check the quality</h2>
        <p className="mt-1 text-[16px] text-ink-muted">Tap Pass or Fail for each item. Use N/A if it isn’t on this garment.</p>
      </div>

      <section className={cn(panelClass, 'overflow-hidden')} aria-label="Quality checklist">
        <div className="flex items-center gap-4 border-b border-line px-5 py-3">
          <span className="shrink-0 text-sm font-medium text-ink tabular">{answered} of {items.length} checked</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken" aria-hidden>
            <div className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out" style={{
            width: `${answered / items.length * 100}%`
          }} />
          </div>
          {answered < items.length && <button type="button" onClick={allPass} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink ring-1 ring-inset ring-line-strong transition-colors duration-150 ease-out hover:bg-canvas">
              <CheckCheckIcon className="h-4 w-4 text-success" /> Pass the rest
            </button>}
        </div>
        <ul className="divide-y divide-line">
          {items.map((c) => {
          const result = draft.results[c.key];
          const failed = result === 'fail';
          const photos = draft.photos[c.key] ?? [];
          return <li key={c.key} className={cn('px-5 py-4 transition-colors duration-150 ease-out', failed && 'bg-critical-soft/40')}>
                <div className={row}>
                  <div className="flex min-w-0 items-start gap-3">
                    <StatusMark result={result} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold text-ink">
                        {c.label}
                        {c.key === lastFailed && <Badge tone="attention">Failed last time</Badge>}
                      </p>
                      <p className="text-[15px] text-ink-muted">{c.hint}</p>
                    </div>
                  </div>
                  <PassFailButtons value={draft.results[c.key]} onChange={(v) => set(c.key, v)} label={c.label} />
                </div>
                <AnimatePresence initial={false}>
                  {failed && <motion.div initial={{
                opacity: 0,
                height: 0
              }} animate={{
                opacity: 1,
                height: 'auto'
              }} exit={{
                opacity: 0,
                height: 0
              }} transition={{
                duration: 0.18,
                ease
              }} className="overflow-hidden">
                      <div className={cn(row, 'pt-3 md:pl-9')}>
                        <input value={draft.notes?.[c.key] ?? ''} onChange={(e) => setNote(c.key, e.target.value)} placeholder="What’s wrong? e.g. beads missing on the front" aria-label={`What’s wrong with ${c.label}`} className={inputClass} />
                        <PhotoButton photos={photos} onChange={(p) => setPhotos(c.key, p)} label={c.label} />
                      </div>
                      {photos.length > 0 && <div className="pt-3 md:pl-9"><PhotoStrip photos={photos} onChange={(p) => setPhotos(c.key, p)} label={c.label} /></div>}
                    </motion.div>}
                </AnimatePresence>
              </li>;
        })}
        </ul>
      </section>
    </div>;
}

/** Small leading mark so answered items read at a glance down the list. */
function StatusMark({
  result


}: {result?: QcResult;}) {
  const base = 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full';
  if (result === 'pass') return <span className={cn(base, 'bg-success text-white')}><CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /></span>;
  if (result === 'fail') return <span className={cn(base, 'bg-critical text-white')}><XIcon className="h-3.5 w-3.5" strokeWidth={3} /></span>;
  if (result === 'na') return <span className={cn(base, 'bg-sunken text-ink-muted')}><MinusIcon className="h-3.5 w-3.5" strokeWidth={3} /></span>;
  return <span className={cn(base, 'ring-2 ring-inset ring-line-strong')} aria-hidden />;
}