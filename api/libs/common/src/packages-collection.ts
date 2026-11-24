import { HttpStatus } from '@nestjs/common';
import { formatPackageCode } from './display-ids';
import { AppError } from './http';
import { asArray, isRecord, text } from './scope';

const CLOSED_STATUSES = new Set(['Delivered', 'Problem']);

function isOpenPackage(pkg: Record<string, unknown>): boolean {
  const status = text(pkg.status);
  return Boolean(status && !CLOSED_STATUSES.has(status));
}

function garmentIdSet(pkg: Record<string, unknown>): string {
  const ids = asArray(pkg.items)
    .map((item) => {
      const category = text(item.category, 'garment');
      if (category !== 'garment') return '';
      return String(item.garmentId ?? '').trim();
    })
    .filter(Boolean)
    .sort();
  return ids.join(',');
}

/** Validate package list before snapshot save: dedupe open packages, normalize store receiving. */
export function validateAndNormalizePackages(
  list: Record<string, unknown>[],
  actor: { name: string },
): Record<string, unknown>[] {
  const next = list.map((pkg) => {
    const copy = { ...pkg };
    if (text(copy.status) === 'Delivered') {
      const dest = isRecord(copy.destination) ? copy.destination : null;
      if (dest && text(dest.kind) === 'store' && !text(copy.receivedBy)) {
        copy.receivedBy = actor.name;
      }
    }
    return copy;
  });

  for (let i = 0; i < next.length; i++) {
    const pkg = next[i];
    if (!isOpenPackage(pkg)) continue;
    const orderId = text(pkg.orderId);
    const set = garmentIdSet(pkg);
    if (!orderId || !set) continue;
    for (let j = 0; j < next.length; j++) {
      if (i === j) continue;
      const other = next[j];
      if (!isOpenPackage(other)) continue;
      if (text(other.orderId) !== orderId) continue;
      if (garmentIdSet(other) !== set) continue;
      const code = formatPackageCode(other.id ?? other.packageCode, orderId);
      throw new AppError(HttpStatus.CONFLICT, `An open package already exists (${code})`);
    }
  }

  return next;
}