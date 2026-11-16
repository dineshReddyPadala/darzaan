import React from 'react';
import { QrCodeIcon, ScanLineIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
interface Picked {
  id: string;
  name: string;
  detail: string;
  color: string;
}
interface Props {
  title: string;
  hint: string;
  onScan: () => void;
  picked?: Picked;
  /** Optional fallback when the tag can't be scanned — a plain dropdown. */
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

/** The one obvious action: scan the tag on the sampler or swatch. Picking from a list is the quiet fallback. */
export function ScanQrPanel({
  title,
  hint,
  onScan,
  picked,
  fallback,
  children
}: Props) {
  return <div className="space-y-4">
      <button type="button" onClick={onScan} className={cn('flex w-full items-center gap-5 rounded-2xl px-5 py-5 text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.99]', picked ? 'bg-canvas ring-1 ring-inset ring-line-strong hover:bg-sunken' : 'bg-brand text-white hover:bg-brand-hover')}>
        <span className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl', picked ? 'bg-surface text-brand ring-1 ring-line' : 'bg-white/15')}>
          <QrCodeIcon className="h-8 w-8" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold">{picked ? 'Scan again' : title}</span>
          <span className={cn('block text-sm', picked ? 'text-ink-muted' : 'text-white/80')}>{hint}</span>
        </span>
        <ScanLineIcon className={cn('h-6 w-6 shrink-0', picked ? 'text-ink-subtle' : 'text-white/80')} aria-hidden />
      </button>

      {picked && <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4" aria-live="polite">
          <span className="h-14 w-14 shrink-0 rounded-xl ring-1 ring-inset ring-line" style={{
        backgroundColor: picked.color
      }} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold">{picked.name}</p>
            <p className="text-sm text-ink-muted">{picked.id} · {picked.detail}</p>
          </div>
          {children}
        </div>}

      {fallback && <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-subtle">Tag missing or unreadable?</span>
          <div className="min-w-[240px] flex-1">{fallback}</div>
        </div>}
    </div>;
}