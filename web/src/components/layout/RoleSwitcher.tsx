import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, LogOutIcon, UserIcon, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import type { Role } from '../../types';
import { cn } from '../../utils/cn';
import { apiMode } from '../../services/mode';
import { clearSession } from '../../services/session';
import { catalogRoleIds, roleDefFor, roleGroups } from '../../utils/roles';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';

/** Prototype persona switcher: "view as" any role, then land on that role's home screen. */
export function RoleSwitcher() {
  const {
    role,
    setRole,
    user,
    roleDef
  } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const pick = (r: Role) => {
    setOpen(false);
    if (r === role) return;
    const def = roleDefFor(r);
    setRole(r);
    navigate(def.home);
    toast.success(`Viewing as ${def.label}`, {
      description: def.user.name
    });
  };
  const signOut = () => {
    clearSession();
    window.location.assign('/login');
  };
  const place = user.store || user.location;
  if (apiMode) {
    return <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Signed in as ${user.name}, ${roleDef.label}`} className="flex h-11 items-center gap-2.5 rounded-xl px-1.5 transition-colors duration-150 ease-out hover:bg-sunken lg:pr-2.5">
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block whitespace-nowrap text-sm font-medium text-ink">{user.name}</span>
          <span className="block whitespace-nowrap text-xs text-ink-subtle">{roleDef.label}</span>
        </span>
        <ChevronDownIcon className={cn('h-4 w-4 text-ink-subtle transition-transform duration-150 ease-out', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && <motion.div role="menu" initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }} className="absolute right-0 top-full z-40 mt-2 w-52 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-pop">
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setProfile(true); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink hover:bg-sunken">
            <UserIcon className="h-4 w-4 text-ink-muted" /> Profile
          </button>
          <button type="button" role="menuitem" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink hover:bg-sunken">
            <LogOutIcon className="h-4 w-4 text-ink-muted" /> Log out
          </button>
        </motion.div>}
      </AnimatePresence>
      <Modal open={profile} onClose={() => setProfile(false)} title="Profile" description="The account you are signed in with.">
        <dl className="space-y-3 text-sm">
          <div><dt className="text-ink-subtle">Name</dt><dd className="font-medium">{user.name}</dd></div>
          {user.email && <div><dt className="text-ink-subtle">Email</dt><dd className="font-medium">{user.email}</dd></div>}
          <div><dt className="text-ink-subtle">Role</dt><dd className="font-medium">{roleDef.label}</dd></div>
          <div><dt className="text-ink-subtle">Title</dt><dd className="font-medium">{user.title}</dd></div>
          {place && <div><dt className="text-ink-subtle">Store</dt><dd className="font-medium">{place}</dd></div>}
        </dl>
      </Modal>
    </div>;
  }
  return <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Signed in as ${user.name}, ${roleDef.label}. Switch role`} className="flex h-11 items-center gap-2.5 rounded-xl px-1.5 transition-colors duration-150 ease-out hover:bg-sunken lg:pr-2.5">
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block whitespace-nowrap text-sm font-medium text-ink">{user.name}</span>
          <span className="block whitespace-nowrap text-xs text-ink-subtle">{roleDef.label}</span>
        </span>
        <ChevronDownIcon className={cn('h-4 w-4 text-ink-subtle transition-transform duration-150 ease-out', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && <motion.div role="menu" initial={{
        opacity: 0,
        y: -4,
        scale: 0.98
      }} animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }} exit={{
        opacity: 0,
        y: -4,
        scale: 0.98
      }} transition={{
        duration: 0.15,
        ease: [0.23, 1, 0.32, 1]
      }} className="absolute right-0 top-full z-40 mt-2 w-[min(340px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <UsersIcon className="h-4 w-4 text-brand" />
              <p className="text-sm font-semibold">View the app as</p>
              <span className="ml-auto text-xs text-ink-subtle">Prototype</span>
            </div>
            <div className="max-h-[min(520px,70vh)] overflow-y-auto p-1.5 scrollbar-thin">
              {roleGroups.map((g) => {
            const list = catalogRoleIds().filter((r) => roleDefFor(r).group === g);
            if (!list.length) return null;
            return <div key={g} className="py-1">
                    <p className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-ink-subtle">{g}</p>
                    {list.map((r) => {
                const d = roleDefFor(r);
                const on = r === role;
                return <button key={r} role="menuitemradio" aria-checked={on} onClick={() => pick(r)} className={cn('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 ease-out', on ? 'bg-brand-soft' : 'hover:bg-sunken')}>
                          <Avatar name={d.user.name} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className={cn('block truncate text-[15px] font-medium', on ? 'text-brand-hover' : 'text-ink')}>{d.label}</span>
                            <span className="block truncate text-xs text-ink-subtle">{d.user.name}</span>
                          </span>
                          {on && <CheckIcon className="h-4 w-4 shrink-0 text-brand" />}
                        </button>;
              })}
                  </div>;
          })}
            </div>
          </motion.div>}
      </AnimatePresence>
    </div>;
}