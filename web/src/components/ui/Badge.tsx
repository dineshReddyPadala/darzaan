import React from 'react';
import { cn } from '../../utils/cn';
import type { Tone } from '../../utils/status';
const tones: Record<Tone, string> = {
  // Every tone carries an inset ring so badges stay legible on beige canvas and on white surfaces alike.
  neutral: 'bg-surface text-ink-muted ring-1 ring-inset ring-line-strong',
  brand: 'bg-brand-soft text-brand-hover ring-1 ring-inset ring-brand/15',
  success: 'bg-success-soft text-success ring-1 ring-inset ring-success/15',
  info: 'bg-info-soft text-info ring-1 ring-inset ring-info/15',
  attention: 'bg-attention-soft text-attention ring-1 ring-inset ring-attention/15',
  warning: 'bg-warning-soft text-warning ring-1 ring-inset ring-warning/15',
  critical: 'bg-critical-soft text-critical ring-1 ring-inset ring-critical/15'
};
const dots: Record<Tone, string> = {
  neutral: 'bg-ink-subtle',
  brand: 'bg-brand',
  success: 'bg-success',
  info: 'bg-info',
  attention: 'bg-attention',
  warning: 'bg-warning',
  critical: 'bg-critical'
};
interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}
export function Badge({
  tone = 'neutral',
  dot,
  size = 'sm',
  className,
  children
}: BadgeProps) {
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium', size === 'sm' ? 'h-6 px-2.5 text-xs' : 'h-8 px-3 text-sm', tones[tone], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} aria-hidden />}
      {children}
    </span>;
}