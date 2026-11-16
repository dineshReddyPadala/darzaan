import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDownIcon, DatabaseIcon, MenuIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../utils/cn';
import { navForRole } from '../../utils/roles';
import { Modal } from '../ui/Modal';
export function MobileNav() {
  const {
    role
  } = useApp();
  const { pathname } = useLocation();
  const items = navForRole(role);
  const primary = items.filter((item) => !item.group).slice(0, 4);
  const [open, setOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(() => pathname.startsWith('/master'));
  const loose = items.filter((item) => !item.group);
  const grouped = items.filter((item) => item.group === 'Master data');
  return <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-line bg-surface md:hidden">
        {primary.map((item) => <NavLink key={item.key} to={item.path} end={item.path === '/'} className={({
        isActive
      }) => cn('flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-brand' : 'text-ink-subtle')}>
            <item.icon className="h-5 w-5" />
            <span className="max-w-[72px] truncate">{item.label}</span>
          </NavLink>)}
        {items.length > 4 && <button onClick={() => setOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-subtle">
            <MenuIcon className="h-5 w-5" />
            More
          </button>}
      </nav>
      <Modal open={open} onClose={() => setOpen(false)} title="All sections">
        <div className="grid grid-cols-2 gap-2">
          {loose.map((item) => <NavLink key={item.key} to={item.path} end={item.path === '/'} onClick={() => setOpen(false)} className={({
          isActive
        }) => cn('flex h-14 items-center gap-3 rounded-xl px-4 text-[15px] font-medium', isActive ? 'bg-brand-soft text-brand' : 'bg-canvas text-ink')}>
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </NavLink>)}
        </div>
        {grouped.length > 0 && <div className="mt-3">
          <button type="button" aria-expanded={masterOpen} onClick={() => setMasterOpen((value) => !value)} className="flex h-14 w-full items-center gap-3 rounded-xl bg-canvas px-4 text-[15px] font-medium text-ink">
            <DatabaseIcon className="h-5 w-5" />
            <span className="flex-1 text-left">Master data</span>
            <ChevronDownIcon className={cn('h-4 w-4 transition-transform', masterOpen && 'rotate-180')} />
          </button>
          {masterOpen && <div className="mt-2 grid grid-cols-2 gap-2">
            {grouped.map((item) => <NavLink key={item.key} to={item.path} onClick={() => setOpen(false)} className={({
            isActive
          }) => cn('flex h-14 items-center gap-3 rounded-xl px-4 text-[15px] font-medium', isActive ? 'bg-brand-soft text-brand' : 'bg-canvas text-ink')}>
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </NavLink>)}
          </div>}
        </div>}
      </Modal>
    </>;
}