import React from 'react';
import { cn } from '../../utils/cn';
import { panelClass } from '../../utils/styles';

/** Small side card used on detail pages (order, customer, employee, package): quiet label, then content. */
export function InfoCard({
  title,
  action,
  children,
  className





}: {title: string;action?: React.ReactNode;children: React.ReactNode;className?: string;}) {
  return <section aria-label={title} className={cn(panelClass, 'p-5', className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xs font-medium text-ink-subtle">{title}</h2>
        {action}
      </div>
      {children}
    </section>;
}

/** Label / value row inside an InfoCard's <dl>. */
export function InfoLine({
  k,
  v,
  muted,
  tone





}: {k: string;v: React.ReactNode;muted?: boolean;tone?: string;}) {
  return <div className={cn('flex justify-between gap-3', muted && 'text-sm text-ink-muted')}>
      <dt className={cn(!muted && 'text-ink-muted')}>{k}</dt>
      <dd className={cn('text-right tabular', tone)}>{v}</dd>
    </div>;
}

/** Main-column section with a heading row — the larger sibling of InfoCard. */
export function SectionCard({
  title,
  count,
  action,
  children,
  flush






}: {title: string;count?: number;action?: React.ReactNode;children: React.ReactNode;flush?: boolean;}) {
  return <section className={panelClass}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-[16px] font-semibold">
          {title}
          {count !== undefined && <span className="ml-2 text-sm font-normal tabular text-ink-subtle">{count}</span>}
        </h2>
        {action}
      </div>
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>;
}