import { builtinRoleCatalog, mergeRoleCatalog, sanitizeRoleId, validateRoleCatalog } from '../libs/common/src/role-catalog';
import { mergeAssignedOrder, orderAssignedTo, presentAssignedOrder } from '../libs/common/src/scope';

describe('role catalog', () => {
  it('seeds the built-in roles with admin settings access', () => {
    const catalog = builtinRoleCatalog();
    expect(Object.keys(catalog)).toHaveLength(10);
    expect(catalog.tailor.label).toBe('Tailor');
    expect(catalog.tailor.screens).toEqual(['orders', 'production']);
    expect(catalog.tailor.perms.production_task).toEqual(['update']);
    expect(catalog.super_admin).toBeUndefined();
    expect(catalog.admin.screens).toEqual(expect.arrayContaining(['settings', 'locations', 'categories', 'audit', 'consultations']));
    expect(validateRoleCatalog(catalog)).toBeNull();
  });

  it('merges a custom role onto the builtins', () => {
    const catalog = mergeRoleCatalog({
      floor_lead: {
        id: 'floor_lead',
        label: 'Floor lead',
        group: 'Production',
        builtin: false,
        home: '/production',
        screens: ['production', 'qc'],
        perms: { production_task: ['update'] },
        scope: { prices: false, payments: false, contacts: false, production: true, ownStoreOnly: false },
      },
    });
    expect(catalog.floor_lead.label).toBe('Floor lead');
    expect(catalog.admin.builtin).toBe(true);
  });

  it('adds master data and audit to an older admin catalog', () => {
    const catalog = mergeRoleCatalog({
      admin: {
        id: 'admin',
        label: 'Admin',
        group: 'Office',
        builtin: true,
        home: '/dashboard',
        screens: ['dashboard', 'settings'],
        perms: {},
        scope: { prices: true, payments: true, contacts: true, production: true, ownStoreOnly: false },
      },
    });
    expect(catalog.admin.screens).toEqual(expect.arrayContaining(['locations', 'categories', 'audit', 'consultations', 'settings']));
  });

  it('drops a stored super admin and keeps locations on admin', () => {
    const catalog = mergeRoleCatalog({
      admin: {
        id: 'admin',
        label: 'Admin',
        group: 'Office',
        builtin: true,
        home: '/dashboard',
        screens: ['dashboard', 'settings', 'locations', 'categories', 'audit'],
        perms: {},
        scope: { prices: true, payments: true, contacts: true, production: true, ownStoreOnly: false },
      },
      super_admin: {
        id: 'super_admin',
        label: 'Super Admin',
        group: 'Office',
        builtin: true,
        home: '/platform',
        screens: [],
        perms: { team: ['read'] },
        scope: { prices: true, payments: true, contacts: true, production: true, ownStoreOnly: false },
      },
    });
    expect(catalog.super_admin).toBeUndefined();
    expect(catalog.admin.screens).toEqual(expect.arrayContaining(['locations', 'categories', 'audit', 'consultations']));
  });

  it('rejects removing settings from admin', () => {
    const catalog = builtinRoleCatalog();
    catalog.admin.screens = catalog.admin.screens.filter((s) => s !== 'settings');
    expect(validateRoleCatalog(catalog)).toMatch(/Settings/);
  });

  it('sanitizes role ids', () => {
    expect(sanitizeRoleId(' Floor Lead! ')).toBe('floor_lead');
  });

  it('keeps a tailor on their own tasks', () => {
    const order = {
      id: 1,
      customerId: 4,
      garments: [{ id: 'G1', assignee: 'Imran Sheikh' }, { id: 'G2', assignee: 'Rafiq Ahmed' }],
      tasks: [
        { id: 'T1', assignee: 'Imran Sheikh', status: 'In progress' },
        { id: 'T2', assignee: 'Rafiq Ahmed', status: 'Queued' },
      ],
    };
    expect(orderAssignedTo(order, 'imran sheikh')).toBe(true);
    expect(orderAssignedTo({ garments: [], tasks: [] }, 'Imran Sheikh')).toBe(false);
    expect(presentAssignedOrder(order, 'Imran Sheikh').tasks).toEqual([{ id: 'T1', assignee: 'Imran Sheikh', status: 'In progress' }]);
    const saved = mergeAssignedOrder(order, { tasks: [{ id: 'T1', assignee: 'Someone else', status: 'Done', updatedBy: 'Imran Sheikh' }, { id: 'T2', status: 'Done' }] }, 'Imran Sheikh');
    expect(saved.tasks).toEqual([
      { id: 'T1', assignee: 'Imran Sheikh', status: 'Done', updatedBy: 'Imran Sheikh' },
      { id: 'T2', assignee: 'Rafiq Ahmed', status: 'Queued' },
    ]);
  });
});
