import {
  BoxesIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  ContactIcon,
  FactoryIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  PackageCheckIcon,
  PackageIcon,
  RouteIcon,
  SettingsIcon,
  MapPinIcon,
  ScrollTextIcon,
  ShieldCheckIcon,
  SunIcon,
  TagsIcon,
  TrendingUpIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
  type LucideIcon } from
'lucide-react';
import type { Garment, PermAction, PermEntity, Role, RoleGroup, RoleRecord, StageKey } from '../types';

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

export type NavKey =
'today' |
'dashboard' |
'customers' |
'orders' |
'calendar' |
'consultations' |
'production' |
'qc' |
'inventory' |
'packing' |
'dispatch' |
'pickup' |
'deliver' |
'handover' |
'payments' |
'reports' |
'team' |
'locations' |
'categories' |
'audit' |
'settings';

export const navItems: Record<NavKey, {label: string;path: string;icon: LucideIcon;group?: string;}> = {
  today: { label: 'Today', path: '/today', icon: SunIcon },
  dashboard: { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboardIcon },
  customers: { label: 'Customers', path: '/customers', icon: UsersIcon },
  orders: { label: 'Orders', path: '/orders', icon: ClipboardListIcon },
  calendar: { label: 'Calendar', path: '/calendar', icon: CalendarDaysIcon },
  consultations: { label: 'Consultations', path: '/consultations', icon: CalendarClockIcon },
  production: { label: 'Production', path: '/production', icon: FactoryIcon },
  qc: { label: 'Quality Check', path: '/qc', icon: ShieldCheckIcon },
  inventory: { label: 'Inventory', path: '/inventory', icon: BoxesIcon },
  packing: { label: 'Shipments', path: '/packing', icon: PackageIcon },
  dispatch: { label: 'Dispatch', path: '/packing', icon: RouteIcon },
  pickup: { label: 'Deliveries', path: '/route', icon: TruckIcon },
  deliver: { label: 'Deliver', path: '/route', icon: PackageCheckIcon },
  handover: { label: 'Receiving', path: '/receiving', icon: HandshakeIcon },
  payments: { label: 'Payments', path: '/payments', icon: WalletIcon },
  reports: { label: 'Reports', path: '/reports', icon: TrendingUpIcon },
  team: { label: 'Team', path: '/team', icon: ContactIcon },
  locations: { label: 'Store locations', path: '/master/locations', icon: MapPinIcon, group: 'Master data' },
  categories: { label: 'Categories', path: '/master/categories', icon: TagsIcon, group: 'Master data' },
  audit: { label: 'Audit log', path: '/audit', icon: ScrollTextIcon },
  settings: { label: 'Settings', path: '/settings', icon: SettingsIcon }
};

/* ------------------------------------------------------------------ */
/* Role definitions — the single source of truth                      */
/* ------------------------------------------------------------------ */

export type KpiKey =
'atRisk' |
'awaitingPayment' |
'inProduction' |
'readyTrial' |
'readyPickup' |
'overdue' |
'trialsToday' |
'ordersToday' |
'balanceDue' |
'collectedToday' |
'openAlterations' |
'toVerify' |
'deliveriesToday' |
'myQueue' |
'myExpress' |
'myDueSoon' |
'awaitingReview' |
'express' |
'inQc' |
'dispatch' |
'firstPassRate' |
'openReworks';

export interface DataScope {
  /** Garment prices, totals and discounts. */
  prices: boolean;
  /** Payments, balances and receipts. */
  payments: boolean;
  /** Customer mobile, WhatsApp and email. */
  contacts: boolean;
  /** Stage-by-stage production detail. */
  production: boolean;
  /** Only orders of the user's own store. */
  ownStoreOnly: boolean;
}

type Perms = Partial<Record<PermEntity, PermAction[]>>;

/** The order page has at most three tabs: details, the production workflow, and supporting info. */
export type OrderTabKey = 'details' | 'workflow' | 'more';
export type LogisticsTabKey = 'packaging' | 'trips' | 'deliveries' | 'receiving' | 'issues';

const ALL_ORDER_TABS: OrderTabKey[] = ['details', 'workflow', 'more'];
const PRODUCTION_TABS: OrderTabKey[] = ['details', 'workflow', 'more'];
/** What a workshop role needs to make a garment — nothing about money, contact or other stations. */
const SHEET_TABS: OrderTabKey[] = ['details'];

