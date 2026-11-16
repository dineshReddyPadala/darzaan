import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, XIcon } from 'lucide-react';
import { OrderStepRail } from '../components/new-order/OrderStepRail';
import { Button, buttonClass } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { useApp } from '../contexts/AppContext';
import { employees as seed } from '../data/team';
import { useSyncedList } from '../hooks/useSyncedList';
import { createUser, updateUser } from '../services/api';
import { apiMode } from '../services/mode';
import { readSession } from '../services/session';
import type { Employee, Role } from '../types';
import { activeLocations } from '../utils/locations';
import { catalogRoleIds, roleDefFor, roleLabel } from '../utils/roles';
import { inputClass } from '../utils/styles';

const STEPS = [
  { key: 'person', label: 'Person' },
  { key: 'work', label: 'Work' },
  { key: 'address', label: 'Address' },
] as const;

type FormState = {
  name: string;
  mobile: string;
  email: string;
  role: string;
  roleId: Role;
  location: string;
  line: string;
  city: string;
  pin: string;
};

function packAddress(line: string, city: string, pin: string): string {
  return [line.trim(), city.trim(), pin.trim()].join('\n');
}

function unpackAddress(value: string | undefined): { line: string; city: string; pin: string } {
  const [line = '', city = '', pin = ''] = (value ?? '').split('\n');
  return { line, city, pin };
}

function formFrom(person: Employee): FormState {
  const address = unpackAddress(person.address);
  return {
    name: person.name,
    mobile: person.mobile ?? '',
    email: person.email ?? '',
    role: person.role,
    roleId: person.roleId ?? 'production_assistant',
    location: person.location || '',
    ...address,
  };
}

function emptyForm(location: string): FormState {
  return {
    name: '',
    mobile: '',
    email: '',
    role: 'Tailor',
    roleId: 'production_assistant',
    location,
    line: '',
    city: '',
    pin: '',
  };
}

