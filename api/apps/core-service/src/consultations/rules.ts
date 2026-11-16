import { HttpStatus } from '@nestjs/common';
import { AppError } from '../../../../libs/common/src/http';

export const SLOTS = ['10:30 AM', '11:30 AM', '12:30 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'] as const;
export const SERVICES = ['Designer Blouse', 'Bridal & Occasionwear', 'Saree Styling', 'Alterations & Fit', 'Custom Tailoring', 'Something Else'] as const;
export const MODES = ['In-studio consultation', 'Video consultation'] as const;
export const STATUSES = ['requested', 'confirmed', 'cancelled', 'completed'] as const;
export const SLOT_TAKEN = 'This slot was just requested by someone else. Please choose another.';

export type AppointmentStatus = (typeof STATUSES)[number];

/** Next 12 non-Sundays in Asia/Kolkata, starting tomorrow, within 18 days. Matches the marketing form. */
export function availableDates(now = new Date()): string[] {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const start = new Date(Date.UTC(read('year'), read('month') - 1, read('day')));
  const dates: string[] = [];
  for (let offset = 1; offset <= 18 && dates.length < 12; offset += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    if (day.getUTCDay() === 0) continue;
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

export function cleanText(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string') throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid text');
  const text = value.trim();
  if (text.length < min || text.length > max || [...text].some((char) => char.charCodeAt(0) < 32)) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid text');
  }
  return text;
}

export function optionalNotes(value: unknown): string {
  if (value == null || value === '') return '';
  return cleanText(value, 0, 700);
}

export function indianMobile(value: unknown): string {
  if (typeof value !== 'string') throw new AppError(HttpStatus.BAD_REQUEST, 'Enter a valid Indian mobile number');
  let phone = value.replace(/[\s-]/g, '');
  if (phone.startsWith('+91')) phone = phone.slice(3);
  if (!/^[6-9]\d{9}$/.test(phone)) throw new AppError(HttpStatus.BAD_REQUEST, 'Enter a valid Indian mobile number');
  return phone;
}

export function optionalEmail(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid email');
  const email = value.trim();
  if (email.length > 180 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new AppError(HttpStatus.BAD_REQUEST, 'Invalid email');
  }
  return email;
}

export function isSlotConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 'P2002';
}
