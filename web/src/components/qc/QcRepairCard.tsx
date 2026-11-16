import React from 'react';
import { CheckIcon, WrenchIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useQcGarment } from '../../hooks/useQcGarment';
import { cn } from '../../utils/cn';
import { fmtDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

/** Shown on the order's Workflow tab when QC sent a garment back. One action: Repair done → back to QC. */
export function QcRepairCard({
  orderId,
  garmentId,
  canFinish




}: {orderId: string;garmentId: string;canFinish: boolean;}) {
  const qc = useQcGarment(orderId, garmentId);
  const {
    role
  } = useApp();
  const rw = qc.openRework;
  if (!rw) return null;
  const ready = rw.status === 'Ready for QC';
  const d = rw.defect;
  return <section className={cn('flex flex-col gap-4 rounded-2xl border px-5 py-4 sm:flex-row sm:items-center', ready ? 'border-line bg-surface' : 'border-critical/30 bg-critical-soft')} aria-label="Repair from QC">
      {d.photos[0] ? <img src={d.photos[0]} alt="Problem found at QC" className="h-16 w-16 shrink-0 rounded-xl object-cover" /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface text-critical"><WrenchIcon className="h-6 w-6" /></span>}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[16px] font-semibold text-ink">Repair from QC: {d.type}</p>
          {ready ? <Badge tone="attention" dot>Waiting for QC</Badge> : <Badge tone="critical" dot>Needs repair</Badge>}
        </div>
        <p className="mt-0.5 text-[15px] text-ink-muted">{d.location} · {d.description}</p>
        <p className="mt-0.5 text-sm text-ink-subtle">{rw.assignee}, {rw.team} · fix by {fmtDate(rw.due, 'd MMM')}</p>
      </div>
      {!ready && canFinish && role !== 'qc' && <Button size="lg" icon={<CheckIcon className="h-5 w-5" />} onClick={qc.readyForQc} className="shrink-0">Repair done</Button>}
    </section>;
}