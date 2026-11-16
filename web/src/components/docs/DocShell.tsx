import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../layout/BrandMark';
import { cn } from '../../utils/cn';

export interface DocNavItem {
  id: string;
  title: string;
}

interface DocShellProps {
  current: 'designsystem';
  title: string;
  intro: string;
  nav: DocNavItem[];
  meta?: React.ReactNode;
  children: React.ReactNode;
}

const pages = [
{ key: 'designsystem', label: 'Design system', to: '/designsystem' }] as
const;

/** Shared frame for the developer handoff pages: top bar, section index and content column. */
export function DocShell({ current, title, intro, nav, meta, children }: DocShellProps) {
  const active = useActiveSection(nav);
  return <div className="min-h-full w-full bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 md:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <BrandMark size={32} />
            <span className="font-display text-lg font-medium">Darzaan</span>
          </Link>
          <span className="hidden text-sm text-ink-subtle sm:inline">Developer handoff</span>
          <nav aria-label="Handoff pages" className="ml-auto flex rounded-xl bg-sunken p-1">
            {pages.map((p) => <Link key={p.key} to={p.to} aria-current={current === p.key ? 'page' : undefined} className={cn('flex h-9 items-center rounded-lg px-3.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-out', current === p.key ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink')}>
                {p.label}
              </Link>)}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-8 md:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-12">
        <nav aria-label="Sections" className="hidden lg:block">
          <ol className="sticky top-24 space-y-0.5">
            {nav.map((s) => <li key={s.id}>
                <a href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined} className={cn('block rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-out', active === s.id ? 'bg-brand-soft font-medium text-brand-hover' : 'text-ink-muted hover:bg-sunken hover:text-ink')}>
                  {s.title}
                </a>
              </li>)}
          </ol>
        </nav>

        <main className="min-w-0">
          <div className="max-w-3xl">
            <h1 className="font-display text-[34px] font-medium leading-tight tracking-tight md:text-[40px]">{title}</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-muted">{intro}</p>
            {meta && <div className="mt-5">{meta}</div>}
          </div>
          <div className="mt-12 space-y-16">{children}</div>
        </main>
      </div>
    </div>;
}

/** Highlights the section currently in view in the side index. */
function useActiveSection(nav: DocNavItem[]): string {
  const [active, setActive] = useState(nav[0]?.id ?? '');
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    nav.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [nav]);
  return active;
}