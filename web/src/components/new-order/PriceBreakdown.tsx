import React, { useState } from 'react';
import { ChevronDownIcon, ClockIcon } from 'lucide-react';
import { trims } from '../../data/inventory';
import type { Garment } from '../../types';
import { cn } from '../../utils/cn';
import { inr } from '../../utils/format';
import { garmentBreakdown, GST_RATE, urgencyPct, type Totals } from '../../utils/pricing';
export function PriceBreakdown({
  garments,
  totals,
  discountPct




}: {garments: Garment[];totals: Totals;discountPct: number;}) {
  const [open, setOpen] = useState<string | null>(garments[0]?.id ?? null);
  return <div>
      <ul className="divide-y divide-line">
        {garments.map((g, i) => {
        const b = garmentBreakdown(g);
        const isOpen = open === g.id;
        const attachmentNames = g.attachments.map((a) => trims.find((t) => t.id === a.trimId)?.name).filter(Boolean).join(', ');
        const rows = ([[g.subCategory || g.category, b.base], ['Fabric', b.fabric], [g.embroidery.mode === 'Custom' ? `Custom design${g.customQuote?.discountPct ? ` · −${g.customQuote.discountPct}%` : ''}` : 'Embroidery', b.embroidery], [attachmentNames ? `Attachments · ${attachmentNames}` : 'Attachments', b.attachments], [`Urgency · +${Math.round(urgencyPct(g) * 100)}%`, b.express]] as [string, number][]).filter(([, v]) => v > 0);
        return <li key={g.id}>
              <button onClick={() => setOpen(isOpen ? null : g.id)} className="flex w-full items-center gap-3 py-3 text-left" aria-expanded={isOpen}>
                <span className="text-xs tabular text-ink-subtle">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{g.subCategory || g.category}</span>
                  {b.pricePending && <span className="flex items-center gap-1 text-xs font-medium text-attention"><ClockIcon className="h-3 w-3" />Custom design price pending</span>}
                </span>
                <span className="text-[15px] font-semibold tabular">{inr(b.total)}</span>
                <ChevronDownIcon className={cn('h-4 w-4 text-ink-subtle transition-transform duration-150 ease-out', !isOpen && '-rotate-90')} />
              </button>
              {isOpen && <dl className="mb-3 space-y-1.5 rounded-xl bg-canvas px-4 py-3 text-sm">
                  {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4">
                      <dt className="min-w-0 truncate text-ink-muted">{k}</dt>
                      <dd className="tabular">{inr(v)}</dd>
                    </div>)}
                  {b.pricePending && <div className="flex justify-between gap-4">
                      <dt className="text-attention">Custom design</dt>
                      <dd className="text-attention">With production</dd>
                    </div>}
                </dl>}
            </li>;
      })}
      </ul>
      <dl className="mt-2 space-y-2 border-t border-line pt-4 text-[15px]">
        <Row k="Subtotal" v={inr(totals.subtotal)} />
        {totals.urgency > 0 && <Row k="incl. urgency charges" v={inr(totals.urgency)} muted />}
        {totals.discount > 0 && <Row k={`Discount (${discountPct}%)`} v={`−${inr(totals.discount)}`} accent />}
        <Row k={`GST (${GST_RATE * 100}%)`} v={inr(totals.gst)} />
        {totals.delivery > 0 && <Row k="Home delivery" v={inr(totals.delivery)} />}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="text-2xl font-semibold tabular">{inr(totals.total)}</dd>
        </div>
        {totals.pending > 0 && <p className="text-sm text-attention">+ {totals.pending} custom design price{totals.pending > 1 ? 's' : ''} to be confirmed by production</p>}
      </dl>
    </div>;
}
function Row({
  k,
  v,
  accent,
  muted





}: {k: string;v: string;accent?: boolean;muted?: boolean;}) {
  return <div className={cn('flex justify-between', muted && 'text-sm')}>
      <dt className={muted ? 'pl-3 text-ink-subtle' : 'text-ink-muted'}>{k}</dt>
      <dd className={cn('tabular', accent && 'text-success', muted && 'text-ink-subtle')}>{v}</dd>
    </div>;
}