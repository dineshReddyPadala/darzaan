import React from 'react';
import type { PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { deliveryState, deliveryStateLabel, type DeliveryState } from '../../utils/packages';

const dot: Record<DeliveryState, string> = {
  ready: 'bg-ink-subtle',
  packing: 'bg-attention',
  packed: 'bg-brand',
  transit: 'bg-info',
  delivered: 'bg-success',
  attention: 'bg-critical'
};

/** Delivery status as quiet text with a coloured dot. Only "Needs attention" is pulled out, in red. */
export function DeliveryStateBadge({ p, state, size }: {p?: PackageRecord;state?: DeliveryState;size?: 'sm' | 'md';}) {
  const s = state ?? (p ? deliveryState(p) : 'ready');
  const alert = s === 'attention';
  return <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', size === 'md' ? 'text-[15px]' : 'text-sm', alert ? 'font-medium text-critical' : 'text-ink')}>
      <span className={cn('h-2 w-2 shrink-0 rounded-full', dot[s])} aria-hidden />
      {deliveryStateLabel[s]}
    </span>;
}