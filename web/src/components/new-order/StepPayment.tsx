import React from 'react';
import { format } from 'date-fns';
import { ADVANCE_PCT } from '../../data/catalog';
import type { NewOrderState } from '../../hooks/useNewOrder';
import type { PaymentMethod } from '../../types';
import { cn } from '../../utils/cn';
import { inr } from '../../utils/format';
import { chipClass, inputClass, panelClass } from '../../utils/styles';
import { Field } from '../ui/Field';
import { QrGlyph } from '../ui/QrGlyph';
import { Segmented } from '../ui/Segmented';
import { SignaturePad } from '../ui/SignaturePad';
const refPlaceholder: Record<PaymentMethod, string> = {
  UPI: 'UPI transaction ID',
  Card: 'Last 4 digits / approval code',
  Cash: 'Receipt number',
  'Bank transfer': 'UTR / SWIFT reference'
};
export function StepPayment({
  o


}: {o: NewOrderState;}) {
  const balance = Math.max(0, o.totals.total - o.amount);
  const short = o.amount < o.advanceRequired;
  const preset = o.payment.amount === null ? '70' : o.amount === o.totals.total ? '100' : 'custom';
  return <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Payment & signature</h2>
        <p className="mt-1 text-ink-muted">{ADVANCE_PCT * 100}% advance and both signatures confirm the order.</p>
      </div>

      <section className={`${panelClass} p-5`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-5">
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-ink-muted">Order total</dt>
                <dd className="text-xl font-semibold tabular">{inr(o.totals.total)}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">Advance required</dt>
                <dd className="text-xl font-semibold tabular">{inr(o.advanceRequired)}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-muted">Balance after</dt>
                <dd className="text-xl font-semibold tabular">{inr(balance)}</dd>
              </div>
            </dl>
            <div>
              <p className="mb-2 text-sm font-medium text-ink-muted">Amount received</p>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => o.setPayment({
                ...o.payment,
                amount: null
              })} className={chipClass(preset === '70')}>70% advance</button>
                <button onClick={() => o.setPayment({
                ...o.payment,
                amount: o.totals.total
              })} className={chipClass(preset === '100')}>Pay in full</button>
                <div className="relative w-44">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
                  <input inputMode="numeric" value={o.amount} onChange={(e) => o.setPayment({
                  ...o.payment,
                  amount: Number(e.target.value.replace(/\D/g, '')) || 0
                })} className={cn(inputClass, 'h-10 pl-8 tabular', short && 'border-attention')} aria-label="Amount received" />
                </div>
              </div>
              {short && <p className="mt-2 text-sm text-attention">Below the 70% advance. {o.canOverride ? 'Allowed with your manager approval — it will be flagged on the order.' : 'A store manager must approve.'}</p>}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink-muted">Method</p>
              <Segmented size="lg" fullWidth value={o.payment.method} onChange={(method) => o.setPayment({
              ...o.payment,
              method
            })} options={(['UPI', 'Card', 'Cash', 'Bank transfer'] as PaymentMethod[]).map((m) => ({
              value: m,
              label: m
            }))} />
            </div>
            <Field label="Payment reference">
              <input value={o.payment.reference} onChange={(e) => o.setPayment({
              ...o.payment,
              reference: e.target.value
            })} placeholder={refPlaceholder[o.payment.method]} className={inputClass} />
            </Field>
            <p className="text-sm text-ink-subtle">Recorded by {o.user.name} · {format(new Date(), 'h:mm a')} · receipt sent automatically</p>
          </div>
          {o.payment.method === 'UPI' && <div className="flex flex-col items-center rounded-2xl bg-canvas p-5 text-center">
              <QrGlyph value={`upi-${o.orderNumber}-${o.amount}`} size={148} />
              <p className="mt-3 text-sm text-ink-muted">Customer scans to pay</p>
              <p className="text-lg font-semibold tabular">{inr(o.amount)}</p>
            </div>}
        </div>
      </section>

      <section className={`${panelClass} p-5`}>
        <h3 className="mb-1 text-[16px] font-semibold">Signatures</h3>
        <p className="mb-4 text-sm text-ink-muted">
          The customer agrees to the garments, approved designs, measurements, delivery date, and policies — two free alterations, then {inr(1500)} each; express orders are non-refundable.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <SignaturePad label="Designer" signerName={o.basics.designer} signed={o.signatures.designer} onSignedChange={(v) => o.setSignatures({
          ...o.signatures,
          designer: v
        })} />
          <SignaturePad label="Customer" signerName={o.customer?.name ?? 'Customer'} signed={o.signatures.customer} onSignedChange={(v) => o.setSignatures({
          ...o.signatures,
          customer: v
        })} />
        </div>
        <p className="mt-3 text-xs text-ink-subtle">Signed against order version 1. Any later change will ask for re-approval.</p>
      </section>
    </div>;
}