import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn } from '../../utils/cn';
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  /** The switch only, for a table cell. Same size as the labeled switch. */
  compact?: boolean;
  /** The request is still in flight. The switch stays put and shows a spinner. */
  busy?: boolean;
}
export function Toggle({
  checked,
  onChange,
  label,
  description,
  compact,
  busy
}: ToggleProps) {
  const track = <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 ease-out', checked ? 'bg-brand' : 'bg-line-strong')}>
      <span className={cn('absolute left-0 top-0.5 h-6 w-6 rounded-full bg-white shadow-soft transition-transform duration-150 ease-out', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </span>;
  if (compact) {
    return <button type="button" role="switch" aria-checked={checked} aria-busy={busy || undefined} aria-label={label} disabled={busy} onClick={() => onChange(!checked)} className="inline-flex items-center disabled:cursor-wait">
        {busy && <Loader2Icon className="mr-2 h-4 w-4 animate-spin text-ink-muted" />}
        <span className="inline-flex items-center">{track}</span>
      </button>;
  }
  return <button type="button" role="switch" aria-checked={checked} aria-busy={busy || undefined} disabled={busy} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl py-1 text-left disabled:cursor-wait">
      <span>
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-ink-subtle">{description}</span>}
      </span>
      <span className="inline-flex items-center gap-2">
        {busy && <Loader2Icon className="h-4 w-4 animate-spin text-ink-muted" />}
        {track}
      </span>
    </button>;
}