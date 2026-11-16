import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { BrandMark } from '../components/layout/BrandMark';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { login } from '../services/api';
import { apiMode } from '../services/mode';
import { readSession } from '../services/session';
import { inputClass, panelClass } from '../utils/styles';
import { homeFor } from '../utils/roles';

const schema = z.object({
  email: z.string().min(1, 'Enter the email').email('Enter a valid email'),
  password: z.string().min(1, 'Enter the password'),
});

type FormValues = z.infer<typeof schema>;

const accounts = [
  ['Aditi Malhotra', 'aditi.malhotra@darzaan.test', 'Admin'],
  ['Kabir Sethi', 'kabir.sethi@darzaan.test', 'Store Manager'],
  ['Ritu Sharma', 'ritu.sharma@darzaan.test', 'Salesperson'],
  ['Vikram Rathore', 'vikram.rathore@darzaan.test', 'Production Head'],
  ['Manoj Tiwari', 'manoj.tiwari@darzaan.test', 'Production Assistant'],
  ['Pooja Verma', 'pooja.verma@darzaan.test', 'Logistics'],
  ['Arjun Singh', 'arjun.singh@darzaan.test', 'Delivery Runner'],
  ['Deepa Joshi', 'deepa.joshi@darzaan.test', 'Quality Check'],
  ['Anjali Desai', 'anjali.desai@darzaan.test', 'Accountant'],
];

export function Login() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = await login(values.email, values.password);
      window.location.assign(user.mustChangePassword ? '/change-password' : homeFor(user.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Those details do not match a staff account');
    }
  });
  useEffect(() => {
    if (!apiMode) navigate('/', { replace: true });
    else if (readSession()) {
      const session = readSession()!;
      navigate(session.user.mustChangePassword ? '/change-password' : homeFor(session.user.role), { replace: true });
    }
  }, [navigate]);
  if (!apiMode || readSession()) return null;
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
    <div className={`${panelClass} w-full max-w-md p-6 md:p-8`}>
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-2xl">Darzaan</span>
      </div>
      <h1 className="font-display text-3xl">Sign in</h1>
      <p className="mt-2 text-[15px] text-ink-muted">Use the staff email for the desk you are opening.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <Field label="Email" required>
          <input type="email" autoComplete="username" placeholder="aditi.malhotra@darzaan.test" className={inputClass} aria-invalid={!!form.formState.errors.email} {...form.register('email')} />
        </Field>
        {form.formState.errors.email && <p className="text-sm text-critical">{form.formState.errors.email.message}</p>}
        <Field label="Password" required>
          <input type="password" autoComplete="current-password" placeholder="Password" className={inputClass} aria-invalid={!!form.formState.errors.password} {...form.register('password')} />
        </Field>
        {form.formState.errors.password && <p className="text-sm text-critical">{form.formState.errors.password.message}</p>}
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-hover">Forgot password?</Link>
        </div>
        <Button type="submit" fullWidth disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <details className="mt-6 text-sm text-ink-muted">
        <summary className="cursor-pointer font-medium text-ink">Staff accounts</summary>
        <p className="mt-2">Password for every account: Darzaan#2026</p>
        <ul className="mt-2 space-y-1">
          {accounts.map(([name, email, role]) => <li key={email}><span className="text-ink">{name}</span> · {role}<br /><span className="font-mono text-xs">{email}</span></li>)}
        </ul>
      </details>
    </div>
  </main>;
}
