import { employees as seedEmployees } from '../data/team';
import { storedOrSample } from '../services/sync';
import type { Employee } from '../types';
import { locationList } from './locations';

export function teamList(): Employee[] {
  return storedOrSample('team', seedEmployees).filter((person) => !person.deletedAt);
}

/** Who each person reports to — store staff to the Store Manager, workshop staff to the Production Head. */
export function reportsTo(e: Employee, people: Employee[] = teamList()): Employee | undefined {
  if (e.role === 'Store Manager' || e.role === 'Production Head' || e.roleId === 'store_manager' || e.roleId === 'production_head') {
    return undefined;
  }
  const workplace = locationList().find((location) => location.name === e.location);
  const isStore = workplace ? workplace.kind === 'store' : e.location.toLowerCase().includes('store');
  const leadRole = isStore ? 'Store Manager' : 'Production Head';
  const leadRoleId = isStore ? 'store_manager' : 'production_head';
  return people.find((x) => x.role === leadRole || x.roleId === leadRoleId);
}

export function directReports(e: Employee, people: Employee[] = teamList()): Employee[] {
  return people.filter((x) => x.id !== e.id && reportsTo(x, people)?.id === e.id);
}

export const statusTone = (s: Employee['status']) => (s === 'On shift' ? 'success' : s === 'On break' ? 'attention' : 'neutral') as 'success' | 'attention' | 'neutral';
