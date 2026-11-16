import { samplers } from '../data/catalog';
import { fabrics, trims } from '../data/inventory';
import { NO_FAULT, qcCheckStage, stageLead } from '../data/production';
import type { DefectSeverity, Garment, Order, QcIssue, StageKey } from '../types';
import { daysUntil, TODAY } from './format';
import { garmentDue, stageIndex } from './orders';

export type MeasureState = 'empty' | 'ok' | 'borderline' | 'off';

/** Tolerance is set in inches; cm orders get the converted value. */
export function toleranceFor(unit: 'in' | 'cm', tolIn: number): number {
  return unit === 'cm' ? Math.round(tolIn * 2.54 * 10) / 10 : tolIn;
}

export function measureState(ordered: number, actual: string, tol: number, unit: 'in' | 'cm'): {state: MeasureState;diff: number;} {
  if (actual.trim() === '' || Number.isNaN(Number(actual))) return { state: 'empty', diff: 0 };
  const diff = Math.round((Number(actual) - ordered) * 100) / 100;
  const abs = Math.abs(diff);
  // Within a quarter inch of the limit is borderline: it passes, but is flagged.
  const band = unit === 'cm' ? 0.6 : 0.25;
  if (abs > tol) return { state: 'off', diff };
  if (abs >= tol - band && abs > 0) return { state: 'borderline', diff };
  return { state: 'ok', diff };
}

/** Where a failed check goes back to. Embroidery on a plain garment means attachments → Stitching. */
export function reworkStage(checkKey: string, g?: Garment): StageKey {
  const stage = qcCheckStage[checkKey] ?? 'stitching';
  if (stage === 'embroidery' && g && g.embroidery.mode === 'None') return 'stitching';
  return stage;
}

/** Who a check is attributed to: whoever completed that stage, else the station lead. */
export function responsibleFor(g: Garment, checkKey: string): {name: string;station: string;stage: StageKey;} {
  const stage = reworkStage(checkKey, g);
  const lead = stageLead[stage] ?? stageLead.stitching!;
  return { name: g.doneBy?.[stage] ?? lead.person, station: lead.station, stage };
}

export function isQcPassed(g: Garment): boolean {
  return stageIndex(g.stage) > stageIndex('qc') || g.stage === 'qc' && !!g.qc?.passedAt;
}

export function orderQcProgress(o: Order): {passed: number;total: number;} {
  return { passed: o.garments.filter(isQcPassed).length, total: o.garments.length };
}

export function hoursWaiting(o: Order, g: Garment): number {
  const since = g.qc?.arrivedAt ?? o.activity[o.activity.length - 1]?.at ?? o.createdAt;
  return Math.max(0, Math.round((TODAY.getTime() - new Date(since).getTime()) / 36e5 * 10) / 10);
}

export const WAIT_ALERT_HOURS = 4;

/** Defects (not fixed at QC) recorded against this garment. */
export function garmentFails(issues: QcIssue[], orderId: string, g: Garment): QcIssue[] {
  return issues.filter((i) => i.orderId === orderId && (i.garmentId ? i.garmentId === g.id : i.garment === g.subCategory) && !i.fixedAtQc);
}

/** Reasons a failure must also go to the Production Head and the store. */
export function escalationReasons(o: Order, g: Garment, failNo: number, critical: boolean): string[] {
  const reasons: string[] = [];
  if (critical) reasons.push('Critical defect');
  if (failNo >= 3) reasons.push(`Failed QC ${failNo} times`);
  if ((g.urgency !== 'Regular' || o.priority === 'Express') && daysUntil(garmentDue(o, g)) <= 2) reasons.push('Express order due within 48 hours');
  return reasons;
}

export const isNoFault = (name: string) => name === NO_FAULT;

/* ---------------- Classifying a fail ---------------- */

export const isLengthMeasure = (name: string) => /length|depth|rise|inseam/i.test(name);

export interface MeasureFinding {
  name: string;
  ordered: number;
  actual?: number;
  diff: number;
  state: MeasureState;
}

/** Every ordered measurement against what QC measured, using the shop tolerance. */
export function measurementFindings(ordered: Record<string, number>, actuals: Record<string, string> = {}, tol: number): MeasureFinding[] {
  return Object.entries(ordered).map(([name, value]) => {
    const raw = actuals[name] ?? '';
    const { state, diff } = measureState(value, raw, tol, 'in');
    return { name, ordered: value, actual: state === 'empty' ? undefined : Number(raw), diff, state };
  });
}

/** Out of tolerance on any point = Fail. All measured and within = Pass. Otherwise not decided yet. */
export function measurementVerdict(f: MeasureFinding[]): 'pass' | 'fail' | null {
  if (f.some((x) => x.state === 'off')) return 'fail';
  if (f.length && f.every((x) => x.state !== 'empty')) return 'pass';
  return null;
}

function locationFor(name: string): string {
  if (/sleeve|bicep|armhole/i.test(name)) return 'Sleeve';
  if (/neck/i.test(name)) return 'Neckline';
  if (/waist/i.test(name)) return 'Waist';
  if (/length|hem|flare/i.test(name)) return 'Hem';
  if (/back/i.test(name)) return 'Back panel';
  return 'Whole garment';
}

