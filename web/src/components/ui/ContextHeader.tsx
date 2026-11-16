import React from 'react';
import { cn } from '../../utils/cn';
import { daysUntil, dueLabel, fmtDate } from '../../utils/format';
interface Props {
  /** The thing being worked on — garment, customer or package. Biggest text on the strip. */
  title: React.ReactNode;
  /** One quiet line under the title, e.g. "DZ-10312 · Kavya Iyer". */
  meta?: React.ReactNode;
  /** ISO date. Renders "Due 8 Oct" with "Due today" / "1d overdue" under it. */
  due?: string;
  /** Badges at the far right (priority, status). */
  badges?: React.ReactNode;
}

/** The order / garment strip kept visible at the top of every step-by-step flow (order form, QC, packing, receiving). */
export function ContextHeader({
  title,
  meta,
  due,
  badges
}: Props) {
  const d = due ? daysUntil(due) : 0;
  return <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <p className="truncate text-[20px] font-semibold leading-tight text-ink">{title}</p>
        {meta && <p className="mt-1 truncate text-sm text-ink-muted">{meta}</p>}
      </div>
      {(due || badges) && <div className="flex shrink-0 items-center gap-3">
          {due && <div className="text-right">
              <p className="text-[15px] font-medium tabular text-ink">Due {fmtDate(due, 'd MMM')}</p>
              <p className={cn('text-sm', d < 0 ? 'font-medium text-critical' : d === 0 ? 'font-medium text-attention' : 'text-ink-muted')}>{dueLabel(due)}</p>
            </div>}
          {badges && <div className="flex items-center gap-2">{badges}</div>}
        </div>}
    </div>;
}