import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronDownIcon, ClockIcon, ShieldAlertIcon, ShieldCheckIcon, ZapIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { measurementsFor, samplers, urgencyOptions } from '../../data/catalog';
import { fabrics, trims } from '../../data/inventory';
import type { Garment, Order } from '../../types';
import { cn } from '../../utils/cn';
import { fmtDate, inr } from '../../utils/format';
import { garmentDue, stageLabel } from '../../utils/orders';
import { garmentBreakdown } from '../../utils/pricing';
import { panelClass } from '../../utils/styles';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/** Every garment in one card; open a row for its fabric, design, attachments and measurements. */
export function GarmentDetailsCard({
  order


}: {order: Order;}) {
  const [open, setOpen] = useState<string | null>(order.garments.length === 1 ? order.garments[0].id : null);
  return <section className={panelClass} aria-labelledby="garments-h">
      <h2 id="garments-h" className="border-b border-line px-5 py-4 text-[16px] font-semibold">Garments <span className="ml-1 text-sm font-normal text-ink-subtle">{order.garments.length}</span></h2>
      <ul className="divide-y divide-line">
        {order.garments.map((g, i) => <Row key={g.id} order={order} g={g} index={i} open={open === g.id} onToggle={() => setOpen(open === g.id ? null : g.id)} />)}
      </ul>
    </section>;
}
function Row({
  order,
  g,
  index,
  open,
  onToggle






}: {order: Order;g: Garment;index: number;open: boolean;onToggle: () => void;}) {
  const {
    roleDef,
    can,
    updateOrder,
    logActivity
  } = useApp();
  const b = garmentBreakdown(g);
  const urgency = urgencyOptions.find((u) => u.value === g.urgency);
  const fabric = fabrics.find((f) => f.id === g.fabric.fabricId);
  const sampler = samplers.find((s) => s.id === g.embroidery.samplerId);
  const fields = measurementsFor(g.category, g.subCategory);
  // Older orders were measured on the earlier chart, so show what was actually recorded when there's a mismatch.
  const recorded = Object.keys(g.measurements);
  const shownFields = fields.length && fields.some((f) => g.measurements[f] !== undefined) ? [...fields, ...recorded.filter((f) => !fields.includes(f))] : recorded.length ? recorded : fields;
  const verify = () => {
    if (!updateOrder(order.id, (o) => ({
      ...o,
      garments: o.garments.map((x) => x.id === g.id ? {
        ...x,
        measurementVerified: true
      } : x)
    }), {
      entity: 'measurement',
      action: 'update'
    })) return;
    logActivity(order.id, `Verified measurements for ${g.subCategory}`, 'measurement');
    toast.success('Measurements verified');
  };
  const facts: [string, string][] = [['Fabric', g.fabric.source === 'Darzaan' ? fabric ? `${fabric.type} ${fabric.name} · ${g.fabric.meters} m` : '—' : g.fabric.pieces.length ? `Customer’s — ${g.fabric.pieces.map((p) => [p.material, p.colour, `${p.length} ${p.unit}`].filter(Boolean).join(', ')).join('; ')}` : 'Customer’s own garment'], ['Embroidery', g.embroidery.mode === 'None' ? 'None' : g.embroidery.mode === 'Sampler' ? `${sampler?.name ?? '—'} (${sampler?.id})` : `Custom design${b.pricePending ? ' · price pending' : ''}`], ['Attachments', g.attachments.map((a) => `${trims.find((t) => t.id === a.trimId)?.name} × ${a.qty}`).join(', ') || 'None'], ...(g.details && Object.keys(g.details).length ? [['Fit details', Object.entries(g.details).map(([k, v]) => `${k}: ${v}`).join(' · ')] as [string, string]] : [])];
  return <li>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-canvas">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold tabular text-ink-muted">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[16px] font-semibold">{g.subCategory}</span>
            {g.urgency !== 'Regular' && <Badge tone="warning"><ZapIcon className="h-3 w-3" />{urgency?.short}</Badge>}
            {b.pricePending && <Badge tone="attention"><ClockIcon className="h-3 w-3" />Price pending</Badge>}
          </span>
          <span className="block text-sm text-ink-subtle">{stageLabel(g.stage)}{g.assignee ? ` · ${g.assignee}` : ''} · due {fmtDate(garmentDue(order, g), 'd MMM')}</span>
        </span>
        {roleDef.scope.prices && <span className="text-[15px] font-semibold tabular">{inr(b.total)}</span>}
        <ChevronDownIcon className={cn('h-5 w-5 shrink-0 text-ink-subtle transition-transform duration-200 ease-out', !open && '-rotate-90')} />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.22,
        ease: [0.23, 1, 0.32, 1]
      }} className="overflow-hidden">
            <div className="space-y-5 px-5 pb-5 pl-[68px]">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {facts.map(([k, v]) => <div key={k}>
                    <dt className="text-xs font-medium text-ink-subtle">{k}</dt>
                    <dd className="text-[15px]">{v}</dd>
                  </div>)}
              </dl>
              {shownFields.length > 0 && <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-ink-subtle">Measurements · inches</p>
                    {g.measurementVerified ? <span className="flex items-center gap-1 text-xs font-medium text-success"><ShieldCheckIcon className="h-3.5 w-3.5" />Verified</span> : <span className="flex items-center gap-1 text-xs font-medium text-attention"><ShieldAlertIcon className="h-3.5 w-3.5" />Not verified</span>}
                    {!g.measurementVerified && can('measurement', 'update') && <Button size="sm" variant="ghost" onClick={verify}>Verify</Button>}
                  </div>
                  <dl className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {shownFields.map((f) => <div key={f} className="rounded-lg bg-canvas px-3 py-2">
                        <dt className="truncate text-[11px] text-ink-subtle">{f}</dt>
                        <dd className={cn('text-[16px] font-semibold tabular', g.measurements[f] === undefined && 'text-ink-subtle')}>{g.measurements[f] ?? '—'}</dd>
                      </div>)}
                  </dl>
                </div>}
              {g.notes && <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted">{g.notes}</p>}
            </div>
          </motion.div>}
      </AnimatePresence>
    </li>;
}