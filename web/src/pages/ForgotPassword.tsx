import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { forgotPassword } from '../services/api';
import { inputClass, panelClass } from '../utils/styles';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Enter the staff email');
      return;
    }
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The email could not be sent');
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
    <div className={`${panelClass} w-full max-w-md p-6 md:p-8`}>
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-2xl">Darzaan</span>
      </div>
      <h1 className="font-display text-3xl">Forgot password</h1>
      {sent ? <p className="mt-3 text-[15px] text-ink-muted">If that email belongs to a staff account, we sent a reset link. It expires in one hour.</p> : <>
        <p className="mt-2 text-[15px] text-ink-muted">Enter the staff email. We will send a link to choose a new password.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)} noValidate>
          <Field label="Email" required>
            <input type="email" autoComplete="username" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Button type="submit" fullWidth disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</Button>
        </form>
      </>}
      <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand hover:text-brand-hover">Back to sign in</Link>
    </div>
  </main>;
}
