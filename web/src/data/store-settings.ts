import { readHydration, scheduleSave } from '../services/sync';

export interface StorePricing {
  expressPct: Record<string, number>;
  gstPct: number;
  advancePct: number;
  homeDelivery: number;
  alterationCharge: number;
  alterationTiers: number[];
  maxDiscountPct: number;
}

export interface StoreWorkflow {
  slaHours: Record<string, number>;
  graceHours: number;
  leadTimeDays: number;
  tolerance: number;
  alterationPolicy: string;
  cancellationPolicy: string;
}

export interface StoreSettingsSlice {
  pricing: StorePricing;
  workflow: StoreWorkflow;
  notifications: Record<string, boolean>;
}

const EVENTS = [
  'Order confirmation',
  'Payment confirmation',
  'Production started',
  'Delay / at risk',
  'Trial reminder',
  'Alteration update',
  'Ready for pickup',
  'Final invoice & feedback',
];
const CHANNELS = ['WhatsApp', 'SMS', 'Email'];

export function defaultNotifications(): Record<string, boolean> {
  const on: Record<string, boolean> = {};
  for (const name of EVENTS) {
    for (const channel of CHANNELS) {
      on[`${name}-${channel}`] = channel === 'WhatsApp'
        || (channel === 'Email' && name.includes('invoice'))
        || (channel === 'SMS' && name.includes('Order'));
    }
  }
  return on;
}

export function defaultStoreSettings(): StoreSettingsSlice {
  return {
    pricing: {
      expressPct: { 'Express 3d': 50, 'Express 2d': 70, 'Express 24h': 100 },
      gstPct: 5,
      advancePct: 70,
      homeDelivery: 500,
      alterationCharge: 1500,
      alterationTiers: [0, 50, 100],
      maxDiscountPct: 10,
    },
    workflow: {
      slaHours: {
        review: 4, material: 24, scheduling: 4, marking: 8, embroidery: 72, cutting: 8,
        stitching: 24, hemming: 6, qc: 4, finishing: 4, packaging: 2, logistics: 8,
      },
      graceHours: 4,
      leadTimeDays: 10,
      tolerance: 0.5,
      alterationPolicy: 'First and second alterations are free. Third and later alterations are charged at ₹1,500 each.',
      cancellationPolicy: 'Full refund before production starts; 50% once started. Express orders are non-refundable. Customer fabric must be returned.',
    },
    notifications: defaultNotifications(),
  };
}

export function readStoreSettings(): Record<string, StoreSettingsSlice> {
  return readHydration<Record<string, StoreSettingsSlice>>('storeSettings') ?? {};
}

/** Create the settings slice for a new store. Other stores already in the map stay. */
export function ensureStoreSettings(storeId: string | number): void {
  const key = String(storeId);
  const current = readStoreSettings();
  if (current[key]) return;
  scheduleSave('storeSettings', { ...current, [key]: defaultStoreSettings() });
}

export function saveStoreSettings(storeId: string | number, slice: StoreSettingsSlice): void {
  scheduleSave('storeSettings', { ...readStoreSettings(), [String(storeId)]: slice });
}
