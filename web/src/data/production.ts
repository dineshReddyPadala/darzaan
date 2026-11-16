import type { QcIssue, QcRework, StageKey, StationTask } from '../types';
import { stageOwnerLabel } from '../utils/roles';

const stageList: {key: StageKey;label: string;}[] = [
{ key: 'acknowledgement', label: 'Order Acknowledgement' },
{ key: 'review', label: 'Review' },
{ key: 'scheduling', label: 'Scheduling' },
{ key: 'material', label: 'Material' },
{ key: 'dyeing', label: 'Dyeing' },
{ key: 'marking', label: 'Marking' },
{ key: 'embroidery', label: 'Embroidery' },
{ key: 'cutting', label: 'Cutting' },
{ key: 'stitching', label: 'Stitching' },
{ key: 'hemming', label: 'Hemming' },
{ key: 'finishing', label: 'Finishing' },
{ key: 'qc', label: 'Quality Check' },
{ key: 'ironing', label: 'Ironing' },
{ key: 'packaging', label: 'Packaging' },
{ key: 'logistics', label: 'Delivery' },
{ key: 'store', label: 'At Store' },
{ key: 'trial', label: 'Trial' },
{ key: 'alteration', label: 'Alteration' },
{ key: 'delivery', label: 'Delivered' }];


/** Stage owners come from the role definitions, so the two never drift apart. */
export const stages: {key: StageKey;label: string;station: string;}[] = stageList.map((s) => ({ ...s, station: stageOwnerLabel(s.key) }));

export interface WorkflowStep {
  key: string;
  label: string;
  /** Stage keys that count as being in this step (scheduling sits inside Review, hemming inside Stitching). */
  stages: StageKey[];
}

/** The 13 production steps — one column each on the Production board, one row each in an order's Workflow tab. */
export const workflowSteps: WorkflowStep[] = [
{ key: 'acknowledgement', label: 'Order acknowledgement', stages: ['acknowledgement'] },
{ key: 'review', label: 'Review', stages: ['review', 'scheduling'] },
{ key: 'material', label: 'Material', stages: ['material'] },
{ key: 'dyeing', label: 'Dyeing', stages: ['dyeing'] },
{ key: 'marking', label: 'Marking', stages: ['marking'] },
{ key: 'embroidery', label: 'Embroidery (hand / machine)', stages: ['embroidery'] },
{ key: 'cutting', label: 'Cutting', stages: ['cutting'] },
{ key: 'stitching', label: 'Stitching', stages: ['stitching', 'hemming'] },
{ key: 'finishing', label: 'Finishing', stages: ['finishing'] },
{ key: 'qc', label: 'Quality check', stages: ['qc'] },
{ key: 'ironing', label: 'Ironing', stages: ['ironing'] },
{ key: 'delivery', label: 'Package & deliver', stages: ['packaging', 'logistics'] }];


export const kanbanColumns = workflowSteps;

/** Default checklist for a stage when the planner hasn’t written task-specific instructions. */
export const stageInstructions: Partial<Record<StageKey, {verb: string;station: string;mins: number;steps: string[];}>> = {
  material: { verb: 'Issue material', station: 'Store room', mins: 30, steps: ['Log fabric received and length', 'Issue trims and lining listed on the order', 'Tag fabric with the order QR'] },
  dyeing: { verb: 'Dye fabric', station: 'Dyeing', mins: 240, steps: ['Record dye lot number', 'Match colour against approved swatch', 'Photo of dyed fabric in daylight'] },
  ironing: { verb: 'Iron & press', station: 'Ironing', mins: 20, steps: ['Steam press every panel', 'Check for shine marks', 'Hang on a garment hanger'] },
  marking: { verb: 'Mark pattern', station: 'Master', mins: 60, steps: ['Check verified measurement sheet', 'Mark pattern on fabric with grain aligned', 'Note any pattern corrections'] },
  cutting: { verb: 'Cut', station: 'Master', mins: 75, steps: ['Fabric check — flaws and shade', 'Cut all panels', 'Label panels with order tag'] },
  embroidery: { verb: 'Embroider', station: 'Embroidery', mins: 480, steps: ['Use the approved design version only', 'Confirm placement against the marking', 'Thread colours match the swatch', 'Proof photo against approved reference'] },
  stitching: { verb: 'Stitch', station: 'Tailoring', mins: 240, steps: ['Follow construction notes', 'Attach all trims listed on the order', 'Seams finished inside'] },
  hemming: { verb: 'Hem', station: 'Hemming', mins: 60, steps: ['Level hem on dress form', 'Edge finish / fall / pico as specified', 'Photo of hem on form'] },
  finishing: { verb: 'Finish', station: 'Tailoring', mins: 45, steps: ['Remove loose threads', 'Press garment', 'Final hook, button and zip check'] },
  packaging: { verb: 'Press & pack', station: 'Packaging', mins: 20, steps: ['Final press', 'Tag with order QR label', 'Packing list matches garment count'] },
  alteration: { verb: 'Alter', station: 'Tailoring', mins: 90, steps: ['Read trial fit notes', 'Make the marked correction only', 'Photo after alteration'] }
};

