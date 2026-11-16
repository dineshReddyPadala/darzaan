import type { Role, RoleRecord, StaffLogin } from '../types';
import { request } from './http';
import type { SessionUser } from './session';
import { writeSession } from './session';

export async function login(email: string, password: string): Promise<SessionUser> {
  const body = await request<{ accessToken: string; refreshToken: string; user: SessionUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  writeSession(body);
  return body.user;
}

function idText(value: unknown): string {
  return value == null ? '' : String(value);
}

/** Keep storeId numeric and turn entity ids into strings the desk already renders. */
function normalizeDoc(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeDoc);
  if (!value || typeof value !== 'object') return value;
  const record: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'storeId') {
      const id = typeof item === 'number' ? item : typeof item === 'string' && /^[1-9]\d*$/.test(item) ? Number(item) : null;
      record[key] = id ?? undefined;
    } else if ((key === 'id' || key.endsWith('Id')) && (typeof item === 'number' || typeof item === 'string')) {
      record[key] = idText(item);
    } else {
      record[key] = normalizeDoc(item);
    }
  }
  return record;
}

export function getState(): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>('/api/v1/state').then((state) => {
    if (Array.isArray(state.orders)) state.orders = state.orders.map(normalizeDoc);
    if (Array.isArray(state.customers)) state.customers = state.customers.map(normalizeDoc);
    return state;
  });
}

export function getRoles(): Promise<Record<string, RoleRecord>> {
  return request('/api/v1/roles');
}

export function getCatalog(): Promise<unknown> {
  return request('/api/v1/catalog');
}

export function listUsers(): Promise<StaffLogin[]> {
  return request('/api/v1/auth/users');
}

export function listProductionAssistants(): Promise<{ id: number; name: string; role: Role; title: string; location: string; storeId?: number }[]> {
  return request('/api/v1/auth/production-assistants');
}

export function createUser(body: {
  email: string;
  name: string;
  roleId: Role;
  title?: string;
  location?: string;
  store?: string;
  storeId?: number;
  mobile?: string;
  address?: string;
  password?: string;
}): Promise<{ user: StaffLogin; password: string; emailed: boolean }> {
  return request('/api/v1/auth/users', { method: 'POST', body: JSON.stringify(body) });
}

export function forgotPassword(email: string): Promise<{ ok: true }> {
  return request('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export function resetPassword(token: string, password: string): Promise<{ ok: true }> {
  return request('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<SessionUser> {
  return request<{ accessToken: string; refreshToken: string; user: SessionUser }>('/api/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then((body) => {
    writeSession(body);
    return body.user;
  });
}

export function updateUser(
  id: string | number,
  body: { name?: string; roleId?: Role; title?: string; location?: string; store?: string | null; storeId?: number | null; mobile?: string; address?: string; disabled?: boolean },
): Promise<StaffLogin> {
  return request(`/api/v1/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export function setUserPassword(id: string | number, password?: string): Promise<{ user: StaffLogin; password: string }> {
  return request(`/api/v1/auth/users/${id}/password`, { method: 'POST', body: JSON.stringify({ password }) });
}

export function importState(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return request('/api/v1/state/import', { method: 'POST', body: JSON.stringify(body) });
}

function numericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) return Number(value);
  return null;
}

/** The server assigns the entity id. A client token is only the idempotency key. */
function withoutInventedId(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const record = { ...(body as Record<string, unknown>) };
  const id = numericId(record.id);
  if (id) record.id = id;
  else delete record.id;
  return record;
}

export function createOrder(order: unknown): Promise<unknown> {
  return request('/api/v1/orders', { method: 'POST', body: JSON.stringify(withoutInventedId(order)), idempotencyKey: crypto.randomUUID() }).then(normalizeDoc);
}

export function updateOrder(order: unknown): Promise<unknown> {
  const id = typeof order === 'object' && order && 'id' in order ? String((order as { id: string }).id) : '';
  return request(`/api/v1/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(order),
    idempotencyKey: `${id}:${hash(JSON.stringify(order))}`,
  }).then(normalizeDoc);
}

export function saveCustomer(customer: unknown, creating: boolean): Promise<unknown> {
  const id = typeof customer === 'object' && customer && 'id' in customer ? String((customer as { id: string | number }).id) : '';
  const body = creating ? withoutInventedId(customer) : customer;
  return request(creating ? '/api/v1/customers' : `/api/v1/customers/${id}`, {
    method: creating ? 'POST' : 'PATCH',
    body: JSON.stringify(body),
    idempotencyKey: creating ? crypto.randomUUID() : `${id}:${hash(JSON.stringify(body))}`,
  }).then(normalizeDoc);
}

export function putCollection(key: string, body: unknown): Promise<unknown> {
  return request(`/api/v1/collections/${key}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function listNotifications(): Promise<unknown[]> {
  return request('/api/v1/notifications');
}

export function createNotification(body: unknown): Promise<unknown> {
  return request('/api/v1/notifications', { method: 'POST', body: JSON.stringify(body) });
}

export function markNotification(id: string): Promise<unknown> {
  return request(`/api/v1/notifications/${id}/read`, { method: 'POST', body: '{}' });
}

export function markAllNotifications(): Promise<unknown> {
  return request('/api/v1/notifications/read-all', { method: 'POST', body: '{}' });
}

export function removeNotification(id: string): Promise<unknown> {
  return request(`/api/v1/notifications/${id}`, { method: 'DELETE' });
}

export interface AuditEntry {
  id: string;
  action: string;
  at: string;
  actor: { id: string; name: string; email: string } | null;
  meta: Record<string, unknown> | null;
}

export function listAudit(query: { cursor?: string; take?: number } = {}): Promise<{ items: AuditEntry[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.take) params.set('take', String(query.take));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request(`/api/v1/auth/audit${suffix}`);
}

export function sendMessage(body: { to: string; channel: 'WhatsApp' | 'SMS' | 'Email'; body: string }): Promise<unknown> {
  return request('/api/v1/notifications/messages', { method: 'POST', body: JSON.stringify(body) });
}

export function publicOrder(id: string): Promise<{ order: unknown; customer: { id: string; name: string } }> {
  return request(`/api/v1/public/orders/${id}`);
}

export interface ConsultationAppointment {
  reference: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  mode: string;
  date: string;
  time: string;
  notes: string;
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
}

export interface ConsultationSlot {
  time: string;
  available: boolean;
  reference?: string;
  name?: string;
}

export function listConsultationAppointments(): Promise<{ appointments: ConsultationAppointment[] }> {
  return request('/api/v1/consultations/appointments');
}

export function listFranchiseLeads(): Promise<{ leads: { name: string; phone: string; profile: string; area: string; createdAt: string }[] }> {
  return request('/api/v1/consultations/franchise');
}

export function consultationBoard(date: string): Promise<{ date: string; modes: { mode: string; slots: ConsultationSlot[] }[] }> {
  return request(`/api/v1/consultations/slots?date=${encodeURIComponent(date)}`);
}

export function setConsultationStatus(reference: string, status: ConsultationAppointment['status']): Promise<{ ok: boolean }> {
  return request(`/api/v1/consultations/appointments/${encodeURIComponent(reference)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function publicBooking(body: unknown): Promise<{ draftId: string; returning: boolean }> {
  return request('/api/v1/public/bookings', { method: 'POST', body: JSON.stringify(body) });
}

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = Math.imul(31, h) + value.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}
