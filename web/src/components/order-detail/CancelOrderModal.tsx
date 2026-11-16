import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangleIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Order } from '../../types';
import { inr, nowIso, uid } from '../../utils/format';
import { stageIndex, orderStage } from '../../utils/orders';
import { orderTotals } from '../../utils/pricing';
import { canOverrideCapacity } from '../../utils/roles';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
const reasons = ['Event cancelled', 'Found elsewhere', 'Budget change', 'Delivery date no longer works', 'Other'];
export function CancelOrderModal({
  order,
  open,
  onClose




}: {order: Order;open: boolean;onClose: () => void;}) {
  const {
    updateOrder,
    logActivity,
    role,
    can
  } = useApp();
  const [reason, setReason] = useState(reasons[0]);
  const [fabricReturned, setFabricReturned] = useState(false);
  const t = orderTotals(order);
  const express = order.priority === 'Express';
  const started = stageIndex(orderStage(order)) > 0;
  const refund = express ? 0 : started ? Math.round(t.paid * 0.5) : t.paid;
  const hasCustomerFabric = order.garments.some((g) => g.fabric.source === 'Customer');
  const manager = canOverrideCapacity(role) && can('order', 'delete');
  const cancel = () => {
    const ok = updateOrder(order.id, (o) => ({
      ...o,
      status: 'Cancelled',
      risk: undefined,
      payments: refund > 0 ? [...o.payments, {
        id: uid('PAY'),
        amount: refund,
        method: 'UPI',
        reference: 'Refund',
        at: nowIso(),
        by: 'Store',
        kind: 'Refund'
      }] : o.payments
    }), {
      entity: 'order',
      action: 'delete'
    });
    if (!ok) return;
    logActivity(order.id, `Order cancelled — ${reason}. Refund ${inr(refund)}${hasCustomerFabric ? '; customer fabric returned' : ''}`, 'closure');
    toast.success('Order cancelled', {
      description: refund ? `${inr(refund)} refund recorded` : 'No refund per policy'
    });
    onClose();
  };
  return <Modal open={open} onClose={onClose} title={`Cancel ${order.id}?`} description="This stops production and cannot be undone." footer={<><Button variant="ghost" onClick={onClose}>Keep order</Button><Button variant="danger" onClick={cancel} disabled={!manager || hasCustomerFabric && !fabricReturned}>Cancel order</Button></>}>
      <div className="space-y-4">
        <Field label="Reason">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>{reasons.map((r) => <option key={r}>{r}</option>)}</select>
        </Field>
        <div className="rounded-2xl bg-canvas p-4">
          <div className="flex justify-between text-[15px]"><span className="text-ink-muted">Paid so far</span><span className="tabular">{inr(t.paid)}</span></div>
          <div className="mt-1 flex justify-between text-[17px] font-semibold"><span>Refund</span><span className="tabular">{inr(refund)}</span></div>
          <p className="mt-2 text-sm text-ink-muted">{express ? 'Express orders are non-refundable once confirmed.' : started ? 'Production has started — 50% of the advance is refundable.' : 'Before production starts — full refund.'}</p>
        </div>
        {hasCustomerFabric && <label className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <input type="checkbox" checked={fabricReturned} onChange={(e) => setFabricReturned(e.target.checked)} className="h-5 w-5 accent-brand" />
            <span className="text-[15px]">Customer’s fabric has been returned and signed for</span>
          </label>}
        {!manager && <p className="flex items-center gap-2 text-sm text-attention"><AlertTriangleIcon className="h-4 w-4" /> Store manager approval is required to cancel.</p>}
      </div>
    </Modal>;
}