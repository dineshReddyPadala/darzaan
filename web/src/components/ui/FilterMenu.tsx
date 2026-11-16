import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, SlidersHorizontalIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}
interface FilterMenuProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  defaultValue: T;
  onChange: (v: T) => void;
  label?: string;
}

/** A single "Filter" button that opens a compact list of mutually exclusive filters. */
export function FilterMenu<T extends string>({
  options,
  value,
  defaultValue,
  onChange,
  label = 'Filter'
}: FilterMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  const filtered = value !== defaultValue;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} className={cn('flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-colors duration-150 ease-out', filtered ? 'border-brand/30 bg-brand-soft text-brand-hover' : 'border-line-strong bg-surface text-ink hover:bg-sunken')}>
        <SlidersHorizontalIcon className="h-4 w-4" />
        {filtered ? current?.label : label}
        <ChevronDownIcon className={cn('h-4 w-4 text-ink-subtle transition-transform duration-150 ease-out', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && <motion.ul role="listbox" aria-label={label} initial={{
        opacity: 0,
        y: -4,
        scale: 0.98
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: -4,
        scale: 0.98
      }} transition={{
        duration: 0.15,
        ease: [0.23, 1, 0.32, 1]
      }} className="absolute right-0 top-full z-30 mt-2 w-64 origin-top-right rounded-xl border border-line bg-surface p-1.5 shadow-pop">
            {options.map((o) => {
          const on = o.value === value;
          return <li key={o.value}>
                  <button role="option" aria-selected={on} onClick={() => {
              onChange(o.value);
              setOpen(false);
            }} className={cn('flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[15px] transition-colors duration-150 ease-out', on ? 'bg-brand-soft text-brand-hover' : 'text-ink hover:bg-sunken')}>
                    <CheckIcon className={cn('h-4 w-4 shrink-0', on ? 'opacity-100' : 'opacity-0')} />
                    <span className="flex-1">{o.label}</span>
                    {o.count !== undefined && <span className="text-sm tabular text-ink-subtle">{o.count}</span>}
                  </button>
                </li>;
        })}
          </motion.ul>}
      </AnimatePresence>
    </div>;
}