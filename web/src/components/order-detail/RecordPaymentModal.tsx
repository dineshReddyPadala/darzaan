import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import type { Order, PaymentMethod } from '../../types';
import { inr, nowIso, uid } from '../../utils/format';
import { orderTotals } from '../../utils/pricing';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';
export function RecordPaymentModal({
  order,
  open,
  onClose




}: {order: Order;open: boolean;onClose: () => void;}) {
  const {
    updateOrder,
    logActivity,
    user
  } = useApp();
  const t = orderTotals(order);
  const [amount, setAmount] = useState(t.balance);
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [ref, setRef] = useState('');
  useEffect(() => {
    if (open) setAmount(orderTotals(order).balance);
  }, [open, order]);
  const save = () => {
    const trimmedRef = ref.trim();
    if (method === 'UPI' && !trimmedRef) {
      toast.error('Enter the UPI transaction reference');
      return;
    }
    const paidAfter = t.paid + amount;
    const ok = updateOrder(order.id, (o) => ({
      ...o,
      payments: [...o.payments, {
        id: uid('PAY'),
        amount,
        method,
        reference: trimmedRef,
        at: nowIso(),
        by: user.name,
        kind: o.payments.length ? 'Balance' : 'Advance'
      }],
      risk: o.risk?.message.startsWith('Advance') && paidAfter >= t.total * 0.7 ? undefined : o.risk
    }), {
      entity: 'payment',
      action: 'create'
    });
    if (!ok) return;
    logActivity(order.id, `${method} payment of ${inr(amount)} received`, 'payment');
    toast.success(`${inr(amount)} recorded`, {
      description: 'Receipt sent to the customer.'
    });
    onClose();
  };
  return <Modal open={open} onClose={onClose} title="Record payment" description={`${order.id} · balance ${inr(t.balance)}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={amount <= 0}>Record {inr(amount)}</Button></>}>
      <div className="space-y-4">
        <Field label="Amount">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-ink-subtle">₹</span>
            <input inputMode="numeric" value={amount} onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)} className={`${inputClass} h-14 pl-8 text-xl tabular`} />
          </div>
        </Field>
        <Segmented fullWidth size="lg" value={method} onChange={setMethod} options={(['UPI', 'Card', 'Cash', 'Bank transfer'] as PaymentMethod[]).map((m) => ({
        value: m,
        label: m
      }))} />
        <Field label="Reference">
          <input value={ref} onChange={(e) => setRef(e.target.value)} className={inputClass} placeholder="Transaction ID or receipt no." />
        </Field>
      </div>
    </Modal>;
}