export type Role =
  | 'admin'
  | 'store_manager'
  | 'salesperson'
  | 'production_head'
  | 'production_assistant'
  | 'tailor'
  | 'logistics'
  | 'runner'
  | 'qc'
  | 'accountant';

export type PermEntity =
  | 'order'
  | 'garment'
  | 'measurement'
  | 'production_task'
  | 'trial'
  | 'alteration'
  | 'payment'
  | 'inventory'
  | 'customer'
  | 'team';

export type PermAction = 'create' | 'update' | 'delete';

export interface DataScope {
  prices: boolean;
  payments: boolean;
  contacts: boolean;
  production: boolean;
  ownStoreOnly: boolean;
}

const CRUD: PermAction[] = ['create', 'update', 'delete'];
const CU: PermAction[] = ['create', 'update'];
const U: PermAction[] = ['update'];
const C: PermAction[] = ['create'];

const storeScope: DataScope = { prices: true, payments: true, contacts: true, production: true, ownStoreOnly: true };
const workshopScope: DataScope = { prices: false, payments: false, contacts: false, production: true, ownStoreOnly: false };

export const rolePermissions: Record<Role, Partial<Record<PermEntity, PermAction[]>>> = {
  admin: { order: CRUD, garment: CRUD, measurement: CRUD, production_task: CRUD, trial: CRUD, alteration: CRUD, payment: CRUD, inventory: CRUD, customer: CRUD, team: CRUD },
  store_manager: { order: CU, customer: CU, measurement: CU, trial: CU, alteration: CU, payment: C },
  salesperson: { order: CU, garment: CU, measurement: C, payment: C, trial: CU, customer: CU },
  production_head: { production_task: CU, garment: U, inventory: U, team: U },
  production_assistant: { production_task: CRUD, garment: U, inventory: U },
  tailor: { production_task: U },
  logistics: { production_task: U },
  runner: { production_task: U },
  qc: { production_task: U },
  accountant: { payment: CU },
};

export const roleScopes: Record<Role, DataScope> = {
  admin: { ...storeScope, ownStoreOnly: false },
  store_manager: storeScope,
  salesperson: storeScope,
  production_head: workshopScope,
  production_assistant: workshopScope,
  tailor: workshopScope,
  logistics: workshopScope,
  runner: workshopScope,
  qc: workshopScope,
  accountant: { prices: true, payments: true, contacts: true, production: false, ownStoreOnly: false },
};

export const roleStore: Partial<Record<Role, string>> = {
  store_manager: 'Khan Market',
  salesperson: 'Khan Market',
};

export function can(role: string, entity: PermEntity, action: PermAction): boolean {
  if (!(role in rolePermissions)) return false;
  return !!rolePermissions[role as Role]?.[entity]?.includes(action);
}

export function scopeFor(role: string): DataScope {
  if (role in roleScopes) return roleScopes[role as Role];
  return { prices: false, payments: false, contacts: false, production: false, ownStoreOnly: false };
}

export interface StaffUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  title: string;
  location: string;
  store?: string;
  /** Location id. Absent when the person is not assigned to a store. */
  storeId?: number;
}

export function isPrivileged(role: string): boolean {
  return role === 'admin';
}

export const staff: StaffUser[] = [
  { id: 'U-admin', email: 'aditi.malhotra@darzaan.test', role: 'admin', name: 'Aditi Malhotra', title: 'Admin', location: 'Khan Market Store', store: 'Khan Market', storeId: 1 },
  { id: 'U-store', email: 'kabir.sethi@darzaan.test', role: 'store_manager', name: 'Kabir Sethi', title: 'Store Manager', location: 'Khan Market Store', store: 'Khan Market', storeId: 1 },
  { id: 'U-sales', email: 'ritu.sharma@darzaan.test', role: 'salesperson', name: 'Ritu Sharma', title: 'Salesperson', location: 'Khan Market Store', store: 'Khan Market', storeId: 1 },
  { id: 'U-head', email: 'vikram.rathore@darzaan.test', role: 'production_head', name: 'Vikram Rathore', title: 'Production Head', location: 'Okhla Workshop', storeId: 2 },
  { id: 'U-assistant', email: 'manoj.tiwari@darzaan.test', role: 'production_assistant', name: 'Manoj Tiwari', title: 'Production Assistant', location: 'Okhla Workshop', storeId: 2 },
  { id: 'U-tailor', email: 'imran.sheikh@darzaan.test', role: 'tailor', name: 'Imran Sheikh', title: 'Tailor', location: 'Okhla Workshop', storeId: 2 },
  { id: 'U-logistics', email: 'pooja.verma@darzaan.test', role: 'logistics', name: 'Pooja Verma', title: 'Logistics', location: 'Okhla Workshop', storeId: 2 },
  { id: 'U-runner', email: 'arjun.singh@darzaan.test', role: 'runner', name: 'Arjun Singh', title: 'Delivery Runner', location: 'On route' },
  { id: 'U-qc', email: 'deepa.joshi@darzaan.test', role: 'qc', name: 'Deepa Joshi', title: 'Quality Check', location: 'Okhla Workshop', storeId: 2 },
  { id: 'U-accounts', email: 'anjali.desai@darzaan.test', role: 'accountant', name: 'Anjali Desai', title: 'Accountant', location: 'Khan Market Store', storeId: 1 },
];

export function isRole(value: string): value is Role {
  return value in rolePermissions;
}

/** Built-in or custom role id — non-empty string used in JWT claims. */
export function isRoleId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 64;
}
