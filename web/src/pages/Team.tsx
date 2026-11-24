import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { RolesSettings } from '../components/settings/RolesSettings';
import { Badge } from '../components/ui/Badge';
import { Button, buttonClass } from '../components/ui/Button';
import { RowMenu, type RowAction } from '../components/ui/RowMenu';
import { Toggle } from '../components/ui/Toggle';
import { TablePager, usePagedRows } from '../components/ui/TablePager';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import { employees as seed } from '../data/team';
import { useConfirm } from '../hooks/useConfirm';
import { useSyncedList } from '../hooks/useSyncedList';
import { listUsers, updateUser } from '../services/api';
import { apiMode } from '../services/mode';
import type { Employee } from '../types';
import { cn } from '../utils/cn';
import { PageHeader } from '../components/ui/PageHeader';
import { employeeLocationLabel, showsProductionWorkload } from '../utils/team-display';
import { pageClass, panelClass } from '../utils/styles';
import { mergeTeam } from '../utils/team-directory';

type Tab = 'employees' | 'roles' | 'attendance' | 'performance';

export function Team() {
  const { can, role, user } = useApp();
  const [tab, setTab] = useState<Tab>('employees');
  const [openRole, setOpenRole] = useState<(() => void) | null>(null);
  const registerRoleCreate = useCallback((open: () => void) => {
    setOpenRole(() => open);
  }, []);
  const [people, setPeople] = useSyncedList<Employee[]>('team', seed);
  const [loading, setLoading] = useState(apiMode && role === 'admin');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  const visible = people.filter((person) => {
    if (person.deletedAt) return false;
    if (user.storeId == null) return true;
    return person.storeId == null || String(person.storeId) === '' || String(person.storeId) === String(user.storeId);
  });
  const page = usePagedRows(visible, tab);

  useEffect(() => {
    if (!apiMode || role !== 'admin') {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    listUsers()
      .then((users) => {
        if (live) setPeople((prev) => mergeTeam(users, prev));
      })
      .catch(() => { if (live) toast.error('Could not load employees'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [role, setPeople]);

  const setActive = (employee: Employee, active: boolean) => {
    const key = String(employee.id);
    if (pendingId) return;
    const apply = () => setPeople((prev) => prev.map((person) => String(person.id) === key ? { ...person, disabled: !active } : person));
    if (!apiMode || !employee.userId) {
      apply();
      return;
    }
    setPendingId(key);
    updateUser(employee.userId, { disabled: !active })
      .then(() => {
        apply();
        toast.success(active ? `${employee.name} is active` : `${employee.name} is inactive`);
      })
      .catch(() => toast.error('Could not update that employee'))
      .finally(() => setPendingId((current) => current === key ? null : current));
  };

  const remove = (employee: Employee) => {
    if (!can('team', 'delete')) return;
    const disabling = apiMode && employee.userId;
    void confirm({
      title: disabling ? `Disable ${employee.name}?` : `Remove ${employee.name}?`,
      description: disabling ? 'They will no longer be able to sign in. Their record stays on file.' : 'They will leave the team list. The record stays on file.',
      confirmLabel: disabling ? 'Disable' : 'Remove',
    }).then((yes) => {
      if (!yes) return;
      if (disabling) {
        updateUser(employee.userId!, { disabled: true })
          .then(() => {
            setPeople((prev) => prev.map((person) => person.userId === employee.userId ? { ...person, disabled: true, status: 'Off today' } : person));
            toast.success(`${employee.name} disabled`);
          })
          .catch(() => toast.error('Could not disable that employee'));
        return;
      }
      setPeople((prev) => prev.map((person) => person.id === employee.id ? { ...person, deletedAt: new Date().toISOString() } : person));
      toast.success(`${employee.name} removed`);
    });
  };

  return (
    <div className={pageClass}>
      {dialog}
      <PageHeader title="Team" subtitle={`${visible.length} people`} />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'employees', label: 'Employees' },
          { key: 'roles', label: 'Roles' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'performance', label: 'Performance' },
        ]}
        actions={tab === 'employees' && can('team', 'create') ? (
          <Link to="/team/new" className={buttonClass('primary', 'sm')}>
            <PlusIcon className="h-4 w-4" />
            Onboard employee
          </Link>
        ) : tab === 'roles' && openRole ? (
          <Button variant="secondary" size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={openRole}>
            Custom role
          </Button>
        ) : undefined}
      />
      <div className="pt-4">
        {tab === 'roles' ? <RolesSettings onCreate={registerRoleCreate} /> : (
          <div className={`${panelClass} overflow-x-auto`}>
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2">Name</th>
                    {tab === 'employees' && (
                      <>
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Location</th>
                        <th className="px-3 py-2">Mobile</th>
                        <th className="px-3 py-2">Active</th>
                        <th className="px-3 py-2 text-right">Workload</th>
                      </>
                    )}
                    {tab === 'attendance' && (
                      <>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Clock in</th>
                        <th className="px-3 py-2 text-right font-medium">Attendance</th>
                      </>
                    )}
                    {tab === 'performance' && (
                      <>
                        <th className="px-3 py-2 text-right font-medium">Tasks / week</th>
                        <th className="px-3 py-2 text-right font-medium">QC reject</th>
                        <th className="px-3 py-2 text-right font-medium">Avg cycle</th>
                      </>
                    )}
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {!loading && page.rows.map((person) => {
                    const load = person.capacity ? Math.round((person.activeTasks / person.capacity) * 100) : 0;
                    return (
                      <tr key={person.id} className="hover:bg-canvas">
                        <td className="px-3 py-2">
                          <Link to={`/team/${person.id}`} className="font-medium hover:text-brand">{person.name}</Link>
                        </td>
                        {tab === 'employees' && (
                          <>
                            <td className="px-3 py-2">{person.role}</td>
                            <td className="px-3 py-2 text-ink-muted">{employeeLocationLabel(person)}</td>
                            <td className="px-3 py-2 tabular">{person.mobile?.trim() || '—'}</td>
                            <td className="px-3 py-2">
                              <Toggle compact busy={pendingId === String(person.id)} checked={!person.disabled} label={`${person.name} active`} onChange={(active) => setActive(person, active)} />
                            </td>
                            <td className="px-3 py-2 text-right">
                              {showsProductionWorkload(person) ? <>
                                  <span className="tabular">{person.activeTasks}/{person.capacity}</span>
                                  <div className="ml-auto mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-sunken">
                                    <div className={cn('h-full rounded-full', load >= 100 ? 'bg-critical' : load >= 80 ? 'bg-warning' : 'bg-brand')} style={{ width: `${Math.min(100, load)}%` }} />
                                  </div>
                                </> : <span className="text-ink-muted">—</span>}
                            </td>
                          </>
                        )}
                        {tab === 'attendance' && (
                          <>
                            <td className="px-3 py-2">
                              <Badge tone={person.disabled ? 'neutral' : person.status === 'On shift' ? 'success' : person.status === 'On break' ? 'attention' : 'neutral'}>{person.disabled ? 'Disabled' : person.status}</Badge>
                            </td>
                            <td className="px-3 py-2">{person.clockIn ? `In at ${person.clockIn}` : 'Not clocked in'}</td>
                            <td className="px-3 py-2 text-right font-medium tabular">{person.attendancePct}%</td>
                          </>
                        )}
                        {tab === 'performance' && (
                          <>
                            <td className="px-3 py-2 text-right tabular">{person.tasksThisWeek}</td>
                            <td className={cn('px-3 py-2 text-right tabular', person.qcRejectRate > 5 && 'font-medium text-warning')}>{person.qcRejectRate ? `${person.qcRejectRate}%` : '—'}</td>
                            <td className="px-3 py-2 text-right tabular">{person.avgCycleHrs ? `${person.avgCycleHrs} h` : '—'}</td>
                          </>
                        )}
                        <td className="px-3 py-2 text-right">
                          <RowMenu label={`Actions for ${person.name}`} items={[
                            { label: 'View', to: `/team/${person.id}` },
                            ...(can('team', 'update') ? [{ label: 'Update', to: `/team/${person.id}/edit` }] : []),
                            ...(can('team', 'delete') ? [{ label: 'Delete', onClick: () => remove(person), destructive: true }] : []),
                          ] satisfies RowAction[]} />
                        </td>
                      </tr>
                    );
                  })}
                  {loading && <tr><td colSpan={8} className="px-4 py-8 text-center text-ink-muted">Loading employees…</td></tr>}
                </tbody>
              </table>
              <TablePager page={page.page} pages={page.pages} from={page.from} to={page.to} total={page.total} onPage={page.setPage} />
            </div>
        )}
      </div>
    </div>
  );
}
