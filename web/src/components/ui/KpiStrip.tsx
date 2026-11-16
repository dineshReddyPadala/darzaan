import React from 'react';
import { cn } from '../../utils/cn';
import { statTileClass } from '../../utils/styles';

export interface KpiItem {
  key: string;
  label: string;
  value: number;
  selected?: boolean;
  onSelect?: () => void;
}

export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  return <div className={cn('mb-4 grid max-w-md grid-cols-3 gap-2', className)}>
    {items.map((item) => {
      const className = cn(statTileClass, 'min-w-0 rounded-xl px-3 py-2 text-left', item.selected && 'border-brand bg-brand-soft ring-1 ring-brand/30');
      const body = <>
        <span className="text-xs text-ink-muted">{item.label}</span>
        <span className="mt-0.5 text-lg font-semibold tabular leading-none">{item.value}</span>
      </>;
      return item.onSelect ? (
        <button key={item.key} type="button" aria-pressed={item.selected} onClick={item.onSelect} className={className}>{body}</button>
      ) : (
        <div key={item.key} className={className}>{body}</div>
      );
    })}
  </div>;
}
