import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

// The prototype runs on a fixed "today" so dates, risk and capacity stay coherent.
export const TODAY = new Date(2026, 9, 8, 10, 30);
export const TODAY_ISO = '2026-10-08';

export function nowIso(): string {
  const n = new Date();
  const d = new Date(TODAY);
  d.setHours(n.getHours(), n.getMinutes(), n.getSeconds());
  return format(d, "yyyy-MM-dd'T'HH:mm:ss");
}

export function inr(n: number): string {
  const sign = n < 0 ? '−' : '';
  return `${sign}₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`;
}

function parsedDate(iso?: string): Date | null {
  if (!iso) return null;
  const date = parseISO(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function fmtDate(iso: string, pattern = 'd MMM'): string {
  const date = parsedDate(iso);
  return date ? format(date, pattern) : '—';
}

export function fmtDateTime(iso: string): string {
  const date = parsedDate(iso);
  return date ? format(date, 'd MMM, h:mm a') : '—';
}

export function fmtTime(iso: string): string {
  return format(parseISO(iso), 'h:mm a');
}

export function daysUntil(iso: string): number {
  const date = parsedDate(iso);
  return date ? differenceInCalendarDays(date, TODAY) : 0;
}

export function dueLabel(iso: string): string {
  if (!iso) return 'No date';
  const d = daysUntil(iso);
  if (d < 0) return `${-d}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `In ${d} days`;
}

export function isoPlusDays(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), 'yyyy-MM-dd');
}

export function todayPlus(days: number): string {
  return format(addDays(TODAY, days), 'yyyy-MM-dd');
}

export function initials(name: string): string {
  return name.
  replace(/[^A-Za-z ]/g, '').
  split(' ').
  filter(Boolean).
  slice(0, 2).
  map((p) => p[0].toUpperCase()).
  join('');
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}