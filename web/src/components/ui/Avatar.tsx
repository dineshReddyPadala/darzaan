import React from 'react';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

// Light tinted fills with dark, accessible text and a hairline outline so initials stay legible without shouting.
const palette = ['bg-brand-muted text-brand-hover ring-brand/20', 'bg-info-soft text-info ring-info/20', 'bg-success-soft text-success ring-success/20', 'bg-attention-soft text-attention ring-attention/20', 'bg-sunken text-ink-muted ring-line-strong'];
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}
const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl'
};
export function Avatar({
  name,
  size = 'md',
  className
}: AvatarProps) {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length;
  return <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide ring-1 ring-inset', sizes[size], palette[idx], className)} aria-hidden>
      {initials(name)}
    </span>;
}