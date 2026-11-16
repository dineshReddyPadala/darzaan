import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useStore } from '../../contexts/StoreContext';
import { fmtDateTime } from '../../utils/format';
import { panelClass } from '../../utils/styles';
import { Button } from '../ui/Button';

/** Designer / Salesperson: drafts started on the floor, waiting to be priced. */
export function FloorDraftsPanel() {
  const {
    customerName,
    user,
    can
  } = useApp();
  const {
    drafts,
    updateDraft
  } = useStore();
  const navigate = useNavigate();
  const open = drafts.filter((d) => d.status !== 'Priced');
  if (!open.length) return null;
  const price = (id: string, customerId: string) => {
    updateDraft(id, {
      status: 'Priced'
    });
    navigate(`/orders/new?customer=${customerId}`);
  };
  return <section className={panelClass} aria-labelledby="drafts-h">
      <div className="px-5 pb-2 pt-5">
        <h2 id="drafts-h" className="text-lg font-semibold">Drafts from the floor</h2>
      </div>
      <ul className="divide-y divide-line">
        {open.map((d) => <li key={d.id} className="space-y-1.5 px-5 py-4">
            <p className="text-[15px] font-semibold">{customerName(d.customerId)} · {d.garments.join(', ') || 'Not sure yet'}</p>
            {d.source === 'Storefront' ? <p className="text-sm text-ink-muted">
                <span className="font-medium text-brand">Booked online</span> · consultation {d.visit}
                {d.assignedTo === user.name ? ' · assigned to you' : ` · for ${d.assignedTo.split(' ')[0]}`}
              </p> : <p className="text-sm text-ink-muted">
              {d.fabric ? `Own fabric: ${d.fabric.material}, ${d.fabric.length} m · ` : ''}{d.photos} photo{d.photos === 1 ? '' : 's'} · {d.by.split(' ')[0]}, {fmtDateTime(d.at)}
              {d.assignedTo === user.name ? ' · assigned to you' : ` · for ${d.assignedTo.split(' ')[0]}`}
            </p>}
            {d.flagged.length > 0 && <p className="text-sm text-attention">Verify {d.flagged.join(', ')} — far from the saved profile</p>}
            {d.status === 'Customer undecided' && <p className="text-sm text-ink-muted">Customer still deciding{d.followUp ? ` — follow up ${d.followUp}` : ''}</p>}
            {d.note && <p className="text-sm text-ink-subtle">“{d.note}”</p>}
            {can('order', 'create') && <Button size="sm" className="mt-1" onClick={() => price(d.id, d.customerId)}>Price & start order</Button>}
          </li>)}
      </ul>
    </section>;
}