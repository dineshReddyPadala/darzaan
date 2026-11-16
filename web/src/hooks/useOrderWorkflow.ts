import { useMemo } from 'react';
import { toast } from 'sonner';
import { arrayMove } from '@dnd-kit/sortable';
import { useApp } from '../contexts/AppContext';
import { useQc } from '../contexts/QcContext';
import { stageInstructions, workflowSteps, type WorkflowStep } from '../data/production';
import type { Employee, Garment, Order, ProductionTask, StageKey } from '../types';
import { teamList } from '../utils/team';
import { nowIso, uid } from '../utils/format';
import { deriveStatus, stageIndex, stageLabel } from '../utils/orders';
import { designPriceOpen, orderTotals } from '../utils/pricing';
import { namesMatch, stageOwnerLabel, workshopStages } from '../utils/roles';

const PERM = { entity: 'production_task', action: 'update' } as const;

/** Task types the Production Assistant can create — one per workshop stage. */
export const taskTypes: {stage: StageKey;label: string;}[] = workshopStages.map((s) => ({
  stage: s,
  label: stageInstructions[s]?.verb ?? stageLabel(s)
}));

export const taskTypeLabel = (stage: StageKey) => taskTypes.find((t) => t.stage === stage)?.label ?? stageLabel(stage);

/** Everyone at the workshop who can take a task (not planning, QC or packing). */
export function workshopWorkers(): Employee[] {
  return teamList().filter(
    (e) => e.location === 'Okhla Workshop' && !['Planning', 'QC', 'Packaging'].includes(e.station)
  );
}

export type StepState = 'done' | 'current' | 'upcoming';

/** Steps that apply to this garment, in this garment's order — embroidery is skipped when there is none. */
export function stepsFor(g: Garment): WorkflowStep[] {
  const applicable = workflowSteps.filter((s) => s.key !== 'embroidery' || g.embroidery.mode !== 'None');
  if (!g.stepOrder) return applicable;
  const pos = (k: string) => {
    const i = g.stepOrder!.indexOf(k);
    return i < 0 ? 999 : i;
  };
  return [...applicable].sort((a, b) => pos(a.key) - pos(b.key));
}

