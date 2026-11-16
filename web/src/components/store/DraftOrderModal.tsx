import React, { useEffect, useMemo, useState } from 'react';
import { XIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useStore } from '../../contexts/StoreContext';
import { liveCategories, liveSubs } from '../../data/catalog';
import { MEASUREMENT_FLAG_DELTA } from '../../data/store';
import { cn } from '../../utils/cn';
import { todayPlus } from '../../utils/format';
import { teamList } from '../../utils/team';
import { chipClass, inputClass, textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { PhotoCapture } from '../ui/PhotoCapture';
import { Toggle } from '../ui/Toggle';

/** The floor captures the visit; the Designer or Salesperson prices it. No price guessing at the counter. */
export function DraftOrderModal({
  open,
  onClose,
  customerId




}: {open: boolean;onClose: () => void;customerId?: string;}) {
  const {
    customers,
    getCustomer
  } = useApp();
  const {
    saveDraft
  } = useStore();
  const [cid, setCid] = useState(customerId ?? '');
  const [cat, setCat] = useState(liveCategories()[0]?.name ?? '');
  const [garments, setGarments] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ownFabric, setOwnFabric] = useState(false);
  const [fabric, setFabric] = useState({
    material: '',
    length: '',
    pieces: '1'
  });
  const [fabricPhotos, setFabricPhotos] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const people = teamList();
  const [assignee, setAssignee] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) setCid(customerId ?? '');
  }, [open, customerId]);
  const catDef = liveCategories().find((c) => c.name === cat) ?? liveCategories()[0];
  const fields = catDef?.measurements.fields.slice(0, 4) ?? [];
  const profile = getCustomer(cid)?.measurementProfiles.find((p) => p.category === cat) ?? getCustomer(cid)?.measurementProfiles[0];
  const flagged = useMemo(() => fields.filter((f) => {
    const v = Number(values[f]);
    const saved = profile?.values[f];
    return v > 0 && saved !== undefined && Math.abs(v - saved) > MEASUREMENT_FLAG_DELTA;
  }), [fields, values, profile]);
  const reset = () => {
    setGarments([]);
    setPhotos([]);
    setOwnFabric(false);
    setFabric({
      material: '',
      length: '',
      pieces: '1'
    });
    setFabricPhotos([]);
    setValues({});
    setNote('');
  };
  const fabricOk = !ownFabric || fabric.material.trim() && Number(fabric.length) > 0 && fabricPhotos.length > 0;
  const valid = !!cid && garments.length > 0 && fabricOk;
  const save = (undecided: boolean) => {
    if (!valid) return;
    const measurements = Object.fromEntries(Object.entries(values).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)]));
    saveDraft({
      customerId: cid,
      garments,
      fabric: ownFabric ? {
        material: fabric.material.trim(),
        length: Number(fabric.length),
        pieces: Number(fabric.pieces) || 1
      } : null,
      photos: photos.length + fabricPhotos.length,
      measurements,
      flagged,
      note: note.trim(),
      assignedTo: assignee,
      status: undecided ? 'Customer undecided' : 'With designer',
      followUp: undecided ? todayPlus(2) : undefined
    });
    reset();
    onClose();
  };
  return <Modal open={open} onClose={onClose} size="lg" title="Draft order" description="Capture what the customer wants. The Designer or Salesperson prices and confirms it." footer={<>
        <Button variant="ghost" disabled={!valid} onClick={() => save(true)}>Customer undecided — follow up</Button>
        <Button disabled={!valid} onClick={() => save(false)}>Send to {assignee.split(' ')[0]} to price</Button>
      </>}>
      <div className="space-y-6">
        <Field label="Customer" required>
          <select value={cid} onChange={(e) => setCid(e.target.value)} className={inputClass}>
            <option value="">Choose a customer…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.mobile}</option>)}
          </select>
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">Garments wanted <span className="text-brand" aria-hidden>*</span></p>
          <div className="mb-3 flex flex-wrap gap-2">
            {liveCategories().map((c) => <button key={c.name} onClick={() => setCat(c.name)} className={chipClass(cat === c.name)}>{c.name}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {liveSubs(catDef?.subCategories ?? []).map((s) => <button key={s.name} onClick={() => setGarments((g) => [...g, s.name])} className="rounded-full border border-dashed border-line-strong px-3 py-1.5 text-sm text-ink-muted hover:border-brand hover:text-brand">+ {s.name}</button>)}
          </div>
          {garments.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">
              {garments.map((g, i) => <li key={`${g}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1 text-sm font-medium text-brand-hover">
                  {g}
                  <button onClick={() => setGarments((x) => x.filter((_, j) => j !== i))} aria-label={`Remove ${g}`} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-brand-muted"><XIcon className="h-3.5 w-3.5" /></button>
                </li>)}
            </ul>}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">Reference photos</p>
          <PhotoCapture photos={photos} onChange={setPhotos} label="Add reference" />
        </div>

        <div className="rounded-2xl border border-line p-4">
          <Toggle checked={ownFabric} onChange={setOwnFabric} label="Customer brought their own fabric" description="Photograph and count it — the store is responsible for it from now." />
          {ownFabric && <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_110px_90px]">
                <Field label="Material"><input value={fabric.material} onChange={(e) => setFabric({
                ...fabric,
                material: e.target.value
              })} className={inputClass} placeholder="e.g. Cotton, indigo print" /></Field>
                <Field label="Length (m)"><input value={fabric.length} onChange={(e) => setFabric({
                ...fabric,
                length: e.target.value.replace(/[^\d.]/g, '')
              })} inputMode="decimal" className={`${inputClass} tabular`} /></Field>
                <Field label="Pieces"><input value={fabric.pieces} onChange={(e) => setFabric({
                ...fabric,
                pieces: e.target.value.replace(/\D/g, '')
              })} inputMode="numeric" className={`${inputClass} tabular`} /></Field>
              </div>
              <PhotoCapture photos={fabricPhotos} onChange={setFabricPhotos} label="Photo of the fabric" hint="Required — proof of what the customer handed over." />
            </div>}
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-ink-muted">Rough measurements ({cat}, inches)</p>
          <p className="mb-3 text-xs text-ink-subtle">Optional. Values far from the saved profile are marked for the Designer to verify.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fields.map((f) => {
            const off = flagged.includes(f);
            return <label key={f} className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-muted">{f}</span>
                  <input value={values[f] ?? ''} onChange={(e) => setValues({
                ...values,
                [f]: e.target.value.replace(/[^\d.]/g, '')
              })} inputMode="decimal" className={cn(inputClass, 'tabular', off && 'ring-2 ring-attention')} />
                  {off && <span className="mt-1 block text-xs text-attention">Profile says {profile?.values[f]} — verify</span>}
                </label>;
          })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price it">
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
              <option value="">Choose</option>
              {people.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} className={textareaClass} placeholder="Occasion, needed by, budget…" />
          </Field>
        </div>
      </div>
    </Modal>;
}