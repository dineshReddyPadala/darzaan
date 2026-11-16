import type { Garment, Order, QcInspectionRecord, QcRework, WorkflowVersion } from '../types';

/** One round of production for a garment. A new version starts each time QC fails and rework begins. */
export interface VersionView {
  number: number;
  current: boolean;
  startedAt: string;
  endedAt?: string;
  /** Rework that started this version (none for version 1). */
  cause?: QcRework;
  /** QC failure that closed this version. */
  failure?: QcRework;
  failedInspection?: QcInspectionRecord;
  /** Latest inspection inside this version (re-check result for the current one). */
  lastInspection?: QcInspectionRecord;
  snapshot?: WorkflowVersion;
}

const startOf = (r: QcRework) => r.events[0]?.at ?? r.due;

/** The team QC sends a repair to decides which workflow step the new version starts from. */
const TEAM_STEP: Record<string, string> = {
  'Embroidery Team': 'embroidery',
  'Tailoring Team': 'stitching',
  'Finishing Team': 'finishing',
  'Master (Cutting)': 'cutting',
  'Material / Dyeing': 'dyeing'
};
const CATEGORY_STEP: Record<string, string> = {
  measurements: 'stitching',
  stitching: 'stitching',
  attachments: 'stitching',
  embroidery: 'embroidery',
  finishing: 'finishing',
  appearance: 'finishing'
};

/** Workflow step key where a repair round begins — never back at order acknowledgement. */
export function reworkStartStep(rw: QcRework): string {
  return TEAM_STEP[rw.team] ?? CATEGORY_STEP[String(rw.defect.category ?? '')] ?? 'qc';
}

export function garmentVersions(order: Order, g: Garment, reworks: QcRework[], inspections: QcInspectionRecord[]): VersionView[] {
  const rws = reworks.filter((r) => r.orderId === order.id && r.garmentId === g.id).sort((a, b) => startOf(a).localeCompare(startOf(b)));
  const ins = inspections.filter((i) => i.orderId === order.id && i.garmentId === g.id).sort((a, b) => a.at.localeCompare(b.at));
  const fails = ins.filter((i) => i.outcome === 'Fail');
  const views: VersionView[] = [];
  for (let i = 0; i <= rws.length; i++) {
    const startedAt = i === 0 ? order.createdAt : startOf(rws[i - 1]);
    const endedAt = rws[i] ? startOf(rws[i]) : undefined;
    const inside = ins.filter((x) => x.at >= startedAt && (!endedAt || x.at <= endedAt));
    views.push({
      number: i + 1,
      current: i === rws.length,
      startedAt,
      endedAt,
      cause: rws[i - 1],
      failure: rws[i],
      failedInspection: fails[i],
      lastInspection: inside[inside.length - 1],
      snapshot: g.workflowVersions?.find((v) => v.version === i + 1)
    });
  }
  return views;
}