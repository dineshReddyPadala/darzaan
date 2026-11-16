import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LockIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Perm } from '../../types';
import { canAccess, canOpenOrder, homeFor, navItems, type NavKey } from '../../utils/roles';
import { pageClass } from '../../utils/styles';
import { buttonClass } from '../ui/Button';
interface RoleGateProps {
  screen: NavKey;
  /** Extra write permission needed to use this screen at all (e.g. creating an order). */
  perm?: Perm;
  /** Also let roles that open orders as a production sheet through (no orders list needed). */
  orderView?: boolean;
  children: React.ReactNode;
}
export function RoleGate({
  screen,
  perm,
  orderView,
  children
}: RoleGateProps) {
  const {
    role,
    roleDef,
    can
  } = useApp();
  const allowed = canAccess(role, screen) || !!orderView && canOpenOrder(role);
  if (allowed && (!perm || can(perm.entity, perm.action))) return <>{children}</>;
  return <NotPartOfRole what={perm ? `${perm.action === 'create' ? 'Creating' : 'Changing'} ${perm.entity.replace('_', ' ')}s` : navItems[screen].label} roleLabel={roleDef.label} home={homeFor(role)} />;
}
export function RoleHome() {
  const {
    role
  } = useApp();
  return <Navigate to={homeFor(role)} replace />;
}
function NotPartOfRole({
  what,
  roleLabel,
  home




}: {what: string;roleLabel: string;home: string;}) {
  return <div className={pageClass}>
      <div className="mx-auto mt-10 max-w-md text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sunken text-ink-muted">
          <LockIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-5 font-display text-[28px] font-medium tracking-tight">Not part of your role</h1>
        <p className="mt-2 text-[16px] text-ink-muted">
          {what} isn’t included in the {roleLabel} role. If you need it for a task, ask your store manager.
        </p>
        <Link to={home} className={buttonClass('primary', 'lg', 'mt-6')}>Back to my work</Link>
      </div>
    </div>;
}