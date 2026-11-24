/** Presentation ids for API numeric keys (live) while seed data keeps DZ-/C-/PKG- as-is. */

function bareNumber(id: string): number | null {
  const s = String(id).trim();
  if (/^[1-9]\d*$/.test(s)) return Number(s);
  return null;
}

export function formatOrderId(id: string): string {
  const s = String(id).trim();
  if (/^DZ-/i.test(s)) return s;
  const n = bareNumber(s);
  if (n === null) return s;
  return `DZ-${n >= 10000 ? n : 10000 + n}`;
}

export function formatCustomerId(id: string): string {
  const s = String(id).trim();
  if (/^C-/i.test(s)) return s;
  const n = bareNumber(s);
  if (n === null) return s;
  return `C-${n >= 1000 ? n : 1000 + n}`;
}

export function formatPackageId(id: string, orderId?: string): string {
  const s = String(id).trim();
  if (/^PKG-/i.test(s)) return s;
  const n = bareNumber(s);
  if (n !== null && orderId) {
    const ord = formatOrderId(orderId).replace(/^DZ-/i, '');
    return `PKG-${ord}-${String.fromCharCode(65 + (n % 26))}`;
  }
  if (/^PKG-/i.test(s)) return s;
  return s;
}

export function formatGarmentTag(orderId: string, garmentId: string): string {
  const o = formatOrderId(orderId);
  const g = String(garmentId).trim();
  if (/^G\d/i.test(g)) return `${o}-${g}`;
  return `${o}-G${g}`;
}

/** Match user search against raw or formatted ids. */
export function idMatchesQuery(rawId: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const raw = String(rawId).toLowerCase();
  if (raw.includes(q)) return true;
  const formatted =
    /^c/i.test(raw) || bareNumber(raw) !== null && String(raw).length <= 4
      ? formatCustomerId(raw).toLowerCase()
      : formatOrderId(raw).toLowerCase();
  return formatted.includes(q);
}