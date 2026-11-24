import type { Employee } from '../types';

/** Workload bar applies only to workshop production roles (QA T-02). */
export function showsProductionWorkload(person: Employee): boolean {
  if (person.station === 'Store' || person.station === 'Accounts') return false;
  if (person.role === 'Accountant' || person.role === 'Runner') return false;
  return person.capacity > 0;
}

export function employeeLocationLabel(person: Employee): string {
  const loc = (person.location ?? '').trim();
  if (!loc || loc === 'Darzaan') return '—';
  return loc;
}