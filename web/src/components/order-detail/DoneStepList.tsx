import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DoneStepTask {
  id: string;
  name: string;
  who?: string;
  done: boolean;
}
export interface DoneStepItem {
  key: string;
  label: string;
  /** Number on the rail when the step isn't done. */
  number: number;
  done: boolean;
  /** Line under the name; defaults to the workers, or "Finished". */
  sub?: string;
  tasks: DoneStepTask[];
  /** The step that ended the version (e.g. a failed QC): cross on the rail, red tag. */
  failed?: boolean;
  /** Extra content shown inside the card (e.g. what QC found). */
  detail?: React.ReactNode;
}

/**
 * Read-only steps in the same layout as the live workflow: rail with a tick, then a card with the
 * step, its status and a "Show tasks" toggle. Used inside the folded "steps done" cards.
 */
export function DoneStepList({
  items,
  label



}: {items: DoneStepItem[];label: string;}) {
  return <ol aria-label={label} className="px-3 pt-3">
      {items.map((s, i) => <DoneStepRow key={s.key} step={s} last={i === items.length - 1} />)}
    </ol>;
}
function DoneStepRow({
  step,
  last



}: {step: DoneStepItem;last: boolean;}) {
  const [open, setOpen] = useState(false);
  const people = Array.from(new Set(step.tasks.map((t) => t.who).filter(Boolean))) as string[];
  const doneTasks = step.tasks.filter((t) => t.done).length;
  const sub = step.sub ?? (step.done ? people.join(', ') || 'Finished' : 'Not reached before QC');
  return <li className="relative grid grid-cols-[32px_minmax(0,1fr)] items-start gap-x-3">
      <span className="relative flex h-full justify-center" aria-hidden>
        {!last && <span className={cn('absolute bottom-0 top-[44px] w-0.5', step.done ? 'bg-success' : 'bg-line-strong')} />}
        <span className={cn('relative z-10 mt-[13px] flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular', step.failed ? 'bg-critical text-white' : step.done ? 'bg-success text-white' : 'bg-surface text-ink-muted ring-2 ring-inset ring-line-strong')}>
          {step.failed ? <XIcon className="h-4 w-4" strokeWidth={3} /> : step.done ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : step.number}
        </span>
      </span>

      <div className={cn('mb-3 overflow-hidden rounded-xl bg-surface ring-1', step.failed ? 'ring-critical/40' : 'ring-line')}>
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={cn('text-[15px] font-semibold', step.failed ? 'text-ink' : 'text-ink-muted')}>{step.label}</h4>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', step.failed ? 'bg-critical-soft text-critical' : step.done ? 'bg-success-soft text-success' : 'bg-sunken text-ink-muted')}>
              {step.failed ? 'Failed' : step.done ? 'Done' : 'Not started'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">
            {sub}
            {step.tasks.length > 0 && <span className="text-ink-subtle"> · {doneTasks} of {step.tasks.length} tasks done</span>}
          </p>
        </div>

        {step.detail}

        {step.tasks.length > 0 && <>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex h-10 w-full items-center gap-1.5 border-t border-line px-4 text-left text-sm font-medium text-ink-muted hover:bg-canvas hover:text-ink">
              <ChevronRightIcon className={cn('h-4 w-4 transition-transform duration-150 ease-out', open && 'rotate-90')} />
              {open ? 'Hide tasks' : `Show ${step.tasks.length} task${step.tasks.length > 1 ? 's' : ''}`}
            </button>
            <AnimatePresence initial={false}>
              {open && <motion.ul initial={{
            height: 0,
            opacity: 0
          }} animate={{
            height: 'auto',
            opacity: 1
          }} exit={{
            height: 0,
            opacity: 0
          }} transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1]
          }} className="space-y-2 overflow-hidden px-4 pb-4">
                  {step.tasks.map((t) => <li key={t.id} className="flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5">
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded', t.done ? 'bg-brand text-white' : 'ring-2 ring-inset ring-line-strong')} aria-hidden>
                        {t.done && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <span className={cn('min-w-0 flex-1 truncate text-[15px] font-medium', t.done && 'text-ink-muted line-through')}>{t.name}</span>
                      <span className="w-[140px] shrink-0 truncate text-right text-sm text-ink-muted">{t.who ?? 'No worker'}</span>
                    </li>)}
                </motion.ul>}
            </AnimatePresence>
          </>}
      </div>
    </li>;
}