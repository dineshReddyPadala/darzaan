export type IdempotencyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface IdempotencyRow {
  requestHash: string;
  status: IdempotencyStatus;
  responseCode: number | null;
  responseBody: unknown;
  lockedUntil: Date | null;
}

export type IdempotencyDecision =
  | { type: 'replay'; code: number; body: unknown }
  | { type: 'in_progress' }
  | { type: 'mismatch' }
  | { type: 'execute' };

const LOCK_MS = 30_000;

export function decideIdempotency(row: IdempotencyRow | null, requestHash: string, now = new Date()): IdempotencyDecision {
  if (!row) return { type: 'execute' };
  if (row.requestHash !== requestHash) return { type: 'mismatch' };
  if (row.status === 'COMPLETED') return { type: 'replay', code: row.responseCode ?? 200, body: row.responseBody };
  const locked = row.lockedUntil && row.lockedUntil.getTime() > now.getTime();
  if (row.status === 'IN_PROGRESS' && locked) return { type: 'in_progress' };
  return { type: 'execute' };
}

export function lockUntil(now = new Date()): Date {
  return new Date(now.getTime() + LOCK_MS);
}

export function idempotencyExpiry(now = new Date()): Date {
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}
