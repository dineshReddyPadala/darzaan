import React, { useState } from 'react';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Alteration, Order } from '../../types';
import { fmtDate, fmtDateTime, inr } from '../../utils/format';
import { panelClass } from '../../utils/styles';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AlterationForm } from './AlterationForm';
const statuses: Alteration['status'][] = ['Open', 'In workshop', 'Resolved'];

/** Trial booking and every alteration, recorded and updated right on the order. */
export function TrialsAlterationsCard({
  order,
  onBook,
  onStartTrial




}: {order: Order;onBook: () => void;onStartTrial: () => void;}) {
  const {
    can,
    updateOrder,
    logActivity
  } = useApp();
  const [adding, setAdding] = useState(false);
  const trial = order.trial;
  const active = order.status !== 'Closed' && order.status !== 'Cancelled';
  const setStatus = (a: Alteration, status: Alteration['status']) => {
    if (!updateOrder(order.id, (o) => ({
      ...o,
      alterations: o.alterations.map((x) => x.id === a.id ? {
        ...x,
        status
      } : x)
    }), {
      entity: 'alteration',
      action: 'update'
    })) return;
    logActivity(order.id, `Alteration “${a.issue}” → ${status}`, 'alteration');
    toast.success(`Marked ${status.toLowerCase()}`);
  };
  return <section className={panelClass} aria-labelledby="trials-h">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id="trials-h" className="text-[16px] font-semibold">Trials & alterations</h2>
        {active && can('alteration', 'create') && <Button size="sm" variant="secondary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setAdding(true)}>Add alteration</Button>}
      </header>

      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-muted">Trial</p>
          {trial ? <p className="text-[16px] font-semibold">{fmtDate(trial.date, 'EEE, d MMM')} · {trial.time}{trial.notes ? <span className="font-normal text-ink-muted"> · {trial.notes}</span> : null}</p> : <p className="text-[16px] text-ink-subtle">Not booked</p>}
        </div>
        {trial && <Badge tone={trial.status === 'Completed' ? 'success' : trial.status === 'Missed' ? 'critical' : 'info'}>{trial.status}</Badge>}
        {active && <div className="flex gap-2">
            {can('trial', trial ? 'update' : 'create') && <Button size="sm" variant="ghost" onClick={onBook}>{trial ? 'Reschedule' : 'Book trial'}</Button>}
            {trial?.status === 'Scheduled' && can('trial', 'update') && <Button size="sm" onClick={onStartTrial}>Start trial</Button>}
          </div>}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add alteration" size="lg">
        <AlterationForm order={order} onSaved={() => setAdding(false)} onCancel={() => setAdding(false)} />
      </Modal>

      <ul className="divide-y divide-line border-t border-line">
        {order.alterations.map((a) => {
        const paid = (a.billing ?? (a.charge > 0 ? 'Paid' : 'Free')) === 'Paid';
        const garment = order.garments.find((g) => g.id === a.garmentId)?.subCategory;
        return <li key={a.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">
                  {a.issue}
                  <span className="font-normal text-ink-muted"> · {garment ? `${garment} · ` : ''}{a.type === 'Small' ? 'in store' : 'workshop'}</span>
                </p>
                {a.notes && <p className="text-sm text-ink-muted">{a.notes}</p>}
                <p className="mt-0.5 text-xs text-ink-subtle">{fmtDateTime(a.at)}{a.recordedBy ? ` · ${a.recordedBy}` : ''}</p>
              </div>
              <Badge tone={paid ? 'warning' : 'success'}>{a.round ? `#${a.round} · ` : ''}{paid ? `${a.round ? '' : 'Paid · '}${inr(a.charge)}` : 'Free'}</Badge>
              {can('alteration', 'update') ? <select value={a.status} onChange={(e) => setStatus(a, e.target.value as Alteration['status'])} aria-label={`Status of ${a.issue}`} className="h-8 rounded-lg bg-surface px-2 text-sm font-medium ring-1 ring-inset ring-line-strong">
                  {statuses.map((s) => <option key={s}>{s}</option>)}
                </select> : <Badge tone={a.status === 'Resolved' ? 'success' : 'attention'}>{a.status}</Badge>}
            </li>;
      })}
        {order.alterations.length === 0 && <li className="px-5 py-5 text-sm text-ink-subtle">No alterations yet.</li>}
      </ul>
    </section>;
}