/** Where the garment is in its own step order. */
export function stepProgress(g: Garment) {
  const steps = stepsFor(g);
  let currentIdx = steps.findIndex((s) => s.stages.includes(g.stage));
  if (currentIdx < 0) currentIdx = stageIndex(g.stage) > stageIndex('logistics') ? steps.length : 0;
  const states: StepState[] = steps.map((_, i) => i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming');
  return { steps, states, currentIdx, current: steps[currentIdx], next: steps[currentIdx + 1], doneCount: Math.min(currentIdx, steps.length) };
}

/** The default worker for a step, so a fresh garment's tasks read like real work rather than blanks. */
function defaultWorker(stage: StageKey): string | undefined {
  const station = stageInstructions[stage]?.station;
  return workshopWorkers().find((w) => w.station === station)?.name;
}

/**
 * First time the Workflow tab is opened, build each step's tasks from its standard checklist,
 * reflecting where the garment already is: earlier steps done, the current step underway.
 */
export function seedTasks(order: Order): ProductionTask[] {
  return order.garments.flatMap((g) => {
    const current = stageIndex(g.stage);
    return workshopStages.
    filter((s) => s !== 'hemming' && s !== 'alteration' && (s !== 'embroidery' || g.embroidery.mode !== 'None')).
    flatMap<ProductionTask>((s) => {
      const idx = stageIndex(s);
      const steps = stageInstructions[s]?.steps ?? [taskTypeLabel(s)];
      const worker = idx === current ? g.assignee ?? defaultWorker(s) : idx < current ? g.doneBy?.[s] ?? defaultWorker(s) : undefined;
      return steps.map<ProductionTask>((name, i) => ({
        id: `${order.id}-${g.id}-${s}${i ? `-${i}` : ''}`,
        garmentId: g.id,
        name,
        stage: s,
        assignee: worker,
        // On the current step the first item is already ticked, so it's clear work is underway.
        status: idx < current || idx === current && i === 0 && !!worker ? 'Done' : idx === current && worker ? 'In progress' : 'Pending',
        instructions: i === 0 ? g.notes ?? '' : '',
        updatedAt: order.createdAt
      }));
    });
  });
}

export function useOrderWorkflow(order: Order) {
  const { updateOrder, logActivity, can, user, role } = useApp();
  const { closeRework } = useQc();
  const ownTasks = role === 'tailor';
  const tasks = useMemo(() => {
    const all = order.tasks ?? seedTasks(order);
    if (!ownTasks) return all;
    return all.filter((task) => namesMatch(task.assignee, user.name));
  }, [order, ownTasks, user.name]);
  const canManage = can('production_task', 'create');
  const canTick = ownTasks && can('production_task', 'update');

  const save = (fn: (list: ProductionTask[]) => ProductionTask[], patch?: (o: Order) => Order) =>
  updateOrder(
    order.id,
    (o) => {
      const next = { ...o, tasks: fn(o.tasks ?? seedTasks(o)) };
      return patch ? patch(next) : next;
    },
    PERM
  );

  const garmentName = (gid: string) => order.garments.find((g) => g.id === gid)?.subCategory ?? 'Garment';

  const addTask = (t: {garmentId: string;stage: StageKey;name: string;assignee?: string;instructions: string;}) => {
    const task: ProductionTask = {
      id: uid('TSK'),
      garmentId: t.garmentId,
      stage: t.stage,
      name: t.name.trim() || taskTypeLabel(t.stage),
      assignee: t.assignee || undefined,
      status: t.assignee ? 'In progress' : 'Pending',
      instructions: t.instructions.trim(),
      updatedAt: nowIso(),
      updatedBy: user.name
    };
    if (!save((list) => [...list, task])) return false;
    logActivity(order.id, `Task added to ${garmentName(t.garmentId)}: ${task.name}${task.assignee ? ` → ${task.assignee}` : ''}`, 'production');
    toast.success('Task added', { description: task.assignee ? `Assigned to ${task.assignee}` : 'Not assigned yet' });
    return true;
  };

  const assign = (taskId: string, worker: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.assignee === worker) return;
    const ok = save(
      (list) => list.map((t) => t.id === taskId ? { ...t, assignee: worker, status: t.status === 'Pending' ? 'In progress' : t.status, updatedAt: nowIso(), updatedBy: user.name } : t),
      (o) => ({
        ...o,
        garments: o.garments.map((g) => {
          if (g.id !== task.garmentId) return g;
          if (g.stage === task.stage) return { ...g, assignee: worker };
          // Reassigning a finished task also changes who gets credit (and QC attribution) for that stage.
          if (task.status === 'Done') return { ...g, doneBy: { ...g.doneBy, [task.stage]: worker } };
          return g;
        })
      })
    );
    if (!ok) return;
    logActivity(order.id, `${garmentName(task.garmentId)} · ${task.name}: ${task.assignee ? `reassigned from ${task.assignee} to ${worker}` : `assigned to ${worker}`}`, 'assignment');
    toast.success(task.assignee ? `Reassigned to ${worker}` : `Assigned to ${worker}`, { description: task.name });
  };

  const setTaskDone = (taskId: string, done: boolean) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (!save((list) => list.map((t) => t.id === taskId ? { ...t, status: done ? 'Done' : t.assignee ? 'In progress' : 'Pending', updatedAt: nowIso(), updatedBy: user.name } : t))) return;
    logActivity(order.id, `${garmentName(task.garmentId)} · ${task.name} ${done ? 'done' : 'reopened'}`, 'production');
  };

  const remove = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !save((list) => list.filter((t) => t.id !== taskId))) return;
    logActivity(order.id, `Task removed: ${task.name}`, 'production');
  };

  /** Drag a task above or below another task in the same step. */
  const reorderTasks = (activeId: string, overId: string) => {
    if (activeId === overId) return;
    save((list) => {
      const from = list.findIndex((t) => t.id === activeId);
      const to = list.findIndex((t) => t.id === overId);
      return from < 0 || to < 0 ? list : arrayMove(list, from, to);
    });
  };

  const reopen = (t: ProductionTask): ProductionTask => ({ ...t, status: t.assignee ? 'In progress' : 'Pending', updatedAt: nowIso(), updatedBy: user.name });
  const close = (t: ProductionTask): ProductionTask => t.status === 'Done' ? t : { ...t, status: 'Done', updatedAt: nowIso(), updatedBy: user.name };

  /**
   * Drag any step, including the one in progress. Position decides status automatically:
   * everything above the in-progress step is done, everything below it is still to do.
   */
  const reorderSteps = (garmentId: string, activeKey: string, overKey: string) => {
    const g = order.garments.find((x) => x.id === garmentId);
    if (!g || activeKey === overKey) return;
    const { steps, currentIdx } = stepProgress(g);
    const from = steps.findIndex((s) => s.key === activeKey);
    const to = steps.findIndex((s) => s.key === overKey);
    if (from < 0 || to < 0) return;
    const reordered = arrayMove(steps, from, to);
    const allDone = currentIdx >= steps.length;
    const newCurrent = allDone ? Infinity : reordered.findIndex((s) => s.key === steps[currentIdx].key);
    const wasDone = new Set(steps.filter((_, i) => i < currentIdx).map((s) => s.key));
    const nowDone = new Set(reordered.filter((_, i) => i < newCurrent).map((s) => s.key));
    const closed = reordered.filter((s) => nowDone.has(s.key) && !wasDone.has(s.key));
    const reopened = reordered.filter((s) => wasDone.has(s.key) && !nowDone.has(s.key));
    if (closed.some((s) => s.key === 'qc') && !g.qc?.passedAt) {
      toast.error('Quality Check can’t be skipped', { description: 'The garment has to pass QC before it moves past it.' });
      return;
    }
    const stagesOf = (list: typeof steps) => new Set(list.flatMap((s) => s.stages));
    const closeStages = stagesOf(closed);
    const reopenStages = stagesOf(reopened);
    const ok = save(
      (list) => list.map((t) => t.garmentId !== garmentId ? t : closeStages.has(t.stage) ? close(t) : reopenStages.has(t.stage) ? reopen(t) : t),
      (o) => ({
        ...o,
        garments: o.garments.map((x) =>
        x.id === garmentId ?
        { ...x, stepOrder: reordered.map((s) => s.key), qc: reopened.some((s) => s.key === 'qc') && x.qc?.passedAt ? { ...x.qc, passedAt: undefined } : x.qc } :
        x
        )
      })
    );
    if (!ok) return;
    const moved = steps[from];
    logActivity(order.id, `${g.subCategory}: ${moved.label} moved ${to > from ? 'after' : 'before'} ${steps[to].label}`, 'production');
    const names = (l: typeof steps) => l.map((s) => s.label).join(', ');
    if (closed.length && reopened.length) toast.success('Steps updated', { description: `Done: ${names(closed)}. To do again: ${names(reopened)}.` });else
    if (closed.length) toast.success(`Marked done: ${names(closed)}`, { description: 'They now sit above the step in progress.' });else
    if (reopened.length) toast.success(`To do again: ${names(reopened)}`, { description: 'They now sit below the step in progress.' });
  };

  /** Send the garment back to a finished step, or forward to a later one. Steps in between close or reopen to match. */
  const moveToStep = (garmentId: string, stepKey: string) => {
    const g = order.garments.find((x) => x.id === garmentId);
    if (!g) return false;
    const { steps, currentIdx } = stepProgress(g);
    const target = steps.findIndex((s) => s.key === stepKey);
    if (target < 0 || target === currentIdx) return false;
    const qcIdx = steps.findIndex((s) => s.key === 'qc');
    if (target > currentIdx && qcIdx >= 0 && currentIdx <= qcIdx && target > qcIdx && !g.qc?.passedAt) {
      toast.error('Can’t skip Quality Check', { description: 'The garment has to pass QC before it moves past it.' });
      return false;
    }
    const step = steps[target];
    const back = target < currentIdx;
    const stepOf = (stage: StageKey) => steps.findIndex((s) => s.stages.includes(stage));
    const lead = tasks.find((t) => t.garmentId === garmentId && step.stages.includes(t.stage) && t.assignee)?.assignee;
    const ok = save(
      (list) => list.map((t) => {
        if (t.garmentId !== garmentId) return t;
        const i = stepOf(t.stage);
        if (i < 0) return t;
        return i < target ? close(t) : t.status === 'Done' ? reopen(t) : t;
      }),
      (o) => {
        const updated = {
          ...o,
          garments: o.garments.map((x) =>
          x.id === garmentId ?
          {
            ...x,
            stage: step.stages[0],
            assignee: lead,
            doneBy: back ? x.doneBy : { ...x.doneBy, [x.stage]: x.assignee ?? user.name },
            qc: back && qcIdx >= target && x.qc?.passedAt ? { ...x.qc, passedAt: undefined } : x.qc
          } :
          x
          ),
          nextAction: { label: stageLabel(step.stages[0]), owner: stageOwnerLabel(step.stages[0]) }
        };
        return { ...updated, status: deriveStatus(updated) };
      }
    );
    if (!ok) return false;
    const label = steps[currentIdx]?.label ?? 'the end';
    logActivity(order.id, `${g.subCategory}: moved ${back ? 'back' : 'forward'} from ${label} to ${step.label}`, 'production');
    toast.success(`${g.subCategory} moved ${back ? 'back' : 'forward'} to ${step.label}`, {
      description: back ? `${step.label} and the steps after it are open again.` : 'The steps in between are marked done.'
    });
    return true;
  };

  const resetStepOrder = (garmentId: string) => {
    updateOrder(order.id, (o) => ({ ...o, garments: o.garments.map((x) => x.id === garmentId ? { ...x, stepOrder: undefined } : x) }), PERM);
    toast.success('Step order reset');
  };

  /** Why this step can't be marked done yet, or null. */
  const stepBlocked = (g: Garment, step: WorkflowStep): string | null => {
    if (step.key === 'review') {
      if (designPriceOpen(g)) return 'Design price not confirmed';
      const t = orderTotals(order);
      if (t.paidPct < 70) return 'Waiting for 70% advance';
      if (!g.measurementVerified) return 'Measurements not verified';
    }
    if (step.key === 'qc') return 'Marked done from Quality Check';
    return null;
  };

  /** Finish a step: its tasks close and the garment moves to the next step in its order. */
  const completeStep = (garmentId: string, step: WorkflowStep) => {
    const g = order.garments.find((x) => x.id === garmentId);
    if (!g || !step.stages.includes(g.stage)) return;
    const { steps } = stepProgress(g);
    // Rework from QC goes straight back to QC for a re-check instead of walking every step again.
    const backToQc = !!g.qc?.reworkOpen && step.key !== 'qc';
    const following = backToQc ? steps.find((s) => s.key === 'qc') : steps[steps.findIndex((s) => s.key === step.key) + 1];
    const next: StageKey = following ? following.stages[0] : 'store';
    const ok = save(
      (all) => all.map((t) => t.garmentId === garmentId && step.stages.includes(t.stage) ? { ...t, status: 'Done', updatedAt: nowIso(), updatedBy: user.name } : t),
      (o) => {
        const updated = {
          ...o,
          garments: o.garments.map((x) =>
          x.id === garmentId ?
          {
            ...x,
            stage: next,
            assignee: undefined,
            doneBy: { ...x.doneBy, [g.stage]: x.assignee ?? user.name },
            qc: backToQc ? { ...x.qc, rechecks: (x.qc?.rechecks ?? 0) + 1, reworkOpen: false, arrivedAt: nowIso(), passedAt: undefined, hold: undefined } : x.qc
          } :
          x
          ),
          risk: backToQc && o.risk && /QC/.test(o.risk.message) ? undefined : o.risk,
          nextAction: { label: stageLabel(next), owner: stageOwnerLabel(next) }
        };
        return { ...updated, status: deriveStatus(updated) };
      }
    );
    if (!ok) return;
    if (backToQc) {
      closeRework(order.id, garmentId, 0, '');
      logActivity(order.id, `${g.subCategory}: rework at ${step.label} done → back to QC for a re-check`, 'rework');
      toast.success('Rework done', { description: `${g.subCategory} goes back to QC for a re-check.` });
      return;
    }
    logActivity(order.id, `${g.subCategory}: ${step.label} done → ${following?.label ?? 'store'}`, 'production');
    toast.success(`${step.label} done`, { description: `${g.subCategory} moves to ${following?.label ?? 'the store'}.` });
  };

  return { tasks, canManage, canTick, addTask, assign, setTaskDone, remove, reorderTasks, reorderSteps, moveToStep, resetStepOrder, completeStep, stepBlocked, garmentName };
}

export type OrderWorkflow = ReturnType<typeof useOrderWorkflow>;