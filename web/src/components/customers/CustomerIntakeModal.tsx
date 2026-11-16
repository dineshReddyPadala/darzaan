import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRightIcon, UserCheckIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { occasions } from '../../data/catalog';
import type { Customer } from '../../types';
import { TODAY_ISO } from '../../utils/format';
import { activeLocations } from '../../utils/locations';
import { chipClass, inputClass, textareaClass } from '../../utils/styles';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { PhotoCapture } from '../ui/PhotoCapture';
import { Toggle } from '../ui/Toggle';
const budgets = ['Under ₹10k', '₹10k–25k', '₹25k–60k', '₹60k+'];
export function CustomerIntakeModal({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const {
    customers,
    addCustomer,
    user
  } = useApp();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [mode, setMode] = useState<'lookup' | 'create'>('lookup');
  const [form, setForm] = useState({
    name: '',
    email: '',
    whatsappSame: true,
    noWhatsapp: false,
    occasion: 'Wedding',
    budget: '₹10k–25k',
    timeline: '',
    notes: ''
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const places = activeLocations().filter((place) => user.storeId == null || String(place.id) === String(user.storeId));
  const [storeId, setStoreId] = useState(user.storeId != null ? String(user.storeId) : '');
  const digits = mobile.replace(/\D/g, '');
  const matches = useMemo(() => digits.length >= 4 ? customers.filter((c) => c.mobile.replace(/\D/g, '').includes(digits)) : [], [digits, customers]);
  const dupes = useMemo(() => {
    const n = form.name.trim().toLowerCase();
    return n.length > 2 ? customers.filter((c) => c.name.toLowerCase() === n) : [];
  }, [form.name, customers]);
  const reset = () => {
    setMobile('');
    setMode('lookup');
    setForm({
      name: '',
      email: '',
      whatsappSame: true,
      noWhatsapp: false,
      occasion: 'Wedding',
      budget: '₹10k–25k',
      timeline: '',
      notes: ''
    });
    setPhotos([]);
  };
  const close = () => {
    reset();
    onClose();
  };
  const create = async (startOrder: boolean) => {
    if (!form.name.trim()) {
      toast.error('Add the customer’s name');
      return;
    }
    const place = places.find((row) => String(row.id) === storeId);
    if (!place) {
      toast.error('Choose a store location');
      return;
    }
    const id = `C-${1011 + customers.length}`;
    const formatted = digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : mobile;
    const c: Customer = {
      id,
      storeId: place.id,
      name: form.name.trim(),
      mobile: formatted,
      whatsapp: form.noWhatsapp ? '' : formatted,
      whatsappAvailable: !form.noWhatsapp,
      email: form.email,
      city: 'New Delhi',
      since: TODAY_ISO,
      tier: 'New',
      designer: user.name,
      preferences: [form.occasion, form.budget].filter(Boolean),
      notes: [form.timeline && `Needed by ${form.timeline}`, form.notes].filter(Boolean).join('. '),
      remote: false,
      measurementProfiles: []
    };
    const saved = await addCustomer(c);
    if (!saved) return;
    toast.success(`${saved.name} added`, {
      description: saved.whatsappAvailable ? 'Welcome message sent on WhatsApp' : 'Welcome SMS sent'
    });
    close();
    navigate(startOrder ? `/orders/new?customer=${saved.id}` : `/customers/${saved.id}`);
  };
  return <Modal open={open} onClose={close} size="lg" title={mode === 'lookup' ? 'Who’s in the store?' : 'New customer'} description={mode === 'lookup' ? 'Start with their mobile number — we’ll find them if they’ve visited before.' : 'Capture what you discussed. Everything carries into the order.'} footer={mode === 'create' ? <>
            <Button variant="ghost" onClick={() => setMode('lookup')}>Back</Button>
            <Button variant="secondary" onClick={() => create(false)}>Save profile</Button>
            <Button onClick={() => create(true)} iconRight={<ArrowRightIcon className="h-4 w-4" />}>Save & start order</Button>
          </> : undefined}>
      {mode === 'lookup' ? <div>
          <Field label="Mobile number">
            <input autoFocus inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="98110 24567" className={`${inputClass} h-14 text-xl tabular`} />
          </Field>
          <div className="mt-5">
            {matches.length > 0 ? <ul className="space-y-2">
                {matches.map((c) => <li key={c.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4">
                    <Avatar name={c.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[17px] font-semibold">
                        {c.name} <UserCheckIcon className="h-4 w-4 text-success" aria-label="Existing customer" />
                      </p>
                      <p className="text-sm text-ink-muted">{c.mobile} · {c.tier} · with {c.designer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => {
                close();
                navigate(`/customers/${c.id}`);
              }}>Open profile</Button>
                      <Button onClick={() => {
                close();
                navigate(`/orders/new?customer=${c.id}`);
              }}>Start order</Button>
                    </div>
                  </li>)}
              </ul> : digits.length >= 10 ? <div className="rounded-2xl bg-canvas p-5">
                <p className="text-[15px] font-medium">No customer with this number yet.</p>
                <Button className="mt-3" onClick={() => setMode('create')}>Create new customer</Button>
              </div> : <p className="text-sm text-ink-subtle">Matches appear as you type.</p>}
          </div>
        </div> : <div className="space-y-5">
          {dupes.length > 0 && <div className="rounded-2xl bg-attention-soft px-4 py-3 text-[15px] text-attention">
              <p className="font-medium">{dupes[0].name} already exists ({dupes[0].mobile}).</p>
              <p className="text-sm">Same person with a new number? Open their profile — the manager merges records.</p>
              <button type="button" onClick={() => {
          close();
          navigate(`/customers/${dupes[0].id}`);
        }} className="mt-1 text-sm font-semibold underline">Open existing profile</button>
            </div>}
          <Field label="Store location" required>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={inputClass}>
              <option value="">Choose a location</option>
              {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
            </select>
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" required>
              <input autoFocus value={form.name} onChange={(e) => setForm({
            ...form,
            name: e.target.value
          })} className={inputClass} placeholder="e.g. Aditi Kulkarni" />
            </Field>
            <Field label="Mobile">
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputClass} inputMode="tel" />
            </Field>
            <Field label="Email" hint="Optional — used for invoices">
              <input value={form.email} onChange={(e) => setForm({
            ...form,
            email: e.target.value
          })} className={inputClass} inputMode="email" />
            </Field>
            <Field label="Needed by">
              <input type="date" value={form.timeline} min={TODAY_ISO} onChange={(e) => setForm({
            ...form,
            timeline: e.target.value
          })} className={inputClass} />
            </Field>
          </div>
          <div className="rounded-2xl border border-line px-4 py-3">
            <Toggle checked={form.noWhatsapp} onChange={(v) => setForm({
          ...form,
          noWhatsapp: v
        })} label="WhatsApp unavailable" description="Updates will go by SMS and email instead." />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink-muted">Occasion</p>
            <div className="flex flex-wrap gap-2">
              {occasions.map((o) => <button key={o} type="button" onClick={() => setForm({
            ...form,
            occasion: o
          })} className={chipClass(form.occasion === o)}>{o}</button>)}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-ink-muted">Budget</p>
            <div className="flex flex-wrap gap-2">
              {budgets.map((b) => <button key={b} type="button" onClick={() => setForm({
            ...form,
            budget: b
          })} className={chipClass(form.budget === b)}>{b}</button>)}
            </div>
          </div>
          <Field label="Notes from the conversation">
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({
          ...form,
          notes: e.target.value
        })} className={textareaClass} placeholder="Colours they love, silhouettes, who's coming for trials…" />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-ink-muted">Reference images</p>
            <PhotoCapture photos={photos} onChange={setPhotos} label="Add reference" hint="Screenshots or photos the customer shows you." />
          </div>
        </div>}
    </Modal>;
}