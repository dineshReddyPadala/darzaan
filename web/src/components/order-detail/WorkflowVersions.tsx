import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, HistoryIcon, XIcon } from 'lucide-react';
import { useQcGarment } from '../../hooks/useQcGarment';
import type { Garment, StageKey } from '../../types';
import { cn } from '../../utils/cn';
import { fmtDate, fmtDateTime } from '../../utils/format';
import { stageLabel } from '../../utils/orders';
import type { VersionView } from '../../utils/workflowVersions';
import { DoneStepList } from './DoneStepList';

/** Round picker, modelled on CI "attempt" switchers: shows the round you're viewing, lists every round with its outcome. */
export function RoundMenu({
  versions,
  selected,
  onSelect




}: {versions: VersionView[];selected: number;onSelect: (n: number) => void;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);
  const sel = versions.find((v) => v.number === selected)!;
  return <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open} className="inline-flex h-10 items-center gap-2 rounded-lg bg-surface px-3 text-sm font-medium ring-1 ring-inset ring-line-strong hover:bg-canvas">
        <HistoryIcon className="h-4 w-4 text-ink-muted" />
        {sel.current ? `${attemptName(sel.number)} · current` : attemptName(sel.number)}
        <ChevronDownIcon className={cn('h-4 w-4 text-ink-muted transition-transform duration-150 ease-out', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && <motion.ul initial={{
        opacity: 0,
        y: -4,
        scale: 0.98
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: -4,
        scale: 0.98
      }} transition={{
        duration: 0.15,
        ease: [0.23, 1, 0.32, 1]
      }} style={{
        transformOrigin: 'top right'
      }} role="listbox" aria-label="Production round" className="absolute right-0 top-full z-30 mt-2 w-[300px] overflow-hidden rounded-xl bg-surface py-1 shadow-pop ring-1 ring-line">
            {[...versions].reverse().map((v) => {
          const on = v.number === selected;
          return <li key={v.number}>
                  <button type="button" role="option" aria-selected={on} onClick={() => {
              onSelect(v.number);
              setOpen(false);
            }} className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-canvas', on && 'bg-canvas')}>
                    <RoundDot v={v} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{attemptName(v.number)}{v.current ? ' · current' : ''}</span>
                      <span className="block truncate text-sm text-ink-muted">{roundSummary(v)}</span>
                    </span>
                    {on && <CheckIcon className="h-4 w-4 text-brand" />}
                  </button>
                </li>;
        })}
          </motion.ul>}
      </AnimatePresence>
    </div>;
}
function RoundDot({
  v


}: {v: VersionView;}) {
  const failed = !v.current;
  const passed = v.current && v.lastInspection?.outcome === 'Pass';
  return <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', failed ? 'bg-critical text-white' : passed ? 'bg-success text-white' : 'bg-brand-soft text-brand')} aria-hidden>
      {failed ? <XIcon className="h-3.5 w-3.5" strokeWidth={3} /> : passed ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-2 w-2 rounded-full bg-brand" />}
    </span>;
}
/** Plain name for a production attempt: the first make, then each repair after a QC fail. */
export function attemptName(n: number) {
  return `Version ${n}`;
}
function roundSummary(v: VersionView) {
  if (!v.current) return `Failed QC ${fmtDate(v.endedAt!, 'd MMM')} · ${v.failure?.defect.type ?? ''}`;
  if (v.lastInspection?.outcome === 'Pass') return 'Passed QC';
  return v.cause ? `Fixing ${v.cause.defect.type.toLowerCase()}` : 'In production';
}

export type ReworkStatus = 'repair' | 'recheck' | 'passed';

/**
 * Sits at the top of the current version: QC failed it, what was found, and the route the
 * repair takes back through the workshop (e.g. Stitching → Finishing → QC recheck).
 */
export function QcSentBackCard({
  orderId,
  g,
  v,
  status,
  route







}: {orderId: string;g: Garment;v: VersionView;status: ReworkStatus; /** Workflow steps the repair goes back through before QC. */route: string[];}) {
  const qc = useQcGarment(orderId, g.id);
  const rw = qc.openRework ?? v.cause;
  if (!rw) return null;
  const d = rw.defect;
  const sentAt = rw.events[0]?.at;
  const sentBy = rw.events[0]?.by;
  void route;
  const passed = status === 'passed';
  const late = status === 'repair' && rw.due < new Date().toISOString().slice(0, 10);
  const pill = passed ? {
    label: 'Passed recheck',
    cls: 'bg-success-soft text-success'
  } : status === 'recheck' ? {
    label: 'Waiting for recheck',
    cls: 'bg-attention-soft text-attention'
  } : {
    label: 'Back for repair',
    cls: 'bg-critical-soft text-critical'
  };
  const facts: {
    k: string;
    v: string;
    warn?: boolean;
  }[] = [{
    k: 'Where',
    v: d.location
  }, {
    k: 'Found by',
    v: [sentBy ?? 'QC', sentAt ? fmtDate(sentAt, 'd MMM') : undefined].filter(Boolean).join(' · ')
  }, {
    k: 'Fixing',
    v: rw.assignee
  }, {
    k: 'Fix by',
    v: late ? `${fmtDate(rw.due, 'd MMM')} · late` : fmtDate(rw.due, 'd MMM'),
    warn: late
  }];
  const notes = [d.description, rw.instructions].filter(Boolean) as string[];
  return <section aria-label="Failed quality check" className={cn('relative mb-3 overflow-hidden rounded-2xl border bg-surface', passed ? 'border-line' : 'border-critical/30')}>
      {/* Left accent marks severity without a full red fill */}
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', passed ? 'bg-success' : 'bg-critical')} />

      {/* Header: what happened + where it stands */}
      <header className="flex items-start gap-3 px-5 pb-4 pt-4">
        <StatusIcon state={passed ? 'done' : 'failed'} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-muted">Failed quality check · {attemptName(v.number - 1)}</p>
          <h3 className="mt-0.5 text-xl font-semibold leading-tight">{d.type}</h3>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', pill.cls)}>{pill.label}</span>
      </header>

      {/* Facts: label over value, two columns */}
      <div className="mx-5 flex gap-4 border-t border-line py-4">
        <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-3">
          {facts.map((f) => <div key={f.k} className="min-w-0">
              <dt className="text-sm text-ink-muted">{f.k}</dt>
              <dd className={cn('mt-0.5 truncate text-[15px] font-medium tabular', f.warn && 'text-critical')}>{f.v}</dd>
            </div>)}
        </dl>
        {d.photos[0] && <img src={d.photos[0]} alt={`${d.type} found at QC`} className="h-[88px] w-[88px] shrink-0 rounded-xl object-cover ring-1 ring-line" />}
      </div>

      {/* QC note, set apart so the tailor reads it */}
      {notes.length > 0 && <div className="mx-5 mb-5">
          <p className="mb-1.5 text-sm text-ink-muted">Note for the tailor</p>
          <div className="space-y-1 rounded-xl bg-sunken px-4 py-3 text-[15px] leading-relaxed">
            {notes.map((n) => <p key={n}>{n}</p>)}
          </div>
        </div>}
    </section>;
}

/** Read-only record of a finished version, laid out like the workflow: each step folds open to its tasks. */
export function PastRoundView({
  v,
  g,
  onBack




}: {v: VersionView;g: Garment;onBack: () => void;}) {
  const f = v.failure!;
  const tasks = v.snapshot?.tasks ?? [];
  const recorded = Object.entries(v.snapshot?.doneBy ?? (v.number === 1 ? g.doneBy ?? {} : {})).filter(([, who]) => who) as [StageKey, string][];
  const groups: PastStep[] = [];
  if (tasks.length) {
    tasks.forEach((t) => {
      const label = stageLabel(t.stage);
      let grp = groups.find((x) => x.label === label);
      if (!grp) {
        grp = {
          label,
          tasks: []
        };
        groups.push(grp);
      }
      grp.tasks.push({
        id: t.id,
        name: t.name,
        who: t.assignee,
        done: t.status === 'Done'
      });
    });
  } else if (recorded.length) {
    recorded.forEach(([stage, who]) => groups.push({
      label: stageLabel(stage),
      who,
      tasks: []
    }));
  } else if (v.cause) {
    groups.push({
      label: `Repair: ${v.cause.defect.type}`,
      who: v.cause.assignee,
      tasks: []
    });
  }
  return <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sunken px-4 py-3">
        <p className="text-sm">
          <span className="font-semibold">{attemptName(v.number)}</span> · {fmtDate(v.startedAt, 'd MMM')} – {fmtDate(v.endedAt!, 'd MMM')} · <span className="text-ink-muted">view only</span>
        </p>
        <button type="button" onClick={onBack} className="text-sm font-medium text-brand hover:underline">Back to current version</button>
      </div>

      {/* Same pattern as the live workflow: ticks up to QC, a cross on the QC step that failed it */}
      <DoneStepList label={`${attemptName(v.number)} steps`} items={[...groups.map((s, i) => ({
      key: s.label,
      label: s.label,
      number: i + 1,
      done: stepDone(s),
      sub: s.who,
      tasks: s.tasks
    })), {
      key: 'qc-failed',
      label: 'Quality check',
      number: groups.length + 1,
      done: false,
      failed: true,
      sub: `${f.events[0]?.by ?? 'QC'} · ${fmtDateTime(v.endedAt!)}`,
      tasks: [],
      detail: <div className="flex gap-3 border-t border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium">{f.defect.type}</p>
              <p className="text-sm text-ink-muted">{f.defect.location}{f.defect.description ? ` · ${f.defect.description}` : ''}</p>
              <p className="mt-1 text-sm text-ink-muted">Sent to {f.assignee}</p>
            </div>
            {f.defect.photos[0] && <img src={f.defect.photos[0]} alt="Problem found at QC" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
          </div>
    }]} />
    </div>;
}
interface PastStep {
  label: string;
  who?: string;
  tasks: {
    id: string;
    name: string;
    who?: string;
    done: boolean;
  }[];
}
const stepDone = (s: PastStep) => !s.tasks.length || s.tasks.every((t) => t.done);
export function PastStepRow({
  step


}: {step: PastStep;}) {
  const [open, setOpen] = useState(false);
  const done = stepDone(step);
  const people = step.who ? [step.who] : Array.from(new Set(step.tasks.map((t) => t.who).filter(Boolean))) as string[];
  const doneTasks = step.tasks.filter((t) => t.done).length;
  const meta = [people.join(', ') || 'Not assigned', step.tasks.length ? `${doneTasks} of ${step.tasks.length} tasks done` : undefined].filter(Boolean).join(' · ');
  return <li>
      <button type="button" onClick={() => setOpen((o) => !o)} disabled={!step.tasks.length} aria-expanded={step.tasks.length ? open : undefined} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out enabled:hover:bg-canvas focus:outline-none focus-visible:bg-canvas">
        {done ? <CheckIcon className="h-4 w-4 shrink-0 text-success" strokeWidth={3} aria-hidden /> : <span className="h-4 w-4 shrink-0 rounded-full ring-2 ring-inset ring-line-strong" aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className={cn('block text-[15px] font-medium', !done && 'text-ink-muted')}>{step.label}</span>
          <span className="block truncate text-sm text-ink-muted">{done ? meta : 'Not reached before QC'}</span>
        </span>
        {step.tasks.length > 0 && <ChevronDownIcon className={cn('h-4 w-4 shrink-0 text-ink-muted transition-transform duration-150 ease-out', open && 'rotate-180')} aria-hidden />}
      </button>
      {open && <ul className="space-y-1.5 px-4 pb-3 pl-11">
          {step.tasks.map((t) => <li key={t.id} className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
              {t.done ? <CheckIcon className="h-4 w-4 shrink-0 text-success" strokeWidth={3} aria-hidden /> : <span className="h-4 w-4 shrink-0 rounded ring-2 ring-inset ring-line-strong" aria-hidden />}
              <span className={cn('min-w-0 flex-1 truncate text-[15px]', t.done && 'text-ink-muted')}>{t.name}</span>
              <span className="w-[140px] shrink-0 truncate text-right text-sm text-ink-muted">{t.who ?? 'No worker'}</span>
            </li>)}
        </ul>}
    </li>;
}
export function StatusIcon({
  state


}: {state: 'done' | 'current' | 'upcoming' | 'failed' | 'warn';}) {
  return <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', state === 'done' && 'bg-success text-white', state === 'failed' && 'bg-critical text-white', state === 'current' && 'bg-brand text-white', state === 'warn' && 'bg-attention text-white', state === 'upcoming' && 'bg-surface ring-2 ring-inset ring-line-strong')} aria-hidden>
      {state === 'done' && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
      {state === 'failed' && <XIcon className="h-3.5 w-3.5" strokeWidth={3} />}
      {(state === 'current' || state === 'warn') && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>;
}