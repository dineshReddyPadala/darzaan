import React from 'react';
import { CheckIcon } from 'lucide-react';
import { usePackages } from '../../contexts/PackagesContext';
import { DRIVERS } from '../../data/packages';
import { cn } from '../../utils/cn';
import { onTheRoad } from '../../utils/packages';
import { Avatar } from '../ui/Avatar';

/** Radio list of drivers with how many deliveries each already has. `allowLater` adds an "Assign later" option (value ''). */
export function DriverPicker({
  value,
  onChange,
  allowLater




}: {value: string;onChange: (v: string) => void;allowLater?: boolean;}) {
  const {
    packages
  } = usePackages();
  const load = (name: string) => packages.filter((p) => p.runner === name && onTheRoad(p.status)).length;
  const options = [...DRIVERS.map((d) => ({
    value: d.name,
    title: d.name,
    sub: d.vehicle,
    n: load(d.name)
  })), ...(allowLater ? [{
    value: '',
    title: 'Assign later',
    sub: 'Keep it packed on the shelf',
    n: -1
  }] : [])];
  return <div role="radiogroup" aria-label="Driver" className="space-y-2">
      {options.map((o) => {
      const on = value === o.value;
      return <button key={o.value || 'later'} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} className={cn('flex min-h-[68px] w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 ring-inset transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand', on ? 'bg-brand-soft ring-brand/40' : 'bg-surface ring-line hover:bg-canvas')}>
            {o.n >= 0 ? <Avatar name={o.title} /> : <span className="h-9 w-9 shrink-0 rounded-full bg-sunken" aria-hidden />}
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{o.title}</span>
              <span className="block truncate text-sm text-ink-muted">{o.sub}</span>
            </span>
            {o.n >= 0 && <span className="shrink-0 text-sm tabular text-ink-muted">{o.n ? `${o.n} on the road` : 'Free'}</span>}
            <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', on ? 'bg-brand text-white' : 'ring-2 ring-inset ring-line-strong')} aria-hidden>
              {on && <CheckIcon className="h-4 w-4" strokeWidth={3} />}
            </span>
          </button>;
    })}
    </div>;
}