export const stationTasks: StationTask[] = [
{
  id: 'TSK-805', orderId: 'DZ-10305', garmentId: 'G1', station: 'Tailoring', stage: 'stitching', title: 'Stitch Angrakha kurta', priority: 'Express', due: '2026-10-09', estimateMins: 240, status: 'Queued', assignee: 'Imran Sheikh',
  instructions: ['Overlap closure on the right with 8 fabric buttons', 'Rust contrast facing on the overlap edge', 'Side slits 8"', 'Hand-finish inner seams — no overlock visible']
},
{
  id: 'TSK-801', orderId: 'DZ-10301', garmentId: 'G1', station: 'Tailoring', stage: 'stitching', title: 'Stitch sherwani body & sleeves', priority: 'Regular', due: '2026-10-13', estimateMins: 420, status: 'In progress', assignee: 'Imran Sheikh',
  instructions: ['Keep chest ease at 2"', 'Hidden inner pocket on left panel', 'Full lining — cream silk', 'Do not attach buttons until CR-0420 is resolved']
},
{
  id: 'TSK-809', orderId: 'DZ-10276', garmentId: 'G1', station: 'Tailoring', stage: 'alteration', title: 'Alteration 2 — take in bust 1"', priority: 'Regular', due: '2026-10-09', estimateMins: 60, status: 'Queued', assignee: 'Imran Sheikh',
  instructions: ['Take in 1" at side seams', 'Re-dart under bust', 'Re-set hooks to match new closure']
},
{
  id: 'TSK-802', orderId: 'DZ-10293', garmentId: 'G2', station: 'Master', stage: 'cutting', title: 'Cut designer blouse panels', priority: 'Regular', due: '2026-10-09', estimateMins: 90, status: 'Queued', assignee: 'Rafiq Ahmed',
  instructions: ['Three-quarter sleeve — 14" (per CR-0412)', 'Deep U back — 9" depth', 'Pattern match the garnet silk grain']
},
{
  id: 'TSK-806', orderId: 'DZ-10295', garmentId: 'G1', station: 'Master', stage: 'marking', title: 'Mark lehenga kalis', priority: 'Regular', due: '2026-10-12', estimateMins: 120, status: 'In progress', assignee: 'Rafiq Ahmed',
  instructions: ['Customer-provided measurements — verified by designer', '10 kalis, flare 110"', 'Leave 1.5" hem allowance for gota border']
},
{
  id: 'TSK-803', orderId: 'DZ-10293', garmentId: 'G1', station: 'Embroidery', stage: 'embroidery', title: 'Zardozi kalis — panels 5–12', priority: 'Regular', due: '2026-10-10', estimateMins: 960, status: 'In progress', assignee: 'Lakshmi Devi',
  instructions: ['Follow approved sketch v3 only', 'Gradient density — light at waist, heavy at hem', 'Scalloped zardozi border on hem']
},
{
  id: 'TSK-807', orderId: 'DZ-10301', garmentId: 'G1', station: 'Embroidery', stage: 'embroidery', title: 'Machine resham vine — collar & cuffs', priority: 'Regular', due: '2026-10-11', estimateMins: 150, status: 'Queued', assignee: 'Farhan Ali',
  instructions: ['Sampler SMP-141', 'Tone-on-tone mustard thread', 'Collar 1.5" band, cuffs 3"']
},
{
  id: 'TSK-804', orderId: 'DZ-10299', garmentId: 'G1', station: 'Hemming', stage: 'hemming', title: 'Rework — redo hand-rolled hem', priority: 'Regular', due: '2026-10-09', estimateMins: 90, status: 'Queued', assignee: 'Geeta Bai',
  instructions: ['QC found 1.5cm drop at back left', 'Re-level hem on dress form at 60" full length', 'Photo the hem on the form before resubmitting']
}];


/** Six checks — each Pass, Fail or N/A. `team` is who fixes a failure. */
export const qcChecklist: {key: string;label: string;hint: string;team: string;}[] = [
{ key: 'measurements', label: 'Measurements', hint: 'Sizes match the order', team: 'Tailoring Team' },
{ key: 'stitching', label: 'Stitching', hint: 'Seams are straight. No loose or broken stitches.', team: 'Tailoring Team' },
{ key: 'embroidery', label: 'Embroidery', hint: 'Matches the design. No missing beads or threads.', team: 'Embroidery Team' },
{ key: 'attachments', label: 'Add-ons', hint: 'Lace, tassels, hooks and buttons are firmly on.', team: 'Tailoring Team' },
{ key: 'finishing', label: 'Finishing', hint: 'Hem is even. Edges are neat.', team: 'Finishing Team' },
{ key: 'appearance', label: 'Overall look', hint: 'Clean. No stains, marks or damage.', team: 'Finishing Team' }];