/** Turns the worst out-of-tolerance point into a pre-filled defect. */
export function measurementDefect(f: MeasureFinding[]): {type: string;location: string;description: string;} | null {
  const off = f.filter((x) => x.state === 'off').sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  if (!off.length) return null;
  const w = off[0];
  const over = w.diff > 0;
  const type = isLengthMeasure(w.name) ? over ? 'Too long' : 'Too short' : over ? 'Too loose' : 'Too tight';
  const fmt = (x: MeasureFinding) => `${x.name} ${x.actual}″ (ordered ${x.ordered}″, ${x.diff > 0 ? '+' : ''}${x.diff}″)`;
  return { type, location: locationFor(w.name), description: off.map(fmt).join('; ') };
}

export const severityGuide: Record<DefectSeverity, string> = {
  Minor: 'Cosmetic, quick fix under an hour. Doesn’t change fit or look from a distance.',
  Major: 'Needs rework at a station — fit out of tolerance, seam, embroidery or hem redone.',
  Critical: 'Can’t simply be fixed — fabric damaged, colour bled, or a remake / customer call is needed.'
};

const MINOR = ['Loose threads', 'Pressing marks', 'Button loose', 'Hook loose', 'Raw edge'];
const CRITICAL = ['Damaged fabric', 'Colour bleed', 'Snag / pull', 'Shade mismatch'];

/** Suggested severity; QC can change it. Measurements more than 4× tolerance off count as critical (likely recut). */
export function suggestSeverity(type: string, findings: MeasureFinding[] = [], tol = 0.5): DefectSeverity {
  if (CRITICAL.includes(type)) return 'Critical';
  if (findings.some((x) => x.state === 'off' && Math.abs(x.diff) > tol * 4)) return 'Critical';
  if (MINOR.includes(type)) return 'Minor';
  return 'Major';
}

/** Plain-language spec of a garment for the QC screens. */
export function garmentSpec(g: Garment): {fabric: string;colour: string;design: string;designImage?: string;materials: string[];} {
  const fab = g.fabric.source === 'Darzaan' ? fabrics.find((f) => f.id === g.fabric.fabricId) : undefined;
  const piece = g.fabric.pieces[0];
  const fabric = fab ? `${fab.type} (Darzaan · ${fab.id})` : piece ? `${piece.material}` : 'Customer provided';
  const colour = fab?.name ?? piece?.colour ?? '—';
  const approved = g.embroidery.versions.find((v) => v.id === g.embroidery.approvedVersionId);
  const sampler = samplers.find((s) => s.id === g.embroidery.samplerId);
  const design = g.embroidery.mode === 'None' ? 'No embroidery' : approved ? `${approved.label} — ${approved.note}` : sampler ? `${sampler.name} (${sampler.id})` : 'Custom design';
  const materials = [
  ...(fab ? [`${fab.type} · ${g.fabric.meters} m`] : g.fabric.pieces.map((p) => `${p.material} · ${p.length} ${p.unit}`)),
  ...g.attachments.map((a) => {
    const t = trims.find((x) => x.id === a.trimId);
    return t ? `${t.name} × ${a.qty}` : `${a.trimId} × ${a.qty}`;
  }),
  ...(g.embroidery.placement ? [`Embroidery on ${g.embroidery.placement.toLowerCase()}`] : [])];

  return { fabric, colour, design, designImage: approved?.image, materials };
}

/** Share of inspected garments that passed QC without any rework (fixes at QC still count as a pass). */
export function firstPassRate(orders: Order[], issues: QcIssue[]): number {
  const inspected = new Set<string>();
  orders.forEach((o) => o.garments.forEach((g) => {if (isQcPassed(g) || g.qc?.reworkOpen || (g.qc?.rechecks ?? 0) > 0) inspected.add(`${o.id}:${g.id}`);}));
  const failed = new Set(issues.filter((i) => !i.fixedAtQc && i.kind !== 'Packing gap').map((i) => `${i.orderId}:${i.garmentId ?? i.garment}`));
  failed.forEach((k) => inspected.add(k));
  return inspected.size ? Math.round((inspected.size - failed.size) / inspected.size * 100) : 100;
}

/** Defects per responsible worker, including fixes at QC; ignores no-fault and packing gaps. */
export function defectsByWorker(issues: QcIssue[]): {name: string;station: string;defects: number;fixedAtQc: number;reworkMins: number;}[] {
  const map = new Map<string, {name: string;station: string;defects: number;fixedAtQc: number;reworkMins: number;}>();
  issues.filter((i) => i.kind !== 'Packing gap' && !isNoFault(i.responsible)).forEach((i) => {
    const row = map.get(i.responsible) ?? { name: i.responsible, station: i.station, defects: 0, fixedAtQc: 0, reworkMins: 0 };
    row.defects += 1;
    if (i.fixedAtQc) row.fixedAtQc += 1;
    row.reworkMins += i.reworkMins;
    map.set(i.responsible, row);
  });
  return [...map.values()].sort((a, b) => b.defects - a.defects);
}