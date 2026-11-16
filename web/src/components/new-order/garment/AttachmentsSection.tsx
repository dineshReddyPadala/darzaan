import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, MinusIcon, PlusIcon, XIcon } from 'lucide-react';
import { priceListAttachments, trims } from '../../../data/inventory';
import type { NewOrderState } from '../../../hooks/useNewOrder';
import type { Garment } from '../../../types';
import { cn } from '../../../utils/cn';
import { inr } from '../../../utils/format';

/** One dropdown; open it to tick any number of attachments. Ticked ones are listed below with a quantity. */
export function AttachmentsSection({
  o,
  g



}: {o: NewOrderState;g: Garment;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const line = (id: string) => g.attachments.find((a) => a.trimId === id);
  const setQty = (id: string, qty: number) => o.updateGarment(g.id, (x) => ({
    ...x,
    attachments: qty <= 0 ? x.attachments.filter((a) => a.trimId !== id) : x.attachments.some((a) => a.trimId === id) ? x.attachments.map((a) => a.trimId === id ? {
      ...a,
      qty
    } : a) : [...x.attachments, {
      trimId: id,
      qty
    }]
  }));
  const chosen = g.attachments.map((a) => ({
    a,
    t: trims.find((t) => t.id === a.trimId)
  })).filter((x): x is {
    a: typeof x.a;
    t: NonNullable<typeof x.t>;
  } => !!x.t);
  const total = chosen.reduce((s, {
    a,
    t
  }) => s + a.qty * t.price, 0);
  return <div className="space-y-3">
      <div ref={ref} className="relative">
        <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open} className={cn('flex h-12 w-full items-center justify-between gap-3 rounded-xl bg-surface px-4 text-left ring-1 ring-inset transition-shadow duration-150 ease-out', open ? 'ring-2 ring-brand' : 'ring-line-strong hover:ring-ink-muted')}>
          <span className={cn('truncate text-[15px]', chosen.length ? 'font-medium text-ink' : 'text-ink-muted')}>
            {chosen.length ? `${chosen.length} selected · ${chosen.map((c) => c.t.name).join(', ')}` : 'Choose attachments'}
          </span>
          <ChevronDownIcon className={cn('h-4 w-4 shrink-0 text-ink-muted transition-transform duration-150 ease-out', open && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {open && <motion.div initial={{
          opacity: 0,
          y: -4,
          scale: 0.98
        }} animate={{
          opacity: 1,
          y: 0,
          scale: 1
        }} exit={{
          opacity: 0,
          y: -4,
          scale: 0.98
        }} transition={{
          duration: 0.16,
          ease: [0.23, 1, 0.32, 1]
        }} style={{
          transformOrigin: 'top'
        }} className="mt-2 max-h-[360px] overflow-y-auto rounded-xl bg-surface py-2 shadow-pop ring-1 ring-line" role="listbox" aria-multiselectable="true" aria-label="Attachments">
              {<div className="py-1">
                  <p className="px-4 pb-1 pt-2 text-xs font-medium text-ink-muted">Tassels</p>
                  {priceListAttachments.map((t) => {
              const on = !!line(t.id);
              const out = t.stock === 0;
              return <button key={t.id} type="button" role="option" aria-selected={on} disabled={out} onClick={() => setQty(t.id, on ? 0 : 1)} className="flex min-h-[48px] w-full items-center gap-3 px-4 text-left hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50">
                        <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset', on ? 'bg-brand text-white ring-brand' : 'bg-surface ring-line-strong')} aria-hidden>
                          {on && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px]">{t.name}</span>
                        <span className="shrink-0 text-sm tabular text-ink-muted">{out ? 'Out of stock' : `${inr(t.price)}/${t.unit}`}</span>
                      </button>;
            })}
                </div>}
              <div className="sticky bottom-0 -mb-2 border-t border-line bg-surface px-4 py-2 text-right">
                <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg px-3 text-[15px] font-medium text-brand hover:bg-brand-soft">Done</button>
              </div>
            </motion.div>}
        </AnimatePresence>
      </div>

      {chosen.length > 0 && <ul className="divide-y divide-line rounded-xl ring-1 ring-inset ring-line">
          {chosen.map(({
        a,
        t
      }) => <li key={t.id} className="flex items-center gap-3 px-4 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{t.name}</span>
                <span className="block text-sm tabular text-ink-muted">{inr(t.price * a.qty)}</span>
              </span>
              <div className="flex shrink-0 items-center rounded-lg ring-1 ring-inset ring-line-strong">
                <button type="button" onClick={() => setQty(t.id, a.qty - 1)} className="flex h-9 w-9 items-center justify-center text-ink-muted" aria-label={`Fewer ${t.name}`}><MinusIcon className="h-4 w-4" /></button>
                <span className="w-7 text-center text-[15px] font-semibold tabular">{a.qty}</span>
                <button type="button" onClick={() => setQty(t.id, a.qty + 1)} className="flex h-9 w-9 items-center justify-center text-ink-muted" aria-label={`More ${t.name}`}><PlusIcon className="h-4 w-4" /></button>
              </div>
              <button type="button" onClick={() => setQty(t.id, 0)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle hover:bg-sunken hover:text-critical" aria-label={`Remove ${t.name}`}>
                <XIcon className="h-4 w-4" />
              </button>
            </li>)}
          <li className="flex justify-between px-4 py-2 text-sm">
            <span className="text-ink-muted">Attachments total</span>
            <span className="font-semibold tabular">{inr(total)}</span>
          </li>
        </ul>}
    </div>;
}