/** Defect types offered per category on the Record Defect screen. */
export const qcDefectTypes: Record<string, string[]> = {
  measurements: ['Too loose', 'Too tight', 'Too long', 'Too short', 'Uneven left / right'],
  stitching: ['Puckered seam', 'Uneven seam', 'Broken stitch', 'Open seam', 'Zip not smooth'],
  embroidery: ['Missing beads', 'Loose threads', 'Wrong placement', 'Colour mismatch', 'Sequins missing'],
  attachments: ['Tassel missing', 'Hook loose', 'Lace not attached', 'Wrong trim used', 'Button loose'],
  finishing: ['Hem uneven', 'Raw edge', 'Loose threads', 'Pressing marks'],
  appearance: ['Stain', 'Snag / pull', 'Colour bleed', 'Shade mismatch', 'Damaged fabric']
};

export const qcLocations = ['Front panel', 'Back panel', 'Sleeve', 'Neckline', 'Waist', 'Hem', 'Dupatta', 'Lining', 'Whole garment'];

/** Teams that take rework, with the person responsible by default. */
export const qcTeams: {team: string;lead: string;members: string[];}[] = [
{ team: 'Embroidery Team', lead: 'Lakshmi Devi', members: ['Lakshmi Devi', 'Farhan Ali', 'Meera Sahu'] },
{ team: 'Tailoring Team', lead: 'Imran Sheikh', members: ['Imran Sheikh', 'Suresh Kumar'] },
{ team: 'Finishing Team', lead: 'Geeta Bai', members: ['Geeta Bai', 'Rani Devi'] },
{ team: 'Master (Cutting)', lead: 'Rafiq Ahmed', members: ['Rafiq Ahmed'] },
{ team: 'Material / Dyeing', lead: 'Mohan Lal', members: ['Mohan Lal'] }];


const DEFECT_PHOTO = "/5b0f1393-e455-42db-89cf-53a0edc01f31.jpg";

/** Rework already under way when the prototype opens. */
export const qcReworks: QcRework[] = [
{
  id: 'RW-118', orderId: 'DZ-10312', garmentId: 'G1',
  defect: { category: 'embroidery', type: 'Missing beads', severity: 'Major', location: 'Front panel', description: 'Missing beads in floral motif on front panel.', photos: [DEFECT_PHOTO] },
  team: 'Embroidery Team', assignee: 'Meera Sahu', priority: 'High', due: '2026-10-08',
  instructions: 'Add missing beads as per design. Maintain same pattern and colour.',
  status: 'Ready for QC',
  events: [
  { step: 'Failed QC', at: '2026-10-07T11:20:00', by: 'Deepa Joshi' },
  { step: 'Assigned', at: '2026-10-07T11:30:00', by: 'Vikram Rathore' },
  { step: 'In rework', at: '2026-10-07T15:10:00', by: 'Meera Sahu' },
  { step: 'Ready for QC', at: '2026-10-08T09:05:00', by: 'Meera Sahu' }]

},
{
  id: 'RW-117', orderId: 'DZ-10299', garmentId: 'G1',
  defect: { category: 'finishing', type: 'Hem uneven', severity: 'Major', location: 'Hem', description: 'Hem drops about 1.5 cm at the back left.', photos: [] },
  team: 'Finishing Team', assignee: 'Geeta Bai', priority: 'Medium', due: '2026-10-09',
  instructions: 'Redo the hand-rolled hem; level it on the stand.',
  status: 'In rework',
  events: [
  { step: 'Failed QC', at: '2026-10-07T15:20:00', by: 'Deepa Joshi' },
  { step: 'Assigned', at: '2026-10-07T15:22:00', by: 'Deepa Joshi' },
  { step: 'In rework', at: '2026-10-08T09:10:00', by: 'Geeta Bai' }]

}];


