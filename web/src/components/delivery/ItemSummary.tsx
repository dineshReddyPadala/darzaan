import React from 'react';
import type { PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { itemQty } from '../../utils/packages';

/** Read-only contents of a package: name and quantity per line. */
export function ItemSummary({
  p,
  className



}: {p: PackageRecord;className?: string;}) {
  return <ul className={cn('divide-y divide-line', className)}>
      {p.items.map((i) => <li key={i.garmentId} className="flex items-baseline justify-between gap-3 py-2 text-[15px]">
          <span className="min-w-0">
            <span className="text-ink">{i.label}</span>
            {i.category && i.category !== 'garment' && <span className="ml-1.5 text-sm text-ink-subtle">· {i.category === 'sample' ? 'sample' : i.category === 'fabric' ? 'to return' : 'belonging'}</span>}
          </span>
          <span className="shrink-0 tabular text-ink-muted">×{itemQty(i)}</span>
        </li>)}
    </ul>;
}