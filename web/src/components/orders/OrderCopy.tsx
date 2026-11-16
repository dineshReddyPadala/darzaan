import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { orderTerms, samplers, urgencyOptions } from '../../data/catalog';
import { fabrics, trims } from '../../data/inventory';
import type { Order } from '../../types';
import { fmtDate, fmtDateTime, inr } from '../../utils/format';
import { garmentDue } from '../../utils/orders';
import { garmentBreakdown, orderTotals } from '../../utils/pricing';
import { BrandMark } from '../layout/BrandMark';
import { QrGlyph } from '../ui/QrGlyph';
export function OrderCopy({
  order,
  kind



}: {order: Order;kind: 'customer' | 'sales' | 'production';}) {
  const {
    getCustomer
  } = useApp();
  const c = getCustomer(order.customerId);
  const t = orderTotals(order);
  const title = {
    customer: 'Customer copy',
    sales: 'Sales copy',
    production: 'Production copy'
  }[kind];
  return <article className="rounded-2xl border border-line bg-surface p-6 shadow-soft md:p-8">
      <header className="flex items-start justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-display text-lg font-medium">Darzaan</p>
            <p className="text-xs text-ink-subtle">{title} · Khan Market, New Delhi</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-mono text-[15px] font-semibold">{order.id}</p>
            <p className="text-xs text-ink-subtle">{fmtDateTime(order.createdAt)}</p>
          </div>
          <QrGlyph value={order.id} size={60} />
        </div>
      </header>

      <div className="grid gap-4 border-b border-line py-5 text-sm sm:grid-cols-3">
        <div>
          <p className="text-ink-subtle">{kind === 'production' ? 'Customer ref' : 'Customer'}</p>
          <p className="text-[15px] font-medium">{kind === 'production' ? `${c?.id} · ${c?.name.split(' ')[0]}` : c?.name}</p>
          {kind !== 'production' && <p className="text-ink-muted">{c?.mobile}</p>}
        </div>
        <div>
          <p className="text-ink-subtle">Delivery</p>
          <p className="text-[15px] font-medium">{fmtDate(order.deliveryDate, 'EEE, d MMM yyyy')}</p>
          <p className="text-ink-muted">{order.deliveryMode}</p>
        </div>
        <div>
          <p className="text-ink-subtle">Designer</p>
          <p className="text-[15px] font-medium">{order.designer}</p>
          <p className="text-ink-muted">{order.priority}</p>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {order.garments.map((g, i) => {
        const f = fabrics.find((x) => x.id === g.fabric.fabricId);
        const s = samplers.find((x) => x.id === g.embroidery.samplerId);
        const b = garmentBreakdown(g);
        const urgency = urgencyOptions.find((u) => u.value === g.urgency);
        const attachments = g.attachments.map((a) => `${trims.find((x) => x.id === a.trimId)?.name} × ${a.qty}`).join(', ');
        return <li key={g.id} className="py-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-semibold">
                  <span className="mr-2 text-xs tabular text-ink-subtle">{i + 1}</span>
                  {g.subCategory} <span className="font-normal text-ink-muted">· {g.category}</span>
                </p>
                {kind !== 'production' ? <span className="text-[15px] tabular">{inr(b.total)}{b.pricePending ? ' + design' : ''}</span> : <span className="text-sm font-medium">Due {fmtDate(garmentDue(order, g))}</span>}
              </div>
              {kind !== 'production' ? <dl className="mt-2 space-y-1 text-sm text-ink-muted">
                  <Line k={g.subCategory} v={inr(b.base)} />
                  {b.fabric > 0 && <Line k={`Fabric · ${f?.type} ${f?.name}, ${g.fabric.meters} m`} v={inr(b.fabric)} />}
                  {b.embroidery > 0 && <Line k={g.embroidery.mode === 'Custom' ? 'Custom design' : `Embroidery · ${s?.name}`} v={inr(b.embroidery)} />}
                  {b.pricePending && <Line k="Custom design" v="Price to be confirmed" />}
                  {b.attachments > 0 && <Line k={`Attachments · ${attachments}`} v={inr(b.attachments)} />}
                  {b.express > 0 && <Line k={`${urgency?.label} (+${(urgency?.surchargePct ?? 0) * 100}%)`} v={inr(b.express)} />}
                </dl> : <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-ink-muted sm:grid-cols-2">
                  <p>Fabric: {g.fabric.source === 'Darzaan' ? `${f?.type} ${f?.name}, ${g.fabric.meters} m` : g.fabric.pieces.map((p) => [p.material, p.colour].filter(Boolean).join(' ')).join(', ') || 'Customer’s own garment'}</p>
                  <p>Embroidery: {g.embroidery.mode === 'None' ? 'None' : g.embroidery.mode === 'Sampler' ? `${s?.name} (${s?.id})` : `Custom — ${g.embroidery.versions.find((v) => v.id === g.embroidery.approvedVersionId)?.label ?? 'pending'}`}</p>
                  <p>Attachments: {attachments || 'None'}</p>
                  {g.urgency !== 'Regular' && <p className="font-medium text-ink">{urgency?.label}</p>}
                  <p className="sm:col-span-2">
                    Measurements (inches{g.measurementVerified ? ', verified' : ', UNVERIFIED'}): {Object.entries(g.measurements).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}
                  </p>
                </div>}
              {kind === 'production' && g.notes && <p className="mt-1 text-sm text-ink-muted">Notes: {g.notes}</p>}
            </li>;
      })}
      </ul>

      {kind !== 'production' && <dl className="space-y-1.5 border-t border-line pt-4 text-[15px]">
          <Line k="Subtotal" v={inr(t.subtotal)} strong={false} />
          {t.urgency > 0 && <Line k="incl. urgency charges" v={inr(t.urgency)} strong={false} />}
          {t.discount > 0 && <Line k="Discount" v={`−${inr(t.discount)}`} strong={false} />}
          <Line k="GST" v={inr(t.gst)} strong={false} />
          {t.delivery > 0 && <Line k="Delivery" v={inr(t.delivery)} strong={false} />}
          <Line k="Total" v={inr(t.total)} strong />
          <Line k="Paid" v={inr(t.paid)} strong={false} />
          <Line k="Balance" v={inr(t.balance)} strong />
          {kind === 'sales' && order.payments.map((p) => <p key={p.id} className="text-sm text-ink-subtle">{p.kind}: {inr(p.amount)} · {p.method} · {p.reference} · {p.by} · {fmtDateTime(p.at)}</p>)}
        </dl>}

      {kind === 'customer' && <section className="mt-5 border-t border-line pt-4" aria-label="Terms and conditions">
          <h3 className="text-sm font-semibold">Terms & conditions</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-ink-muted">
            {orderTerms.map((term) => <li key={term}>{term}</li>)}
          </ol>
          <p className="mt-3 text-xs text-ink-subtle">Track your order: darzaan.in/track/{order.id}</p>
        </section>}
      {kind !== 'customer' && <footer className="mt-5 border-t border-line pt-4 text-xs text-ink-subtle">
          {kind === 'sales' && `Signatures: ${order.signatures.map((s) => `${s.role} ${s.name} (v${s.version})`).join(' · ')}`}
          {kind === 'production' && 'Only approved design versions are listed. Raise doubts with the Production Assistant.'}
        </footer>}
    </article>;
}
function Line({
  k,
  v,
  strong




}: {k: string;v: string;strong?: boolean;}) {
  return <div className={`flex justify-between gap-4 ${strong ? 'font-semibold text-ink' : ''}`}>
      <dt className={strong === false ? 'text-ink-muted' : 'min-w-0 truncate'}>{k}</dt>
      <dd className="shrink-0 tabular">{v}</dd>
    </div>;
}