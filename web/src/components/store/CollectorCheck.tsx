import React, { useState } from 'react';
import { toast } from 'sonner';
import { CheckIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useStore } from '../../contexts/StoreContext';
import { DEMO_OTP } from '../../data/store';
import type { Order } from '../../types';
import { inputClass, panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { PhotoCapture } from '../ui/PhotoCapture';
import { Segmented } from '../ui/Segmented';
export interface Collector {
  who: 'customer' | 'someone';
  verified: boolean;
  name: string;
  relation?: string;
  viaManager?: boolean;
}
const relations = ['Family', 'Friend', 'Driver', 'Colleague'];

/** Someone other than the customer needs a name, an ID photo and the customer's OTP — or the manager's release. */
export function CollectorCheck({
  order,
  value,
  onChange




}: {order: Order;value: Collector;onChange: (c: Collector) => void;}) {
  const {
    getCustomer
  } = useApp();
  const {
    requestApproval,
    approvedFor,
    waitingFor,
    managerName
  } = useStore();
  const [relation, setRelation] = useState(relations[0]);
  const [idPhotos, setIdPhotos] = useState<string[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const customer = getCustomer(order.customerId);
  const released = approvedFor(order.id, 'Release without OTP');
  const releaseWaiting = waitingFor(order.id, 'Release without OTP');
  const setWho = (who: Collector['who']) => {
    setOtp('');
    setOtpSent(false);
    onChange(who === 'customer' ? {
      who,
      verified: true,
      name: ''
    } : {
      who,
      verified: false,
      name: '',
      relation
    });
  };
  const update = (patch: Partial<Collector>) => onChange({
    ...value,
    ...patch,
    verified: false
  });
  const verifyOtp = () => {
    if (otp.trim() !== DEMO_OTP) {
      toast.error('Code doesn’t match', {
        description: 'Ask the customer to read the latest code again.'
      });
      return;
    }
    onChange({
      ...value,
      relation,
      verified: true,
      viaManager: false
    });
    toast.success('Collector verified');
  };
  const canVerify = value.name.trim().length > 1 && idPhotos.length > 0;
  return <section className={`${panelClass} p-5`} aria-labelledby="collector-h">
      <h2 id="collector-h" className="mb-3 text-[16px] font-semibold">Who’s collecting?</h2>
      <Segmented fullWidth value={value.who} onChange={setWho} options={[{
      value: 'customer',
      label: 'The customer'
    }, {
      value: 'someone',
      label: 'Someone else'
    }]} />
      {value.who === 'someone' && (value.verified ? <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-[15px] font-medium text-success">
            <CheckIcon className="h-5 w-5" /> {value.name} ({value.relation}) — {value.viaManager ? `released by ${managerName}` : 'OTP verified'}
          </p> : <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <Field label="Their name">
                <input value={value.name} onChange={(e) => update({
            name: e.target.value
          })} className={inputClass} placeholder="Full name" />
              </Field>
              <Field label="Relation">
                <select value={relation} onChange={(e) => {
            setRelation(e.target.value);
            update({
              relation: e.target.value
            });
          }} className={inputClass}>
                  {relations.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink-muted">Photo of their ID</p>
              <PhotoCapture photos={idPhotos} onChange={setIdPhotos} label="Capture ID" />
            </div>
            {!otpSent ? <Button variant="secondary" fullWidth disabled={!canVerify} onClick={() => {
        setOtpSent(true);
        toast.success('Code sent', {
          description: `To ${customer?.mobile ?? 'the customer'} — demo code ${DEMO_OTP}.`
        });
      }}>
                {canVerify ? `Send a one-time code to ${customer?.name.split(' ')[0] ?? 'the customer'}` : 'Add their name and ID photo first'}
              </Button> : <form className="flex gap-2" onSubmit={(e) => {
        e.preventDefault();
        verifyOtp();
      }}>
                <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={4} className={`${inputClass} font-mono tracking-[0.3em]`} placeholder="4-digit code" aria-label="One-time code from the customer" />
                <Button type="submit" disabled={otp.length < 4}>Verify</Button>
              </form>}
            {released ? <Button variant="ghost" fullWidth onClick={() => onChange({
        ...value,
        relation,
        verified: true,
        viaManager: true
      })}>{managerName} approved — release without code</Button> : releaseWaiting ? <p className="text-sm text-ink-muted">Asked {managerName} to release without the code — waiting.</p> : <button disabled={!canVerify} onClick={() => requestApproval({
        kind: 'Release without OTP',
        orderId: order.id,
        reason: `${value.name} (${relation}) collecting; customer can’t share the code. ID photo taken.`
      })} className="text-sm font-medium text-ink-muted hover:text-ink hover:underline disabled:no-underline disabled:opacity-50">
                Customer can’t get the code? Ask {managerName} to release
              </button>}
          </div>)}
    </section>;
}