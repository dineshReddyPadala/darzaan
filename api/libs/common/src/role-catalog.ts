import type { DataScope, PermAction, PermEntity, Role } from './roles';
import { rolePermissions, roleScopes } from './roles';

export type RoleGroup = 'Office' | 'Store' | 'Production';

export type NavKey =
  | 'today'
  | 'dashboard'
  | 'customers'
  | 'orders'
  | 'calendar'
  | 'consultations'
  | 'production'
  | 'qc'
  | 'inventory'
  | 'packing'
  | 'dispatch'
  | 'pickup'
  | 'deliver'
  | 'handover'
  | 'payments'
  | 'reports'
  | 'team'
  | 'locations'
  | 'categories'
  | 'audit'
  | 'settings';

export interface RoleRecord {
  id: string;
  label: string;
  group: RoleGroup;
  builtin: boolean;
  home: string;
  screens: NavKey[];
  perms: Partial<Record<PermEntity, PermAction[]>>;
  scope: DataScope;
  stages?: string[];
  oversight?: boolean;
  delivers?: boolean;
  boardReadOnly?: boolean;
  orderSheet?: boolean;
  orderTabs?: string[];
  logisticsTabs?: string[];
  kpis?: string[];
  responsibilities?: string[];
  /** Kept in the catalog so past assignments still resolve. Hidden from pickers. */
  deleted?: boolean;
}

const ALL_ORDER_TABS = ['details', 'workflow', 'more'];
const PRODUCTION_TABS = ['details', 'workflow', 'more'];
const workshopStages = ['material', 'dyeing', 'marking', 'embroidery', 'cutting', 'stitching', 'hemming', 'finishing', 'ironing', 'alteration'];

const SCREENS: Record<Role, NavKey[]> = {
  admin: ['dashboard', 'customers', 'orders', 'calendar', 'consultations', 'production', 'qc', 'inventory', 'handover', 'payments', 'reports', 'team', 'locations', 'categories', 'audit', 'settings'],
  store_manager: ['dashboard', 'customers', 'orders', 'calendar', 'handover', 'payments'],
  salesperson: ['dashboard', 'customers', 'orders', 'calendar', 'handover', 'payments'],
  production_head: ['orders', 'calendar', 'production', 'qc', 'inventory', 'reports', 'team'],
  production_assistant: ['orders', 'calendar', 'production', 'inventory'],
  tailor: ['orders', 'production'],
  logistics: ['packing'],
  runner: ['pickup'],
  qc: ['production', 'qc'],
  accountant: ['orders', 'customers', 'payments'],
};

const META: Record<
  Role,
  Pick<RoleRecord, 'label' | 'group' | 'home' | 'stages' | 'oversight' | 'delivers' | 'boardReadOnly' | 'orderSheet' | 'orderTabs' | 'logisticsTabs' | 'kpis' | 'responsibilities'>
> = {
  admin: {
    label: 'Admin',
    group: 'Office',
    home: '/dashboard',
    stages: ['store', 'delivery'],
    oversight: true,
    orderTabs: ALL_ORDER_TABS,
    logisticsTabs: ['trips', 'deliveries', 'packaging', 'issues'],
    kpis: ['atRisk', 'awaitingPayment', 'inProduction', 'readyTrial', 'readyPickup', 'overdue'],
    responsibilities: ['Full order lifecycle oversight', 'Order confirmation and delivery', 'Exception and at-risk resolution', 'Inventory', 'Store locations', 'Team and settings', 'All reports'],
  },
  store_manager: {
    label: 'Store Manager',
    group: 'Store',
    home: '/dashboard',
    stages: [],
    orderTabs: ALL_ORDER_TABS,
    logisticsTabs: ['issues'],
    kpis: ['atRisk', 'awaitingPayment', 'inProduction', 'readyTrial', 'readyPickup', 'overdue'],
    responsibilities: ['Store dashboard', 'Customer check-in and records', 'Draft orders for the Designer to price', 'Trial booking and sessions', 'Receiving packages and raising discrepancies'],
  },
  salesperson: {
    label: 'Salesperson',
    group: 'Store',
    home: '/dashboard',
    stages: [],
    orderTabs: ALL_ORDER_TABS,
    logisticsTabs: [],
    kpis: ['ordersToday', 'awaitingPayment', 'balanceDue', 'trialsToday', 'readyPickup'],
    responsibilities: ['Customer intake', 'Creating orders and quotes', 'Advance collection', 'Trial booking', 'Follow-ups on balances'],
  },
  production_head: {
    label: 'Production Head',
    group: 'Production',
    home: '/production',
    stages: ['acknowledgement', 'review', 'scheduling'],
    orderTabs: PRODUCTION_TABS,
    logisticsTabs: ['trips', 'issues'],
    kpis: ['express', 'atRisk', 'inQc', 'firstPassRate', 'openReworks', 'awaitingReview', 'dispatch'],
    responsibilities: ['Production review', 'Scheduling and station assignment', 'Load and capacity balance', 'Express prioritisation', 'Unblocking issues and rework decisions', 'Weekly throughput'],
  },
  production_assistant: {
    label: 'Production Assistant',
    group: 'Production',
    home: '/production',
    stages: workshopStages,
    orderTabs: PRODUCTION_TABS,
    logisticsTabs: [],
    kpis: ['express', 'atRisk', 'awaitingReview', 'inQc'],
    responsibilities: ['Creating production tasks per order', 'Scanning worker badges to assign tasks', 'Reassigning work', 'Moving tasks through Pending, In progress and Done', 'Tracking every garment from the Workflow tab'],
  },
  tailor: {
    label: 'Tailor',
    group: 'Production',
    home: '/production',
    stages: [],
    orderTabs: ['details', 'workflow'],
    logisticsTabs: [],
    kpis: [],
    responsibilities: ['View the orders they are working', 'Mark their own tasks done'],
  },
  logistics: {
    label: 'Logistics',
    group: 'Production',
    home: '/packing',
    stages: ['packaging'],
    orderTabs: [],
    logisticsTabs: [],
    kpis: ['dispatch'],
    responsibilities: ['Packing finished orders against the checklist', 'Printing package QR labels', 'Assigning packages to runners', 'Watching deliveries and resolving exceptions'],
  },
  runner: {
    label: 'Delivery Runner',
    group: 'Production',
    home: '/route',
    stages: ['logistics'],
    delivers: true,
    orderTabs: [],
    logisticsTabs: [],
    kpis: ['myQueue', 'dispatch', 'deliveriesToday'],
    responsibilities: ['Delivering packages to stores and homes', 'Confirming home deliveries with the customer’s OTP'],
  },
  qc: {
    label: 'Quality Check',
    group: 'Production',
    home: '/qc',
    stages: ['qc'],
    boardReadOnly: true,
    orderSheet: true,
    orderTabs: ['details', 'workflow'],
    logisticsTabs: [],
    kpis: ['inQc', 'myExpress', 'myDueSoon'],
    responsibilities: ['Checklist inspection', 'Pass / fail', 'Defect classification', 'Routing garments back to the responsible station'],
  },
  accountant: {
    label: 'Accountant',
    group: 'Office',
    home: '/payments',
    stages: [],
    orderTabs: ['details', 'more'],
    logisticsTabs: [],
    kpis: ['awaitingPayment', 'balanceDue', 'collectedToday'],
    responsibilities: ['Payments and receipts', 'GST', 'Advances and balances', 'Refunds and alteration charges', 'Day close, ledger and revenue reports'],
  },
};

