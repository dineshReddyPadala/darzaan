import { differenceInCalendarDays, parseISO } from 'date-fns';
import { capacityStart, dailyLoadPct } from '../data/capacity';
import { todayPlus } from './format';

export type CapacityLevel = 'available' | 'busy' | 'near' | 'full' | 'overloaded';

/**
 * Bright, clearly separated fills, each with text that passes WCAG AA (4.5:1 or better):
 * Available 6.6:1 · Busy 7.2:1 · Near 6.5:1 · Full 5.6:1 · Overloaded (white on #B42323) 6.5:1.
 * Each fill also carries an edge in its own text colour so pale cells still read against white (3:1 for shapes).
 */
export const levelMeta: Record<CapacityLevel, {label: string;cell: string;dot: string;}> = {
  available: { label: 'Available', cell: 'bg-heat-0 text-[#14532D] ring-1 ring-inset ring-[#14532D]/35', dot: 'bg-heat-0 ring-1 ring-inset ring-[#14532D]' },
  busy: { label: 'Busy', cell: 'bg-heat-1 text-[#713F12] ring-1 ring-inset ring-[#713F12]/35', dot: 'bg-heat-1 ring-1 ring-inset ring-[#713F12]' },
  near: { label: 'Near capacity', cell: 'bg-heat-2 text-[#7C2D12] ring-1 ring-inset ring-[#7C2D12]/35', dot: 'bg-heat-2 ring-1 ring-inset ring-[#7C2D12]' },
  full: { label: 'Full', cell: 'bg-heat-3 text-[#7F1D1D] ring-1 ring-inset ring-[#7F1D1D]/35', dot: 'bg-heat-3 ring-1 ring-inset ring-[#7F1D1D]' },
  overloaded: { label: 'Overloaded', cell: 'bg-heat-4 text-white', dot: 'bg-heat-4' }
};

export function loadForDate(iso: string): number | null {
  const idx = differenceInCalendarDays(parseISO(iso), parseISO(capacityStart));
  if (idx < 0 || idx >= dailyLoadPct.length) return null;
  return dailyLoadPct[idx];
}

/** From this load the workshop is full: booking a regular garment needs a reason. */
export const FULL_PCT = 95;
export function isFullDay(iso: string): boolean {
  return (loadForDate(iso) ?? 0) >= FULL_PCT;
}

export function levelFor(pct: number): CapacityLevel {
  if (pct > 100) return 'overloaded';
  if (pct >= 95) return 'full';
  if (pct >= 85) return 'near';
  if (pct >= 65) return 'busy';
  return 'available';
}

export function suggestDeliveryDate(minDays: number): string {
  for (let d = minDays; d < minDays + 40; d++) {
    const iso = todayPlus(d);
    const load = loadForDate(iso);
    if (load !== null && load < 85) return iso;
  }
  return todayPlus(minDays);
}