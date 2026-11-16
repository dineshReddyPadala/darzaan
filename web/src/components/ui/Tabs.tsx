import React from 'react';
import { cn } from '../../utils/cn';
interface TabsProps<T extends string> {
  tabs: {
    key: T;
    label: string;
    count?: number;
  }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
  actions?: React.ReactNode;
}
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  actions
}: TabsProps<T>) {
  return <div className={cn('flex items-end justify-between gap-3 border-b border-line', className)}>
    <div role="tablist" className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
      {tabs.map((t) => {
      const active = t.key === value;
      return <button key={t.key} role="tab" aria-selected={active} onClick={() => onChange(t.key)} className={cn('relative flex h-12 shrink-0 items-center gap-2 whitespace-nowrap px-3 text-[15px] font-medium transition-colors duration-150 ease-out', active ? 'text-ink' : 'text-ink-subtle hover:text-ink-muted')}>
            {t.label}
            {t.count !== undefined && <span className={cn('rounded-full px-1.5 text-xs tabular', active ? 'bg-brand-soft text-brand-hover' : 'bg-sunken text-ink-muted')}>{t.count}</span>}
            {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />}
          </button>;
    })}
    </div>
    {actions ? <div className="mb-1.5 shrink-0">{actions}</div> : null}
  </div>;
}