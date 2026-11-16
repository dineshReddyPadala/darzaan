import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon, MailIcon, MessageCircleIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { categories } from '../../data/catalog';
import type { Customer } from '../../types';
import { cn } from '../../utils/cn';
import { TODAY_ISO, uid } from '../../utils/format';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
type Stage = 'compose' | 'sent' | 'submitted' | 'correction' | 'verified';
const steps: {
  key: Stage;
  label: string;
}[] = [{
  key: 'sent',
  label: 'Instructions sent'
}, {
  key: 'submitted',
  label: 'Customer submitted'
}, {
  key: 'correction',
  label: 'Designer review'
}, {
  key: 'verified',
  label: 'Darzaan-verified'
}];
export function RemoteMeasurementModal({
  open,
  onClose,
  customer




}: {open: boolean;onClose: () => void;customer: Customer;}) {
  const {
    updateCustomer,
    user
  } = useApp();
  const [stage, setStage] = useState<Stage>('compose');
  const [category, setCategory] = useState('Blouse');
  const [note, setNote] = useState('');
  const order: Stage[] = ['compose', 'sent', 'submitted', 'correction', 'verified'];
  const at = order.indexOf(stage);
  const fields = categories.find((c) => c.name === category)?.measurements.fields ?? [];
  const submitted: Record<string, number> = Object.fromEntries(fields.map((f, i) => [f, 12 + i * 7 % 26]));
  const verify = () => {
    updateCustomer(customer.id, (c) => ({
      ...c,
      measurementProfiles: [{
        id: uid('MP'),
        label: `${category} — remote`,
        category,
        source: 'Customer',
        verified: true,
        takenBy: customer.name,
        date: TODAY_ISO,
        values: submitted
      }, ...c.measurementProfiles]
    }));
    setStage('verified');
    toast.success('Measurements verified', {
      description: `Saved to ${customer.name}’s profile as Darzaan-verified.`
    });
  };
  const close = () => {
    setStage('compose');
    setNote('');
    onClose();
  };
  return <Modal open={open} onClose={close} size="lg" title="Remote measurements" description={`For ${customer.name} — ${customer.city}`}>
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {steps.map((s, i) => {
        const done = at > i + 1 || stage === 'verified' && i === 3;
        const current = at === i + 1 && stage !== 'verified';
        return <li key={s.key} className="flex flex-col gap-2">
              <span className={cn('h-1.5 rounded-full', done ? 'bg-success' : current ? 'bg-brand' : 'bg-sunken')} />
              <span className={cn('text-xs font-medium', done || current ? 'text-ink' : 'text-ink-subtle')}>{s.label}</span>
            </li>;
      })}
      </ol>

      {stage === 'compose' && <div className="space-y-4">
          <Field label="Garment to measure">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categories.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <div className="rounded-2xl bg-canvas p-4 text-sm text-ink-muted">
            The customer receives a guided form with a how-to video for each of the {fields.length} {category.toLowerCase()} measurements, and is asked for three photos (front, side, back — no face needed) and any reference images.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<MessageCircleIcon className="h-4 w-4" />} onClick={() => {
          setStage('sent');
          toast.success('Measurement guide sent on WhatsApp');
        }} disabled={!customer.whatsappAvailable}>
              Send on WhatsApp
            </Button>
            <Button variant="secondary" icon={<MailIcon className="h-4 w-4" />} onClick={() => {
          setStage('sent');
          toast.success('Measurement guide sent by email');
        }}>
              Send by email
            </Button>
          </div>
        </div>}

      {stage === 'sent' && <div className="rounded-2xl border border-line p-5">
          <p className="text-[15px] font-medium">Waiting for {customer.name.split(' ')[0]} to submit.</p>
          <Button variant="secondary" className="mt-4" onClick={() => setStage('submitted')}>Simulate customer submission</Button>
        </div>}

      {(stage === 'submitted' || stage === 'correction') && <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[15px] font-semibold">Customer-provided · {category}</p>
            <span className="rounded-full bg-attention-soft px-2.5 py-1 text-xs font-medium text-attention">Not yet verified</span>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            {fields.map((f) => <div key={f} className="bg-surface px-4 py-3">
                <p className="text-xs text-ink-subtle">{f}</p>
                <p className="text-[17px] font-semibold tabular">{submitted[f]}"</p>
              </div>)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['Front', 'Side', 'Back'].map((p) => <div key={p} className="flex aspect-[3/4] items-end rounded-xl bg-sunken p-2 text-xs font-medium text-ink-muted">{p} photo</div>)}
          </div>
          {stage === 'correction' ? <div className="mt-4 space-y-3">
              <Field label="What needs correcting?">
                <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="e.g. Re-measure bust at fullest point, arms relaxed" />
              </Field>
              <div className="flex gap-2">
                <Button onClick={() => {
            toast.success('Correction request sent');
            setStage('sent');
          }} disabled={!note}>Send correction request</Button>
                <Button variant="ghost" onClick={() => setStage('submitted')}>Cancel</Button>
              </div>
            </div> : <div className="mt-4 flex flex-wrap gap-2">
              <Button icon={<CheckIcon className="h-4 w-4" />} onClick={verify}>Verify as {user.name.split(' ')[0]}</Button>
              <Button variant="secondary" onClick={() => setStage('correction')}>Request correction</Button>
            </div>}
        </div>}

      {stage === 'verified' && <div className="rounded-2xl bg-success-soft p-5">
          <p className="text-[15px] font-semibold text-success">Verified and saved</p>
          <p className="mt-1 text-sm text-ink-muted">Production will see these as customer-provided, verified by {user.name}.</p>
          <Button className="mt-4" onClick={close}>Done</Button>
        </div>}
    </Modal>;
}