/** Old deep links (?tab=production, ?tab=payments…) land on the tab that now holds that content. */
export function normaliseOrderTab(tab: string | null): OrderTabKey | null {
  if (!tab) return null;
  if (tab === 'details' || tab === 'workflow' || tab === 'more') return tab;
  if (tab === 'production') return 'workflow';
  if (tab === 'payments' || tab === 'communication' || tab === 'activity') return 'more';
  return 'details';
}

export interface RoleDef {
  id: Role;
  label: string;
  group: RoleGroup;
  user: {name: string;title: string;location: string;store?: string;};
  responsibilities: string[];
  home: string;
  stages: StageKey[];
  /** Embroidery roles only see garments of their technique. */
  technique?: 'Hand' | 'Machine';
  /** May act on any stage of any order (store manager). */
  oversight?: boolean;
  /** Handles movement scans and home deliveries. */
  delivers?: boolean;
  /** Sees the production board but can’t move cards or plan. */
  boardReadOnly?: boolean;
  /** Opens orders only as a production sheet reached from a task or card — no orders list. */
  orderSheet?: boolean;
  /** Order page tabs this role sees; empty = can’t open orders at all. */
  orderTabs: OrderTabKey[];
  /** Logistics tabs this role sees, first = landing tab. */
  logisticsTabs: LogisticsTabKey[];
  perms: Perms;
  scope: DataScope;
  kpis: KpiKey[];
}

const CRUD: PermAction[] = ['create', 'update', 'delete'];
const CU: PermAction[] = ['create', 'update'];
const U: PermAction[] = ['update'];
const C: PermAction[] = ['create'];

const storeScope: DataScope = { prices: true, payments: true, contacts: true, production: true, ownStoreOnly: true };
const workshopScope: DataScope = { prices: false, payments: false, contacts: false, production: true, ownStoreOnly: false };
/** Every workshop stage the Production Assistant coordinates from the Workflow tab. */
export const workshopStages: StageKey[] = ['material', 'dyeing', 'marking', 'embroidery', 'cutting', 'stitching', 'hemming', 'finishing', 'ironing', 'alteration'];
const KHAN = { location: 'Khan Market Store', store: 'Khan Market' };
const OKHLA = { location: 'Okhla Workshop' };

