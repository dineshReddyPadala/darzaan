import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CheckIcon, ChevronDownIcon, PlusIcon, QrCodeIcon, RotateCcwIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useQc } from '../../contexts/QcContext';
import type { WorkflowStep } from '../../data/production';
import { stepProgress, useOrderWorkflow, type StepState } from '../../hooks/useOrderWorkflow';
import { useQcGarment } from '../../hooks/useQcGarment';
import type { Garment, Order, StageKey } from '../../types';
import { cn } from '../../utils/cn';
import { workshopAlteration } from '../../utils/orders';
import { ownsStage } from '../../utils/roles';
import { garmentVersions, reworkStartStep } from '../../utils/workflowVersions';
import { Button } from '../ui/Button';
import { AddTaskModal } from './AddTaskModal';
import { AlterationBanner, useAlterationDone } from './AlterationBanner';
import { PreparePackageModal } from './PreparePackageModal';
import { ScanWorkerModal } from './ScanWorkerModal';
import { WorkflowStepRow } from './WorkflowStepRow';
import { attemptName, PastRoundView, QcSentBackCard, RoundMenu, StatusIcon, type ReworkStatus } from './WorkflowVersions';
import { fmtDate } from '../../utils/format';

/**
 * Production for one garment, laid out like an operations list in manufacturing tools:
 * a summary line, then one row per step (status · step · worker · state · action).
 * Rework rounds switch from a menu, the way CI tools switch between run attempts.
 */
