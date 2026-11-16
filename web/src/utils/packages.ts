import { differenceInMinutes, parseISO } from 'date-fns';
import type { Order, ReworkPriority, Garment } from '../types';
import type { PackageItem, PackageRecord, PackageStatus } from '../types/packaging';
import { customerAddresses, STORES } from '../data/packages';
import type { Tone } from './status';
import { daysUntil, TODAY } from './format';
import { garmentDue } from './orders';

/** Green done · forest packed/assigned · blue moving · brass waiting · clay problem. */
export const packageStatusTone: Record<PackageStatus, Tone> = {
  'Packaging assigned': 'neutral',
  'Ready for dispatch': 'brand',
  'Assigned to runner': 'brand',
  'Picked up': 'info',
  'In transit': 'info',
  Delivered: 'success',
  Problem: 'critical'
};

export const packageStatusLabel: Record<PackageStatus, string> = {
  'Packaging assigned': 'Ready to pack',
  'Ready for dispatch': 'Packed',
  'Assigned to runner': 'Out for delivery',
  'Picked up': 'Out for delivery',
  'In transit': 'Out for delivery',
  Delivered: 'Delivered',
  Problem: 'Needs attention'
};

export const isClosed = (s: PackageStatus) => s === 'Delivered';
export const isMoving = (s: PackageStatus) => s === 'Picked up' || s === 'In transit';
/** With a driver, not yet delivered. */
export const onTheRoad = (s: PackageStatus) => s === 'Assigned to runner' || isMoving(s);

/** Code the customer gives the driver at the door. Derived for seed data; demo only. */
export const otpFor = (p: PackageRecord) => p.otp ?? p.orderId.replace(/\D/g, '').slice(-4).padStart(4, '0');

/* ------------------------------------------------------------------ */
/* One status everyone sees                                            */
/* ------------------------------------------------------------------ */

export type DeliveryState = 'ready' | 'packing' | 'packed' | 'transit' | 'delivered' | 'attention';
export const deliveryStates: DeliveryState[] = ['ready', 'packing', 'packed', 'transit', 'delivered', 'attention'];

export function deliveryState(p: PackageRecord): DeliveryState {
  if (p.discrepancy && !p.discrepancy.resolvedAt) return 'attention';
  switch (p.status) {
    case 'Problem':return 'attention';
    case 'Packaging assigned':return p.checked?.length ? 'packing' : 'ready';
    case 'Ready for dispatch':return 'packed';
    case 'Assigned to runner':
    case 'Picked up':
    case 'In transit':return 'transit';
    default:return 'delivered';
  }
}

export const deliveryStateLabel: Record<DeliveryState, string> = {
  ready: 'Ready to pack', packing: 'Packing', packed: 'Packed', transit: 'Out for delivery', delivered: 'Delivered', attention: 'Needs attention'
};
export const deliveryStateTone: Record<DeliveryState, Tone> = {
  ready: 'neutral', packing: 'attention', packed: 'brand', transit: 'info', delivered: 'success', attention: 'critical'
};

/** Past its deliver-by date and still not delivered. */
export const isLate = (p: PackageRecord) => p.status !== 'Delivered' && daysUntil(p.deadline) < 0;

/** Still at the packing bench (Logistics can open the checklist). */
export const atPacking = (p: PackageRecord) => p.status === 'Packaging assigned' || p.status === 'Problem' && p.problem?.from === 'Packaging assigned';

/* ------------------------------------------------------------------ */
/* Dispatch flags                                                      */
/* ------------------------------------------------------------------ */

const minutesSince = (iso?: string) => iso ? differenceInMinutes(TODAY, parseISO(iso)) : 0;

export type FlagKind = 'not-picked' | 'not-arrived' | 'wrong-scan';
export interface Flag {kind: FlagKind;label: string;}

/** A scan at the wrong destination that Logistics hasn't reviewed yet. */
export function openWrongScan(p: PackageRecord) {
  if (p.status === 'Delivered') return undefined;
  for (let i = p.history.length - 1; i >= 0; i--) {
    const e = p.history[i];
    if (e.reviewed) return undefined;
    if (e.exception) return e;
  }
  return undefined;
}

export function flagsFor(p: PackageRecord): Flag[] {
  const out: Flag[] = [];
  if (p.status === 'Assigned to runner' && minutesSince(p.assignedAt) > 60) out.push({ kind: 'not-picked', label: 'Not scanned at pickup' });
  if (isMoving(p.status) && (daysUntil(p.deadline) < 0 || minutesSince(p.pickedUpAt) > 180)) out.push({ kind: 'not-arrived', label: 'Not at destination yet' });
  const wrong = openWrongScan(p);
  if (wrong) out.push({ kind: 'wrong-scan', label: `Scanned at ${wrong.where}` });
  return out;
}

/** An expected package past its deadline that hasn't been delivered. */
export const notArrived = (p: PackageRecord) => isMoving(p.status) && daysUntil(p.deadline) < 0;

