import { asArray, entityId, isRecord, text } from './scope';
import { formatCustomerCode, formatOrderCode, formatPackageCode } from './display-ids';

function ensureId(doc: Record<string, unknown>, rowId?: number): void {
  if (rowId && !entityId(doc.id)) doc.id = rowId;
}

export function enrichCustomer(
  customer: Record<string, unknown>,
  rowId?: number,
  columnDesigner?: string,
): Record<string, unknown> {
  const next = { ...customer };
  ensureId(next, rowId);
  if (columnDesigner && !text(next.designer)) next.designer = columnDesigner;
  const id = entityId(next.id) ?? rowId;
  if (id) {
    next.customerCode = formatCustomerCode(id);
    next.id = String(id);
  }
  return next;
}

export function enrichOrder(order: Record<string, unknown>, rowId?: number, rowCustomerId?: number): Record<string, unknown> {
  const next = { ...order };
  ensureId(next, rowId);
  if (rowCustomerId && !entityId(next.customerId)) next.customerId = rowCustomerId;
  const orderId = entityId(next.id) ?? rowId;
  if (orderId) {
    next.orderCode = formatOrderCode(orderId);
    next.id = String(orderId);
  }
  const customerId = entityId(next.customerId) ?? rowCustomerId;
  if (customerId) {
    next.customerCode = formatCustomerCode(customerId);
    next.customerId = String(customerId);
  }
  return next;
}

export function enrichPackage(pkg: Record<string, unknown>): Record<string, unknown> {
  const next = { ...pkg };
  const orderId = text(next.orderId);
  next.packageCode = formatPackageCode(next.id ?? next.packageCode, orderId);
  if (orderId) next.orderCode = formatOrderCode(orderId);
  return next;
}

export function enrichPackages(list: unknown): Record<string, unknown>[] {
  return asArray(list).map(enrichPackage);
}