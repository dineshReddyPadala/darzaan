/** Presentation ids for numeric DB keys (aligned with staff web displayIds). */

function bareNumber(id: string): number | null {
  const s = String(id).trim();
  if (/^[1-9]\d*$/.test(s)) return Number(s);
  return null;
}

export function formatOrderCode(id: unknown): string {
  const s = String(id ?? '').trim();
  if (/^DZ-/i.test(s)) return s;
  const n = bareNumber(s);
  if (n === null) return s;
  return `DZ-${n >= 10000 ? n : 10000 + n}`;
}

export function formatCustomerCode(id: unknown): string {
  const s = String(id ?? '').trim();
  if (/^C-/i.test(s)) return s;
  const n = bareNumber(s);
  if (n === null) return s;
  return `C-${n >= 1000 ? n : 1000 + n}`;
}

export function formatPackageCode(packageId: unknown, orderId?: unknown): string {
  const s = String(packageId ?? '').trim();
  if (/^PKG-/i.test(s)) return s;
  if (orderId) {
    const ord = formatOrderCode(orderId).replace(/^DZ-/i, '');
    const n = bareNumber(s);
    const suffix = n !== null ? String.fromCharCode(65 + (n % 26)) : 'A';
    if (ord) return `PKG-${ord}-${suffix}`;
  }
  return s;
}