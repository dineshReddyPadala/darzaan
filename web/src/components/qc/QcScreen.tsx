import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { pageClass } from '../../utils/styles';
const steps = ['Details', 'Checklist', 'Decision', 'Defect', 'Rework'] as const;
export type QcStep = (typeof steps)[number];

/** Same frame as Order details: text back link, display-font title with badges, content, sticky bottom bar like the order form. */
export function QcScreen({
  back,
  backLabel = 'Waiting for inspection',
  title,
  badges,
  subtitle,
  step,
  footer,
  children









}: {back: string;backLabel?: string;title: string;badges?: React.ReactNode;subtitle?: React.ReactNode;step?: QcStep;footer?: React.ReactNode;children: React.ReactNode;}) {
  const at = step ? steps.indexOf(step) : -1;
  return <div className="flex min-h-full flex-col">
      <div className={cn(pageClass, 'flex-1')}>
        <Link to={back} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeftIcon className="h-4 w-4" /> {backLabel}
        </Link>
        <header className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[30px] font-medium leading-none tracking-tight text-ink">{title}</h1>
            {badges}
          </div>
          {subtitle && <p className="mt-2 text-[16px] text-ink-muted">{subtitle}</p>}
        </header>
        {step && <ol className="mb-6 grid grid-cols-5 gap-2" aria-label="QC steps">
            {steps.map((s, i) => <li key={s} aria-current={i === at ? 'step' : undefined}>
                <span className={cn('block h-1 rounded-full', i < at ? 'bg-brand/40' : i === at ? 'bg-brand' : 'bg-line-strong')} />
                <span className={cn('mt-1.5 block truncate text-xs', i === at ? 'font-semibold text-ink' : i < at ? 'text-ink-muted' : 'text-ink-subtle')}>{s}</span>
              </li>)}
          </ol>}
        {children}
      </div>
      {footer && <div className="sticky bottom-0 z-20 border-t border-line bg-surface">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 md:px-6 lg:px-8">{footer}</div>
        </div>}
    </div>;
}
export function QcMissing() {
  return <QcScreen back="/qc" title="Garment not found">
      <p className="text-ink-muted">It may have already moved on from QC.</p>
    </QcScreen>;
}