export const qcIssues: QcIssue[] = [
{ id: 'QCI-231', orderId: 'DZ-10299', garmentId: 'G1', garment: 'Evening Gown', kind: 'Defect', checkKey: 'finishing', defectType: 'Hem uneven', severity: 'Major', issue: 'Uneven hem — 1.5cm drop at back left', station: 'Hemming', responsible: 'Geeta Bai', reworkMins: 0, repeat: 1, at: '2026-10-07T15:20:00', status: 'In rework', inspector: 'Deepa Joshi' },
{ id: 'QCI-227', orderId: 'DZ-10288', garmentId: 'G1', garment: 'Floor-length Anarkali', kind: 'Defect', checkKey: 'embroidery', defectType: 'Loose threads', severity: 'Minor', issue: 'Loose thread ends on yoke embroidery', station: 'Embroidery', responsible: 'Lakshmi Devi', reworkMins: 35, repeat: 1, at: '2026-10-03T12:10:00', status: 'Resolved', inspector: 'Deepa Joshi' },
{ id: 'QCI-224', orderId: 'DZ-10288', garmentId: 'G1', garment: 'Floor-length Anarkali', kind: 'Defect', checkKey: 'finishing', defectType: 'Loose threads', severity: 'Minor', issue: 'Thread ends at hem — snipped at QC', station: 'Hemming', responsible: 'Geeta Bai', reworkMins: 0, repeat: 1, at: '2026-10-03T12:10:00', status: 'Resolved', fixedAtQc: true, inspector: 'Deepa Joshi' },
{ id: 'QCI-219', orderId: 'DZ-10270', garmentId: 'G1', garment: 'Jodhpuri Bandhgala', kind: 'Defect', checkKey: 'finishing', defectType: 'Piping uneven', severity: 'Major', issue: 'Collar piping uneven', station: 'Tailoring', responsible: 'Imran Sheikh', reworkMins: 50, repeat: 1, at: '2026-10-01T16:00:00', status: 'Resolved', inspector: 'Deepa Joshi' },
{ id: 'QCI-216', orderId: 'DZ-10276', garmentId: 'G1', garment: 'Designer Blouse', kind: 'Defect', checkKey: 'measurements', defectType: 'Missed at QC — found at trial', severity: 'Major', issue: 'Bust 1" loose — passed QC, found at trial', station: 'Master', responsible: 'Rafiq Ahmed', reworkMins: 60, repeat: 1, at: '2026-09-28T17:30:00', status: 'Resolved', inspector: 'Deepa Joshi' },
{ id: 'QCI-212', orderId: 'DZ-10260', garmentId: 'G1', garment: 'Regular Blouse', kind: 'Defect', checkKey: 'measurements', defectType: 'Off tolerance', severity: 'Major', issue: 'Sleeve length 0.5" short', station: 'Master', responsible: 'Suresh Kumar', reworkMins: 70, repeat: 2, at: '2026-08-25T11:00:00', status: 'Resolved', inspector: 'Deepa Joshi' }];


/** Which stage each QC check is attributed to — the worker who completed it is responsible. */
export const qcCheckStage: Record<string, StageKey> = {
  measurements: 'stitching',
  fabric: 'material',
  stitching: 'stitching',
  embroidery: 'embroidery',
  finishing: 'finishing',
  design: 'stitching',
  appearance: 'finishing',
  // Older checks on past issues
  construction: 'stitching',
  reference: 'stitching',
  instructions: 'stitching',
  attachments: 'stitching'
};

/** Station lead used when nobody is recorded as having completed a stage. */
export const stageLead: Partial<Record<StageKey, {station: string;person: string;}>> = {
  material: { station: 'Material / Dyeing', person: 'Mohan Lal' },
  marking: { station: 'Master', person: 'Rafiq Ahmed' },
  cutting: { station: 'Master', person: 'Rafiq Ahmed' },
  embroidery: { station: 'Embroidery', person: 'Lakshmi Devi' },
  stitching: { station: 'Tailoring', person: 'Imran Sheikh' },
  hemming: { station: 'Hemming', person: 'Geeta Bai' },
  finishing: { station: 'Finishing', person: 'Geeta Bai' }
};

export const workshopPeople: {name: string;station: string;}[] = [
{ name: 'Rafiq Ahmed', station: 'Master' },
{ name: 'Suresh Kumar', station: 'Master' },
{ name: 'Mohan Lal', station: 'Material / Dyeing' },
{ name: 'Lakshmi Devi', station: 'Embroidery' },
{ name: 'Farhan Ali', station: 'Embroidery' },
{ name: 'Imran Sheikh', station: 'Tailoring' },
{ name: 'Geeta Bai', station: 'Hemming' }];


/** Label used when a defect is nobody’s fault (material flaw, unclear instruction). */
export const NO_FAULT = 'No one — not a worker’s fault';


export const issueTypes: {key: string;label: string;routesTo: string;}[] = [
{ key: 'wrong-cut', label: 'Wrong cut', routesTo: 'Master' },
{ key: 'fabric-shortage', label: 'Fabric shortage', routesTo: 'Material / Dyeing' },
{ key: 'measurement', label: 'Measurement doubt / mismatch', routesTo: 'Designer' },
{ key: 'stitching', label: 'Stitching defect', routesTo: 'Tailoring' },
{ key: 'trim', label: 'Missing trim', routesTo: 'Inventory' }];