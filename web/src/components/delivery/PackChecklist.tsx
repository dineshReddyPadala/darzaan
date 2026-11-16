import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, TriangleAlertIcon } from 'lucide-react';
import type { ItemCategory, PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { itemQty } from '../../utils/packages';
const groups: {
  key: ItemCategory;
  label: string;
}[] = [{
  key: 'garment',
  label: 'Finished garments'
}, {
  key: 'sample',
  label: 'Customer samples'
}, {
  key: 'fabric',
  label: 'Fabric to return'
}, {
  key: 'belonging',
  label: 'Customer belongings'
}];

/** One large tappable row per item, grouped the way the packer fills the box. */
export function PackChecklist({
  p,
  editable,
  onToggle




}: {p: PackageRecord;editable: boolean;onToggle: (itemId: string) => void;}) {
  const checked = p.checked ?? [];
  const missing = p.status === 'Problem' ? p.problem?.itemIds ?? [] : [];
  return <div className="space-y-6">
      {groups.map((grp) => {
      const items = p.items.filter((i) => (i.category ?? 'garment') === grp.key);
      if (!items.length) return null;
      const done = items.filter((i) => checked.includes(i.garmentId)).length;
      return <section key={grp.key} aria-labelledby={`grp-${grp.key}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 id={`grp-${grp.key}`} className="text-[15px] font-semibold">{grp.label}</h3>
              <span className="text-sm tabular text-ink-muted">{done} of {items.length}</span>
            </div>
            <ul className="space-y-2">
              {items.map((i) => {
            const on = checked.includes(i.garmentId);
            const lost = missing.includes(i.garmentId);
            return <li key={i.garmentId}>
                    <button type="button" role="checkbox" aria-checked={on} aria-disabled={!editable || undefined} onClick={() => editable && onToggle(i.garmentId)} className={cn('flex min-h-[72px] w-full items-center gap-4 rounded-xl px-4 py-3 text-left ring-1 ring-inset transition-colors duration-150 ease-out', on ? 'bg-success-soft ring-success/30' : lost ? 'bg-critical-soft ring-critical/30' : 'bg-surface ring-line', editable && !on && 'hover:bg-canvas hover:ring-line-strong', !editable && 'cursor-default')}>
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-150 ease-out', on ? 'border-success bg-success text-white' : lost ? 'border-critical bg-surface text-critical' : 'border-line-strong bg-surface')}>
                        {on && <motion.span initial={{
                    opacity: 0,
                    scale: 0.7
                  }} animate={{
                    opacity: 1,
                    scale: 1
                  }} transition={{
                    duration: 0.14,
                    ease: 'easeOut'
                  }}>
                            <CheckIcon className="h-5 w-5" strokeWidth={3} aria-hidden />
                          </motion.span>}
                        {!on && lost && <TriangleAlertIcon className="h-4 w-4" aria-hidden />}
                      </span>
                      {i.photo && <img src={i.photo} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-semibold text-ink">{i.label}</span>
                        {i.note && <span className="block text-sm text-ink-muted">{i.note}</span>}
                        {lost && !on && <span className="block text-sm font-medium text-critical">Reported missing</span>}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs text-ink-subtle">Qty</span>
                        <span className="block text-xl font-semibold tabular">{itemQty(i)}</span>
                      </span>
                    </button>
                  </li>;
          })}
            </ul>
          </section>;
    })}
    </div>;
}