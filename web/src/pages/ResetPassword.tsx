import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { resetPassword } from '../services/api';
import { inputClass, panelClass } from '../utils/styles';

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error('Use at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Those passwords do not match');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'This reset link has expired');
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
      <h1 className="font-display text-3xl">New password</h1>
      {!token && <p className="mt-3 text-[15px] text-ink-muted">This reset link is incomplete. Request a new one from the sign-in page.</p>}
      {token && done && <p className="mt-3 text-[15px] text-ink-muted">Your password is updated. Sign in with it.</p>}
      {token && !done && <>
        <p className="mt-2 text-[15px] text-ink-muted">Choose a password of at least 8 characters.</p>
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)} noValidate>
          <Field label="New password" required>
            <input type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="Confirm password" required>
            <input type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </Field>
          <Button type="submit" fullWidth disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button>
        </form>
      </>}
      <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand hover:text-brand-hover">Back to sign in</Link>
    </div>
  </main>;
}
