import React from 'react';
import { toast } from 'sonner';
import { ScissorsIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Garment, Order } from '../../types';
import { fmtDate, inr, nowIso } from '../../utils/format';
import { deriveStatus, workshopAlteration } from '../../utils/orders';
import { stageOwnerLabel } from '../../utils/roles';

/** Finishing the alteration: resolves it and sends the garment to Quality check. */
export function useAlterationDone(order: Order, g: Garment) {
  const {
    updateOrder,
    logActivity
  } = useApp();
  return () => {
    const alt = workshopAlteration(order, g.id);
    if (!alt) return;
    const at = nowIso();
    const ok = updateOrder(order.id, (o) => {
      const updated: Order = {
        ...o,
        garments: o.garments.map((x) => x.id === g.id ? {
          ...x,
          stage: 'qc' as const,
          doneBy: {
            ...x.doneBy,
            alteration: x.assignee
          },
          assignee: undefined,
          qc: {
            ...x.qc,
            rechecks: (x.qc?.rechecks ?? 0) + 1,
            arrivedAt: at,
            passedAt: undefined
          }
        } : x),
        alterations: o.alterations.map((a) => a.id === alt.id ? {
          ...a,
          status: 'Resolved' as const
        } : a),
        nextAction: {
          label: 'Quality check after alteration',
          owner: stageOwnerLabel('qc')
        }
      };
      return {
        ...updated,
        status: deriveStatus(updated)
      };
    }, {
      entity: 'production_task',
      action: 'update'
    });
    if (!ok) return;
    logActivity(order.id, `${g.subCategory}: alteration done${g.assignee ? ` by ${g.assignee}` : ''} — back to Quality check`, 'alteration');
    toast.success('Alteration done', {
      description: 'It goes to Quality check, then back to the store.'
    });
  };
}

/**
 * A garment sent back from the store's trial — the same card as a QC failure:
 * what's asked for in large type, the facts underneath, then the store's note.
 * The work itself happens in the steps below it.
 */
export function AlterationBanner({
  order,
  g



}: {order: Order;g: Garment;}) {
  const alt = workshopAlteration(order, g.id);
  if (!alt) return null;
  const kind = alt.round ? 'Fit fix' : 'Customer request';
  const facts: {
    k: string;
    v: string;
  }[] = [{
    k: 'Type',
    v: alt.round ? `${kind} · round ${alt.round}` : kind
  }, {
    k: 'From trial',
    v: [fmtDate(alt.at, 'd MMM'), alt.recordedBy].filter(Boolean).join(' · ')
  }, {
    k: 'Size',
    v: alt.type === 'Small' ? 'Small' : 'Major'
  }, {
    k: 'Charge',
    v: alt.billing === 'Free' || !alt.charge ? 'Free' : inr(alt.charge)
  }];
  return <section aria-label="Alteration from trial" className="relative mb-3 overflow-hidden rounded-2xl border border-line bg-surface">
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-attention" />

      <header className="flex items-start gap-3 px-5 pb-4 pt-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-attention text-white" aria-hidden>
          <ScissorsIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-muted">Alteration from trial</p>
          <h3 className="mt-0.5 text-xl font-semibold leading-tight">{alt.issue}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-attention-soft px-2.5 py-1 text-xs font-semibold text-attention">Back for alteration</span>
      </header>

      <div className="mx-5 border-t border-line py-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {facts.map((f) => <div key={f.k} className="min-w-0">
              <dt className="text-sm text-ink-muted">{f.k}</dt>
              <dd className="mt-0.5 truncate text-[15px] font-medium tabular">{f.v}</dd>
            </div>)}
        </dl>
      </div>

      {alt.notes && <div className="mx-5 mb-5">
          <p className="mb-1.5 text-sm text-ink-muted">Note for the tailor</p>
          <p className="rounded-xl bg-sunken px-4 py-3 text-[15px] leading-relaxed">{alt.notes}</p>
        </div>}
    </section>;
}