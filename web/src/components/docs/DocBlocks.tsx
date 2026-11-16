import React, { useState } from 'react';
import { CheckIcon, CopyIcon, XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

/** Top-level section on a handoff page. */
export function DocSection({ id, title, intro, children }: {id: string;title: string;intro?: string;children: React.ReactNode;}) {
  return <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2 id={`${id}-title`} className="font-display text-[26px] font-medium tracking-tight">{title}</h2>
      {intro && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-muted">{intro}</p>}
      <div className="mt-6 space-y-8">{children}</div>
    </section>;
}

export function SubHeading({ children, id }: {children: React.ReactNode;id?: string;}) {
  return <h3 id={id} className="mb-3 scroll-mt-24 text-[16px] font-semibold">{children}</h3>;
}

/** Monospace snippet with a copy button. */
export function CodeBlock({ code, className }: {code: string;className?: string;}) {
  return <div className={cn('relative rounded-xl bg-ink', className)}>
      <pre className="scrollbar-thin overflow-x-auto px-4 py-3.5 pr-14 font-mono text-[13px] leading-relaxed text-[#F1EEEA]"><code>{code}</code></pre>
      <CopyButton value={code} className="absolute right-2 top-2 text-[#D9D4C7] hover:bg-white/10 hover:text-white" />
    </div>;
}

/** Inline token, e.g. `bg-brand`. */
export function Token({ children }: {children: React.ReactNode;}) {
  return <code className="whitespace-nowrap rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{children}</code>;
}

export function CopyButton({ value, className, label = 'Copy' }: {value: string;className?: string;label?: string;}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };
  return <button type="button" onClick={copy} aria-label={copied ? 'Copied' : `${label} ${value}`} className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40', className)}>
      {copied ? <CheckIcon className="h-4 w-4" aria-hidden /> : <CopyIcon className="h-4 w-4" aria-hidden />}
    </button>;
}

/** Ruled reference table. Scrolls sideways on narrow screens instead of wrapping cells to one word per line. */
export function SpecTable({ headers, rows, widths }: {headers: string[];rows: React.ReactNode[][];widths?: string[];}) {
  return <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-line bg-surface shadow-soft">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-sunken/60">
            {headers.map((h, i) => <th key={h} scope="col" className={cn('px-4 py-3 text-xs font-medium text-ink-subtle', widths?.[i])}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => <tr key={i} className="align-top">
              {r.map((c, j) => <td key={j} className={cn('px-4 py-3 leading-relaxed', j === 0 ? 'font-medium text-ink' : 'text-ink-muted')}>{c}</td>)}
            </tr>)}
        </tbody>
      </table>
    </div>;
}

/** Paired usage guidance. */
export function DoDont({ dos, donts }: {dos: string[];donts: string[];}) {
  return <div className="grid gap-4 md:grid-cols-2">
      <List tone="do" items={dos} />
      <List tone="dont" items={donts} />
    </div>;
}

function List({ tone, items }: {tone: 'do' | 'dont';items: string[];}) {
  const isDo = tone === 'do';
  return <div className="rounded-2xl border border-line bg-surface p-5">
      <p className={cn('flex items-center gap-2 text-sm font-semibold', isDo ? 'text-success' : 'text-critical')}>
        {isDo ? <CheckIcon className="h-4 w-4" aria-hidden /> : <XIcon className="h-4 w-4" aria-hidden />}
        {isDo ? 'Do' : 'Don’t'}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((i) => <li key={i} className="text-sm leading-relaxed text-ink-muted">{i}</li>)}
      </ul>
    </div>;
}

/** Frame that holds a live component example. */
export function Preview({ children, className, label }: {children: React.ReactNode;className?: string;label?: string;}) {
  return <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      {label && <p className="border-b border-line px-5 py-2.5 text-xs font-medium text-ink-subtle">{label}</p>}
      <div className={cn('bg-canvas p-6', className)}>{children}</div>
    </div>;
}