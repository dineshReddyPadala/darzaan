import React from 'react';
import { urgencyOptions } from '../../data/catalog';
import type { StorePricing } from '../../data/store-settings';
import { inputClass, panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';

function Row({ label, hint, value, suffix, onChange }: { label: string; hint?: string; value: number; suffix: string; onChange: (value: number) => void }) {
  return <div className="flex items-center gap-4 px-5 py-3.5">
    <div className="flex-1">
      <p className="text-[15px]">{label}</p>
      {hint && <p className="text-sm text-ink-subtle">{hint}</p>}
    </div>
    <div className="relative w-32">
      <input value={Number.isFinite(value) ? value : ''} inputMode="decimal" className={`${inputClass} h-10 pr-10 tabular`} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">{suffix}</span>
    </div>
  </div>;
}

export function PricingSettings({ value, onChange, onSave }: { value: StorePricing; onChange: (next: StorePricing) => void; onSave: () => void }) {
  const set = (patch: Partial<StorePricing>) => onChange({ ...value, ...patch });
  return <div className="space-y-6">
    <section className={panelClass}>
      <h3 className="border-b border-line px-5 py-4 text-[16px] font-semibold">Express surcharges</h3>
      <div className="divide-y divide-line">
        {urgencyOptions.filter((u) => u.days).map((u) => <Row key={u.value} label={u.label} hint="Applied to labour (base, embroidery, construction, finishing)" value={value.expressPct[u.value] ?? 0} suffix="%" onChange={(pct) => set({ expressPct: { ...value.expressPct, [u.value]: pct } })} />)}
      </div>
    </section>
    <section className={panelClass}>
      <h3 className="border-b border-line px-5 py-4 text-[16px] font-semibold">Order rules</h3>
      <div className="divide-y divide-line">
        <Row label="GST" value={value.gstPct} suffix="%" onChange={(gstPct) => set({ gstPct })} />
        <Row label="Advance required" value={value.advancePct} suffix="%" onChange={(advancePct) => set({ advancePct })} />
        <Row label="Home delivery" value={value.homeDelivery} suffix="₹" onChange={(homeDelivery) => set({ homeDelivery })} />
        <Row label="Alteration charge (full)" value={value.alterationCharge} suffix="₹" onChange={(alterationCharge) => set({ alterationCharge })} />
        {value.alterationTiers.map((pct, i) => <Row key={i} label={`Alteration #${i + 1}${i === value.alterationTiers.length - 1 ? ' and after' : ''}`} value={pct} suffix="%" onChange={(next) => set({ alterationTiers: value.alterationTiers.map((item, index) => index === i ? next : item) })} />)}
        <Row label="Max discount without approval" value={value.maxDiscountPct} suffix="%" onChange={(maxDiscountPct) => set({ maxDiscountPct })} />
      </div>
    </section>
    <Button onClick={onSave}>Save pricing</Button>
  </div>;
}
