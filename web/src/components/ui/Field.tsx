import React from 'react';
import { cn } from '../../utils/cn';
interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}
export function Field({
  label,
  hint,
  required,
  className,
  children
}: FieldProps) {
  return <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-ink-muted">
        {label}
        {required && <span className="text-brand" aria-hidden>*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-subtle">{hint}</span>}
    </label>;
}