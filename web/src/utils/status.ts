import type { OrderStatus, Severity } from '../types';

export type Tone = 'neutral' | 'brand' | 'success' | 'info' | 'attention' | 'warning' | 'critical';

export const orderStatusTone: Record<OrderStatus, Tone> = {
  Draft: 'neutral',
  Confirmed: 'info',
  'In Production': 'brand',
  'Ready for Trial': 'success',
  Alteration: 'attention',
  'Ready for Pickup': 'success',
  Closed: 'neutral',
  Cancelled: 'critical'
};

export const severityTone: Record<Severity, Tone> = {
  info: 'info',
  attention: 'attention',
  warning: 'warning',
  critical: 'critical'
};

export const severityLabel: Record<Severity, string> = {
  info: 'Informational',
  attention: 'Attention',
  warning: 'Warning',
  critical: 'Critical'
};

export const severityRank: Record<Severity, number> = { critical: 0, warning: 1, attention: 2, info: 3 };

export const toneBar: Record<Tone, string> = {
  neutral: 'bg-line-strong',
  brand: 'bg-brand',
  success: 'bg-success',
  info: 'bg-info',
  attention: 'bg-attention',
  warning: 'bg-warning',
  critical: 'bg-critical'
};

export const toneText: Record<Tone, string> = {
  neutral: 'text-ink-muted',
  brand: 'text-brand',
  success: 'text-success',
  info: 'text-info',
  attention: 'text-attention',
  warning: 'text-warning',
  critical: 'text-critical'
};