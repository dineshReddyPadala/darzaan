import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckIcon, MessageCircleIcon } from 'lucide-react';
import { BrandMark } from '../components/layout/BrandMark';
import { useApp } from '../contexts/AppContext';
import { publicOrder } from '../services/api';
import { apiMode } from '../services/mode';
import type { Customer, Order } from '../types';
import { cn } from '../utils/cn';
import { fmtDate, fmtDateTime, inr } from '../utils/format';
import { trackerSteps } from '../utils/orders';
import { orderTotals } from '../utils/pricing';
const kindForStep: Record<string, string[]> = {
  confirmed: ['created'],
  production: ['production', 'assignment'],
  qc: ['qc'],
  ready: ['logistics'],
  trial: ['trial'],
  alteration: ['alteration'],
  pickup: ['communication'],
  delivered: ['closure']
};
export function CustomerTracker() {
  const {
    id = ''
  } = useParams();
  const {
    getOrder,
    getCustomer
  } = useApp();
  const fromDesk = getOrder(id);
  const [loaded, setLoaded] = useState<{ order: Order; customer: Pick<Customer, 'id' | 'name'> } | null>(null);
  const [checked, setChecked] = useState(!apiMode || !!fromDesk);
  useEffect(() => {
    if (fromDesk || !apiMode) return;
    publicOrder(id).then((body) => {
      setLoaded({ order: body.order as Order, customer: body.customer });
    }).catch(() => undefined).finally(() => setChecked(true));
  }, [fromDesk, id]);
  const order = fromDesk ?? loaded?.order;
  const fetchedCustomer = loaded?.customer;
  if (!order) {
    if (!checked) return <div className="min-h-screen bg-canvas" />;
    return <div className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink-muted">We couldn’t find order {id}.</div>;
  }
  const c = getCustomer(order.customerId) ?? fetchedCustomer;
  const steps = trackerSteps(order);
  const t = orderTotals(order);
  const currentIdx = steps.findIndex((s) => s.state === 'current');
  const next = steps.slice(currentIdx + 1).find((s) => s.state === 'upcoming');
  return <div className="min-h-screen w-full bg-canvas px-4 py-8 text-ink">
      <main className="mx-auto max-w-lg">
        <header className="mb-8 flex items-center gap-3">
          <BrandMark />
          <span className="font-display text-xl font-medium">Darzaan</span>
        </header>
        <p className="text-[15px] text-ink-muted">Hi {c?.name.split(' ')[0]},</p>
        <h1 className="mt-1 font-display text-[30px] font-medium leading-tight tracking-tight">
          {order.status === 'Closed' ? 'Your order has been delivered' : `Your ${order.garments.length > 1 ? 'garments are' : order.garments[0].subCategory.toLowerCase() + ' is'} ${steps[currentIdx]?.label.toLowerCase() ?? 'on the way'}`}
        </h1>
        <p className="mt-2 text-[15px] text-ink-muted">Order {order.id} · expected {fmtDate(order.deliveryDate, 'EEEE, d MMMM')}</p>

        {next && order.status !== 'Closed' && <div className="mt-6 rounded-2xl bg-brand-soft px-5 py-4">
            <p className="text-sm text-brand">What happens next</p>
            <p className="text-[15px] font-medium">{next.label} — {next.detail}</p>
          </div>}

        <ol className="mt-8 rounded-2xl border border-line bg-surface p-5">
          {steps.map((s, i) => {
          const ev = [...order.activity].reverse().find((a) => kindForStep[s.key]?.includes(a.kind));
          return <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && <span className={cn('absolute left-[13px] top-8 h-[calc(100%-24px)] w-0.5', s.state === 'done' ? 'bg-brand/40' : 'bg-line')} aria-hidden />}
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', s.state === 'done' && 'bg-brand-muted text-brand-hover', s.state === 'current' && 'bg-brand text-white ring-4 ring-brand-soft', s.state === 'upcoming' && 'border-2 border-line-strong bg-surface', s.state === 'skipped' && 'border-2 border-dashed border-line-strong bg-surface')}>
                  {s.state === 'done' && <CheckIcon className="h-4 w-4" />}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={cn('text-[15px] font-semibold', (s.state === 'upcoming' || s.state === 'skipped') && 'text-ink-subtle')}>
                    {s.label}
                    {s.state === 'skipped' && <span className="ml-2 text-sm font-normal">Not needed</span>}
                  </p>
                  {(s.state === 'current' || s.state === 'done') && <p className="text-sm text-ink-muted">{s.detail}</p>}
                  {s.state === 'done' && ev && <p className="mt-0.5 text-xs text-ink-subtle">{fmtDateTime(ev.at)}</p>}
                </div>
              </li>;
        })}
        </ol>

        <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-[15px] font-semibold">Your order</h2>
          <ul className="space-y-1.5 text-[15px]">
            {order.garments.map((g) => <li key={g.id}>{g.subCategory}</li>)}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-3 text-[15px]">
            <span className="text-ink-muted">Balance at pickup</span>
            <span className="font-semibold tabular">{inr(t.balance)}</span>
          </div>
        </section>

        <a href="#" onClick={(e) => e.preventDefault()} className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-surface text-[15px] font-medium ring-1 ring-inset ring-line-strong">
          <MessageCircleIcon className="h-5 w-5" /> Message {order.designer.split(' ')[0]} at the store
        </a>
        <p className="mt-6 text-center text-xs text-ink-subtle">Darzaan · Khan Market, New Delhi</p>
      </main>
    </div>;
}