export const roleDefs: Record<Role, RoleDef> = {
  admin: {
    id: 'admin', label: 'Admin', group: 'Office',
    user: { name: 'Aditi Malhotra', title: 'Admin', ...KHAN },
    responsibilities: ['Full order lifecycle oversight', 'Order confirmation and delivery', 'Exception and at-risk resolution', 'Inventory', 'Store locations', 'Team and settings', 'All reports'],
    home: '/dashboard', stages: ['store', 'delivery'], oversight: true,
    orderTabs: ALL_ORDER_TABS, logisticsTabs: ['trips', 'deliveries', 'packaging', 'issues'],
    perms: { order: CRUD, garment: CRUD, measurement: CRUD, production_task: CRUD, trial: CRUD, alteration: CRUD, payment: CRUD, inventory: CRUD, customer: CRUD, team: CRUD },
    scope: { ...storeScope, ownStoreOnly: false }, kpis: ['atRisk', 'awaitingPayment', 'inProduction', 'readyTrial', 'readyPickup', 'overdue']
  },
  /** Store Assistant rights, with the Admin's dashboard as home. */
  store_manager: {
    id: 'store_manager', label: 'Store Manager', group: 'Store',
    user: { name: 'Kabir Sethi', title: 'Store Manager', ...KHAN },
    responsibilities: ['Store dashboard', 'Customer check-in and records', 'Draft orders for the Designer to price', 'Trial booking and sessions', 'Receiving packages and raising discrepancies'],
    home: '/dashboard', stages: [], orderTabs: ALL_ORDER_TABS, logisticsTabs: ['issues'],
    perms: { order: CU, customer: CU, measurement: CU, trial: CU, alteration: CU, payment: C },
    scope: storeScope, kpis: ['atRisk', 'awaitingPayment', 'inProduction', 'readyTrial', 'readyPickup', 'overdue']
  },
  salesperson: {
    id: 'salesperson', label: 'Salesperson', group: 'Store',
    user: { name: 'Ritu Sharma', title: 'Salesperson', ...KHAN },
    responsibilities: ['Customer intake', 'Creating orders and quotes', 'Advance collection', 'Trial booking', 'Follow-ups on balances'],
    home: '/dashboard', stages: [], orderTabs: ALL_ORDER_TABS, logisticsTabs: [],
    perms: { order: CU, garment: CU, measurement: C, payment: C, trial: CU, customer: CU },
    scope: storeScope, kpis: ['ordersToday', 'awaitingPayment', 'balanceDue', 'trialsToday', 'readyPickup']
  },
  production_head: {
    id: 'production_head', label: 'Production Head', group: 'Production',
    user: { name: 'Vikram Rathore', title: 'Production Head', ...OKHLA },
    responsibilities: ['Production review', 'Scheduling and station assignment', 'Load and capacity balance', 'Express prioritisation', 'Unblocking issues and rework decisions', 'Weekly throughput'],
    home: '/production', stages: ['acknowledgement', 'review', 'scheduling'],
    orderTabs: PRODUCTION_TABS, logisticsTabs: ['trips', 'issues'],
    perms: { production_task: CU, garment: U, inventory: U, team: U },
    scope: workshopScope, kpis: ['express', 'atRisk', 'inQc', 'firstPassRate', 'openReworks', 'awaitingReview', 'dispatch']
  },
  production_assistant: {
    id: 'production_assistant', label: 'Production Assistant', group: 'Production',
    user: { name: 'Manoj Tiwari', title: 'Production Assistant', ...OKHLA },
    responsibilities: ['Creating production tasks per order', 'Scanning worker badges to assign tasks', 'Reassigning work', 'Moving tasks through Pending, In progress and Done', 'Tracking every garment from the Workflow tab'],
    home: '/production', stages: workshopStages,
    orderTabs: PRODUCTION_TABS, logisticsTabs: [],
    perms: { production_task: CRUD, garment: U, inventory: U },
    scope: workshopScope, kpis: ['express', 'atRisk', 'awaitingReview', 'inQc']
  },
  tailor: {
    id: 'tailor', label: 'Tailor', group: 'Production',
    user: { name: 'Imran Sheikh', title: 'Tailor', ...OKHLA },
    responsibilities: ['View the orders they are working', 'Mark their own tasks done'],
    home: '/production', stages: [],
    orderTabs: ['details', 'workflow'], logisticsTabs: [],
    perms: { production_task: U },
    scope: workshopScope, kpis: []
  },
  logistics: {
    id: 'logistics', label: 'Logistics', group: 'Production',
    user: { name: 'Pooja Verma', title: 'Logistics', ...OKHLA },
    responsibilities: ['Packing finished orders against the checklist', 'Printing package QR labels', 'Assigning packages to runners', 'Watching deliveries and resolving exceptions'],
    home: '/packing', stages: ['packaging'],
    orderTabs: [], logisticsTabs: [],
    perms: { production_task: U }, scope: workshopScope, kpis: ['dispatch']
  },
  runner: {
    id: 'runner', label: 'Delivery Runner', group: 'Production',
    user: { name: 'Arjun Singh', title: 'Delivery Runner', location: 'On route' },
    responsibilities: ['Delivering packages to stores and homes', 'Confirming home deliveries with the customer’s OTP'],
    home: '/route', stages: ['logistics'], delivers: true,
    orderTabs: [], logisticsTabs: [],
    perms: { production_task: U }, scope: workshopScope, kpis: ['myQueue', 'dispatch', 'deliveriesToday']
  },
  qc: {
    id: 'qc', label: 'Quality Check', group: 'Production',
    user: { name: 'Deepa Joshi', title: 'Quality Check', ...OKHLA },
    responsibilities: ['Checklist inspection', 'Pass / fail', 'Defect classification', 'Routing garments back to the responsible station'],
    home: '/qc', stages: ['qc'], boardReadOnly: true, orderSheet: true, orderTabs: ['details', 'workflow'], logisticsTabs: [],
    perms: { production_task: U }, scope: workshopScope, kpis: ['inQc', 'myExpress', 'myDueSoon']
  },
  accountant: {
    id: 'accountant', label: 'Accountant', group: 'Office',
    user: { name: 'Anjali Desai', title: 'Accountant', location: 'Khan Market Store' },
    responsibilities: ['Payments and receipts', 'GST', 'Advances and balances', 'Refunds and alteration charges', 'Day close, ledger and revenue reports'],
    home: '/payments', stages: [],
    orderTabs: ['details', 'more'], logisticsTabs: [],
    perms: { payment: CU },
    scope: { prices: true, payments: true, contacts: true, production: false, ownStoreOnly: false },
    kpis: ['awaitingPayment', 'balanceDue', 'collectedToday']
  }
};

