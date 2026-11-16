import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useQc } from '../../contexts/QcContext';
import type { QcIssue } from '../../types';
import { cn } from '../../utils/cn';
import { fmtDateTime } from '../../utils/format';
import { canOpenOrder } from '../../utils/roles';
import { chipClass, panelClass } from '../../utils/styles';
type Filter = 'open' | 'all';
/** Colour only on open items; resolved and fixed-at-QC rows stay neutral. */
const statusText = (i: QcIssue) => i.status === 'Resolved' || i.fixedAtQc ? 'text-ink-subtle' : i.status === 'With Production Head' ? 'font-medium text-attention' : 'font-medium text-warning';

/** Every defect, with who made it, the rework time and how often it repeated. */
export function ReworkLog({
  orderId


}: {orderId?: string;}) {
  const {
    issues
  } = useQc();
  const {
    role
  } = useApp();
  const [filter, setFilter] = useState<Filter>(orderId ? 'all' : 'open');
  const scoped = issues.filter((i) => !orderId || i.orderId === orderId);
  const list = scoped.filter((i) => filter === 'open' ? i.status !== 'Resolved' : true);
  const open = canOpenOrder(role);
  return <div>
      {!orderId && <div className="mb-4 flex flex-wrap gap-2">
          {([['open', 'Open'], ['all', 'All']] as [Filter, string][]).map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={chipClass(filter === k)}>{l}</button>)}
        </div>}
      <div className={panelClass}>
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_90px_70px_150px] gap-4 border-b border-line px-5 py-3 text-xs font-semibold text-ink-subtle md:grid">
          <span>Defect</span><span>Who made it</span><span>Rework</span><span>Fail</span><span>Status</span>
        </div>
        {list.length === 0 ? <p className="px-5 py-12 text-center text-ink-muted">No defects here.</p> : <ul className="divide-y divide-line">
            {list.map((i) => <li key={i.id} className="grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_90px_70px_150px] md:items-center md:gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-ink">{i.issue}</p>
                  <p className="text-[13px] text-ink-subtle">
                    {i.severity && <span className={i.severity === 'Critical' ? 'font-medium text-critical' : undefined}>{i.severity} · </span>}
                    {open && !orderId ? <Link to={`/orders/${i.orderId}?tab=workflow`} className="hover:underline">{i.orderId}</Link> : i.orderId} · {i.garment} · {fmtDateTime(i.at)}
                  </p>
                  {(i.blameChange || i.noPhotoReason || i.escalated || i.reworkNote) && <p className="mt-1 text-sm text-ink-muted">
                      {[i.escalated && `Escalated: ${i.escalated}`, i.blameChange && `Changed: ${i.blameChange}`, i.noPhotoReason && `No photo: ${i.noPhotoReason}`, i.reworkNote && `Rework note: ${i.reworkNote}`].filter(Boolean).join(' · ')}
                    </p>}
                </div>
                <p className="text-[15px]">{i.responsible} <span className="text-ink-muted">· {i.station}</span></p>
                <p className="text-[15px] tabular">{i.fixedAtQc ? 'At QC' : i.reworkMins ? `${i.reworkMins} min` : '—'}</p>
                <p className={cn('text-[15px] tabular', i.repeat > 1 ? 'font-medium text-ink' : 'text-ink-muted')}>#{i.repeat}</p>
                <p className={cn('text-[15px]', statusText(i))}>{i.fixedAtQc ? 'Fixed at QC' : i.status}</p>
              </li>)}
          </ul>}
      </div>
    </div>;
}