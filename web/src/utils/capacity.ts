import { differenceInCalendarDays, parseISO } from 'date-fns';
import { capacityStart, dailyLoadPct } from '../data/capacity';
import { readStoreSettings } from '../data/store-settings';
import type { Order } from '../types';
import { readSession } from '../services/session';
import { isActive } from './orders';
import { todayPlus } from './format';

export type CapacityLevel = 'available' | 'busy' | 'near' | 'full' | 'overloaded';

/** Garment slots the workshop can finish in one day (Settings → Workflow). */
export const DEFAULT_DAILY_GARMENT_CAPACITY = 12;

export function dailyGarmentCapacityFromSettings(): number {
  const settings = readStoreSettings();
  const session = readSession();
  const key = session?.user?.storeId != null ? String(session.user.storeId) : Object.keys(settings)[0];
  const cap = key ? settings[key]?.workflow?.dailyGarmentCapacity : undefined;
  if (typeof cap === 'number' && cap >= 1 && cap <= 999) return cap;
  return DEFAULT_DAILY_GARMENT_CAPACITY;
}

export const levelMeta: Record<CapacityLevel, {label: string;cell: string;dot: string;}> = {
  available: { label: 'Available', cell: 'bg-heat-0 text-[#14532D] ring-1 ring-inset ring-[#14532D]/35', dot: 'bg-heat-0 ring-1 ring-inset ring-[#14532D]' },
  busy: { label: 'Busy', cell: 'bg-heat-1 text-[#713F12] ring-1 ring-inset ring-[#713F12]/35', dot: 'bg-heat-1 ring-1 ring-inset ring-[#713F12]' },
  near: { label: 'Near capacity', cell: 'bg-heat-2 text-[#7C2D12] ring-1 ring-inset ring-[#7C2D12]/35', dot: 'bg-heat-2 ring-1 ring-inset ring-[#7C2D12]' },
  full: { label: 'Full', cell: 'bg-heat-3 text-[#7F1D1D] ring-1 ring-inset ring-[#7F1D1D]/35', dot: 'bg-heat-3 ring-1 ring-inset ring-[#7F1D1D]' },
  overloaded: { label: 'Overloaded', cell: 'bg-heat-4 text-white', dot: 'bg-heat-4' }
};

function bookedGarmentDays(iso: string, orders: Order[]): number {
  return orders.filter((o) => isActive(o) && o.deliveryDate === iso).reduce((sum, o) => sum + o.garments.length, 0);
}

export function loadForDate(iso: string, orders?: Order[], dailyCapacity?: number): number | null {
  const cap = dailyCapacity ?? dailyGarmentCapacityFromSettings();
  if (orders) {
    const booked = bookedGarmentDays(iso, orders);
    if (cap <= 0) return null;
    return Math.round((booked / cap) * 100);
  }
  const idx = differenceInCalendarDays(parseISO(iso), parseISO(capacityStart));
  if (idx < 0 || idx >= dailyLoadPct.length) return null;
  return dailyLoadPct[idx];
}

export const FULL_PCT = 95;
export function isFullDay(iso: string, orders?: Order[]): boolean {
  return (loadForDate(iso, orders) ?? 0) >= FULL_PCT;
}

export function levelFor(pct: number): CapacityLevel {
  if (pct > 100) return 'overloaded';
  if (pct >= 95) return 'full';
  if (pct >= 85) return 'near';
  if (pct >= 65) return 'busy';
  return 'available';
}

export function suggestDeliveryDate(minDays: number, orders?: Order[]): string {
  for (let d = minDays; d < minDays + 40; d++) {
    const iso = todayPlus(d);
    const load = loadForDate(iso, orders);
    if (load !== null && load < 85) return iso;
  }
  return todayPlus(minDays);
}