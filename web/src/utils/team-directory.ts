import type { Employee, StaffLogin } from '../types';
import { roleLabel } from './roles';

const emptyShift = {
  status: 'Off today' as const,
  activeTasks: 0,
  capacity: 5,
  qcRejectRate: 0,
  avgCycleHrs: 0,
  tasksThisWeek: 0,
  attendancePct: 0,
};

function match(user: StaffLogin, people: Employee[]): Employee | undefined {
  const email = user.email.toLowerCase();
  return people.find((person) => String(person.userId ?? '') === String(user.id) || String(person.id) === String(user.id) || person.email?.toLowerCase() === email);
}

/** Auth accounts are the people. Snapshot rows only add attendance and performance. */
export function mergeTeam(users: StaffLogin[], saved: Employee[]): Employee[] {
  const visible = users.map((user) => {
    const extra = match(user, saved);
    return {
      ...emptyShift,
      ...extra,
      id: user.id,
      userId: user.id,
      name: user.name,
      role: extra?.role || user.title || roleLabel(user.role),
      roleId: user.role,
      station: extra?.station || user.title || roleLabel(user.role),
      location: user.location?.trim() || extra?.location || '',
      email: user.email,
      storeId: user.storeId,
      mobile: user.mobile || extra?.mobile,
      address: user.address || extra?.address,
      status: user.disabled ? 'Off today' : (extra?.status ?? 'Off today'),
      disabled: user.disabled,
    };
  });
  const ids = new Set(visible.flatMap((person) => [person.id, person.userId].filter((id) => id != null).map((id) => String(id))));
  const emails = new Set(visible.map((person) => person.email?.toLowerCase()).filter((email): email is string => !!email));
  const kept = saved.filter((person) => {
    if (person.email && emails.has(person.email.toLowerCase())) return false;
    const keys = [person.id, person.userId].filter((id) => id != null && id !== '').map((id) => String(id));
    return keys.length > 0 && keys.every((id) => !ids.has(id));
  });
  return [...visible, ...kept];
}
