import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import type { ChangeRequest, Order } from '../../types';
import { nowIso, uid } from '../../utils/format';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { SignaturePad } from '../ui/SignaturePad';
import { ChangeDiff } from '../orders/ChangeDiff';
export function ChangeRequestModal({
  order,
  open,
  onClose




}: {order: Order;open: boolean;onClose: () => void;}) {
  const {
    updateOrder,
    logActivity,
    customerName,
    user
  } = useApp();
  const [field, setField] = useState('');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [price, setPrice] = useState(0);
  const [dateImpact, setDateImpact] = useState('No change');
  const [signed, setSigned] = useState(false);
  const draft: ChangeRequest = {
    id: 'preview',
    field,
    before,
    after,
    priceImpact: price,
    dateImpact,
    status: 'Awaiting approval',
    requestedBy: customerName(order.customerId),
    at: nowIso()
  };
  const reset = () => {
    setField('');
    setBefore('');
    setAfter('');
    setPrice(0);
    setDateImpact('No change');
    setSigned(false);
  };
  const save = () => {
    const id = `CR-${uid('').slice(1, 5).toUpperCase()}`;
    const version = Math.max(1, ...order.signatures.map((s) => s.version)) + 1;
    const ok = updateOrder(order.id, (o) => ({
      ...o,
      changeRequests: [...o.changeRequests, {
        ...draft,
        id,
        status: signed ? 'Approved' : 'Awaiting approval'
      }],
      signatures: signed ? [...o.signatures, {
        role: 'Customer',
        name: customerName(o.customerId),
        at: nowIso(),
        version
      }] : o.signatures
    }));
    if (!ok) return;
    logActivity(order.id, signed ? `Change ${id} approved & re-signed (version ${version}) — copies reissued` : `Change ${id} raised — awaiting customer approval`, 'change');
    toast.success(signed ? 'Change approved and copies reissued' : 'Change request sent for approval', {
      description: signed ? `Production notified by ${user.name}` : 'Customer receives the before/after on WhatsApp.'
    });
    reset();
    onClose();
  };
  return <Modal open={open} onClose={onClose} size="lg" title="Change request" description="Changes after signing need customer approval and a new signature." footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={!field || !after}>{signed ? 'Approve & reissue copies' : 'Send for approval'}</Button></>}>
      <div className="space-y-4">
        <Field label="What is changing?"><input value={field} onChange={(e) => setField(e.target.value)} className={inputClass} placeholder="e.g. Blouse neckline" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Previous value"><input value={before} onChange={(e) => setBefore(e.target.value)} className={inputClass} placeholder="Round neck, 6&quot;" /></Field>
          <Field label="New value"><input value={after} onChange={(e) => setAfter(e.target.value)} className={inputClass} placeholder="Sweetheart, 7&quot;" /></Field>
          <Field label="Price impact (₹)"><input inputMode="numeric" value={price} onChange={(e) => setPrice(Number(e.target.value.replace(/\D/g, '')) || 0)} className={`${inputClass} tabular`} /></Field>
          <Field label="Delivery impact">
            <select value={dateImpact} onChange={(e) => setDateImpact(e.target.value)} className={inputClass}>
              {['No change', '+1 day', '+2 days', '+3 days', '+1 week'].map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>
        {field && after && <div className="rounded-2xl border border-line p-4">
            <p className="mb-3 text-sm font-medium text-ink-muted">Customer will see</p>
            <ChangeDiff change={draft} />
          </div>}
        <SignaturePad label="Customer approval (optional now)" signerName={customerName(order.customerId)} signed={signed} onSignedChange={setSigned} />
      </div>
    </Modal>;
}