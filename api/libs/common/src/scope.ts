import type { DataScope } from './roles';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

export function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

export function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/** Positive integer entity id. Numeric strings count; invented ids such as loc- or U- do not. */
export function entityId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

/** String form of an id that may already be a number. */
export function label(value: unknown, fallback = ''): string {
  const id = entityId(value);
  if (id) return String(id);
  return typeof value === 'string' ? value : fallback;
}

export function presentOrder(order: Record<string, unknown>, scope: DataScope): Record<string, unknown> {
  const next = structuredClone(order);
  if (!scope.prices) {
    next.discount = 0;
    next.deliveryCharge = 0;
    next.garments = asArray(next.garments).map((garment) => {
      const copy = { ...garment };
      delete copy.price;
      delete copy.customQuote;
      return copy;
    });
  }
  if (!scope.payments) next.payments = [];
  return next;
}

export function presentCustomer(customer: Record<string, unknown>, scope: DataScope): Record<string, unknown> {
  if (scope.contacts) return customer;
  const next = { ...customer };
  next.mobile = '';
  next.whatsapp = '';
  next.email = '';
  return next;
}

/** Keep money and contact fields the caller is not allowed to change. */
export function mergeProtectedOrder(existing: Record<string, unknown> | null, incoming: Record<string, unknown>, scope: DataScope): Record<string, unknown> {
  if (!existing) return incoming;
  const next = structuredClone(incoming);
  if (!scope.prices) {
    next.discount = existing.discount;
    next.deliveryCharge = existing.deliveryCharge;
    const previous = new Map(asArray(existing.garments).map((garment) => [text(garment.id), garment]));
    next.garments = asArray(next.garments).map((garment) => {
      const prior = previous.get(text(garment.id));
      if (!prior) return garment;
      return { ...garment, price: prior.price, customQuote: prior.customQuote };
    });
  }
  if (!scope.payments) next.payments = existing.payments ?? [];
  return next;
}

export function namesMatch(value: unknown, name: string): boolean {
  const who = name.trim().toLowerCase();
  return who.length > 0 && typeof value === 'string' && value.trim().toLowerCase() === who;
}

/** An order is this person's work when a task or the current garment is assigned to them. */
export function orderAssignedTo(order: Record<string, unknown>, name: string): boolean {
  if (asArray(order.tasks).some((task) => namesMatch(task.assignee, name))) return true;
  return asArray(order.garments).some((garment) => namesMatch(garment.assignee, name));
}

/** Desk copy: the order stays, other workers' tasks do not. */
export function presentAssignedOrder(order: Record<string, unknown>, name: string): Record<string, unknown> {
  return { ...order, tasks: asArray(order.tasks).filter((task) => namesMatch(task.assignee, name)) };
}

/**
 * A tailor may change the status of their own tasks.
 * Every other task, and the rest of the order, stays as it was saved.
 */
export function mergeAssignedOrder(existing: Record<string, unknown>, incoming: Record<string, unknown>, name: string): Record<string, unknown> {
  const incomingById = new Map(asArray(incoming.tasks).map((task) => [text(task.id), task]));
  const tasks = asArray(existing.tasks).map((task) => {
    if (!namesMatch(task.assignee, name)) return task;
    const next = incomingById.get(text(task.id));
    if (!next) return task;
    return {
      ...task,
      status: typeof next.status === 'string' ? next.status : task.status,
      updatedAt: typeof next.updatedAt === 'string' ? next.updatedAt : task.updatedAt,
      updatedBy: typeof next.updatedBy === 'string' ? next.updatedBy : task.updatedBy,
    };
  });
  return { ...existing, tasks };
}

export function mergeProtectedCustomer(existing: Record<string, unknown> | null, incoming: Record<string, unknown>, scope: DataScope): Record<string, unknown> {
  if (!existing || scope.contacts) return incoming;
  return { ...incoming, mobile: existing.mobile, whatsapp: existing.whatsapp, email: existing.email };
}