export const roleIds = Object.keys(roleDefs) as Role[];
export const roleGroups: RoleGroup[] = ['Office', 'Store', 'Production'];
export const rolesIn = (group: RoleGroup) => roleIds.filter((r) => roleDefs[r].group === group);

/* ------------------------------------------------------------------ */
/* Screen access                                                       */
/* ------------------------------------------------------------------ */

export const screenAccess: Record<NavKey, Role[]> = {
  today: [],
  dashboard: ['admin', 'store_manager', 'salesperson'],
  orders: ['admin', 'store_manager', 'salesperson', 'production_head', 'production_assistant', 'tailor', 'accountant'],
  customers: ['admin', 'store_manager', 'salesperson', 'accountant'],
  calendar: ['admin', 'store_manager', 'salesperson', 'production_head', 'production_assistant'],
  consultations: ['admin'],
  production: ['admin', 'production_head', 'production_assistant', 'tailor', 'qc'],
  qc: ['qc', 'production_head', 'admin'],
  inventory: ['admin', 'production_head', 'production_assistant'],
  packing: ['logistics'],
  dispatch: [],
  pickup: ['runner'],
  deliver: [],
  handover: ['admin', 'store_manager', 'salesperson'],
  payments: ['admin', 'store_manager', 'salesperson', 'accountant'],
  reports: ['admin', 'production_head'],
  team: ['admin', 'production_head'],
  locations: ['admin'],
  categories: ['admin'],
  audit: ['admin'],
  settings: ['admin']
};

const ADMIN_SHELL: NavKey[] = ['locations', 'categories', 'audit', 'consultations'];

/** Older saved admin catalogs predate store locations, categories, the audit log, and consultations. */
function withAdminShell(id: string, screens: string[]): string[] {
  if (id !== 'admin') return screens;
  const rest = screens.filter((key) => !ADMIN_SHELL.includes(key as NavKey));
  return [...rest, ...ADMIN_SHELL];
}

/** Runtime catalog (built-ins + custom). Null means use the seed roleDefs only. */
let liveCatalog: Record<string, RoleRecord> | null = null;

function screensForSeed(role: Role): string[] {
  return (Object.keys(screenAccess) as NavKey[]).filter((key) => screenAccess[key].includes(role));
}

export function seedRoleCatalog(): Record<string, RoleRecord> {
  const catalog: Record<string, RoleRecord> = {};
  for (const id of roleIds) {
    const def = roleDefs[id];
    catalog[id] = {
      id,
      label: def.label,
      group: def.group,
      builtin: true,
      home: def.home,
      screens: screensForSeed(id),
      perms: def.perms,
      scope: def.scope,
      stages: def.stages,
      oversight: def.oversight,
      delivers: def.delivers,
      boardReadOnly: def.boardReadOnly,
      orderSheet: def.orderSheet,
      orderTabs: def.orderTabs,
      logisticsTabs: def.logisticsTabs,
      kpis: def.kpis,
      responsibilities: def.responsibilities,
    };
  }
  return catalog;
}

export function setRoleCatalog(catalog: Record<string, RoleRecord> | null | undefined): void {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    liveCatalog = null;
    return;
  }
  const base = seedRoleCatalog();
  liveCatalog = { ...base };
  for (const [id, role] of Object.entries(catalog)) {
    if (id === 'super_admin') continue;
    if (!role || typeof role !== 'object') continue;
    liveCatalog[id] = {
      ...base[id],
      ...role,
      id,
      builtin: Boolean(base[id]?.builtin || role.builtin),
      screens: withAdminShell(id, Array.isArray(role.screens) ? role.screens : base[id]?.screens ?? []),
      perms: role.perms ?? base[id]?.perms ?? {},
      scope: role.scope ?? base[id]?.scope ?? { prices: false, payments: false, contacts: false, production: false, ownStoreOnly: false },
    };
  }
}

export function getRoleCatalog(): Record<string, RoleRecord> {
  return liveCatalog ?? seedRoleCatalog();
}

export function hasRole(roleId: string): boolean {
  return roleId in getRoleCatalog();
}

