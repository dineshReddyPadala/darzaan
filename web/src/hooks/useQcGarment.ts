import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { useQc } from '../contexts/QcContext';
import { qcChecklist, qcTeams } from '../data/production';
import type { Garment, Order, QcDefect, QcDraft, QcRework, ReworkPriority, StageKey } from '../types';
import { daysUntil, nowIso, uid } from '../utils/format';
import { deriveStatus, garmentDue, stageLabel } from '../utils/orders';
import { seedTasks } from './useOrderWorkflow';

const QC_PERM = { entity: 'production_task', action: 'update' } as const;
/** The stage a garment goes to after passing QC (from the configured stage order). */
export const NEXT_AFTER_QC: StageKey = 'ironing';
const emptyDraft: QcDraft = { results: {}, photos: {} };

export const qcKey = (orderId: string, garmentId: string) => `${orderId}:${garmentId}`;
export const qcPath = (orderId: string, garmentId: string, screen = '') => `/qc/${orderId}/${garmentId}${screen ? `/${screen}` : ''}`;

export function qcPriority(o: Order, g: Garment): ReworkPriority {
  const d = daysUntil(garmentDue(o, g));
  if (o.priority === 'Express' || g.urgency !== 'Regular' || d <= 0) return 'High';
  return d <= 2 ? 'Medium' : 'Low';
}

/** Where a garment sits in the QC loop. */
export type QcState = 'waiting' | 'reinspect' | 'rework';
export function qcState(g: Garment, rework?: QcRework): QcState {
  if (g.qc?.reworkOpen) return 'rework';
  return rework && !rework.closedAt ? 'reinspect' : 'waiting';
}

