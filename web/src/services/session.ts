import type { Role } from '../types';

export interface SessionUser {
  id: number;
  email: string;
  role: Role;
  name: string;
  title: string;
  location: string;
  store?: string;
  storeId?: number;
  /** True until the person replaces the temporary password from onboarding. */
  mustChangePassword?: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

const KEY = 'darzaan.session';

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as Session : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(KEY);
}
