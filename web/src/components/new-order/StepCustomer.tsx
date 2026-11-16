import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SearchIcon, UserPlusIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { activeLocations } from '../../utils/locations';
import { teamList } from '../../utils/team';
import type { NewOrderState } from '../../hooks/useNewOrder';
import { fmtDate, TODAY_ISO } from '../../utils/format';
import { inputClass, panelClass } from '../../utils/styles';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Segmented } from '../ui/Segmented';
import { Toggle } from '../ui/Toggle';
import type { CustomerBehaviour } from '../../types';
const behaviours: CustomerBehaviour[] = ['Easy-going', 'Particular', 'Demanding', 'Difficult'];
export function StepCustomer({
  o


}: {o: NewOrderState;}) {
  const {
    customers,
    orders,
    addCustomer,
    updateCustomer
  } = useApp();
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const people = teamList();
  const places = activeLocations().filter((place) => o.user.storeId == null || String(place.id) === String(o.user.storeId));
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, '');
    if (!s) return customers.slice(0, 5);
    return customers.filter((c) => c.name.toLowerCase().includes(s) || digits.length >= 3 && c.mobile.replace(/\D/g, '').includes(digits));
  }, [q, customers]);
  const pick = (id: string) => {
    const c = customers.find((x) => String(x.id) === String(id));
    o.setCustomerId(id);
    o.setBasics({
      ...o.basics,
      whatsappUnavailable: !c?.whatsappAvailable,
      designer: c?.designer ?? o.basics.designer
    });
  };
  const phoneDigits = newPhone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const phoneValid = phoneDigits.length === 10;
  const phoneTaken = phoneValid && customers.some((x) => x.mobile.replace(/\D/g, '').endsWith(phoneDigits));
  const startCreate = () => {
    const s = q.trim();
    const digits = s.replace(/\D/g, '');
    if (digits.length >= 3 && digits.length === s.replace(/[\s+-]/g, '').length) setNewPhone(s);else if (s) setNewName(s);
    setTouched(false);
    setCreating(true);
  };
  const create = async () => {
    setTouched(true);
    if (!newName.trim() || !phoneValid || phoneTaken) return;
    const digits = phoneDigits;
    const id = `C-${1011 + customers.length}`;
    const mobile = `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    if (!o.placeId) {
      toast.error('Choose a store location');
      return;
    }
    const saved = await addCustomer({
      id,
      storeId: Number(o.placeId),
      name: newName.trim(),
      mobile,
      whatsapp: mobile,
      whatsappAvailable: true,
      email: '',
      city: 'New Delhi',
      since: TODAY_ISO,
      tier: 'New',
      designer: o.basics.designer,
      preferences: [],
      notes: '',
      remote: false,
      measurementProfiles: []
    });
    if (!saved) return;
    o.setCustomerId(String(saved.id));
    o.setBlocked(null);
    setCreating(false);
    toast.success(`${newName.trim()} added as a new customer`);
  };
  const c = o.customer;
  const priorOrders = c ? orders.filter((x) => String(x.customerId) === String(c.id)).length : 0;
  const nameMissing = o.blocked === 'customer' && !c;
  const nameError = nameMissing || creating && touched && !newName.trim();
  return <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Who is this order for?</h2>
      </div>
      <Field label="Store location" required hint={o.blocked === 'customer' && !o.placeId ? 'Choose a store location.' : undefined}>
        <select value={o.placeId} onChange={(event) => o.setPlaceId(event.target.value)} className={inputClass}>
          <option value="">Choose a location</option>
          {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
        </select>
      </Field>

      {c ? <div className={`${panelClass} flex flex-wrap items-center gap-4 p-5`}>
          <Avatar name={c.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
              {c.name}
              <Badge tone={priorOrders > 0 ? 'success' : 'info'}>{priorOrders > 0 ? 'Existing customer' : 'New customer'}</Badge>
            </p>
            <p className="text-[15px] text-ink-muted">{c.mobile} · {c.measurementProfiles.length} saved measurement profile{c.measurementProfiles.length === 1 ? '' : 's'} · {priorOrders} previous order{priorOrders === 1 ? '' : 's'}</p>
          </div>
          <Button variant="secondary" onClick={() => o.setCustomerId(undefined)}>Change</Button>
          <div className="w-full border-t border-line pt-4">
            <p id="behaviour-label" className="mb-2 text-sm font-medium text-ink-muted">
              Customer behaviour{c.behaviour && priorOrders > 0 ? <span className="font-normal text-ink-subtle"> · from their profile</span> : null}
            </p>
            <Segmented<CustomerBehaviour> ariaLabel="Customer behaviour" fullWidth value={c.behaviour ?? 'Easy-going'} onChange={(v) => updateCustomer(c.id, (x) => ({
          ...x,
          behaviour: v
        }))} options={behaviours.map((b) => ({
          value: b,
          label: b
        }))} />
          </div>
        </div> : <div className={`${panelClass} p-5 ${nameMissing ? 'ring-2 ring-critical/40' : ''}`}>
          {!creating && <>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mobile number or name" className={`${inputClass} h-14 pl-12 text-lg`} aria-label="Find customer" />
          </div>
          <ul className="mt-3 divide-y divide-line">
            {matches.map((m) => <li key={m.id}>
                <button onClick={() => pick(m.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-canvas">
                  <Avatar name={m.name} />
                  <span className="flex-1">
                    <span className="block text-[15px] font-medium">{m.name}</span>
                    <span className="block text-sm text-ink-subtle">{m.mobile} · {m.tier}</span>
                  </span>
                  <span className="text-sm font-medium text-brand">Select</span>
                </button>
              </li>)}
          </ul>
          </>}
          {creating ? <form onSubmit={(e) => {
        e.preventDefault();
        create();
      }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[16px] font-semibold">New customer</h3>
                <button type="button" onClick={() => {
            setCreating(false);
            setTouched(false);
          }} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
                  <SearchIcon className="h-4 w-4" /> Find existing customer
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                <div>
                  <label htmlFor="new-name" className="mb-1.5 block text-sm font-medium text-ink-muted">Name <span className="text-critical" aria-hidden>*</span></label>
                  <input id="new-name" autoFocus={!newName} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Customer name" aria-required="true" aria-invalid={nameError && !newName.trim()} aria-describedby={nameError && !newName.trim() ? 'name-error' : undefined} className={`${inputClass} ${nameError && !newName.trim() ? 'border-critical' : ''}`} />
                  {nameError && !newName.trim() && <p id="name-error" role="alert" className="mt-1.5 text-sm font-medium text-critical">Enter the customer’s name.</p>}
                </div>
                <div>
                  <label htmlFor="new-phone" className="mb-1.5 block text-sm font-medium text-ink-muted">Contact number <span className="text-critical" aria-hidden>*</span></label>
                  <input id="new-phone" type="tel" inputMode="numeric" autoFocus={!!newName && !newPhone} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="98765 43210" aria-required="true" aria-invalid={touched && (!phoneValid || phoneTaken)} aria-describedby={touched && (!phoneValid || phoneTaken) ? 'phone-error' : undefined} className={`${inputClass} tabular ${touched && (!phoneValid || phoneTaken) ? 'border-critical' : ''}`} />
                  {touched && (!phoneValid || phoneTaken) && <p id="phone-error" role="alert" className="mt-1.5 text-sm font-medium text-critical">
                      {!phoneDigits ? 'Enter a contact number.' : !phoneValid ? 'Enter a 10-digit mobile number.' : 'This number already belongs to a customer — select them above.'}
                    </p>}
                </div>
                <Button type="submit" className="sm:mt-[26px]">Create & select</Button>
              </div>
            </form> : <>
              <Button variant="subtle" className="mt-3" icon={<UserPlusIcon className="h-4 w-4" />} onClick={startCreate}>
                New customer{q ? ` with “${q}”` : ''}
              </Button>
              {nameMissing && <p role="alert" className="mt-2 text-sm font-medium text-critical">Select a customer or add a new one with their name and contact number to continue.</p>}
            </>}
        </div>}

      <section className={`${panelClass} p-5`}>
        <h3 className="mb-4 text-[16px] font-semibold">Order details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Order number" hint="Generated automatically">
            <input value={o.orderNumber} readOnly className={`${inputClass} bg-canvas font-mono`} />
          </Field>
          <Field label="Date of order">
            <input value={fmtDate(o.basics.orderDate, 'EEEE, d MMM yyyy')} readOnly className={`${inputClass} bg-canvas`} />
          </Field>
          <Field label="Designer">
            <select value={o.basics.designer} onChange={(e) => o.setBasics({
            ...o.basics,
            designer: e.target.value
          })} className={inputClass}>
              <option value="">Choose</option>
              {people.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Designer assistant">
            <select value={o.basics.assistant} onChange={(e) => o.setBasics({
            ...o.basics,
            assistant: e.target.value
          })} className={inputClass}>
              <option value="">None</option>
              {people.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-5 rounded-xl border border-line px-4 py-3">
          <Toggle checked={o.basics.whatsappUnavailable} onChange={(v) => o.setBasics({
          ...o.basics,
          whatsappUnavailable: v
        })} label="WhatsApp unavailable" description={o.basics.whatsappUnavailable ? 'Updates will go by SMS and email.' : `Updates go to WhatsApp ${c?.whatsapp || ''}`} />
        </div>
      </section>
    </div>;
}