/** Built-in roles used when the roles snapshot is empty. */
export function builtinRoleCatalog(): Record<string, RoleRecord> {
  const catalog: Record<string, RoleRecord> = {};
  for (const id of Object.keys(rolePermissions) as Role[]) {
    catalog[id] = {
      id,
      builtin: true,
      screens: SCREENS[id],
      perms: rolePermissions[id],
      scope: roleScopes[id],
      ...META[id],
    };
  }
  return catalog;
}

export function isRecordRoleCatalog(value: unknown): value is Record<string, RoleRecord> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function mergeRoleCatalog(stored: unknown): Record<string, RoleRecord> {
  const base = builtinRoleCatalog();
  if (!isRecordRoleCatalog(stored)) return base;
  const next = { ...base };
  for (const [id, role] of Object.entries(stored)) {
    if (id === 'super_admin') continue;
    if (!role || typeof role !== 'object' || typeof role.id !== 'string') continue;
    next[id] = {
      ...base[id],
      ...role,
      id,
      builtin: Boolean(base[id]?.builtin || role.builtin),
      perms: role.perms ?? base[id]?.perms ?? {},
      scope: role.scope ?? base[id]?.scope ?? { prices: false, payments: false, contacts: false, production: false, ownStoreOnly: false },
      screens: withAdminShell(id, Array.isArray(role.screens) ? role.screens : base[id]?.screens ?? []),
    };
  }
  return next;
}

/** Older admin catalogs predate store locations, categories, the audit log, and consultations. */
export function withAdminShell(id: string, screens: NavKey[]): NavKey[] {
  if (id !== 'admin') return screens;
  const shell: NavKey[] = ['locations', 'categories', 'audit', 'consultations'];
  const rest = screens.filter((key) => !shell.includes(key));
  return [...rest, ...shell];
}

export function roleFromCatalog(catalog: Record<string, RoleRecord>, roleId: string): RoleRecord | undefined {
  return catalog[roleId];
}

export function catalogHasRole(catalog: Record<string, RoleRecord>, roleId: string): boolean {
  return Boolean(catalog[roleId] && !catalog[roleId].deleted);
}

export function canWithCatalog(catalog: Record<string, RoleRecord>, roleId: string, entity: PermEntity, action: PermAction): boolean {
  return !!catalog[roleId]?.perms[entity]?.includes(action);
}

export function scopeFromCatalog(catalog: Record<string, RoleRecord>, roleId: string): DataScope {
  return catalog[roleId]?.scope ?? { prices: false, payments: false, contacts: false, production: false, ownStoreOnly: false };
}

/** Admin role must keep Settings; admin itself cannot be removed from the catalog. */
export function validateRoleCatalog(catalog: Record<string, RoleRecord>): string | null {
  const admin = catalog.admin;
  if (!admin) return 'The admin role is required';
  if (!admin.screens.includes('settings')) return 'Admin must keep Settings access';
  return null;
}

export function sanitizeRoleId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}
