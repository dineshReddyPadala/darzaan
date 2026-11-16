import React from 'react';
import { cn } from '../../utils/cn';
interface SegmentedProps<T extends string> {
  options: {
    value: T;
    label: React.ReactNode;
  }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  ariaLabel?: string;
}
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth,
  ariaLabel
}: SegmentedProps<T>) {
  return <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex rounded-xl bg-sunken p-1', fullWidth && 'flex w-full')}>
      {options.map((o) => {
      const active = o.value === value;
      return <button key={o.value} role="radio" aria-checked={active} onClick={() => onChange(o.value)} className={cn('flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 font-medium transition-[background-color,color,box-shadow] duration-150 ease-out', size === 'lg' ? 'h-12 text-[15px]' : 'h-9 text-sm', active ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink')}>
            {o.label}
          </button>;
    })}
    </div>;
}