export function catalogRoleIds(): Role[] {
  return Object.entries(getRoleCatalog()).filter(([, role]) => !role.deleted).map(([id]) => id) as Role[];
}

export function roleDefFor(role: Role): RoleDef {
  const seed = roleDefs[role as keyof typeof roleDefs] as RoleDef | undefined;
  if (!liveCatalog || !liveCatalog[role]) {
    if (seed) return seed;
    return roleDefs.admin;
  }
  const record = liveCatalog[role];
  return {
    id: role,
    label: record.label,
    group: record.group,
    user: seed?.user ?? { name: record.label, title: record.label, location: 'Khan Market Store' },
    responsibilities: record.responsibilities ?? seed?.responsibilities ?? [],
    home: record.home || seed?.home || '/dashboard',
    stages: (record.stages as StageKey[]) ?? seed?.stages ?? [],
    technique: seed?.technique,
    oversight: record.oversight ?? seed?.oversight,
    delivers: record.delivers ?? seed?.delivers,
    boardReadOnly: record.boardReadOnly ?? seed?.boardReadOnly,
    orderSheet: record.orderSheet ?? seed?.orderSheet,
    orderTabs: (record.orderTabs as OrderTabKey[]) ?? seed?.orderTabs ?? ['details'],
    logisticsTabs: (record.logisticsTabs as LogisticsTabKey[]) ?? seed?.logisticsTabs ?? [],
    perms: record.perms ?? seed?.perms ?? {},
    scope: record.scope ?? seed?.scope ?? { prices: false, payments: false, contacts: false, production: false, ownStoreOnly: false },
    kpis: (record.kpis as KpiKey[]) ?? seed?.kpis ?? [],
  };
}

export function sanitizeRoleId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

export function canAccess(role: Role, key: NavKey): boolean {
  const record = getRoleCatalog()[role];
  if (record) return record.screens.includes(key);
  return screenAccess[key]?.includes(role as never) ?? false;
}

/** Navigation for a role, with its home screen first. */
export function navForRole(role: Role) {
  const def = roleDefFor(role);
  const homePath = def.home.split('?')[0];
  const keys = (Object.keys(navItems) as NavKey[]).filter((k) => canAccess(role, k));
  const home = keys.find((k) => navItems[k].path === homePath);
  const ordered = home ? [home, ...keys.filter((k) => k !== home)] : keys;
  return ordered.map((key) => ({ key, ...navItems[key] }));
}

export function homeFor(role: Role): string {
  return roleDefFor(role).home;
}

export type OrdersTab = 'all' | 'quotes' | 'changes' | 'cancellations';
export type OrdersFilter = 'active' | 'attention' | 'production' | 'ready' | 'closed' | 'all';

/** Store-facing roles: they talk to customers, so they see order status, never workshop stages. */
export function isStoreRole(role: Role): boolean {
  return role === 'store_manager' || role === 'salesperson';
}

/** Workshop roles: they plan and make garments, so sales paperwork stays out of their way. */
export function isWorkshopRole(role: Role): boolean {
  return role === 'production_head' || role === 'production_assistant' || role === 'qc';
}

/**
 * What the Orders page shows for each role.
 * Store: quotes, changes and cancellations, but no workshop stages or "In production" filter.
 * Production Head: orders plus change requests (they can shift workshop dates). Other workshop roles: orders only.
 */
export function ordersView(role: Role): {tabs: OrdersTab[];filters: OrdersFilter[];showStage: boolean;} {
  if (role === 'admin') return { tabs: ['all', 'quotes', 'changes', 'cancellations'], filters: ['active', 'attention', 'production', 'ready', 'closed', 'all'], showStage: true };
  if (isStoreRole(role)) return { tabs: ['all', 'quotes', 'changes', 'cancellations'], filters: ['active', 'attention', 'ready', 'closed', 'all'], showStage: false };
  if (role === 'production_head') return { tabs: ['all', 'changes'], filters: ['active', 'attention', 'production', 'ready', 'all'], showStage: true };
  if (isWorkshopRole(role)) return { tabs: ['all'], filters: ['active', 'attention', 'production', 'ready', 'all'], showStage: true };
  return { tabs: ['all'], filters: ['active', 'attention', 'ready', 'closed', 'all'], showStage: false };
}

