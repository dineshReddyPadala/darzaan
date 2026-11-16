import React, { useState } from 'react';
import { toast } from 'sonner';
import { PlusIcon, XIcon } from 'lucide-react';
import { detailsFor, measurementsFor, measurementUnit, profileMatches } from '../../../data/catalog';
import { missingDetails, missingMeasurements, type NewOrderState } from '../../../hooks/useNewOrder';
import type { Garment, MeasurementSource } from '../../../types';
import { cn } from '../../../utils/cn';
import { fmtDate } from '../../../utils/format';
import { chipClass } from '../../../utils/styles';
import { Button } from '../../ui/Button';
import { PhotoCapture } from '../../ui/PhotoCapture';
import { Toggle } from '../../ui/Toggle';
import { AddMeasurementModal } from './AddMeasurementModal';
const sources: {
  value: MeasurementSource;
  label: string;
}[] = [{
  value: 'Designer',
  label: 'Taken by designer'
}, {
  value: 'Customer',
  label: 'Given by customer'
}, {
  value: 'Profile',
  label: 'Saved profile'
}, {
  value: 'Sample garment',
  label: 'Sample garment'
}];

/** Measurements for one garment, in inches, plus any extra ones added by hand. */
export function MeasurementsSection({
  o,
  g



}: {o: NewOrderState;g: Garment;}) {
  const [adding, setAdding] = useState(false);
  const standard = measurementsFor(g.category, g.subCategory);
  const details = detailsFor(g.category, g.subCategory);
  const extra = g.extraMeasurements ?? [];
  const fields = [...standard, ...extra];
  const profile = o.customer?.measurementProfiles.find((p) => profileMatches(g.category, p.category));
  const missing = missingMeasurements(g);
  const missingD = missingDetails(g);
  const showErrors = o.blocked === 'garments' && missing.length > 0;
  const showDetailErrors = o.blocked === 'garments' && missingD.length > 0;
  const setDetail = (name: string, v: string) => o.updateGarment(g.id, (x) => ({
    ...x,
    details: {
      ...x.details,
      [name]: v
    }
  }));
  /** Saved profiles use older labels ("Under Bust"); match them to this chart's names regardless of case. */
  const matchField = (key: string) => standard.find((f) => f.toLowerCase() === key.toLowerCase()) ?? key;
  const setValue = (f: string, v: string) => o.updateGarment(g.id, (x) => {
    const m = {
      ...x.measurements
    };
    if (v === '') delete m[f];else m[f] = Number(v);
    return {
      ...x,
      measurements: m,
      unit: 'in'
    };
  });
  const removeExtra = (f: string) => o.updateGarment(g.id, (x) => {
    const m = {
      ...x.measurements
    };
    delete m[f];
    return {
      ...x,
      measurements: m,
      extraMeasurements: (x.extraMeasurements ?? []).filter((n) => n !== f)
    };
  });
  const addExtra = (rows: {
    name: string;
    value?: number;
  }[]) => {
    o.updateGarment(g.id, (x) => ({
      ...x,
      extraMeasurements: [...(x.extraMeasurements ?? []), ...rows.map((r) => r.name)],
      measurements: {
        ...x.measurements,
        ...Object.fromEntries(rows.filter((r) => r.value !== undefined && !Number.isNaN(r.value)).map((r) => [r.name, r.value as number]))
      }
    }));
    toast.success(rows.length > 1 ? `${rows.length} measurements added` : `${rows[0].name} added`);
  };
  const loadProfile = () => {
    if (!profile) return;
    o.updateGarment(g.id, (x) => ({
      ...x,
      measurements: {
        ...x.measurements,
        ...Object.fromEntries(Object.entries(profile.values).filter(([, v]) => v > 0).map(([k, v]) => [matchField(k), v]))
      },
      measurementSource: 'Profile',
      measurementVerified: profile.verified,
      unit: 'in'
    }));
    toast.success(`Loaded “${profile.label}”`);
  };
  return <div className="space-y-4">
      {profile && g.measurementSource !== 'Profile' && <div className="flex flex-wrap items-center gap-4 rounded-xl bg-brand-soft px-4 py-3">
          <p className="flex-1 text-[15px]"><span className="font-semibold text-brand">Saved profile</span> <span className="text-ink-muted">· {profile.label} · {fmtDate(profile.date, 'd MMM yyyy')}</span></p>
          <Button size="sm" onClick={loadProfile}>Use these</Button>
        </div>}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Who took the measurements">
        {sources.map((s) => {
        const on = g.measurementSource === s.value;
        return <button key={s.value} type="button" role="radio" aria-checked={on} disabled={s.value === 'Profile' && !profile} onClick={() => {
          o.updateGarment(g.id, {
            measurementSource: s.value,
            measurementVerified: s.value !== 'Customer'
          });
          if (s.value === 'Profile') loadProfile();
        }} className={cn(chipClass(on), 'disabled:opacity-40')}>{s.label}</button>;
      })}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {fields.map((f) => {
        const isExtra = extra.includes(f);
        const err = showErrors && missing.includes(f);
        return <label key={f} className={cn('relative block rounded-xl px-3.5 pb-2 pt-2.5 ring-1 ring-inset transition-shadow duration-150 ease-out focus-within:ring-2 focus-within:ring-brand', err ? 'bg-critical-soft ring-critical' : g.measurements[f] !== undefined ? 'bg-surface ring-line-strong' : 'bg-canvas ring-line')}>
              <span className={cn('block truncate text-xs font-medium', err ? 'text-critical' : 'text-ink-muted', isExtra && 'pr-6')}>{f}{!isExtra && <span className="text-critical" aria-hidden> *</span>}</span>
              <span className="flex items-baseline gap-1">
                <input inputMode="decimal" aria-required={!isExtra} aria-invalid={err} value={g.measurements[f] ?? ''} onChange={(e) => setValue(f, e.target.value.replace(/[^0-9.]/g, ''))} placeholder="—" className="h-10 w-full bg-transparent text-2xl font-semibold tabular outline-none placeholder:text-line-strong" />
                <span className="text-sm text-ink-subtle">{measurementUnit(f)}</span>
              </span>
              {isExtra && <button type="button" onClick={(e) => {
            e.preventDefault();
            removeExtra(f);
          }} className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle hover:bg-sunken hover:text-critical" aria-label={`Remove ${f}`}>
                  <XIcon className="h-3.5 w-3.5" />
                </button>}
            </label>;
      })}
        <button type="button" onClick={() => setAdding(true)} className="flex min-h-[76px] items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong text-[15px] font-medium text-brand transition-colors duration-150 ease-out hover:bg-brand-soft">
          <PlusIcon className="h-4 w-4" /> Add measurement
        </button>
      </div>
      {showErrors && <p role="alert" className="text-sm font-medium text-critical">
          {missing.length} required measurement{missing.length === 1 ? '' : 's'} still to fill: {missing.join(', ')}.
        </p>}
      {details.length > 0 && <div className="border-t border-line pt-4" data-fit-details>
          <h4 className="mb-3 text-sm font-semibold">Fit details</h4>
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            {details.map((d) => {
          const value = g.details?.[d.name] ?? '';
          const err = showDetailErrors && missingD.includes(d.name);
          const labelId = `${g.id}-detail-${d.name.replace(/\W+/g, '-')}`;
          if (d.kind === 'note') return <label key={d.name} className="block md:col-span-2">
                  <span className={cn('mb-1.5 block text-xs font-medium', err ? 'text-critical' : 'text-ink-muted')}>{d.name}<span className="text-critical" aria-hidden> *</span></span>
                  <textarea rows={2} value={value} onChange={(e) => setDetail(d.name, e.target.value)} aria-required aria-invalid={err} data-detail-note placeholder="e.g. Right shoulder slightly lower, upright posture" className={cn('w-full rounded-xl px-3.5 py-2.5 text-[15px] ring-1 ring-inset outline-none transition-shadow duration-150 ease-out focus:ring-2 focus:ring-brand', err ? 'bg-critical-soft ring-critical' : 'bg-surface ring-line-strong')} />
                </label>;
          const options = d.kind === 'yesno' ? ['Yes', 'No'] : d.options;
          return <div key={d.name}>
                  <p id={labelId} className={cn('mb-1.5 text-xs font-medium', err ? 'text-critical' : 'text-ink-muted')}>{d.name}<span className="text-critical" aria-hidden> *</span></p>
                  <div role="radiogroup" aria-labelledby={labelId} aria-required aria-invalid={err} data-detail-group={value ? 'answered' : 'open'} className={cn('flex flex-wrap gap-2 rounded-xl', err && 'ring-2 ring-critical ring-offset-2')}>
                    {options.map((opt) => <button key={opt} type="button" role="radio" aria-checked={value === opt} onClick={() => setDetail(d.name, opt)} className={chipClass(value === opt)}>{opt}</button>)}
                  </div>
                </div>;
        })}
          </div>
          {showDetailErrors && <p role="alert" className="mt-3 text-sm font-medium text-critical">
              Still to answer: {missingD.join(', ')}.
            </p>}
        </div>}
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <PhotoCapture photos={g.photos} onChange={(photos) => o.updateGarment(g.id, {
        photos
      })} label="Photos" />
        <div className="rounded-xl border border-line px-4 py-3">
          <Toggle checked={g.measurementVerified} onChange={(v) => o.updateGarment(g.id, {
          measurementVerified: v
        })} label="Darzaan-verified" description={g.measurementVerified ? `By ${o.basics.designer}` : 'Flagged for production'} />
        </div>
      </div>
      <AddMeasurementModal open={adding} garmentName={g.subCategory || g.category} taken={fields} onClose={() => setAdding(false)} onSave={addExtra} />
    </div>;
}