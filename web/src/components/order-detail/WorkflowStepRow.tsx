import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link, useParams } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, GripVerticalIcon, PackagePlusIcon, PlusIcon, QrCodeIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useApp } from '../../contexts/AppContext';
import { usePackages } from '../../contexts/PackagesContext';
import { isClosed, notArrived, packageStatusLabel } from '../../utils/packages';
import { daysUntil, fmtDate } from '../../utils/format';
import { canAccess } from '../../utils/roles';
import type { WorkflowStep } from '../../data/production';
import { workshopWorkers, type OrderWorkflow, type StepState } from '../../hooks/useOrderWorkflow';
import type { Garment, ProductionTask } from '../../types';
import { cn } from '../../utils/cn';
export const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('');
interface Props {
  step: WorkflowStep;
  number: number;
  garment: Garment;
  state: StepState;
  tasks: ProductionTask[];
  wf: OrderWorkflow;
  open: boolean;
  last: boolean;
  /** Whether this person may mark the step done (owner, oversight or the Production Assistant). */
  mayComplete: boolean;
  /** Steps not started yet can be dragged to a new place. */
  draggable: boolean;
  onToggle: () => void;
  onAddTask: () => void;
  onScan: () => void;
  /** Delivery step: opens Prepare package. */
  onPrepare?: () => void;
  /** Quality check step: state of a QC send-back, if there is one. */
  rework?: 'repair' | 'recheck' | 'passed';
  /** Extra content inside the card, under its header (e.g. the repair instructions). */
  nested?: React.ReactNode;
  /** Replaces Mark done (e.g. the repair route's own buttons). */
  action?: React.ReactNode;
  /** Replaces the line under the step name. */
  subOverride?: string;
  /** Hide the task list toggle (repair steps carry their instructions instead). */
  hideTasks?: boolean;
}
const statusPill: Record<StepState, {
  label: string;
  cls: string;
}> = {
  done: {
    label: 'Done',
    cls: 'bg-success-soft text-success'
  },
  current: {
    label: 'In progress',
    cls: 'bg-brand-soft text-brand-hover'
  },
  upcoming: {
    label: 'Not started',
    cls: 'bg-sunken text-ink-muted'
  }
};

