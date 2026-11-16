import React from 'react';
import { GripVerticalIcon, PencilIcon, UserPlusIcon, ZapIcon } from 'lucide-react';
import type { Garment, Order } from '../../types';
import { cn } from '../../utils/cn';
import { useQc } from '../../contexts/QcContext';
import { daysUntil, fmtDate } from '../../utils/format';
import { garmentDue } from '../../utils/orders';
import { isBehind } from '../../utils/production';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface ProductionCardProps {
  order: Order;
  garment: Garment;
  customer: string;
  draggable?: boolean;
  lifted?: boolean;
  /** Highlights the viewer’s own work on a read-only board. */
  mine?: boolean;
  /** Planners pick the assistant right on the card. */
  onAssign?: () => void;
}

/** Board card: order and due date, customer, garment and days to make, then the one assistant. */
export function ProductionCard({ order, garment, customer, draggable, lifted, mine, onAssign }: ProductionCardProps) {
  const due = garmentDue(order, garment);
  const behind = isBehind(order, garment);
  const express = garment.urgency !== 'Regular';
  const name = garment.productionAssistant;
  const { reworks } = useQc();
  // The open QC send-back for this garment, if any — tagged on the card instead of a separate list.
  const rework = reworks.filter((r) => r.orderId === order.id && r.garmentId === garment.id && !r.closedAt).sort((a, b) => (b.events[0]?.at ?? '').localeCompare(a.events[0]?.at ?? ''))[0];
  return <div className={cn('rounded-xl border p-3.5 shadow-soft transition-[border-color,box-shadow] duration-150 ease-out', behind ? 'border-critical/60 bg-critical-soft' : 'bg-surface', !behind && (mine ? 'border-brand/50 ring-2 ring-brand/25' : 'border-line-strong'), lifted ? 'shadow-pop ring-2 ring-brand/40' : !behind && 'hover:border-ink-subtle')}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-mono text-xs text-ink-muted">
          {draggable && <GripVerticalIcon className="-ml-1 h-4 w-4 text-ink-subtle" aria-hidden />}
          {order.id}
        </span>
        <span className={cn('flex items-center gap-1 text-xs font-medium tabular', behind ? 'text-critical' : 'text-ink-muted')}>
          {express && <ZapIcon className="h-3.5 w-3.5 text-critical" aria-label={garment.urgency} />}
          Due {fmtDate(due, 'd MMM')}
          {behind && <span className="sr-only"> — behind schedule</span>}
        </span>
      </div>

      <p className="mt-2 truncate text-[15px] font-semibold leading-snug text-ink">{customer}</p>
      <p className="truncate text-sm text-ink-muted">
        {garment.subCategory}{garment.makeDays ? <span className="tabular"> · {garment.makeDays}d</span> : null}
      </p>
      {rework && <div className="mt-2.5 space-y-1">
          {rework.status === 'Ready for QC' ? <Badge tone="info">QC recheck</Badge> : <>
              <Badge tone="critical" className="max-w-full"><span className="truncate">Sent back · {rework.defect.type}</span></Badge>
              <p className={cn('truncate text-xs', daysUntil(rework.due) < 0 ? 'font-medium text-critical' : 'text-ink-muted')}>
                {rework.assignee} · fix by {fmtDate(rework.due, 'd MMM')}
              </p>
            </>}
        </div>}

      <div className="mt-3 border-t border-line pt-2.5 text-sm">
        {onAssign ? <button type="button" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onClick={(e) => {
        e.stopPropagation();
        onAssign();
      }} aria-label={name ? `Assistant ${name} — change for ${order.id}` : `Unassigned — assign a production assistant to ${order.id}`} className="-mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors duration-150 ease-out hover:bg-sunken focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <AssistantFace name={name} />
            <span className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-muted ring-1 ring-inset ring-line-strong" aria-hidden>
              {name ? <PencilIcon className="h-3.5 w-3.5" /> : <UserPlusIcon className="h-3.5 w-3.5 text-attention" />}
            </span>
          </button> : <div className="flex items-center gap-2 py-1"><AssistantFace name={name} /></div>}
      </div>
    </div>;
}

function AssistantFace({ name }: {name?: string;}) {
  return name ? <><Avatar name={name} size="sm" /><span className="truncate">{name}</span></> : <span className="font-medium text-attention">Unassigned</span>;
}