export function EmployeeForm() {
  const home = '/team';
  const { id } = useParams();
  const editingId = id && id !== 'new' ? id : undefined;
  const navigate = useNavigate();
  const { can } = useApp();
  const [people, setPeople] = useSyncedList<Employee[]>('team', seed);
  const teamPerson = people.find((person) => String(person.id) === String(editingId));
  const signedInStore = readSession()?.user.storeId;
  const workplaces = activeLocations().filter((location) => signedInStore == null || String(location.id) === String(signedInStore));
  const roleOptions = useMemo(
    () => catalogRoleIds().map((roleId) => ({ id: roleId, label: roleLabel(roleId) })),
    [],
  );
  const [ready] = useState(true);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string; emailed: boolean } | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(teamPerson ? String(teamPerson.id) : null);
  const [form, setForm] = useState<FormState>(() => (teamPerson ? formFrom(teamPerson) : emptyForm('')));

  useEffect(() => {
    if (!teamPerson) return;
    const key = String(teamPerson.id);
    if (loadedId === key) return;
    setForm(formFrom(teamPerson));
    setLoadedId(key);
  }, [teamPerson, loadedId]);

  const issue = (index: number): string | null => {
    if (index === 0) {
      if (!form.name.trim()) return 'Enter the employee’s name';
      if (!/^[6-9]\d{9}$/.test(form.mobile.replace(/\s/g, ''))) return 'Enter a 10-digit mobile number';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a work email';
    }
    if (index === 2 && !editingId) {
      if (!form.line.trim() || !form.city.trim()) return 'Enter the street and city';
      if (!/^\d{6}$/.test(form.pin.trim())) return 'Enter a 6-digit PIN code';
    }
    return null;
  };

  const go = (next: number) => {
    if (next > step) {
      const problem = issue(step);
      if (problem) {
        toast.error(problem);
        return;
      }
    }
    setStep(next);
    setMaxStep((current) => Math.max(current, next));
  };

  const save = async () => {
    for (let i = 0; i < STEPS.length; i += 1) {
      const problem = issue(i);
      if (problem) {
        setStep(i);
        toast.error(problem);
        return;
      }
    }
    if (editingId && !can('team', 'update')) return;
    if (!editingId && !can('team', 'create')) return;
    const workplace = form.location.trim() ? workplaces.find((location) => location.name === form.location) : undefined;
    const keptStore = teamPerson?.storeId != null && String(teamPerson.storeId) !== '' ? Number(teamPerson.storeId) : null;
    const address = packAddress(form.line, form.city, form.pin);
    const mobile = form.mobile.replace(/\s/g, '');
    const email = form.email.trim().toLowerCase();
    const displayRole = form.role.trim() || roleDefFor(form.roleId).label;
    const storeId = !form.location.trim() ? null : workplace?.id ?? keptStore;
    const storeName = !form.location.trim() ? null : workplace ? workplace.store || workplace.name : undefined;
    setBusy(true);
    try {
      let userId = teamPerson?.userId;
      let password = '';
      if (!editingId) {
        if (!apiMode) {
          toast.error('Connect the app to the API before creating a login');
          return;
        }
        const created = await createUser({
          email,
          name: form.name.trim(),
          roleId: form.roleId,
          title: roleDefFor(form.roleId).label,
          location: form.location,
          store: storeName ?? undefined,
          storeId: storeId ?? undefined,
          mobile,
          address,
        });
        userId = created.user.id;
        password = created.password;
        setIssued({ email, password, emailed: created.emailed });
      } else if (apiMode && userId) {
        await updateUser(userId, {
          name: form.name.trim(),
          roleId: form.roleId,
          title: roleDefFor(form.roleId).label,
          location: form.location,
          ...(storeName !== undefined ? { store: storeName } : {}),
          storeId,
          mobile,
          address,
        });
      }
      const saved = {
        name: form.name.trim(),
        role: displayRole,
        station: displayRole,
        location: form.location,
        roleId: form.roleId,
        email,
        mobile,
        address,
        userId,
        storeId: storeId ?? undefined,
      };
      if (teamPerson) {
        setPeople((prev) => prev.map((person) => person.id === teamPerson.id ? { ...person, ...saved } : person));
        toast.success(`${form.name.trim()} updated`);
        navigate(`/team/${teamPerson.id}`);
        return;
      }
      const employeeId = `EMP-${String(30 + people.length).padStart(3, '0')}`;
      setPeople((prev) => [...prev, {
        id: employeeId,
        name: form.name.trim(),
        role: displayRole,
        station: displayRole,
        location: form.location,
        status: 'Off today',
        activeTasks: 0,
        capacity: 5,
        qcRejectRate: 0,
        avgCycleHrs: 0,
        tasksThisWeek: 0,
        attendancePct: 100,
        roleId: form.roleId,
        userId,
        email,
        mobile,
        address,
        storeId: storeId ?? undefined,
      }]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the employee');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <div className="p-8 text-ink-muted">Loading…</div>;
  }

  if (editingId && !teamPerson) {
    return <div className="p-8">
      <p className="text-ink-muted">Employee not found.</p>
      <Link to={home} className={buttonClass('secondary', 'md', 'mt-4')}>Back</Link>
    </div>;
  }

  if (issued) {
    return <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-[32px] font-medium tracking-tight">{issued.emailed ? 'Login emailed' : 'Login created'}</h1>
      <p className="mt-3 text-[15px] text-ink-muted">
        {issued.emailed
          ? `We emailed ${issued.email} their login and a temporary password. The first time they sign in, Darzaan asks them to choose a new password.`
          : `The account for ${issued.email} was created, but the email could not be sent. Share this temporary password. They will be asked to change it the first time they sign in.`}
      </p>
      {!issued.emailed && <p className="mt-6 rounded-2xl border border-brand/30 bg-brand-soft px-5 py-4 font-mono text-lg font-semibold">{issued.password}</p>}
      <Link to={home} className={buttonClass('primary', 'lg', 'mt-8')}>Back</Link>
    </div>;
  }

  const isLast = step === STEPS.length - 1;
  return <div className="flex min-h-full bg-canvas">
    <aside className="hidden w-[232px] shrink-0 border-r border-line md:block">
      <div className="sticky top-0">
        <div className="px-3 pt-4">
          <Link to={home} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-ink-muted hover:bg-sunken hover:text-ink">
            <XIcon className="h-4 w-4" /> Close
          </Link>
        </div>
        <OrderStepRail
          title={editingId ? 'Edit employee' : 'Onboard employee'}
          subtitle={form.name || undefined}
          step={step}
          maxStep={maxStep}
          onStep={go}
          steps={STEPS}
          ariaLabel="Employee steps"
        />
      </div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-xl flex-1 px-4 py-8 md:px-8">
        <p className="text-sm text-ink-muted tabular">Step {step + 1} of {STEPS.length}</p>
        <h1 className="mt-2 font-display text-[28px] font-medium tracking-tight">{STEPS[step].label}</h1>
        <div className="mt-6 space-y-4">
          {step === 0 && <>
            <Field label="Full name" required>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Mobile" required hint="10-digit Indian mobile.">
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputClass} inputMode="tel" />
            </Field>
            <Field label="Email" required hint="This becomes their staff login.">
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} type="email" autoComplete="off" />
            </Field>
          </>}
          {step === 1 && <>
            <Field label="Display role">
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass} placeholder="Tailor, Cutter…" />
            </Field>
            <Field label="System role" required>
              <select value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value as Role })} className={inputClass}>
                {roleOptions.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
              </select>
            </Field>
            <Field label="Store location" hint="Optional. Leave blank when this person is not based at one location.">
              <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass}>
                <option value="">No location</option>
                {form.location && !workplaces.some((location) => location.name === form.location) && (
                  <option value={form.location}>{form.location}</option>
                )}
                {workplaces.map((location) => <option key={location.id} value={location.name}>{location.name}</option>)}
              </select>
            </Field>
          </>}
          {step === 2 && <>
            <Field label="Address" required={!editingId} hint={editingId ? 'Optional for an existing account.' : undefined}>
              <input value={form.line} onChange={(e) => setForm({ ...form, line: e.target.value })} className={inputClass} placeholder="House, street" />
            </Field>
            <Field label="City" required={!editingId}>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </Field>
            <Field label="PIN code" required={!editingId}>
              <input value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} className={inputClass} inputMode="numeric" />
            </Field>
          </>}
        </div>
      </div>
      <div className="sticky bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-3 md:px-8">
          <Button variant="ghost" size="lg" icon={<ArrowLeftIcon className="h-5 w-5" />} onClick={() => go(Math.max(0, step - 1))} disabled={step === 0 || busy}>
            Back
          </Button>
          <span className="flex-1" />
          {isLast ? (
            <Button size="lg" onClick={() => void save()} disabled={busy} iconRight={<CheckIcon className="h-5 w-5" />}>
              {editingId ? 'Save' : 'Create'}
            </Button>
          ) : (
            <Button size="lg" onClick={() => go(step + 1)} iconRight={<ArrowRightIcon className="h-5 w-5" />}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>;
}