export function useQcGarment(orderId?: string, garmentId?: string) {
  const { getOrder, getCustomer, updateOrder, logActivity, notify, user } = useApp();
  const qc = useQc();
  const navigate = useNavigate();
  const order = orderId ? getOrder(orderId) : undefined;
  const garment = order?.garments.find((g) => g.id === garmentId);
  const key = orderId && garmentId ? qcKey(orderId, garmentId) : '';
  const draft = qc.drafts[key] ?? emptyDraft;
  const customer = order ? getCustomer(order.customerId) : undefined;
  const reworks = qc.reworks.filter((r) => r.orderId === orderId && r.garmentId === garmentId);
  const openRework = reworks.find((r) => !r.closedAt);
  const round = reworks.length + 1;

  const required = qcChecklist.filter((c) => draft.results[c.key] !== 'na');
  const failed = qcChecklist.filter((c) => draft.results[c.key] === 'fail');
  const answered = qcChecklist.filter((c) => draft.results[c.key]).length;
  const complete = answered === qcChecklist.length;

  const setDraft = (fn: (d: QcDraft) => QcDraft) => key && qc.setDraft(key, fn);

  const closePrevious = (at: string) => {
    if (!openRework || !order || !garment) return;
    qc.closeReworkRecord(openRework.id, at);
    qc.closeRework(order.id, garment.id, 0, `Re-inspected by ${user.name}`);
  };

  const pass = () => {
    if (!order || !garment) return;
    const at = nowIso();
    qc.addInspection({ id: uid('INS'), orderId: order.id, garmentId: garment.id, round, results: draft.results, photos: draft.photos, actuals: draft.actuals, outcome: 'Pass', at, by: user.name });
    const ok = updateOrder(order.id, (o) => {
      const updated = {
        ...o,
        garments: o.garments.map((g) => g.id === garment.id ? { ...g, stage: NEXT_AFTER_QC, assignee: undefined, qc: { ...g.qc, rechecks: g.qc?.rechecks ?? 0, passedAt: at, passedBy: user.name, reworkOpen: false } } : g),
        risk: o.risk && /QC/.test(o.risk.message) ? undefined : o.risk,
        nextAction: { label: stageLabel(NEXT_AFTER_QC), owner: 'Workshop' }
      };
      return { ...updated, status: deriveStatus(updated) };
    }, QC_PERM);
    if (!ok) return;
    closePrevious(at);
    qc.clearDraft(key);
    logActivity(order.id, `${garment.subCategory} passed QC${round > 1 ? ` (re-inspection ${round - 1})` : ''} → ${stageLabel(NEXT_AFTER_QC)}`, 'qc');
    toast.success(`Passed — sent to ${stageLabel(NEXT_AFTER_QC)}`, { description: `${order.id} · ${garment.subCategory}` });
    navigate('/qc');
  };

  const saveDefect = (defect: QcDefect) => setDraft((d) => ({ ...d, defect }));

  const assignRework = (a: {team: string;assignee: string;priority: ReworkPriority;due: string;instructions: string;}, defect?: QcDefect) => {
    const d = defect ?? draft.defect;
    if (!order || !garment || !d) return;
    const at = nowIso();
    const checkLabel = qcChecklist.find((c) => c.key === d.category)?.label ?? d.category;
    qc.addInspection({ id: uid('INS'), orderId: order.id, garmentId: garment.id, round, results: draft.results, photos: draft.photos, actuals: draft.actuals, outcome: 'Fail', at, by: user.name });
    closePrevious(at);
    const rework: QcRework = {
      id: uid('RW'), orderId: order.id, garmentId: garment.id, defect: d,
      team: a.team, assignee: a.assignee, priority: a.priority, due: a.due, instructions: a.instructions,
      status: 'Assigned',
      events: [{ step: 'Failed QC', at, by: user.name }, { step: 'Assigned', at, by: user.name }]
    };
    const ok = updateOrder(order.id, (o) => {
      const updated = {
        ...o,
        // Close this round of production as a version, so its tasks and workers stay on record.
        garments: o.garments.map((g) => {
          if (g.id !== garment.id) return g;
          const past = g.workflowVersions ?? [];
          const snapshot = { version: reworks.length + 1, startedAt: past[past.length - 1]?.endedAt ?? o.createdAt, endedAt: at, tasks: (o.tasks ?? seedTasks(o)).filter((t) => t.garmentId === g.id).map((t) => ({ ...t })), doneBy: { ...g.doneBy } };
          return { ...g, assignee: a.assignee, workflowVersions: [...past.filter((v) => v.version !== snapshot.version), snapshot], qc: { ...g.qc, rechecks: g.qc?.rechecks ?? 0, passedAt: undefined, reworkOpen: true } };
        }),
        risk: { severity: a.priority === 'High' ? 'critical' : 'warning', message: `Failed QC — ${d.type} (${d.location}). Rework with ${a.team}`, owner: a.assignee } as Order['risk'],
        nextAction: { label: `Rework — ${d.type}`, owner: a.assignee }
      };
      return { ...updated, status: deriveStatus(updated) };
    }, QC_PERM);
    if (!ok) return;
    qc.addRework(rework);
    qc.addIssues([{
      id: uid('QCI'), orderId: order.id, garmentId: garment.id, garment: garment.subCategory, kind: 'Defect', checkKey: d.category,
      defectType: d.type, severity: d.severity, issue: `${checkLabel}: ${d.type} — ${d.location}`, station: a.team, responsible: a.assignee,
      reworkMins: 0, repeat: round, at, status: 'In rework', photo: d.photos[0], inspector: user.name
    }]);
    qc.clearDraft(key);
    logActivity(order.id, `${garment.subCategory} failed QC — ${d.type} (${d.location}, ${d.severity}). Rework assigned to ${a.assignee}, ${a.team}`, 'rework');
    notify({ category: 'Production', severity: a.priority === 'High' ? 'critical' : 'attention', title: `Rework — ${order.id}`, body: `${garment.subCategory}: ${d.type} at ${d.location}. Assigned to ${a.assignee} (${a.team}).`, orderId: order.id });
    toast.success('Sent for repair', { description: `${a.assignee} · ${a.team}` });
    navigate('/qc');
  };

  const startRework = () => {
    if (!openRework) return;
    qc.advanceRework(openRework.id, 'In rework', openRework.assignee, nowIso());
    if (order) logActivity(order.id, `${openRework.assignee} started rework — ${openRework.defect.type}`, 'rework');
    toast.success('Rework started');
  };

  const readyForQc = () => {
    if (!openRework || !order || !garment) return;
    const at = nowIso();
    if (openRework.status === 'Assigned') qc.advanceRework(openRework.id, 'In rework', openRework.assignee, at);
    qc.advanceRework(openRework.id, 'Ready for QC', openRework.assignee, at);
    updateOrder(order.id, (o) => ({
      ...o,
      garments: o.garments.map((g) => g.id === garment.id ? { ...g, assignee: undefined, qc: { ...g.qc, rechecks: (g.qc?.rechecks ?? 0) + 1, reworkOpen: false, arrivedAt: at } } : g),
      nextAction: { label: 'Re-inspection at QC', owner: 'Deepa Joshi' }
    }), QC_PERM);
    logActivity(order.id, `${garment.subCategory}: rework done by ${openRework.assignee} — back in the QC queue`, 'rework');
    toast.success('Back in Waiting for inspection', { description: 'QC will check it again with the same steps.' });
  };

  const defaultTeam = (category: string) => {
    const team = qcChecklist.find((c) => c.key === category)?.team ?? 'Tailoring Team';
    return qcTeams.find((t) => t.team === team) ?? qcTeams[0];
  };

  return {
    order, garment, customer, draft, setDraft, key, round, reworks, openRework,
    required, failed, answered, complete,
    pass, saveDefect, assignRework, startRework, readyForQc, defaultTeam
  };
}

export type QcGarmentState = ReturnType<typeof useQcGarment>;