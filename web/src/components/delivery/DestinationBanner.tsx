import React from 'react';
import { HomeIcon, StoreIcon } from 'lucide-react';
import type { Destination } from '../../types/packaging';
import { cn } from '../../utils/cn';

/** The destination, big enough to stop a box going to the wrong store. */
export function DestinationBanner({
  destination,
  label,
  tone = 'ink'




}: {destination: Destination;label: string;tone?: 'ink' | 'critical';}) {
  const Icon = destination.kind === 'store' ? StoreIcon : HomeIcon;
  return <div className={cn('flex items-start gap-4 rounded-2xl px-5 py-4', tone === 'ink' ? 'bg-ink text-white' : 'bg-critical-soft text-critical ring-1 ring-inset ring-critical/30')}>
      <Icon className="mt-1 h-7 w-7 shrink-0" strokeWidth={1.75} aria-hidden />
      <div className="min-w-0">
        <p className={cn('text-sm', tone === 'ink' ? 'text-white/70' : 'text-critical/80')}>{label}</p>
        <p className="text-2xl font-semibold leading-tight">{destination.name}</p>
        <p className={cn('mt-0.5 text-sm', tone === 'ink' ? 'text-white/70' : 'text-ink-muted')}>{destination.detail}</p>
      </div>
    </div>;
}