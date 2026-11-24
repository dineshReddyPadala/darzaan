import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDownIcon, DatabaseIcon, StoreIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../utils/cn';
import { navForRole, roleDefFor } from '../../utils/roles';
import { BrandMark } from './BrandMark';

type NavItem = ReturnType<typeof navForRole>[number];

function navBlocks(items: NavItem[]) {
  const blocks: Array<{ kind: 'item'; item: NavItem } | { kind: 'group'; label: string; items: NavItem[] }> = [];
  for (const item of items) {
    if (!item.group) {
      blocks.push({ kind: 'item', item });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === 'group' && last.label === item.group) last.items.push(item);
    else blocks.push({ kind: 'group', label: item.group, items: [item] });
  }
  return blocks;
}

/** Step-by-step task screens (order form, packing, QC inspection) have their own step rail — the menu folds to icons. */
const TASK_SCREEN = /^\/(orders\/new|packing\/[^/]+|qc\/[^/]+\/[^/]+)/;

export function Sidebar() {
  const {
    role
  } = useApp();
  const { pathname } = useLocation();
  const compact = TASK_SCREEN.test(pathname);
  const items = navForRole(role);
  const blocks = navBlocks(items);
  const [open, setOpen] = useState(() => pathname.startsWith('/master'));
  // Full labels only on wide screens, and never on task screens.
  const wide = compact ? 'hidden' : 'hidden xl:inline';
  const labelClass = compact ? 'sr-only' : 'sr-only xl:not-sr-only xl:truncate';
  const linkClass = (isActive: boolean) => cn('group flex h-12 items-center justify-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2', !compact && 'xl:justify-start', isActive ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-sunken hover:text-ink');
  return <aside className={cn('hidden shrink-0 flex-col border-r border-line bg-surface md:flex md:w-[84px]', !compact && 'xl:w-64')}>
      <div className={cn('flex h-16 items-center justify-center gap-3 px-5', !compact && 'xl:justify-start')}>
        <BrandMark />
        <span className={cn(wide, 'font-display text-xl font-medium tracking-tight')}>Darzaan</span>
      </div>
      <nav aria-label="Primary" className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {blocks.map((block) => block.kind === 'item' ? (
          <NavLink key={block.item.key} to={block.item.path} end={block.item.path === '/'} title={block.item.label} className={({ isActive }) => linkClass(isActive)}>
            <block.item.icon className="h-5 w-5 shrink-0" strokeWidth={1.9} />
            <span className={labelClass}>{block.item.label}</span>
          </NavLink>
        ) : (
          <div key={block.label} className="space-y-1">
            <button type="button" aria-expanded={open} title={block.label} onClick={() => setOpen((value) => !value)} className={linkClass(block.items.some((item) => pathname.startsWith(item.path)))}>
              <DatabaseIcon className="h-5 w-5 shrink-0" strokeWidth={1.9} />
              <span className={labelClass}>{block.label}</span>
              <ChevronDownIcon className={cn('ml-auto h-4 w-4 shrink-0 transition-transform', wide, open && 'rotate-180')} />
            </button>
            {open && block.items.map((item) => (
              <NavLink key={item.key} to={item.path} title={item.label} className={({ isActive }) => cn(linkClass(isActive), !compact && 'xl:pl-8')}>
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={1.9} />
                <span className={labelClass}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {roleDefFor(role).group === 'Store' && <Link to="/shop" target="_blank" title="Customer storefront" className={cn('mx-3 mb-2 flex h-10 items-center justify-center gap-3 rounded-xl px-3 text-sm text-ink-subtle transition-colors duration-150 ease-out hover:bg-sunken hover:text-ink', !compact && 'xl:justify-start')}>
          <StoreIcon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
          <span className={compact ? 'sr-only' : 'sr-only xl:not-sr-only'}>Customer storefront</span>
        </Link>}
    </aside>;
}