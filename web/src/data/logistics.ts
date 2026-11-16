import type { DeliveryJob, LogisticsIssue, LogisticsIssueType, Movement, Severity } from '../types';

export const WORKSHOP = 'Okhla Workshop';
export const STORE = 'Khan Market Store';

/** A trip with no scan for this long is flagged as stuck. */
export const STALE_AFTER_HOURS = 2;
/** First re-attempt is free; every attempt after that is charged to the order. */
export const REATTEMPT_CHARGE = 300;

export const runners = ['Arjun Singh', 'Ravi Kumar'];
export const deliveryAgents = ['Sunil Mehta', 'Ravi Kumar'];
export const deliveryWindows = ['10 AM – 1 PM', '1 PM – 4 PM', '4 PM – 7 PM'];
export const receiverRelations = ['Customer', 'Family member', 'Building security', 'Office reception', 'Other'];

export const movements: Movement[] = [
{
  id: 'MV-7710', from: WORKSHOP, to: STORE, runner: 'Arjun Singh', status: 'Awaiting pickup', priority: 'Regular',
  bags: [
  { tag: 'DZ-10297-G1', orderId: 'DZ-10297', garmentId: 'G1', label: 'Straight Kurta', state: 'Waiting' },
  { tag: 'DZ-10297-G2', orderId: 'DZ-10297', garmentId: 'G2', label: 'Palazzo', state: 'Waiting' }],

  lastScan: { at: '2026-10-08T09:40:00', location: 'Packaging — Okhla' },
  custody: [{ at: '2026-10-08T09:40:00', who: 'Pooja Verma', what: 'Packed and labelled — 2 bags ready for pickup' }]
},
{
  id: 'MV-7708', from: STORE, to: WORKSHOP, runner: 'Arjun Singh', status: 'In transit', priority: 'Express',
  bags: [{ tag: 'DZ-10276-G1', orderId: 'DZ-10276', garmentId: 'G1', label: 'Wine blouse — alteration 2', state: 'On board' }],
  lastScan: { at: '2026-10-08T10:05:00', location: 'Lajpat Nagar — en route' },
  custody: [
  { at: '2026-10-08T09:30:00', who: 'Kabir Sethi', what: 'Handed to runner at Khan Market Store' },
  { at: '2026-10-08T09:32:00', who: 'Arjun Singh', what: 'Picked up — 1 bag scanned with photo' }]

},
{
  id: 'MV-7705', from: STORE, to: WORKSHOP, runner: 'Ravi Kumar', status: 'In transit', priority: 'Regular',
  bags: [{ tag: 'DZ-10308-F1', orderId: 'DZ-10308', label: 'Customer fabric parcel', state: 'On board' }],
  lastScan: { at: '2026-10-08T07:50:00', location: 'Khan Market Store — picked up' },
  custody: [{ at: '2026-10-08T07:50:00', who: 'Ravi Kumar', what: 'Picked up — 1 bag scanned with photo' }]
},
{
  id: 'MV-7702', from: WORKSHOP, to: STORE, runner: 'Arjun Singh', status: 'Received', priority: 'Regular',
  bags: [{ tag: 'DZ-10270-G1', orderId: 'DZ-10270', garmentId: 'G1', label: 'Jodhpuri', state: 'Received' }],
  lastScan: { at: '2026-10-03T14:10:00', location: 'Khan Market Store — received' },
  custody: [
  { at: '2026-10-03T11:20:00', who: 'Arjun Singh', what: 'Picked up — 1 bag scanned with photo' },
  { at: '2026-10-03T14:10:00', who: 'Kabir Sethi', what: 'Received and counted at store' }]

}];


export const deliveryJobs: DeliveryJob[] = [
{ id: 'DL-3104', orderId: 'DZ-10270', address: 'Flat 4B, Palm Grove Apartments, Golf Links', addressConfirmed: false, status: 'To schedule', attempts: [] }];


export const logisticsIssues: LogisticsIssue[] = [
{
  id: 'LI-118', type: 'Running late', ref: 'MV-7705', orderIds: ['DZ-10308'], note: 'Traffic at Ashram flyover — expected 40 min late.',
  at: '2026-10-08T08:30:00', by: 'Ravi Kumar', severity: 'attention', owner: 'Vikram Rathore', status: 'Resolved', resolution: 'Workshop informed; no impact on cutting schedule.'
}];


export const issueSeverity: Record<LogisticsIssueType, Severity> = {
  'Bag not ready': 'attention',
  'Damaged in transit': 'critical',
  'Bag missing': 'critical',
  'Running late': 'attention',
  'Short count': 'warning',
  'Wrong bag': 'warning',
  'Customer not home': 'attention',
  'Address problem': 'attention',
  'Refused at door': 'critical'
};

/** Problems a runner can raise while a trip is on the road. */
export const transitIssueTypes: {type: LogisticsIssueType;label: string;hint: string;needsBags: boolean;needsPhoto: boolean;}[] = [
{ type: 'Damaged in transit', label: 'Garment damaged', hint: 'Goes back to finishing with priority. Photo required.', needsBags: true, needsPhoto: true },
{ type: 'Bag missing', label: 'Bag missing', hint: 'Escalated to the manager with the last scan location.', needsBags: true, needsPhoto: false },
{ type: 'Running late', label: 'Running late', hint: 'The destination is told the new arrival time.', needsBags: false, needsPhoto: false }];


export const failReasons: {outcome: 'Not home' | 'Address problem' | 'Refused';label: string;hint: string;}[] = [
{ outcome: 'Not home', label: 'Customer not available', hint: 'Book another slot. First re-attempt is free.' },
{ outcome: 'Address problem', label: 'Address wrong or incomplete', hint: 'Store calls the customer to correct it before the next attempt.' },
{ outcome: 'Refused', label: 'Customer refused the garment', hint: 'Garment returns to the store; manager follows up on fit or quality.' }];