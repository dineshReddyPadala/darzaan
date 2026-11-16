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

export function defaultStoreSettings(notifications?: Record<string, boolean>): StoreSettingsSlice {
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
        review: 4,
        material: 24,
        scheduling: 4,
        marking: 8,
        embroidery: 72,
        cutting: 8,
        stitching: 24,
        hemming: 6,
        qc: 4,
        finishing: 4,
        packaging: 2,
        logistics: 8,
      },
      graceHours: 4,
      leadTimeDays: 10,
      tolerance: 0.5,
      alterationPolicy: 'First and second alterations are free. Third and later alterations are charged at ₹1,500 each.',
      cancellationPolicy: 'Full refund before production starts; 50% once started. Express orders are non-refundable. Customer fabric must be returned.',
    },
    notifications: notifications && Object.keys(notifications).length > 0 ? notifications : defaultNotifications(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function booleanRecord(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};
  const out: Record<string, boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'boolean') out[key] = item;
  }
  return out;
}

/** Keep a stored slice, filling any missing field from the defaults. */
export function normalizeStoreSettings(value: unknown, notifications?: Record<string, boolean>): StoreSettingsSlice {
  const base = defaultStoreSettings(notifications);
  if (!isRecord(value)) return base;
  const pricing = isRecord(value.pricing) ? value.pricing : {};
  const workflow = isRecord(value.workflow) ? value.workflow : {};
  const express = isRecord(pricing.expressPct) ? pricing.expressPct : {};
  const sla = isRecord(workflow.slaHours) ? workflow.slaHours : {};
  const tiers = Array.isArray(pricing.alterationTiers) ? pricing.alterationTiers.filter((item) => typeof item === 'number') : base.pricing.alterationTiers;
  return {
    pricing: {
      expressPct: { ...base.pricing.expressPct, ...booleanFreeNumbers(express) },
      gstPct: numberOr(pricing.gstPct, base.pricing.gstPct),
      advancePct: numberOr(pricing.advancePct, base.pricing.advancePct),
      homeDelivery: numberOr(pricing.homeDelivery, base.pricing.homeDelivery),
      alterationCharge: numberOr(pricing.alterationCharge, base.pricing.alterationCharge),
      alterationTiers: tiers.length ? tiers : base.pricing.alterationTiers,
      maxDiscountPct: numberOr(pricing.maxDiscountPct, base.pricing.maxDiscountPct),
    },
    workflow: {
      slaHours: { ...base.workflow.slaHours, ...booleanFreeNumbers(sla) },
      graceHours: numberOr(workflow.graceHours, base.workflow.graceHours),
      leadTimeDays: numberOr(workflow.leadTimeDays, base.workflow.leadTimeDays),
      tolerance: numberOr(workflow.tolerance, base.workflow.tolerance),
      alterationPolicy: typeof workflow.alterationPolicy === 'string' ? workflow.alterationPolicy : base.workflow.alterationPolicy,
      cancellationPolicy: typeof workflow.cancellationPolicy === 'string' ? workflow.cancellationPolicy : base.workflow.cancellationPolicy,
    },
    notifications: { ...base.notifications, ...booleanRecord(value.notifications) },
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanFreeNumbers(value: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'number' && Number.isFinite(item)) out[key] = item;
  }
  return out;
}

export function booleanMap(value: unknown): Record<string, boolean> {
  return booleanRecord(value);
}
