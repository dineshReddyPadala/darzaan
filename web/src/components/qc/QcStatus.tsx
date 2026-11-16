import React from 'react';
import { ShirtIcon } from 'lucide-react';
import type { ReworkPriority } from '../../types';
import { cn } from '../../utils/cn';
import type { Tone } from '../../utils/status';
import { Badge } from '../ui/Badge';

/** Same Badge as the rest of the app: green passed, red failed, amber pending. */
export const priorityTone: Record<ReworkPriority, Tone> = {
  High: 'critical',
  Medium: 'attention',
  Low: 'neutral'
};
export function PriorityBadge({
  p,
  size



}: {p: ReworkPriority;size?: 'sm' | 'md';}) {
  return <Badge tone={priorityTone[p]} size={size} dot>{p}</Badge>;
}
export function GarmentPhoto({
  src,
  alt,
  className




}: {src?: string;alt: string;className?: string;}) {
  return <div className={cn('overflow-hidden bg-sunken', className)}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-ink-subtle"><ShirtIcon className="h-1/3 w-1/3" /></div>}
    </div>;
}