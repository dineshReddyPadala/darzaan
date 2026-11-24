import React, { useState } from 'react';
import { AlertOctagonIcon, CalendarIcon, PercentIcon, XIcon, ZapIcon } from 'lucide-react';
import { HOME_DELIVERY_CHARGE, urgencyOptions } from '../../data/catalog';
import type { NewOrderState } from '../../hooks/useNewOrder';
import type { Garment } from '../../types';
import { FULL_PCT, isFullDay, levelFor, levelMeta, loadForDate } from '../../utils/capacity';
import { cn } from '../../utils/cn';
import { fmtDate, inr } from '../../utils/format';
import { expressImpact } from '../../utils/pricing';
import { chipClass, inputClass, panelClass } from '../../utils/styles';
import { DeliveryHeatmap } from '../ui/DeliveryHeatmap';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';

/** Delivery: urgency and its own date for each garment, then handover. Discount stays tucked away. */
export function StepPricing({
  o


}: {o: NewOrderState;}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDiscount, setShowDiscount] = useState(o.discountPct > 0);
  return <div className="space-y-6">
      <h2 className="text-xl font-semibold">Delivery</h2>

      <section className={panelClass} aria-label="Delivery per garment">
        <ul className="divide-y divide-line">
          {o.garments.map((g, i) => <GarmentDelivery key={g.id} o={o} g={g} index={i} open={openId === g.id} onToggle={() => setOpenId(openId === g.id ? null : g.id)} />)}
        </ul>
      </section>

      <DatesReview o={o} />

      {o.overloaded.length > 0 && !openId && <FullDayReason o={o} names={o.overloaded.map((g) => g.subCategory || g.category)} />}

      <section className={`${panelClass} space-y-5 p-5`}>
        <div>
          <p className="mb-2 text-sm font-medium text-ink-muted">Handover</p>
          <Segmented fullWidth size="lg" value={o.deliveryMode} onChange={o.setDeliveryMode} options={[{
          value: 'Store pickup',
          label: 'Store pickup'
        }, {
          value: 'Home delivery',
          label: `Home delivery +${inr(HOME_DELIVERY_CHARGE)}`
        }]} />
        </div>
        <div className="border-t border-line pt-4">
          {showDiscount ? <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-muted">Discount</p>
                <button type="button" onClick={() => {
              o.setDiscountPct(0);
              setShowDiscount(false);
            }} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-ink-muted hover:bg-sunken hover:text-ink">
                  <XIcon className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 5, 10, 15].map((d) => <button key={d} type="button" onClick={() => o.setDiscountPct(d)} className={chipClass(o.discountPct === d)}>{d === 0 ? 'None' : `${d}%`}</button>)}
              </div>
              {o.discountPct > 10 && <p className="mt-2 text-sm text-attention">Over 10% is logged for manager review.</p>}
            </div> : <button type="button" onClick={() => setShowDiscount(true)} className="inline-flex h-9 items-center gap-1.5 text-[15px] font-medium text-brand hover:underline">
              <PercentIcon className="h-4 w-4" /> Apply discount
            </button>}
        </div>
      </section>
    </div>;
}
/** Shown wherever a full day is picked: in the date pop-up and on the Delivery step. */
function FullDayReason({
  o,
  names,
  autoFocus




}: {o: NewOrderState;names: string[];autoFocus?: boolean;}) {
  const missing = !o.overrideReason.trim();
  return <div role="alert" className="rounded-xl border border-critical/30 bg-critical-soft p-4">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-critical">
        <AlertOctagonIcon className="h-5 w-5 shrink-0" /> Workshop full · {names.join(', ')}
      </p>
      <Field label="Reason" required className="mt-3">
        <input autoFocus={autoFocus} value={o.overrideReason} onChange={(e) => o.setOverrideReason(e.target.value)} placeholder="e.g. Wedding date fixed" aria-invalid={missing} className={cn(inputClass, 'bg-surface', missing && 'border-critical')} />
      </Field>
    </div>;
}
/** Every garment's date on one capacity calendar, so the whole order can be checked at a glance. */
function DatesReview({
  o


}: {o: NewOrderState;}) {
  const rows = o.garments.map((g, i) => ({
    g,
    i,
    date: o.dateFor(g)
  })).sort((a, b) => a.date.localeCompare(b.date));
  const markers: Record<string, number> = {};
  rows.forEach((r) => {
    markers[r.date] = (markers[r.date] ?? 0) + 1;
  });
  const urgent = rows.filter((r) => r.g.urgency !== 'Regular').map((r) => r.date);
  const first = rows[0]?.date;
  return <section className={`${panelClass} p-5`} aria-label="Review delivery dates">
      <h3 className="mb-4 text-[15px] font-semibold">Review dates</h3>
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.5fr)_minmax(240px,1fr)]">
        <DeliveryHeatmap key={first} startOn={first} markers={markers} urgent={urgent} minDate={o.minDeliveryDate} orders={o.orders} size="large" />
        <ul className="divide-y divide-line self-start rounded-xl ring-1 ring-line">
          {rows.map(({
          g,
          i,
          date
        }) => {
          const load = loadForDate(date, o.orders);
          return <li key={g.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold tabular">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{g.subCategory || g.category}</span>
                  <span className="block text-sm text-ink-muted">{fmtDate(date, 'EEE d MMM')}{g.urgency !== 'Regular' ? ' · express' : ''}</span>
                </span>
                {load !== null && <span className={cn('text-sm font-medium tabular', load >= FULL_PCT ? 'text-critical' : load >= 85 ? 'text-attention' : 'text-success')}>{load}%</span>}
              </li>;
        })}
          <li className="flex items-center justify-between px-4 py-3 text-[15px]">
            <span className="text-ink-muted">Order ready by</span>
            <span className="font-semibold">{fmtDate(rows[rows.length - 1]?.date ?? first, 'EEE d MMM')}</span>
          </li>
        </ul>
      </div>
    </section>;
}
function GarmentDelivery({
  o,
  g,
  index,
  open,
  onToggle






}: {o: NewOrderState;g: Garment;index: number;open: boolean;onToggle: () => void;}) {
  const date = o.dateFor(g);
  const express = g.urgency !== 'Regular';
  const charge = expressImpact(g, g.urgency);
  const load = loadForDate(date, o.orders);
  const level = load !== null ? levelFor(load) : null;
  const full = !express && isFullDay(date, o.orders);
  return <li>
      <div className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_minmax(190px,auto)] md:items-center">
        <p className="min-w-0 truncate text-[15px] font-semibold md:col-span-2"><span className="mr-2 text-ink-muted tabular">{index + 1}</span>{g.subCategory || g.category}</p>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={`Urgency for ${g.subCategory || g.category}`}>
          {urgencyOptions.map((u) => {
          const on = g.urgency === u.value;
          return <button key={u.value} type="button" role="radio" aria-checked={on} onClick={() => o.setUrgency(g.id, u.value)} className={cn('flex h-12 min-w-[84px] flex-col items-center justify-center whitespace-nowrap rounded-lg px-2 text-sm font-medium leading-tight transition-[background-color,box-shadow,color] duration-150 ease-out', on ? 'bg-brand-soft text-brand-hover ring-2 ring-inset ring-brand' : 'bg-surface text-ink ring-1 ring-inset ring-line-strong hover:bg-canvas')}>
                {u.days ? `${u.days}-day` : 'Regular'}
                <span className={cn('text-xs', on ? 'text-brand' : 'text-ink-muted')}>{u.surchargePct ? `+${u.surchargePct * 100}%` : 'Standard'}</span>
              </button>;
        })}
        </div>
        <button type="button" onClick={onToggle} disabled={express} aria-expanded={open} className={cn('flex h-11 items-center justify-between gap-2 rounded-lg px-3 text-left ring-1 ring-inset transition-colors duration-150 ease-out', express ? 'bg-canvas ring-line' : open ? 'bg-sunken ring-line-strong' : 'bg-surface ring-line-strong hover:bg-canvas')}>
          <span className="flex items-center gap-2">
            {express ? <ZapIcon className="h-4 w-4 text-warning" /> : <CalendarIcon className="h-4 w-4 text-ink-muted" />}
            <span className="text-[15px] font-semibold">{fmtDate(date, 'EEE d MMM')}</span>
            {charge > 0 && <span className="text-sm tabular text-ink-muted">+{inr(charge)}</span>}
          </span>
          {!express && <span className="text-sm font-medium text-brand">Change</span>}
        </button>
      </div>
      <Modal open={open && !express} onClose={onToggle} title={`Delivery date · ${g.subCategory || g.category}`} size="lg" footer={<>
            <p className="mr-auto self-center text-[15px]">
              <span className="font-semibold">{fmtDate(date, 'EEE d MMM')}</span>
              {load !== null && level && <span className={cn('ml-2 text-sm font-medium', load >= FULL_PCT ? 'text-critical' : load >= 85 ? 'text-attention' : 'text-success')}>{load}% · {levelMeta[level].label}</span>}
            </p>
            <Button onClick={onToggle} disabled={full && !o.overrideReason.trim()}>Done</Button>
          </>}>
        <div className="space-y-4">
          <DeliveryHeatmap selected={date} onSelect={(d) => o.setGarmentDate(g.id, d)} minDate={o.minDeliveryDate} size="large" />
          {full && <FullDayReason o={o} names={[g.subCategory || g.category]} autoFocus />}
        </div>
      </Modal>
    </li>;
}