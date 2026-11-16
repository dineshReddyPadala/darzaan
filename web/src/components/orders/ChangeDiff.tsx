import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import type { ChangeRequest } from '../../types';
import { inr } from '../../utils/format';
export function ChangeDiff({
  change


}: {change: ChangeRequest;}) {
  return <div>
      <div className="grid items-stretch gap-2 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl bg-critical-soft/60 px-4 py-3">
          <p className="text-xs font-medium text-ink-subtle">Before</p>
          <p className="text-[15px] text-ink line-through decoration-critical/50">{change.before}</p>
        </div>
        <span className="hidden items-center justify-center text-ink-subtle md:flex"><ArrowRightIcon className="h-5 w-5" /></span>
        <div className="rounded-xl bg-success-soft px-4 py-3">
          <p className="text-xs font-medium text-ink-subtle">After</p>
          <p className="text-[15px] font-medium text-ink">{change.after}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-ink-muted">Price impact <span className="font-semibold text-ink">{change.priceImpact === 0 ? 'None' : `+${inr(change.priceImpact)}`}</span></span>
        <span className="text-ink-muted">Delivery impact <span className="font-semibold text-ink">{change.dateImpact}</span></span>
      </div>
    </div>;
}