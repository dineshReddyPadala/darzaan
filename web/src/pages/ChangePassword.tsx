import React, { useState } from 'react';
import { toast } from 'sonner';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { changePassword } from '../services/api';
import { readSession } from '../services/session';
import { homeFor } from '../utils/roles';
import { inputClass, panelClass } from '../utils/styles';

export function ChangePassword() {
  const session = readSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
    if (password === currentPassword) {
      toast.error('Choose a different password');
      return;
    }
    setBusy(true);
    try {
      const user = await changePassword(currentPassword, password);
      window.location.assign(homeFor(user.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the password');
      setBusy(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
    <div className={`${panelClass} w-full max-w-md p-6 md:p-8`}>
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-2xl">Darzaan</span>
      </div>
      <h1 className="font-display text-3xl">Choose a password</h1>
      <p className="mt-2 text-[15px] text-ink-muted">
        {session?.user.mustChangePassword
          ? 'This login used a temporary password. Choose your own before opening the desk.'
          : 'Replace the password on this staff account.'}
      </p>
      <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)} noValidate>
        <Field label="Current password" required>
          <input type="password" autoComplete="current-password" className={inputClass} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </Field>
        <Field label="New password" required>
          <input type="password" autoComplete="new-password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Field label="Confirm password" required>
          <input type="password" autoComplete="new-password" className={inputClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </Field>
        <Button type="submit" fullWidth disabled={busy}>{busy ? 'Saving…' : 'Save password'}</Button>
      </form>
    </div>
  </main>;
}
