import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import type { FloorRequestKind } from '../../types';
import { inputClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
const hasAmount: FloorRequestKind[] = ['Discount', 'Refund'];
const hasCallback: FloorRequestKind[] = ['Dispute', 'Cancellation'];
const hints: Partial<Record<FloorRequestKind, string>> = {
  Discount: 'The customer can wait for the answer, or pay the full amount now.',
  Dispute: 'Write what the customer said in their words. The manager calls back.',
  Cancellation: 'You can’t cancel from the floor. The manager applies the policy and calls back.',
  'Merge customers': 'Two records for the same person — the manager merges them.'
};

/** Anything money- or policy-related goes up to the manager with a reason. */
export function FloorRequestModal({
  open,
  onClose,
  kind,
  orderId,
  customerId






}: {open: boolean;onClose: () => void;kind: FloorRequestKind;orderId?: string;customerId?: string;}) {
  const {
    requestApproval,
    managerName,
    managerInStore
  } = useStore();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [callback, setCallback] = useState('17:00');
  const needsAmount = hasAmount.includes(kind);
  const valid = reason.trim().length > 3 && (!needsAmount || Number(amount) > 0);
  const send = () => {
    if (!valid) return;
    const r = requestApproval({
      kind,
      orderId,
      customerId,
      amount: needsAmount ? Number(amount) : undefined,
      reason: reason.trim(),
      callback: hasCallback.includes(kind) ? callback : undefined
    });
    if (!r) return;
    setAmount('');
    setReason('');
    onClose();
  };
  return <Modal open={open} onClose={onClose} title={`Ask ${managerName}: ${kind.toLowerCase()}`} description={`${hints[kind] ?? 'The manager decides; you’ll see the answer in “Waiting on manager”.'}${managerInStore ? '' : ` ${managerName} is away — it goes to their phone and escalates after 2 hours.`}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button disabled={!valid} onClick={send}>Send request</Button></>}>
      <div className="space-y-4">
        {needsAmount && <Field label="Amount (₹)" required>
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`${inputClass} tabular`} placeholder="1000" />
          </Field>}
        <Field label={hasCallback.includes(kind) ? 'What the customer said' : 'Reason'} required>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={textareaClass} placeholder="Short and specific — the manager reads this on their phone." />
        </Field>
        {hasCallback.includes(kind) && <Field label="Callback time promised">
            <input type="time" value={callback} onChange={(e) => setCallback(e.target.value)} className={inputClass} />
          </Field>}
      </div>
    </Modal>;
}