import { apiUrl } from './mode';
import { clearSession, readSession, writeSession } from './session';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function refresh(): Promise<boolean> {
  const session = readSession();
  if (!session) return false;
  const response = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) {
    clearSession();
    return false;
  }
  const body = await response.json() as { accessToken: string; refreshToken: string; user: SessionUser };
  writeSession({ accessToken: body.accessToken, refreshToken: body.refreshToken, user: body.user });
  return true;
}

type SessionUser = import('./session').SessionUser;

export async function request<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}, retry = true): Promise<T> {
  const session = readSession();
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (session) headers.set('authorization', `Bearer ${session.accessToken}`);
  if (init.idempotencyKey) headers.set('Idempotency-Key', init.idempotencyKey);
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  if (response.status === 401 && retry && session && !path.startsWith('/api/v1/auth/login')) {
    const ok = await refresh();
    if (ok) return request<T>(path, init, false);
  }
  const text = await response.text();
  const payload = text ? JSON.parse(text) as { error?: { message?: string } } : {};
  if (!response.ok) throw new ApiError(payload.error?.message ?? 'Could not save. Try again.', response.status);
  return payload as T;
}