/** One production step: number on the rail, then a card that says what it is, its status, who has it and what to do. */
export function WorkflowStepRow({
  step,
  number,
  garment,
  state,
  tasks,
  wf,
  open,
  last,
  mayComplete,
  draggable,
  onToggle,
  onAddTask,
  onScan,
  onPrepare,
  rework,
  nested,
  action,
  subOverride,
  hideTasks
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: step.key,
    disabled: !draggable
  });
  const title = step.key === 'embroidery' ? `Embroidery — ${garment.embroidery.technique === 'Both' ? 'hand & machine' : (garment.embroidery.technique ?? 'Hand').toLowerCase()}` : step.label;
  const people = Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean))) as string[];
  const {
    role
  } = useApp();
  const {
    id: orderId
  } = useParams();
  // Quality check isn't ticked here — it finishes when the garment passes on the Quality Check screen.
  const isQc = step.key === 'qc';
  // Delivery runs on packages: prepared below the steps, advanced by scans.
  const isDelivery = step.key === 'delivery';
  const {
    getPackage,
    mayPrepare
  } = usePackages();
  const pkg = isDelivery && garment.packageId ? getPackage(garment.packageId) : undefined;
  const canInspect = canAccess(role, 'qc');
  const blocked = state === 'current' && !isQc && !isDelivery ? wf.stepBlocked(garment, step) : null;
  const doneTasks = tasks.filter((t) => t.status === 'Done').length;
  const openRework = tasks.some((t) => t.rework && t.status !== 'Done');
  const deliveryPill = pkg ? {
    label: pkg.status === 'Problem' && pkg.problem ? pkg.problem.kind : packageStatusLabel[pkg.status],
    cls: pkg.status === 'Problem' ? 'bg-critical-soft text-critical' : isClosed(pkg.status) ? 'bg-success-soft text-success' : 'bg-info-soft text-info'
  } : {
    label: 'Needs a package',
    cls: 'bg-attention-soft text-attention'
  };
  const reworkPill = rework === 'repair' ? {
    label: 'Failed QC',
    cls: 'bg-critical-soft text-critical'
  } : rework === 'recheck' ? {
    label: 'Waiting for recheck',
    cls: 'bg-attention-soft text-attention'
  } : rework === 'passed' ? {
    label: 'Passed recheck',
    cls: 'bg-success-soft text-success'
  } : null;
  const failed = rework === 'repair';
  const pill = reworkPill ? reworkPill : isDelivery && state === 'current' ? deliveryPill : isQc && state === 'current' ? {
    label: 'Waiting for inspection',
    cls: 'bg-attention-soft text-attention'
  } : blocked ? {
    label: blocked,
    cls: 'bg-attention-soft text-attention'
  } : openRework && state === 'current' ? {
    label: 'Rework from QC',
    cls: 'bg-attention-soft text-attention'
  } : state === 'current' && !people.length ? {
    label: 'Needs a worker',
    cls: 'bg-attention-soft text-attention'
  } : statusPill[state];
  const warn = pill.cls.includes('attention');
  // Delivery is tagged on its step instead of a separate section below.
  const late = !!pkg && (notArrived(pkg) || !isClosed(pkg.status) && daysUntil(pkg.deadline) < 0);
  const canTrack = !!pkg && canAccess(role, 'packing');
  const sub = subOverride ? subOverride : isDelivery && state !== 'upcoming' ? pkg ? `${pkg.id} · to ${pkg.destination.name}` : state === 'done' ? 'Delivered' : 'Not packaged yet' : isQc ? rework === 'repair' ? 'Sent back for repair' : rework === 'recheck' ? 'Repaired · ready to inspect again' : state === 'done' ? 'Passed inspection' : 'Finishes on the Quality Check screen' : people.length ? people.join(', ') : state === 'done' ? 'Finished' : state === 'current' ? 'No worker assigned' : 'No worker planned';
  return <li ref={setNodeRef} style={{
    transform: CSS.Transform.toString(transform),
    transition
  }} data-step-state={state} className={cn('relative grid grid-cols-[24px_32px_minmax(0,1fr)] items-start gap-x-3', isDragging && 'z-20')}>
      {/* Drag handle */}
      <span className="flex h-[58px] items-center justify-center">
        {draggable && <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} aria-label={`Drag ${step.label} to reorder`} className="flex h-9 w-6 cursor-grab touch-none items-center justify-center rounded text-ink-subtle hover:bg-sunken hover:text-ink active:cursor-grabbing">
            <GripVerticalIcon className="h-4 w-4" />
          </button>}
      </span>

      {/* Rail */}
      <span className="relative flex h-full justify-center" aria-hidden>
        {!last && <span className={cn('absolute bottom-0 top-[44px] w-0.5', state === 'done' ? 'bg-success' : 'bg-line-strong')} />}
        <span className={cn('relative z-10 mt-[13px] flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold tabular', state === 'done' ? 'bg-success text-white' : failed ? 'bg-critical text-white' : state === 'current' ? warn ? 'bg-attention text-white' : 'bg-brand text-white' : 'bg-surface text-ink-muted ring-2 ring-inset ring-line-strong')}>
          {state === 'done' ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : failed ? <XIcon className="h-4 w-4" strokeWidth={3} /> : number}
        </span>
      </span>

      {/* Card */}
      <div className={cn('mb-3 overflow-hidden rounded-xl bg-surface transition-[box-shadow] duration-150 ease-out', failed ? 'shadow-sm ring-2 ring-critical/50' : state === 'current' ? warn ? 'shadow-sm ring-2 ring-attention' : 'shadow-sm ring-2 ring-brand' : 'ring-1 ring-line', isDragging && 'shadow-pop ring-2 ring-brand')}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className={cn('text-[15px] font-semibold', state === 'done' && 'text-ink-muted')}>{title}</h4>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', pill.cls)}>{pill.label}</span>
            </div>
            <p className={cn('mt-0.5 text-sm', sub === 'No worker assigned' ? 'font-medium text-attention' : 'text-ink-muted')}>
              {sub}
              {isDelivery && pkg && pkg.status !== 'Delivered' && <span className={cn('tabular', late ? 'font-medium text-critical' : '')}> · {late ? 'late, was due' : 'by'} {fmtDate(pkg.deadline, 'd MMM')}</span>}
              {tasks.length > 0 && <span className="font-normal text-ink-subtle"> · {doneTasks} of {tasks.length} tasks done</span>}
            </p>
          </div>
          {isQc && state === 'current' && !failed && canInspect && orderId && <Link to={`/qc/${orderId}/${garment.id}`} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-brand-hover">
              Inspect <ArrowRightIcon className="h-4 w-4" />
            </Link>}
          {isDelivery && state === 'current' && !pkg && mayPrepare && onPrepare && <button type="button" onClick={onPrepare} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-hover active:scale-[0.98]">
              <PackagePlusIcon className="h-4 w-4" /> Prepare package
            </button>}
          {isDelivery && canTrack && pkg && <Link to={`/shipments/${pkg.id}`} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-medium text-brand ring-1 ring-inset ring-line-strong transition-colors duration-150 ease-out hover:bg-brand-soft">
              Track <ChevronRightIcon className="h-4 w-4" />
            </Link>}
          {action}
          {!action && state === 'current' && !isQc && !isDelivery && <button type="button" onClick={() => wf.completeStep(garment.id, step)} disabled={!mayComplete || !!blocked} title={blocked ?? undefined} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-hover active:scale-[0.98] disabled:bg-sunken disabled:text-ink-subtle">
              <CheckIcon className="h-4 w-4" strokeWidth={3} /> Mark step as done
            </button>}
        </div>

        {nested}

        {!isQc && !isDelivery && !hideTasks && <button type="button" onClick={onToggle} aria-expanded={open} className="flex h-10 w-full items-center gap-1.5 border-t border-line px-4 text-left text-sm font-medium text-ink-muted hover:bg-canvas hover:text-ink">
            <ChevronRightIcon className={cn('h-4 w-4 transition-transform duration-150 ease-out', open && 'rotate-90')} />
            {open ? 'Hide tasks' : tasks.length ? `Show ${tasks.length} task${tasks.length > 1 ? 's' : ''}` : 'Add tasks'}
          </button>}

        <AnimatePresence initial={false}>
          {open && !isQc && !isDelivery && !hideTasks && <motion.div initial={{
          height: 0,
          opacity: 0
        }} animate={{
          height: 'auto',
          opacity: 1
        }} exit={{
          height: 0,
          opacity: 0
        }} transition={{
          duration: 0.2,
          ease: [0.23, 1, 0.32, 1]
        }} className="overflow-hidden">
              <div className="px-4 pb-4">
                {blocked && <p className="mb-2 text-sm font-medium text-attention">Can't mark done yet: {blocked}</p>}
                <TaskList tasks={tasks} wf={wf} editable={wf.canManage} tickable={wf.canManage || wf.canTick} />
                {wf.canManage && <div className="mt-2 flex flex-wrap gap-1">
                    <button type="button" onClick={onAddTask} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
                      <PlusIcon className="h-4 w-4" /> Add task
                    </button>
                    <button type="button" onClick={onScan} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-brand hover:bg-brand-soft">
                      <QrCodeIcon className="h-4 w-4" /> Scan badge
                    </button>
                  </div>}
              </div>
            </motion.div>}
        </AnimatePresence>
      </div>
    </li>;
}
function TaskList({
  tasks,
  wf,
  editable,
  tickable
}: {tasks: ProductionTask[];wf: OrderWorkflow;editable: boolean;tickable: boolean;}) {
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 4
    }
  }), useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 6
    }
  }));
  const onDragEnd = (e: DragEndEvent) => e.over && wf.reorderTasks(String(e.active.id), String(e.over.id));
  if (!tasks.length) return <p className="rounded-lg bg-canvas px-3 py-2.5 text-sm text-ink-muted">No tasks yet.</p>;
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {tasks.map((t) => <TaskLine key={t.id} task={t} wf={wf} editable={editable} tickable={tickable} />)}
        </ul>
      </SortableContext>
    </DndContext>;
}
function TaskLine({
  task,
  wf,
  editable,
  tickable
}: {task: ProductionTask;wf: OrderWorkflow;editable: boolean;tickable: boolean;}) {
  const { confirm, dialog } = useConfirm();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    disabled: !editable
  });
  const done = task.status === 'Done';
  return <li ref={setNodeRef} style={{
    transform: CSS.Transform.toString(transform),
    transition
  }} className={cn('flex items-center gap-2 rounded-xl py-2 pl-1 pr-2', task.rework && !done ? 'bg-attention-soft' : 'bg-canvas', isDragging && 'relative z-10 bg-surface shadow-pop ring-2 ring-brand')}>
      {dialog}
      {editable ? <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} aria-label={`Drag ${task.name} to reorder`} className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-ink-subtle hover:text-ink active:cursor-grabbing">
          <GripVerticalIcon className="h-4 w-4" />
        </button> : <span className="w-2" />}
      <label className={cn('flex min-w-0 flex-1 items-center gap-3', tickable && 'cursor-pointer')}>
        <input type="checkbox" checked={done} disabled={!tickable} onChange={() => wf.setTaskDone(task.id, !done)} className="h-5 w-5 shrink-0 rounded accent-brand" />
        {task.photo && <img src={task.photo} alt="Photo from QC" className="h-10 w-10 shrink-0 rounded-lg object-cover" />}
        <span className="min-w-0">
          <span className={cn('block truncate text-[15px] font-medium', done && 'text-ink-muted line-through')}>{task.name}</span>
          {task.instructions && <span className="block truncate text-sm text-ink-subtle">{task.instructions}</span>}
        </span>
      </label>
      {editable ? <select value={task.assignee ?? ''} onChange={(e) => wf.assign(task.id, e.target.value)} aria-label={`Worker for ${task.name}`} className={cn('h-9 w-[160px] shrink-0 rounded-lg bg-surface px-2 text-sm ring-1 ring-inset ring-line-strong focus:outline-none focus:ring-2 focus:ring-brand', task.assignee ? 'font-medium' : 'text-attention', done && 'text-ink-muted')}>
          <option value="" disabled>Choose worker</option>
          {workshopWorkers().map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
        </select> : <span className="w-[160px] shrink-0 truncate text-sm text-ink-muted">{task.assignee ?? 'No worker'}</span>}
      {editable && !done && <button type="button" onClick={() => void confirm({
        title: `Remove ${task.name}?`,
        description: 'This task leaves the workflow. Work already recorded stays on the order.',
      }).then((yes) => { if (yes) wf.remove(task.id); })} aria-label={`Remove ${task.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-subtle hover:text-critical">
          <Trash2Icon className="h-4 w-4" />
        </button>}
    </li>;
}