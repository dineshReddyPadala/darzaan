import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useApp } from '../../contexts/AppContext';
import { kanbanColumns, type WorkflowStep } from '../../data/production';
import type { Garment, Order, StageKey } from '../../types';
import { cn } from '../../utils/cn';
import { deriveStatus, stageIndex, stageLabel } from '../../utils/orders';
import { orderLink, stageOwnerLabel } from '../../utils/roles';
import { AssignAssistantModal } from './AssignAssistantModal';
import { PlanGarmentModal } from './PlanGarmentModal';
import { ProductionCard } from './ProductionCard';
export interface BoardItem {
  order: Order;
  garment: Garment;
  index: number;
  score: number;
}
const idOf = (i: BoardItem) => `${i.order.id}::${i.garment.id}`;
/** Garments sent back from a trial get their own column at the end. */
const ALTERATIONS: WorkflowStep = {
  key: 'alteration',
  label: 'Alterations',
  stages: ['alteration']
};
export function ProductionBoard({
  items,
  readOnly = false




}: {items: BoardItem[]; /** View-only board: nothing can be dragged or assigned; tapping a card opens its Workflow tab. */readOnly?: boolean;}) {
  const {
    customerName,
    role,
    can,
    updateOrder,
    logActivity,
    getOrder
  } = useApp();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [assign, setAssign] = useState<{
    id: string;
    toCol?: number;
  } | null>(null);
  const planItem = items.find((i) => idOf(i) === planId);
  const planOrder = planItem ? getOrder(planItem.order.id) ?? planItem.order : null;
  const planGarment = planItem && planOrder ? planOrder.garments.find((g) => g.id === planItem.garment.id) ?? null : null;
  const assignItem = assign ? items.find((i) => idOf(i) === assign.id) : undefined;
  /** Only the Production Head (and Admin) move, plan and assign. Cards otherwise advance as steps are done. */
  const planner = !readOnly && can('production_task', 'create');
  const openPath = (orderId: string) => orderLink(role, orderId, 'workflow');
  const columns = [...kanbanColumns, ALTERATIONS];
  const colOf = (stage: StageKey) => columns.findIndex((c) => c.stages.includes(stage));
  const isAlteration = (ci: number) => columns[ci]?.key === ALTERATIONS.key;
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 6
    }
  }), useSensor(TouchSensor, {
    activationConstraint: {
      delay: 180,
      tolerance: 6
    }
  }), useSensor(KeyboardSensor, {
    keyboardCodes: {
      start: ['Space'],
      cancel: ['Escape'],
      end: ['Space']
    }
  }));
  const allowedMove = (it: BoardItem, toCol: number) => {
    const from = colOf(it.garment.stage);
    // Alterations come from the store's trial and finish from the Workflow tab, never by dragging.
    return planner && toCol !== from && !isAlteration(from) && !isAlteration(toCol);
  };
  const mayDrag = (it: BoardItem) => planner && it.garment.stage !== 'alteration';
  const active = items.find((i) => idOf(i) === activeId);
  const liveGarment = (it: BoardItem) => getOrder(it.order.id)?.garments.find((g) => g.id === it.garment.id);
  const moveCard = (it: BoardItem, toCol: number) => {
    const live = liveGarment(it);
    if (!live) return;
    const target = columns[toCol].stages[0];
    const backward = stageIndex(target) < stageIndex(live.stage);
    const ok = updateOrder(it.order.id, (o) => {
      const garments = o.garments.map((g) => g.id === live.id ? {
        ...g,
        stage: target,
        assignee: undefined
      } : g);
      const updated = {
        ...o,
        garments,
        nextAction: {
          label: stageLabel(target),
          owner: stageOwnerLabel(target)
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
    logActivity(it.order.id, `${live.subCategory}: ${backward ? 'sent back' : 'moved'} from ${stageLabel(live.stage)} to ${stageLabel(target)}`, 'production');
    toast.success(`Moved to ${columns[toCol].label}`);
  };
  const setAssistant = (it: BoardItem, name: string) => {
    const ok = updateOrder(it.order.id, (o) => ({
      ...o,
      garments: o.garments.map((g) => g.id === it.garment.id ? {
        ...g,
        productionAssistant: name
      } : g)
    }), {
      entity: 'production_task',
      action: 'update'
    });
    if (ok) logActivity(it.order.id, `${it.garment.subCategory}: Production Assistant ${name}`, 'production');
    return ok;
  };
  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const it = items.find((i) => idOf(i) === e.active.id);
    if (!it || !e.over) return;
    const toCol = columns.findIndex((c) => c.key === e.over!.id);
    if (toCol < 0 || toCol === colOf(it.garment.stage)) return;
    if (!allowedMove(it, toCol)) {
      toast.error('Can’t move this card there');
      return;
    }
    // Like an unowned ticket: nobody is on it yet, so ask before it moves on.
    if (!liveGarment(it)?.productionAssistant) {
      setAssign({
        id: idOf(it),
        toCol
      });
      return;
    }
    moveCard(it, toCol);
  };
  return <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-4">
          {columns.map((col, ci) => {
          const cards = items.filter((i) => col.stages.includes(i.garment.stage)).sort((a, b) => b.score - a.score);
          const canDrop = active ? allowedMove(active, ci) : false;
          return <Column key={col.key} id={col.key} label={col.label} count={cards.length} dragging={!!active} canDrop={canDrop}>
                {cards.map((c) => <DraggableCard key={idOf(c)} id={idOf(c)} disabled={!mayDrag(c)} onOpen={() => {
              if (planner && c.garment.stage !== 'alteration') return setPlanId(idOf(c));
              const to = openPath(c.order.id);
              if (to) navigate(to);
            }}>
                    <ProductionCard order={c.order} garment={c.garment} customer={customerName(c.order.customerId)} draggable={mayDrag(c)} onAssign={planner && c.garment.stage !== 'alteration' ? () => setAssign({
                id: idOf(c)
              }) : undefined} />
                  </DraggableCard>)}
                {cards.length === 0 && <p className="px-1 py-6 text-center text-sm text-ink-subtle">Clear</p>}
              </Column>;
        })}
        </div>
      </div>
      <DragOverlay dropAnimation={{
      duration: 180,
      easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
    }}>
        {active && <div className="w-[240px] rotate-[1.5deg] cursor-grabbing">
            <ProductionCard order={active.order} garment={active.garment} customer={customerName(active.order.customerId)} draggable lifted />
          </div>}
      </DragOverlay>
      {planner && <PlanGarmentModal order={planGarment ? planOrder : null} garment={planGarment} onClose={() => setPlanId(null)} />}
      {planner && <AssignAssistantModal open={!!assignItem} garment={assignItem?.garment.subCategory ?? ''} customer={assignItem ? customerName(assignItem.order.customerId) : ''} current={assignItem ? liveGarment(assignItem)?.productionAssistant : undefined} moveTo={assign?.toCol !== undefined ? columns[assign.toCol]?.label : undefined} onClose={() => setAssign(null)} onPick={(name) => {
      if (!assignItem) return;
      const ok = setAssistant(assignItem, name);
      if (ok && assign?.toCol !== undefined) moveCard(assignItem, assign.toCol);else if (ok) toast.success(`${name} assigned`);
      setAssign(null);
    }} />}
    </DndContext>;
}
function Column({
  id,
  label,
  count,
  dragging,
  canDrop,
  children







}: {id: string;label: string;count: number;dragging: boolean;canDrop: boolean;children: React.ReactNode;}) {
  const {
    setNodeRef,
    isOver
  } = useDroppable({
    id
  });
  return <section ref={setNodeRef} aria-label={label} className={cn('flex min-h-[calc(100vh-320px)] w-[264px] shrink-0 flex-col rounded-2xl border p-3 transition-[background-color,border-color] duration-150 ease-out', isOver && canDrop ? 'border-brand bg-brand-soft' : dragging && canDrop ? 'border-dashed border-brand/50 bg-sunken' : 'border-line bg-sunken')}>
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="rounded-full border border-line-strong bg-surface px-2 text-xs font-medium tabular text-ink-muted">{count}</span>
      </header>
      <div className="min-h-[80px] flex-1 space-y-2.5">{children}</div>
    </section>;
}
function DraggableCard({
  id,
  disabled,
  onOpen,
  children





}: {id: string;disabled: boolean;onOpen: () => void;children: React.ReactNode;}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging
  } = useDraggable({
    id,
    disabled
  });
  return <div ref={setNodeRef} {...attributes} {...listeners} data-card role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => {
    listeners?.onKeyDown?.(e);
    if (e.key === 'Enter') onOpen();
  }} className={cn('touch-manipulation rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand', disabled ? 'cursor-pointer' : 'cursor-grab', isDragging && 'opacity-40')}>
      {children}
    </div>;
}