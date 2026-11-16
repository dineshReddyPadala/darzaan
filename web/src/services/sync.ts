import type { Employee, RoleRecord } from '../types';
import { demoMode } from '../utils/demo';
import { setRoleCatalog } from '../utils/roles';
import { mergeTeam } from '../utils/team-directory';
import { getState, listNotifications, listUsers, putCollection } from './api';
import { apiMode } from './mode';
import { readSession } from './session';

let bag: Record<string, unknown> | null = null;
const timers = new Map<string, number>();

export function readHydration<T>(key: string): T | undefined {
  if (!bag || !(key in bag)) return undefined;
  const value = bag[key];
  if (value == null) return undefined;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return undefined;
  return value as T;
}

/** Saved workspace value, or an empty list when the API has no rows. Sample files stay on the demo screens. */
export function storedOrSample<T>(key: string, sample: T): T {
  const saved = readHydration<T>(key);
  if (saved !== undefined) return saved;
  if (apiMode && !demoMode && Array.isArray(sample)) return [] as T;
  return sample;
}

export function remember(key: string, value: unknown): void {
  bag = { ...(bag ?? {}), [key]: value };
}

export async function loadWorkspace(): Promise<void> {
  if (!apiMode || !readSession()) return;
  const state = await getState();
  let notifications: unknown[] = [];
  try {
    notifications = await listNotifications();
  } catch {
    /* the inbox can load later; the rest of the desk still opens */
  }
  bag = { ...state, notifications };
  setRoleCatalog(state.roles as Record<string, RoleRecord> | undefined);
  try {
    const users = await listUsers();
    const saved = Array.isArray(bag.team) ? bag.team as Employee[] : [];
    bag = { ...bag, team: mergeTeam(users, saved) };
  } catch {
    /* a non-admin session cannot list logins; the snapshot team remains */
  }
}

export function applyRoleCatalog(catalog: Record<string, RoleRecord>): void {
  remember('roles', catalog);
  setRoleCatalog(catalog);
}

export function scheduleSave(key: string, value: unknown): void {
  if (!apiMode || demoMode || !readSession()) return;
  remember(key, value);
  const previous = timers.get(key);
  if (previous) window.clearTimeout(previous);
  timers.set(key, window.setTimeout(() => {
    void putCollection(key, value).catch(() => undefined);
  }, 300));
}
