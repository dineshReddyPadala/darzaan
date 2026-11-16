import React, { useEffect, useRef, useState } from 'react';
import { usePackages } from '../../contexts/PackagesContext';
import type { PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { otpFor } from '../../utils/packages';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/** Home delivery: the customer reads out their 4-digit code; the right code marks it delivered. */
export function OtpModal({
  p,
  onClose



}: {p: PackageRecord | null;onClose: () => void;}) {
  const {
    deliverHome
  } = usePackages();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (p) {
      setOtp('');
      setError(false);
      window.setTimeout(() => ref.current?.focus(), 50);
    }
  }, [p]);
  const submit = () => {
    if (!p) return;
    if (deliverHome(p.id, otp)) onClose();else setError(true);
  };
  return <Modal open={!!p} onClose={onClose} title="Enter customer OTP" footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button disabled={otp.length < 4} onClick={submit}>Mark as delivered</Button>
    </>}>
      {p && <form onSubmit={(e) => {
      e.preventDefault();
      if (otp.length === 4) submit();
    }}>
          <p className="text-[15px] text-ink-muted">Ask {p.destination.name} for the code sent to their phone.</p>
          <input ref={ref} value={otp} onChange={(e) => {
        setOtp(e.target.value.replace(/\D/g, '').slice(0, 4));
        setError(false);
      }} inputMode="numeric" autoComplete="one-time-code" aria-label="4-digit OTP" aria-invalid={error} aria-describedby={error ? 'otp-error' : undefined} className={cn(inputClass, 'mt-4 h-16 text-center font-mono text-3xl tracking-[0.5em]', error && 'border-critical')} placeholder="••••" />
          {error && <p id="otp-error" role="alert" className="mt-2 text-[15px] font-medium text-critical">Wrong code. Check with the customer and try again.</p>}
          <p className="mt-3 text-sm text-ink-subtle">Demo code: <span className="font-mono">{otpFor(p)}</span></p>
        </form>}
    </Modal>;
}