import React from 'react';
import { Drawer } from '../ui/Drawer';
import { BagPanel } from './BagPanel';
import { VisitPanel } from './VisitPanel';
export type TodaySelection = {
  type: 'customer';
  customerId: string;
  orderId?: string;
} | {
  type: 'bag';
  bagId: string;
};

/** On tablets and phones the visit opens over the list instead of beside it. */
export function CheckInDrawer({
  selection,
  open,
  onClose,
  onDraft





}: {selection: TodaySelection | null;open: boolean;onClose: () => void;onDraft: (customerId: string) => void;}) {
  return <Drawer open={open && !!selection} onClose={onClose} title={selection?.type === 'bag' ? 'Bag' : 'Visit'}>
      {selection?.type === 'customer' && <VisitPanel customerId={selection.customerId} focusOrderId={selection.orderId} onDraft={onDraft} />}
      {selection?.type === 'bag' && <BagPanel bagId={selection.bagId} />}
    </Drawer>;
}