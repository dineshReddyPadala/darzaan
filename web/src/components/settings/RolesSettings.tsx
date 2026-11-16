import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { PermAction, PermEntity, Role, RoleGroup, RoleRecord } from '../../types';
import { putCollection } from '../../services/api';
import { apiMode } from '../../services/mode';
import { applyRoleCatalog } from '../../services/sync';
import { cn } from '../../utils/cn';
import {
  catalogRoleIds,
  getRoleCatalog,
  navItems,
  roleGroups,
  sanitizeRoleId,
  seedRoleCatalog,
  type NavKey,
} from '../../utils/roles';
import { teamList } from '../../utils/team';
import { inputClass, panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';
import { useConfirm } from '../../hooks/useConfirm';
import { TablePager, usePagedRows } from '../ui/TablePager';

const entities: PermEntity[] = ['order', 'garment', 'measurement', 'production_task', 'trial', 'alteration', 'payment', 'inventory', 'customer', 'team'];
const actions: PermAction[] = ['create', 'update', 'delete'];
const screenKeys = Object.keys(navItems) as NavKey[];
const reservedScreens = new Set<NavKey>(['settings', 'locations', 'categories', 'audit', 'consultations']);

type View = 'list' | 'screens' | 'detail';

function cloneCatalog(): Record<string, RoleRecord> {
  return structuredClone(getRoleCatalog());
}

function countOn(role: RoleRecord, people: { roleId?: string; role?: string }[]): number {
  return people.filter((person) => person.roleId === role.id || person.role === role.label).length;
}

export function RolesSettings({ onCreate, people }: { onCreate?: (open: () => void) => void; people?: { roleId?: string; role?: string }[] }) {
  const [view, setView] = useState<View>('list');
  const [catalog, setCatalog] = useState<Record<string, RoleRecord>>(() => cloneCatalog());
  const [sel, setSel] = useState<Role>('salesperson');
  const [busy, setBusy] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ id: '', label: '', group: 'Production' as RoleGroup, copyFrom: 'production_assistant' as Role });
  const openCreate = useCallback(() => setRoleModal(true), []);
  useEffect(() => {
    onCreate?.(openCreate);
  }, [onCreate, openCreate]);

  const directory = people ?? teamList();
  const { confirm, dialog } = useConfirm();
  const roleList = useMemo(() => Object.values(catalog).filter((role) => !role.deleted).sort((a, b) => a.label.localeCompare(b.label)), [catalog]);
  const rolePage = usePagedRows(roleList, String(roleList.length));
  const selected = catalog[sel] ?? catalog.admin;

  const saveCatalog = async (next: Record<string, RoleRecord>) => {
    if (!next.admin) {
      toast.error('The admin role is required');
      return;
    }
    if (!next.admin.screens.includes('settings')) {
      toast.error('Admin must keep Settings access');
      return;
    }
    setBusy(true);
    try {
      if (apiMode) await putCollection('roles', next);
      applyRoleCatalog(next);
      setCatalog(structuredClone(next));
      toast.success('Roles saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save roles');
    } finally {
      setBusy(false);
    }
  };

  const toggleScreen = (roleId: Role, key: NavKey) => {
    if (roleId === 'admin' && key === 'settings') {
      toast.error('Admin must keep Settings access');
      return;
    }
    const next = structuredClone(catalog);
    const role = next[roleId];
    if (!role) return;
    role.screens = role.screens.includes(key) ? role.screens.filter((s) => s !== key) : [...role.screens, key];
    setCatalog(next);
  };

  const togglePerm = (roleId: Role, entity: PermEntity, action: PermAction) => {
    const next = structuredClone(catalog);
    const role = next[roleId];
    if (!role) return;
    const current = role.perms[entity] ?? [];
    role.perms[entity] = current.includes(action) ? current.filter((a) => a !== action) : [...current, action];
    setCatalog(next);
  };

  const toggleScope = (roleId: Role, key: keyof RoleRecord['scope']) => {
    const next = structuredClone(catalog);
    const role = next[roleId];
    if (!role) return;
    role.scope = { ...role.scope, [key]: !role.scope[key] };
    setCatalog(next);
  };

  const openRole = (roleId: Role) => {
    setSel(roleId);
    setView('detail');
  };

  const createRole = async () => {
    const id = sanitizeRoleId(roleForm.id || roleForm.label);
    if (!id) {
      toast.error('Give the role an id or label');
      return;
    }
    if (catalog[id]) {
      toast.error('That role id already exists');
      return;
    }
    const base = catalog[roleForm.copyFrom] ?? seedRoleCatalog().production_assistant;
    const next = cloneCatalog();
    next[id] = {
      ...structuredClone(base),
      id,
      label: roleForm.label.trim() || id,
      group: roleForm.group,
      builtin: false,
      screens: (base.screens ?? []).filter((s) => !reservedScreens.has(s as NavKey)),
    };
    setSel(id);
    setRoleModal(false);
    setView('detail');
    await saveCatalog(next);
  };

  const deleteRole = async (roleId: Role) => {
    if (catalog[roleId]?.builtin || roleId === 'admin') {
      toast.error('Built-in roles can’t be deleted');
      return;
    }
    if (directory.some((person) => person.roleId === roleId)) {
      toast.error('Reassign employees on this role before deleting it');
      return;
    }
    const yes = await confirm({
      title: `Delete ${catalog[roleId]?.label ?? roleId}?`,
      description: 'It will disappear from role pickers. People who already have it keep that assignment on file.',
    });
    if (!yes) return;
    const next = cloneCatalog();
    next[roleId] = { ...next[roleId], deleted: true };
    setSel('admin');
    setView('list');
    await saveCatalog(next);
  };

  return (
    <div className="space-y-4">
      {dialog}
      {view === 'list' && (
        <div className="space-y-3">
          {!onCreate && (
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={openCreate}>
                Custom role
              </Button>
            </div>
          )}
          <div className={`${panelClass} overflow-x-auto`}>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ink-muted">
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Group</th>
                  <th className="px-3 py-2 font-medium">Home</th>
                  <th className="px-3 py-2 text-right font-medium">Screens</th>
                  <th className="px-3 py-2 text-right font-medium">People</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rolePage.rows.map((role) => (
                  <tr key={role.id} className="cursor-pointer hover:bg-canvas" onClick={() => openRole(role.id)}>
                    <th scope="row" className="px-3 py-2 text-left text-[15px] font-medium">
                      <button type="button" className="text-left" onClick={() => openRole(role.id)}>
                        {role.label}
                        {!role.builtin && <span className="ml-2 text-xs font-normal text-ink-subtle">custom</span>}
                      </button>
                    </th>
                    <td className="px-3 py-2">{role.group}</td>
                    <td className="px-3 py-2 text-ink-muted">{role.home}</td>
                    <td className="px-3 py-2 text-right tabular">{role.screens.length}</td>
                    <td className="px-3 py-2 text-right tabular">{countOn(role, directory)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePager page={rolePage.page} pages={rolePage.pages} from={rolePage.from} to={rolePage.to} total={rolePage.total} onPage={rolePage.setPage} />
          </div>
        </div>
      )}

      {view !== 'list' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView('list')}>
              All roles
            </Button>
            <Segmented<View>
              value={view}
              onChange={setView}
              options={[
                { value: 'detail', label: 'Role detail' },
                { value: 'screens', label: 'Screen access' },
              ]}
            />
          </div>

          {view === 'screens' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button size="sm" disabled={busy} onClick={() => void saveCatalog(catalog)}>
                  Save screens
                </Button>
              </div>
              <div className={`${panelClass} overflow-x-auto`}>
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="sticky left-0 bg-surface px-3 py-2 text-left font-semibold">Role</th>
                      {screenKeys.map((k) => (
                        <th key={k} className="px-2 py-3 text-center text-xs font-medium text-ink-muted">
                          {navItems[k].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {roleGroups.map((g) => (
                    <tbody key={g} className="divide-y divide-line">
                      <tr>
                        <th colSpan={screenKeys.length + 1} className="bg-canvas px-4 py-2 text-left text-xs font-semibold text-ink-muted">
                          {g}
                        </th>
                      </tr>
                      {roleList
                        .filter((r) => r.group === g)
                        .map((r) => (
                          <tr key={r.id} className={r.id === sel ? 'bg-brand-soft/40' : undefined}>
                            <th scope="row" className="sticky left-0 bg-surface px-4 py-2.5 text-left text-[15px] font-medium">
                              <button type="button" onClick={() => setSel(r.id)} className="text-left">
                                {r.label}
                                {!r.builtin && <span className="ml-2 text-xs font-normal text-ink-subtle">custom</span>}
                              </button>
                            </th>
                            {screenKeys.map((k) => {
                              const on = r.screens.includes(k);
                              return (
                                <td key={k} className="px-2 py-2 text-center">
                                  <button
                                    type="button"
                                    aria-label={`${r.label} ${navItems[k].label} ${on ? 'has access' : 'no access'}`}
                                    onClick={() => toggleScreen(r.id, k)}
                                    className={cn('mx-auto flex h-7 w-7 items-center justify-center rounded-lg', on ? 'bg-brand-muted text-brand-hover' : 'bg-sunken text-transparent hover:text-ink-subtle')}
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  ))}
                </table>
              </div>
            </div>
          )}

          {view === 'detail' && selected && (
            <section className={`${panelClass} p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{selected.label}</h3>
                </div>
                <div className="flex gap-2">
                  {!selected.builtin && (
                    <Button variant="ghost" size="sm" icon={<Trash2Icon className="h-4 w-4" />} onClick={() => void deleteRole(selected.id)}>
                      Delete
                    </Button>
                  )}
                  <Button size="sm" disabled={busy} onClick={() => void saveCatalog(catalog)}>
                    Save role
                  </Button>
                </div>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-[15px]">
                {(selected.responsibilities ?? []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <table className="mt-6 w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ink-muted">
                    <th className="py-2 font-medium">Record</th>
                    {actions.map((a) => (
                      <th key={a} className="py-2 text-center font-medium capitalize">
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {entities.map((e) => (
                    <tr key={e}>
                      <td className="py-2.5 capitalize">{e.replace('_', ' ')}</td>
                      {actions.map((a) => {
                        const on = selected.perms[e]?.includes(a);
                        return (
                          <td key={a} className="py-2.5 text-center">
                            <button type="button" onClick={() => togglePerm(selected.id, e, a)} className="mx-auto block">
                              {on ? <CheckIcon className="mx-auto h-4 w-4 text-success" aria-label="Allowed" /> : <span className="text-ink-subtle" aria-label="Not allowed">—</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {(['prices', 'payments', 'contacts', 'production', 'ownStoreOnly'] as const).map((key) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                    <input type="checkbox" checked={selected.scope[key]} onChange={() => toggleScope(selected.id, key)} />
                    <span className="capitalize">{key === 'ownStoreOnly' ? 'Own store only' : key}</span>
                  </label>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Modal
        open={roleModal}
        onClose={() => setRoleModal(false)}
        title="Create custom role"
        description="Copies screens and permissions from a base role, then you can edit them."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => void createRole()} disabled={busy || !roleForm.label.trim()}>
              Create role
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Label" required>
            <input className={inputClass} value={roleForm.label} onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })} placeholder="Floor lead" />
          </Field>
          <Field label="Id" hint="Letters, numbers, underscores">
            <input className={inputClass} value={roleForm.id} onChange={(e) => setRoleForm({ ...roleForm, id: e.target.value })} placeholder="floor_lead" />
          </Field>
          <Field label="Group">
            <select className={inputClass} value={roleForm.group} onChange={(e) => setRoleForm({ ...roleForm, group: e.target.value as RoleGroup })}>
              {roleGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Copy from">
            <select className={inputClass} value={roleForm.copyFrom} onChange={(e) => setRoleForm({ ...roleForm, copyFrom: e.target.value as Role })}>
              {catalogRoleIds().map((id) => (
                <option key={id} value={id}>
                  {catalog[id]?.label ?? id}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