export function WorkflowTab({
  order


}: {order: Order;}) {
  const wf = useOrderWorkflow(order);
  const {
    role,
    roleDef
  } = useApp();
  const {
    reworks,
    inspections
  } = useQc();
  const [garmentId, setGarmentId] = useState(order.garments[0].id);
  const [roundPick, setRoundPick] = useState<Record<string, number>>({});
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const [prepareOpen, setPrepareOpen] = useState(false);
  /** How many steps of the repair route are done, per send-back. */
  const [routeDone, setRouteDone] = useState<Record<string, number>>({});
  const [modal, setModal] = useState<{
    kind: 'add' | 'scan';
    stage?: StageKey;
  } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 4
    }
  }), useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 6
    }
  }), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const g = order.garments.find((x) => x.id === garmentId) ?? order.garments[0];
  const versions = garmentVersions(order, g, reworks, inspections);
  const currentRound = versions[versions.length - 1];
  const viewing = versions.find((v) => v.number === roundPick[g.id]) ?? currentRound;
  const pickRound = (n: number) => setRoundPick((p) => ({
    ...p,
    [g.id]: n
  }));
  const qcGarment = useQcGarment(order.id, g.id);
  const {
    steps,
    states,
    current
  } = stepProgress(g);
  /*
   * After a QC fail, the new version starts with a "sent back" card, then picks the workflow up at
   * the step the fault belongs to and walks forward as in the workshop: e.g. Stitching → Finishing
   * → Quality check → Ironing. Earlier steps fold away.
   * An alteration from the trial comes after every step, so the steps fold away behind its card.
   */
  // An alteration is reworked like a QC fix: card on top, earlier steps folded, then Stitching → Finishing → QC.
  const alt = workshopAlteration(order, g.id);
  const alteration = !!alt;
  const finishAlteration = useAlterationDone(order, g);
  const rw = alteration ? undefined : qcGarment.openRework ?? currentRound.cause;
  const qcIdx = steps.findIndex((s) => s.key === 'qc');
  const reworkStatus: ReworkStatus | undefined = !rw ? undefined : currentRound.lastInspection?.outcome === 'Pass' && !qcGarment.openRework ? 'passed' : rw.status === 'Ready for QC' || rw.closedAt ? 'recheck' : 'repair';
  const startKey = alteration ? 'stitching' : rw ? reworkStartStep(rw) : '';
  const startIdx = startKey ? steps.findIndex((s) => s.key === startKey) : -1;
  const from = alteration || rw ? startIdx >= 0 && (qcIdx < 0 || startIdx < qcIdx) ? startIdx : Math.max(0, qcIdx) : 0;
  const repairing = reworkStatus === 'repair' || alteration;
  const shownSteps = steps.slice(from);
  // The route: steps from the faulty one up to (not including) Quality check.
  const routeLen = alteration ? Math.max(1, qcIdx > from ? qcIdx - from : 0) : rw && qcIdx > from ? qcIdx - from : 0;
  const routeKey = rw?.id ?? alt?.id ?? '';
  const routeAt = Math.min(routeDone[routeKey] ?? 0, Math.max(0, routeLen - 1));
  const shownStates: StepState[] = repairing ? shownSteps.map((_, i) => i < routeAt ? 'done' : i === routeAt ? 'current' : 'upcoming') : reworkStatus === 'recheck' ? shownSteps.map((_, i) => i < routeLen ? 'done' : i === routeLen ? 'current' : 'upcoming') : states.slice(from);
  const canRepair = (wf.canManage || !!roleDef.oversight) && role !== 'qc' && (alteration || !!qcGarment.openRework);
  const repairLate = rw && reworkStatus === 'repair' ? rw.due < new Date().toISOString().slice(0, 10) : false;
  const routeAction = (i: number) => {
    if (!repairing || i !== routeAt || !canRepair) return undefined;
    const lastOne = i === routeLen - 1;
    return <Button icon={<CheckIcon className="h-4 w-4" strokeWidth={3} />} onClick={() => lastOne ? alteration ? finishAlteration() : qcGarment.readyForQc() : setRouteDone((r) => ({
      ...r,
      [routeKey]: i + 1
    }))}>
        Mark step as done
      </Button>;
  };
  const earlier = steps.slice(0, from);
  const isOpen = (key: string, i: number) => openKeys[`${g.id}:${key}`] ?? shownStates[i] === 'current';
  const toggle = (key: string, i: number) => setOpenKeys((o) => ({
    ...o,
    [`${g.id}:${key}`]: !isOpen(key, i)
  }));
  const tasksFor = (s: WorkflowStep) => wf.tasks.filter((t) => t.garmentId === g.id && s.stages.includes(t.stage));
  const mayComplete = (stages: StageKey[]) => !!roleDef.oversight || stages.some((s) => ownsStage(role, s)) || wf.canManage && !stages.some((s) => s === 'acknowledgement' || s === 'review' || s === 'scheduling');
  const onDragEnd = (e: DragEndEvent) => e.over && wf.reorderSteps(g.id, String(e.active.id), String(e.over.id));
  return <div className="space-y-4">
      {/* Garment switcher + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {order.garments.length > 1 ? <div role="tablist" aria-label="Garment" className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-sunken p-1">
            {order.garments.map((x) => {
          const p = stepProgress(x);
          const on = x.id === g.id;
          return <button key={x.id} role="tab" aria-selected={on} onClick={() => setGarmentId(x.id)} className={cn('flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-[background-color,color] duration-150 ease-out', on ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink')}>
                  {x.subCategory}
                  <span className="tabular text-ink-subtle">{Math.min(p.doneCount, p.steps.length)}/{p.steps.length}</span>
                </button>;
        })}
          </div> : viewing.current && wf.canManage ? <DragHint showReset={!!g.stepOrder} onReset={() => wf.resetStepOrder(g.id)} /> : <span />}
        <div className="flex flex-wrap items-center gap-2">
          {versions.length > 1 && <RoundMenu versions={versions} selected={viewing.number} onSelect={pickRound} />}
          {wf.canManage && viewing.current && <>
              <Button variant="secondary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setModal({
            kind: 'add',
            stage: current?.stages[0]
          })}>Add task</Button>
              <Button icon={<QrCodeIcon className="h-4 w-4" />} onClick={() => setModal({
            kind: 'scan'
          })}>Scan worker</Button>
            </>}
        </div>
      </div>

      {!viewing.current ? <PastRoundView v={viewing} g={g} onBack={() => pickRound(currentRound.number)} /> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Summary: where it is, who has it, when it's due — beside the steps on wide screens, above them on narrow */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
          
          {g.notes && <section className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-soft">
              <p className="text-sm text-ink-muted">Notes for the workshop</p>
              <p className="mt-1 text-[15px]">{g.notes}</p>
            </section>}
        </aside>

        <div className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1">
          <AlterationBanner order={order} g={g} />

          {/* Steps */}
          <section aria-label={`Production steps for ${g.subCategory}`}>
            {wf.canManage && order.garments.length > 1 && shownSteps.length > 0 && <div className="mb-3">
                <DragHint showReset={!!g.stepOrder} onReset={() => wf.resetStepOrder(g.id)} />
              </div>}
            {rw && reworkStatus && <QcSentBackCard orderId={order.id} g={g} v={currentRound} status={reworkStatus} route={shownSteps.slice(0, routeLen).map((s) => s.label)} />}
            {earlier.length > 0 && <EarlierSteps steps={earlier} note={alteration ? 'Made before the trial' : `Done in ${attemptName(currentRound.number - 1)}`}>
                {/* Same step cards as below (tasks, add task, scan badge) — finished steps can't be reordered */}
                <DndContext>
                  <SortableContext items={earlier.map((s) => s.key)} strategy={verticalListSortingStrategy}>
                    <ol aria-label="Earlier steps">
                      {earlier.map((s, i) => role === 'tailor' && tasksFor(s).length === 0 ? null : <WorkflowStepRow key={s.key} step={s} number={i + 1} garment={g} state="done" tasks={tasksFor(s)} wf={wf} open={!!openKeys[`${g.id}:${s.key}`]} last={i === earlier.length - 1} mayComplete={false} draggable={false} onToggle={() => setOpenKeys((o) => ({
                    ...o,
                    [`${g.id}:${s.key}`]: !o[`${g.id}:${s.key}`]
                  }))} onAddTask={() => setModal({
                    kind: 'add',
                    stage: s.stages[0]
                  })} onScan={() => setModal({
                    kind: 'scan'
                  })} />)}
                    </ol>
                  </SortableContext>
                </DndContext>
              </EarlierSteps>}
            {shownSteps.length > 0 && <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={shownSteps.map((s) => s.key)} strategy={verticalListSortingStrategy}>
                <ol>
                  {shownSteps.map((s, i) => {
                  if (role === 'tailor' && tasksFor(s).length === 0) return null;
                  const onRoute = (alteration || !!rw && reworkStatus !== 'passed') && i < routeLen;
                  const first = onRoute && i === 0;
                  return <WorkflowStepRow key={s.key} step={s} number={from + i + 1} garment={g} state={shownStates[i]} tasks={tasksFor(s)} wf={wf} open={isOpen(s.key, i)} last={i === shownSteps.length - 1} mayComplete={!repairing && mayComplete(s.stages)} draggable={wf.canManage} rework={s.key === 'qc' && reworkStatus !== 'repair' ? reworkStatus : undefined} subOverride={first && alt ? `Alteration${g.assignee ? ` · ${g.assignee}` : ''}` : first && rw ? `Repair · ${rw.assignee}` : undefined} nested={first && alt && shownStates[i] === 'current' ? <div className="border-t border-line bg-attention-soft/60 px-4 py-3">
                        <p className="text-[15px] font-medium">Alter: {alt.issue}</p>
                        {alt.notes && <p className="mt-0.5 text-sm">{alt.notes}</p>}
                        <p className="mt-1 text-sm text-ink-muted tabular">From trial · {fmtDate(alt.at, 'd MMM')}</p>
                      </div> : first && rw && shownStates[i] === 'current' ? <div className="border-t border-line bg-critical-soft/50 px-4 py-3">
                        <p className="text-[15px] font-medium">Fix: {rw.defect.type} · {rw.defect.location}</p>
                        {rw.instructions && <p className="mt-0.5 text-sm">{rw.instructions}</p>}
                        <p className={cn('mt-1 text-sm tabular', repairLate ? 'font-medium text-critical' : 'text-ink-muted')}>Fix by {fmtDate(rw.due, 'd MMM')}</p>
                      </div> : undefined} action={onRoute ? routeAction(i) ?? <span /> : undefined} onToggle={() => toggle(s.key, i)} onAddTask={() => setModal({
                    kind: 'add',
                    stage: s.stages[0]
                  })} onScan={() => setModal({
                    kind: 'scan'
                  })} onPrepare={() => setPrepareOpen(true)} />;
                })}
                </ol>
              </SortableContext>
            </DndContext>}
          </section>
        </div>
      </div>}

      <AddTaskModal order={order} wf={wf} open={modal?.kind === 'add'} initialGarmentId={g.id} initialStage={modal?.stage} onClose={() => setModal(null)} />
      <ScanWorkerModal wf={wf} open={modal?.kind === 'scan'} onClose={() => setModal(null)} />
      <PreparePackageModal order={order} open={prepareOpen} onClose={() => setPrepareOpen(false)} />
    </div>;
}
function DragHint({
  showReset,
  onReset



}: {showReset: boolean;onReset: () => void;}) {
  return <div className="flex items-center gap-4">
      <p className="text-sm text-ink-muted">Drag to reorder steps.</p>
      {showReset && <button type="button" onClick={onReset} className="inline-flex h-8 items-center gap-1 text-sm font-medium text-brand hover:underline">
          <RotateCcwIcon className="h-3.5 w-3.5" /> Reset order
        </button>}
    </div>;
}
/** Steps already finished, folded into one card so the current work leads. Opens to the full step cards. */
function EarlierSteps({
  steps,
  note,
  children




}: {steps: WorkflowStep[];note: string;children: React.ReactNode;}) {
  const [open, setOpen] = useState(false);
  const range = steps.length === 1 ? steps[0].label : `${steps[0].label} → ${steps[steps.length - 1].label}`;
  return <div className="mb-3 overflow-hidden rounded-2xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Earlier steps: ${steps.length} done. ${open ? 'Hide' : 'Show'}`} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ease-out hover:bg-canvas focus:outline-none focus-visible:bg-canvas">
        <StatusIcon state="done" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium">{steps.length} step{steps.length > 1 ? 's' : ''} done</span>
          <span className="block truncate text-sm text-ink-muted">{note} · {range}</span>
        </span>
        <span className="flex items-center gap-1 text-sm font-medium text-brand">
          {open ? 'Hide' : 'Show'}
          <ChevronDownIcon className={cn('h-4 w-4 transition-transform duration-150 ease-out', open && 'rotate-180')} aria-hidden />
        </span>
      </button>
      {open && <div className="border-t border-line bg-canvas pl-1 pr-3 pt-3">{children}</div>}
    </div>;
}