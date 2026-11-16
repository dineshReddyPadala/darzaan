import React from 'react';
import { ArrowRightIcon, CornerDownRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
export interface OutcomeStep {
  label: string;
  sub?: string;
  /** now = where it is today, next = where your action sends it, later = what follows */
  state: 'now' | 'next' | 'later';
}
interface OutcomeMapProps {
  title?: string;
  steps: OutcomeStep[];
  effects: string[];
  tone?: 'brand' | 'critical';
}

/** Explains, before the user commits, where an action moves the item and what else it triggers. */
export function OutcomeMap({
  title = 'When you confirm',
  steps,
  effects,
  tone = 'brand'
}: OutcomeMapProps) {
  return <div className="rounded-xl border border-line bg-canvas p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {steps.map((s, i) => <React.Fragment key={s.label}>
            {i > 0 && <li aria-hidden className="flex items-center justify-center text-ink-subtle">
                <ArrowRightIcon className="h-4 w-4 rotate-90 sm:rotate-0" />
              </li>}
            <li className={cn('flex-1 rounded-lg border px-3 py-2', s.state === 'now' && 'border-line-strong bg-surface', s.state === 'next' && (tone === 'critical' ? 'border-critical/40 bg-critical-soft' : 'border-brand/40 bg-brand-soft'), s.state === 'later' && 'border-dashed border-line-strong bg-transparent')}>
              <span className={cn('block text-xs', s.state === 'next' ? tone === 'critical' ? 'font-medium text-critical' : 'font-medium text-brand-hover' : 'text-ink-subtle')}>
                {s.state === 'now' ? 'Now' : s.state === 'next' ? 'After you confirm' : 'Then'}
              </span>
              <span className="block text-[15px] font-semibold leading-snug text-ink">{s.label}</span>
              {s.sub && <span className="block text-sm text-ink-muted">{s.sub}</span>}
            </li>
          </React.Fragment>)}
      </ol>
      {effects.length > 0 && <ul className="mt-3 space-y-1.5">
          {effects.map((e) => <li key={e} className="flex items-start gap-2 text-sm text-ink-muted">
              <CornerDownRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
              {e}
            </li>)}
        </ul>}
    </div>;
}