/* ------------------------------------------------------------------ */
/* Packing                                                             */
/* ------------------------------------------------------------------ */

export const itemQty = (i: PackageItem) => i.quantity ?? 1;
/** Garment pieces expected in the box (a lehenga set counts as 3). */
export const pieceCount = (p: PackageRecord) => p.items.filter((i) => (i.category ?? 'garment') === 'garment').reduce((s, i) => s + itemQty(i), 0);
export const garmentNames = (p: PackageRecord) => p.items.filter((i) => (i.category ?? 'garment') === 'garment').map((i) => i.label).join(', ');

/** The pieces a finished garment is made of, from its sub-category. */
export function piecesFor(subCategory: string): string[] {
  const s = subCategory.toLowerCase();
  if (s.includes('lehenga')) return ['Lehenga skirt', 'Blouse', 'Dupatta'];
  if (s.includes('sharara')) return ['Kurta', 'Sharara', 'Dupatta'];
  if (s.includes('gharara')) return ['Kurta', 'Gharara', 'Dupatta'];
  if (s.includes('kurta set') || s.includes('suit')) return ['Kurta', 'Pants', 'Dupatta'];
  if (s.includes('anarkali') && !s.includes('basic')) return ['Anarkali', 'Churidar', 'Dupatta'];
  if (s.includes('co-ord')) return ['Top', 'Bottom'];
  if (s.includes('blazer with pant')) return ['Blazer', 'Pant'];
  return [subCategory];
}

/** The packing checklist, built from what was recorded at intake. Extras go in the order's first package. */
export function checklistFor(o: Order, garmentIds: string[], withExtras: boolean): PackageItem[] {
  const garments = o.garments.filter((g) => garmentIds.includes(g.id));
  const items: PackageItem[] = garments.map((g) => {
    const pieces = piecesFor(g.subCategory);
    return { garmentId: g.id, label: g.subCategory, photo: g.photos[0], category: 'garment', quantity: pieces.length, note: pieces.length > 1 ? pieces.join(', ') : undefined };
  });
  garments.forEach((g) => {
    if (g.fabric.source !== 'Customer') return;
    g.fabric.pieces.forEach((fp) => items.push({ garmentId: `${g.id}-${fp.id}`, label: `Leftover fabric · ${fp.material}`, category: 'fabric', quantity: 1, note: 'Customer’s own — return' }));
  });
  if (withExtras) (o.returnItems ?? []).forEach((r) => items.push({ garmentId: r.id, label: r.name, category: r.kind, quantity: r.quantity, note: r.note }));
  return items;
}

/** Steps on a package's progress line. */
export const progressSteps: PackageStatus[] = ['Packaging assigned', 'Ready for dispatch', 'Assigned to runner', 'Delivered'];

/** Where each persona lands when scanning from the top bar. */
export function scanHomeFor(role: string): string | null {
  if (role === 'runner') return '/route';
  if (role === 'logistics') return '/packing';
  if (role === 'admin' || role === 'store_manager' || role === 'salesperson') return '/receiving';
  return null;
}

/** Logistics opens the packing form while it's at the bench, the shipment page after. */
export const shipmentHref = (p: PackageRecord) => atPacking(p) ? `/packing/${p.id}` : `/shipments/${p.id}`;

/** Garments the Production Assistant can put in a new package: past ironing and not in a package yet. */
export const readyToPackage = (g: Garment) => g.stage === 'packaging' && !g.packageId;

/** PKG-10342-A, -B… one letter per package of the order. */
export function nextPackageId(orderId: string, existing: PackageRecord[]): string {
  const n = existing.filter((p) => p.orderId === orderId).length;
  return `PKG-${orderId.replace('DZ-', '')}-${String.fromCharCode(65 + n)}`;
}

export function storeDestination(name: string): PackageRecord['destination'] {
  const s = STORES.find((x) => x.name === name) ?? STORES[0];
  return { kind: 'store', name: s.name, detail: s.detail };
}

export function destinationFor(o: Order, customerName: string): PackageRecord['destination'] {
  if (o.deliveryMode === 'Home delivery') return { kind: 'customer', name: customerName, detail: customerAddresses[o.customerId] ?? 'Address on file' };
  return storeDestination(`${o.store} Store`);
}

export function orderPriority(o: Order, g?: Garment): ReworkPriority {
  const d = daysUntil(g ? garmentDue(o, g) : o.deliveryDate);
  if (o.priority === 'Express' || d <= 0) return 'High';
  return d <= 2 ? 'Medium' : 'Low';
}

/** The last real status change — what a tracking list shows as "Latest update". */
export function latestUpdate(p: PackageRecord) {
  return [...p.history].reverse().find((e) => !e.scanOnly) ?? p.history[p.history.length - 1];
}

/** Short destination line: "Khan Market Store" or "Home · Nikhil Rao". */
export const destinationLine = (p: PackageRecord) => p.destination.kind === 'store' ? p.destination.name : `Home · ${p.destination.name}`;