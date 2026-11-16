import React from 'react';
import { CheckIcon } from 'lucide-react';
import { STEPS } from '../../hooks/useNewOrder';
import { cn } from '../../utils/cn';
interface Props {
  title: string;
  subtitle?: string;
  step: number;
  maxStep: number;
  onStep: (i: number) => void;
  /** Defaults to the order form steps; QC passes its own. */
  steps?: readonly {
    key: string;
    label: string;
  }[];
  ariaLabel?: string;
}

/** Vertical stepper on the left: numbered circles joined by a line, the current step highlighted. */
export function OrderStepRail({
  title,
  subtitle,
  step,
  maxStep,
  onStep,
  steps = STEPS,
  ariaLabel = 'Order steps'
}: Props) {
  return <nav aria-label={ariaLabel} className="px-3 py-6">
      <div className="px-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-muted">{title}</p>
        {subtitle && <p className="mt-1 truncate text-sm font-medium tabular text-ink">{subtitle}</p>}
      </div>
      <ol className="mt-5">
        {steps.map((s, i) => {
        const active = i === step;
        const done = i < step;
        const reachable = i <= maxStep;
        return <li key={s.key} className="relative">
              {i < steps.length - 1 && <span aria-hidden className={cn('absolute left-[26px] top-[38px] h-[calc(100%-28px)] w-px', done ? 'bg-brand' : 'bg-line-strong')} />}
              <button type="button" onClick={() => reachable && onStep(i)} disabled={!reachable} aria-current={active ? 'step' : undefined} className={cn('relative flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] transition-colors duration-150 ease-out disabled:cursor-default', active ? 'bg-sunken font-semibold text-ink' : reachable ? 'text-ink-muted hover:bg-sunken/60 hover:text-ink' : 'text-ink-subtle')}>
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular', active ? 'bg-brand text-white' : done ? 'bg-brand-soft text-brand ring-1 ring-inset ring-brand' : 'bg-surface ring-1 ring-inset ring-line-strong')}>
                  {done ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            </li>;
      })}
      </ol>
    </nav>;
}