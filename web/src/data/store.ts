import type { FloorDraft, FloorRequest, SwatchLoan } from '../types';

/** Trial rooms at the store — one booking per room per slot. */
export const TRIAL_ROOMS = 2;
export const TRIAL_SLOTS = ['11:00', '11:30', '12:30', '14:00', '15:30', '17:00', '18:30'];

/** Rack spots on the store floor. */
export const RACK_SPOTS = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'].map((s) => `Rack ${s}`);

/** Days after "ready" when an uncollected-order reminder is due. */
export const COLLECTION_REMINDERS = [7, 14, 30];
/** Hours a floor request waits before escalating past the manager. */
export const ESCALATE_AFTER_HOURS = 2;
/** Reschedule messages after a no-show before it goes to the manager. */
export const MAX_CONTACT_ATTEMPTS = 3;
/** How far (in inches) a new measurement may be from the saved profile before it's flagged. */
export const MEASUREMENT_FLAG_DELTA = 2;
/** Demo one-time code the customer reads out when someone else collects. */
export const DEMO_OTP = '4821';

/** Ready-made customer messages the floor can send in one tap. */
export const messageTemplates = [
{ key: 'trial', label: 'Ready for trial', body: 'Your garment is ready for its trial. Reply with a time that suits you.' },
{ key: 'pickup', label: 'Ready for pickup', body: 'Your order is ready to collect from the Khan Market store.' },
{ key: 'reschedule', label: 'Reschedule link', body: 'We missed you today — pick a new trial slot here.' },
{ key: 'balance', label: 'Balance reminder', body: 'A balance is due on your order. Pay by UPI link or at the store.' }] as
const;

export type MessageKey = (typeof messageTemplates)[number]['key'];

export const floorRequests: FloorRequest[] = [
{ id: 'FR-118', kind: 'Discount', orderId: 'DZ-10288', amount: 1000, reason: 'Customer asked for ₹1,000 off — repeat client, sister’s order pending.', at: '2026-10-08T09:40:00', by: 'Neha Gupta', status: 'Waiting' }];


export const floorDrafts: FloorDraft[] = [
{ id: 'FD-031', customerId: 'C-1008', garments: ['Straight Kurta', 'Churidar'], fabric: { material: 'Customer cotton — indigo print', length: 3, pieces: 1 }, photos: 2, measurements: { Chest: 38, Waist: 32, Length: 42 }, flagged: [], note: 'Wants it before Diwali. Price by evening.', assignedTo: 'Aarav Bedi', at: '2026-10-07T18:10:00', by: 'Neha Gupta', status: 'With designer' }];


export const swatchLoans: SwatchLoan[] = [
{ id: 'SW-207', fabricId: 'FAB-2124', label: 'Organza — Powder Blue', customerId: 'C-1007', out: '2026-10-04', due: '2026-10-07' }];