import React from 'react';
import { ClockIcon, PencilIcon, ShieldCheckIcon, ZapIcon } from 'lucide-react';
import { samplers, urgencyOptions } from '../../data/catalog';
import { fabrics, trims } from '../../data/inventory';
import { needsFabric, type NewOrderState } from '../../hooks/useNewOrder';
import { fmtDate, inr } from '../../utils/format';
import { garmentBreakdown } from '../../utils/pricing';
import { panelClass } from '../../utils/styles';
import { Badge } from '../ui/Badge';
import { PriceBreakdown } from './PriceBreakdown';

/** Review comes before payment and signatures — the customer checks everything, then pays and signs. */
export function StepReview({
  o


}: {o: NewOrderState;}) {
  const Edit = ({
    step,
    garmentId



  }: {step: number;garmentId?: string;}) => <button onClick={() => {
    o.editFromReview(step, garmentId);
    document.getElementById('main-scroll')?.scrollTo({
      top: 0
    });
  }} className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
      <PencilIcon className="h-3.5 w-3.5" /> Edit
    </button>;
  return <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review with the customer</h2>

      <section className={`${panelClass} p-5`}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold">Customer</h3>
          <Edit step={0} />
        </div>
        <p className="text-[15px]">{o.customer?.name} · {o.customer?.mobile}</p>
        <p className="text-sm text-ink-muted">Designer {o.basics.designer} · Assistant {o.basics.assistant} · Updates via {o.basics.whatsappUnavailable ? 'SMS & email' : 'WhatsApp'} · Behaviour {o.customer?.behaviour ?? 'Easy-going'}</p>
      </section>

      {o.garments.map((g, i) => {
      const b = garmentBreakdown(g);
      const fabric = fabrics.find((f) => f.id === g.fabric.fabricId);
      const sampler = samplers.find((s) => s.id === g.embroidery.samplerId);
      const approved = g.embroidery.versions.find((v) => v.id === g.embroidery.approvedVersionId);
      const fabricText = !needsFabric(g) ? 'Customer’s own garment' : g.fabric.source === 'Darzaan' ? `${fabric?.type} — ${fabric?.name}, ${g.fabric.meters} m` : `Customer’s fabric: ${g.fabric.pieces.map((p) => [p.material === 'Other' ? p.materialDetail || 'Other' : p.material || 'Fabric', p.colour, `${p.length} m`].filter(Boolean).join(', ')).join('; ')}`;
      const colour = g.fabric.colourHex ? [g.fabric.colourName, g.fabric.colourCode, g.fabric.colourHex].filter(Boolean).join(' · ') : 'Not set';
      const rows: [string, string, number][] = [['Fabric', fabricText, 1], ['Colour', colour, 1], ['Embroidery', g.embroidery.mode === 'None' ? 'None' : g.embroidery.mode === 'Sampler' ? `${sampler?.name} (${sampler?.id})${g.embroidery.placement ? ` · ${g.embroidery.placement}` : ''}` : `Custom — ${approved?.label ?? 'not saved yet'}${g.customQuote?.discountPct ? ` · ${g.customQuote.discountPct}% off` : ''}`, 1], ['Lining', g.lining ? g.liningFabric ?? 'Yes' : 'No', 1], ['Attachments', g.attachments.length ? g.attachments.map((a) => `${trims.find((t) => t.id === a.trimId)?.name} × ${a.qty}`).join(', ') : 'None', 1], ['Measurements', Object.keys(g.measurements).length ? `${Object.keys(g.measurements).length} values, inches` : 'None', 1], ...(g.details && Object.keys(g.details).length ? [['Fit details', Object.entries(g.details).filter(([, v]) => v.trim()).map(([k, v]) => `${k}: ${v}`).join(' · '), 1] as [string, string, number]] : []), ['Delivery', `${fmtDate(o.dateFor(g), 'EEE d MMM')} · ${urgencyOptions.find((u) => u.value === g.urgency)?.label ?? 'Regular'}`, 2]];
      return <section key={g.id} className={`${panelClass} p-5`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm tabular text-ink-subtle">{i + 1}</span>
                <h3 className="text-[16px] font-semibold">{g.subCategory}</h3>
                <span className="text-sm text-ink-subtle">{g.category}</span>
                {g.urgency !== 'Regular' && <Badge tone="warning"><ZapIcon className="h-3 w-3" />{urgencyOptions.find((u) => u.value === g.urgency)?.short}</Badge>}
                {g.measurementVerified && Object.keys(g.measurements).length > 0 && <Badge tone="success"><ShieldCheckIcon className="h-3 w-3" />Verified</Badge>}
                {b.pricePending && <Badge tone="attention"><ClockIcon className="h-3 w-3" />Design price pending</Badge>}
              </div>
              <span className="text-[15px] font-semibold tabular">{inr(b.total)}</span>
            </div>
            <dl className="divide-y divide-line">
              {rows.map(([k, v, step]) => <div key={k} className="flex items-start gap-4 py-2.5">
                  <dt className="w-32 shrink-0 text-sm text-ink-muted">{k}</dt>
                  <dd className="flex-1 text-[15px]">{v}</dd>
                  <Edit step={step} garmentId={g.id} />
                </div>)}
            </dl>
            {g.notes && <p className="mt-2 rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted">{g.notes}</p>}
          </section>;
    })}

      <section className={`${panelClass} grid gap-6 p-5 md:grid-cols-2`}>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[16px] font-semibold">Delivery</h3>
            <Edit step={2} />
          </div>
          <p className="text-[15px]">Last garment ready {fmtDate(o.deliveryDate, 'EEEE, d MMMM yyyy')} · {o.deliveryMode}</p>
          {o.overrideReason && <p className="text-sm text-ink-muted">Full-day reason: {o.overrideReason}</p>}
          <p className="mt-3 text-sm text-ink-muted">Advance to collect next: <span className="font-semibold text-ink">{inr(o.advanceRequired)}</span> (70%)</p>
        </div>
        <div>
          <h3 className="mb-2 text-[16px] font-semibold">Total</h3>
          <PriceBreakdown garments={o.garments} totals={o.totals} discountPct={o.discountPct} />
        </div>
      </section>
    </div>;
}