/** Status as a store sees it: everything still being made reads "In workshop", no stage detail. */
export function storeStatusLabel(status: string): string | null {
  return status === 'In Production' || status === 'Confirmed' ? 'In workshop' : null;
}

/** Whether this role can open an order page at all (as a full page or a production sheet). */
export function canOpenOrder(role: Role): boolean {
  return roleDefFor(role).orderTabs.length > 0;
}

/** Link to an order for this role, landing on a tab it can see; null when it can’t open orders. */
export function orderLink(role: Role, orderId: string, tab?: OrderTabKey): string | null {
  const tabs = roleDefFor(role).orderTabs;
  if (!tabs.length) return null;
  return tab && tabs.includes(tab) && tab !== 'details' ? `/orders/${orderId}?tab=${tab}` : `/orders/${orderId}`;
}

/** Notifications only reach roles that can act on or open what they’re about. */
export function notificationVisible(role: Role, n: {category: string;orderId?: string;audience?: Role[];}): boolean {
  if (n.audience) return n.audience.includes(role);
  const def = roleDefFor(role);
  const handlesPackages = canAccess(role, 'packing') || canAccess(role, 'pickup');
  if (n.orderId && !canOpenOrder(role)) return n.category === 'Logistics' && handlesPackages;
  switch (n.category) {
    case 'Payments':
      return def.scope.payments;
    case 'Customer':
      return def.scope.contacts;
    case 'Production':
      return canAccess(role, 'production') || canAccess(role, 'qc');
    case 'Logistics':
      return handlesPackages || canAccess(role, 'production');
    case 'Order Updates':
      return canAccess(role, 'orders');
    default:
      return true;
  }
}

/* ------------------------------------------------------------------ */
/* Write permissions                                                   */
/* ------------------------------------------------------------------ */

export function can(role: Role, entity: PermEntity, action: PermAction): boolean {
  return roleDefFor(role).perms[entity]?.includes(action) ?? false;
}

/** Change requests carry price and date impact — only the Admin signs them off. */
export function canApproveChanges(role: Role): boolean {
  return !!roleDefFor(role).oversight;
}

export function canOverrideCapacity(role: Role): boolean {
  return role === 'admin' || role === 'production_head' || !!roleDefFor(role).oversight;
}

/* ------------------------------------------------------------------ */
/* Stage ownership                                                     */
/* ------------------------------------------------------------------ */

export function ownsStage(role: Role, stage: StageKey): boolean {
  return roleDefFor(role).stages.includes(stage);
}

export function stageOwners(stage: StageKey): Role[] {
  return catalogRoleIds().filter((r) => roleDefFor(r).stages.includes(stage));
}

export function stageOwnerLabel(stage: StageKey): string {
  const owners = stageOwners(stage);
  return owners.map((r) => roleDefFor(r).label).join(' / ') || '—';
}

function techniqueMatches(role: Role, g: Garment): boolean {
  const t = roleDefFor(role).technique;
  if (!t) return true;
  const gt = g.embroidery.technique ?? 'Hand';
  return gt === 'Both' || gt === t;
}

/** A role may act on a garment's current stage if it owns that stage or the garment is assigned to this person. */
export function actsOnGarment(role: Role, userName: string, g: Garment): boolean {
  if (g.assignee && g.assignee === userName) return true;
  return ownsStage(role, g.stage) && techniqueMatches(role, g);
}

/** Owner, assignee, or oversight role — the only roles that see stage action buttons. */
export function canActOnStage(role: Role, userName: string, g: Garment): boolean {
  return !!roleDefFor(role).oversight || actsOnGarment(role, userName, g);
}

/** Where a role does the work for a given stage. Workshop stages are run from the order's Workflow tab. */
export function workPathFor(stage: StageKey, orderId: string): string {
  if (stage === 'qc') return '/qc';

  if (stage === 'trial') return trialPath(orderId);
  if (stage === 'store' || stage === 'delivery') return `/orders/${orderId}`;
  return `/orders/${orderId}?tab=workflow`;
}

/** Trials are run inside the order page now. */
export function trialPath(orderId: string): string {
  return `/orders/${orderId}?trial=start`;
}

export function roleLabel(role: Role): string {
  return roleDefFor(role).label;
}

export function namesMatch(value: unknown, name: string): boolean {
  const who = name.trim().toLowerCase();
  return who.length > 0 && typeof value === 'string' && value.trim().toLowerCase() === who;
}