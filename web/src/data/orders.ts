import type { Garment, Order, StageKey } from '../types';

const IMG = {
  lehenga: "/5bbc16d3-440c-4190-af3a-e3d24fc32e38.jpg",
  blouse: "/61fc06d2-4799-40e8-8d78-9f69b7cff50c.jpg",
  anarkali: "/279594f1-f5ff-4447-ab02-1da3a0e644ff.jpg",
  kurta: "/71b24e41-b952-4901-be1c-ab737d7907e7.jpg"
};

export const orders: Order[] = [
{
  id: 'DZ-10293', customerId: 'C-1001', createdAt: '2026-09-21T12:10:00', deliveryDate: '2026-10-14', status: 'In Production', priority: 'Regular',
  occasion: 'Wedding — 18 Oct', designer: 'Nisha Arora', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 5000,
  garments: [
  {
    id: 'G1', category: 'Lehenga', subCategory: 'Bridal Lehenga', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2104', meters: 6, pieces: [] },
    embroidery: {
      mode: 'Custom', technique: 'Hand', placement: 'Full skirt — 12 kalis with scalloped hem border',
      versions: [
      { id: 'SK-1', label: 'Version 1', note: 'Dense floral jaal across all kalis', at: '2026-09-21T13:00:00', status: 'Superseded', customerComment: 'Too heavy near the waist.' },
      { id: 'SK-2', label: 'Version 2', note: 'Gradient density — light at waist, heavy at hem', at: '2026-09-23T17:20:00', status: 'Superseded', customerComment: 'Love it. Can the border be scalloped?' },
      { id: 'SK-3', label: 'Version 3', note: 'Gradient density with scalloped zardozi border', at: '2026-09-25T11:05:00', status: 'Approved', customerComment: 'Approved — this is the one.' }],

      approvedVersionId: 'SK-3'
    },
    attachments: [{ trimId: 'TRM-301', qty: 8 }, { trimId: 'TRM-330', qty: 4 }],
    construction: ['Can-can', 'Full lining', 'Concealed zip'], finishing: ['Piping'],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Waist: 28, Hip: 38, Length: 41, Flare: 120 }, unit: 'in',
    photos: [], notes: 'Hem to graze the floor with 2" heels. Latkans on the drawstring.', customFields: [{ id: 'CF-1', label: 'Kali count', type: 'Number', value: '12' }],
    stage: 'embroidery', assignee: 'Lakshmi Devi'
  },
  {
    id: 'G2', category: 'Blouse', subCategory: 'Designer Blouse', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2101', meters: 1.5, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Hand', samplerId: 'SMP-101', placement: 'Sleeve hem and back neckline', versions: [] },
    attachments: [{ trimId: 'TRM-320', qty: 6 }],
    construction: ['Padded cups', 'Hooks & eyes'], finishing: ['Lace edging'],
    measurementSource: 'Profile', measurementVerified: true,
    measurements: { Shoulder: 14.5, Bust: 34, 'Under Bust': 29, Waist: 28, 'Blouse Length': 14, 'Sleeve Length': 14, 'Sleeve Round': 11, Armhole: 16, 'Front Neck Depth': 7, 'Back Neck Depth': 9 }, unit: 'in',
    photos: [], notes: 'Deep U back with tie-up dori. Sleeve changed to three-quarter (CR-0412).', customFields: [],
    stage: 'cutting', assignee: 'Rafiq Ahmed'
  }],

  payments: [{ id: 'PAY-5521', amount: 61200, method: 'UPI', reference: 'UPI 6271 0093 4410', at: '2026-09-21T12:42:00', by: 'Ritu Sharma', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Nisha Arora', at: '2026-09-21T12:40:00', version: 2 },
  { role: 'Customer', name: 'Ananya Mehra', at: '2026-09-27T16:12:00', version: 2 }],

  trial: { date: '2026-10-12', time: '11:00', status: 'Scheduled' },
  alterations: [],
  changeRequests: [
  { id: 'CR-0412', field: 'Blouse sleeve length', before: 'Elbow length — 10"', after: 'Three-quarter — 14"', priceImpact: 0, dateImpact: 'No change', status: 'Approved', requestedBy: 'Ananya Mehra', at: '2026-09-27T16:05:00' }],

  messages: [
  { id: 'M-1', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-09-21T12:45:00', status: 'Read' },
  { id: 'M-2', channel: 'WhatsApp', template: 'Design approval request — v3', at: '2026-09-25T11:06:00', status: 'Read' },
  { id: 'M-3', channel: 'WhatsApp', template: 'Production started', at: '2026-09-29T09:30:00', status: 'Read' }],

  risk: { severity: 'warning', message: 'May miss delivery — lehenga embroidery is 2 days behind plan', owner: 'Vikram Rathore' },
  nextAction: { label: 'Finish lehenga embroidery (panels 5–12) by 10 Oct', owner: 'Lakshmi Devi' },
  activity: [
  { id: 'A1', at: '2026-09-21T12:10:00', who: 'Nisha Arora', what: 'Order created from draft quote Q-2038', kind: 'created' },
  { id: 'A2', at: '2026-09-21T12:40:00', who: 'Ananya Mehra', what: 'Signed order (version 1)', kind: 'signature' },
  { id: 'A3', at: '2026-09-21T12:42:00', who: 'Ritu Sharma', what: 'Advance ₹61,200 received via UPI', kind: 'payment' },
  { id: 'A4', at: '2026-09-25T11:30:00', who: 'Ananya Mehra', what: 'Approved lehenga embroidery sketch v3 — version locked', kind: 'design' },
  { id: 'A5', at: '2026-09-27T16:12:00', who: 'Ananya Mehra', what: 'Approved change CR-0412 and re-signed (version 2)', kind: 'change' },
  { id: 'A6', at: '2026-09-29T09:15:00', who: 'Vikram Rathore', what: 'Production review complete — tasks created', kind: 'production' },
  { id: 'A7', at: '2026-09-29T09:20:00', who: 'Vikram Rathore', what: 'Assigned lehenga embroidery to Lakshmi Devi', kind: 'assignment' },
  { id: 'A8', at: '2026-10-07T18:00:00', who: 'System', what: 'Delivery risk raised — embroidery behind plan', kind: 'production' }]

},
{
  id: 'DZ-10301', customerId: 'C-1002', createdAt: '2026-09-28T15:30:00', deliveryDate: '2026-10-20', status: 'In Production', priority: 'Regular',
  occasion: 'Wedding — 24 Oct', designer: 'Aarav Bedi', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Sherwani', subCategory: 'Classic Sherwani', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2140', meters: 3.5, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Machine', samplerId: 'SMP-141', placement: 'Collar, placket and cuffs', versions: [] },
    attachments: [{ trimId: 'TRM-320', qty: 9 }],
    construction: ['Full lining'], finishing: [],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 18, Chest: 40, Waist: 34, Hip: 39, Length: 42, 'Sleeve Length': 25, Neck: 15.5, Bicep: 13 }, unit: 'in',
    photos: [], notes: 'Keep chest ease at 2". Hidden inner pocket on left.', customFields: [],
    stage: 'stitching', assignee: 'Imran Sheikh'
  },
  {
    id: 'G2', category: 'Kurta', subCategory: 'Regular Kurta', urgency: 'Regular',
    fabric: { source: 'Customer', meters: 0, pieces: [{ id: 'FP-1', material: 'Ivory silk (customer)', length: 2.5, unit: 'm', notes: 'Slight sheen; wash before cutting' }] },
    embroidery: { mode: 'None', versions: [] },
    attachments: [{ trimId: 'TRM-321', qty: 6 }],
    construction: [], finishing: ['Piping'],
    measurementSource: 'Profile', measurementVerified: true, measurements: { Shoulder: 18, Chest: 40, Waist: 34, Hip: 39, 'Kurta Length': 40, 'Sleeve Length': 25, Armhole: 19, Neck: 15.5 }, unit: 'in',
    photos: ["/71b24e41-b952-4901-be1c-ab737d7907e7.jpg"], notes: 'Mandarin collar, side pockets.', customFields: [],
    stage: 'qc',
    doneBy: { cutting: 'Rafiq Ahmed', stitching: 'Imran Sheikh', hemming: 'Geeta Bai' },
    qc: { rechecks: 0, arrivedAt: '2026-10-08T05:45:00' }
  }],

  payments: [{ id: 'PAY-5560', amount: 27800, method: 'Card', reference: 'HDFC •••• 4412', at: '2026-09-28T15:50:00', by: 'Ritu Sharma', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Aarav Bedi', at: '2026-09-28T15:46:00', version: 1 },
  { role: 'Customer', name: 'Rohan Kapoor', at: '2026-09-28T15:47:00', version: 1 }],

  alterations: [], changeRequests: [
  { id: 'CR-0420', field: 'Sherwani buttons', before: 'Kundan buttons × 9', after: 'Antique brass buttons × 9', priceImpact: 450, dateImpact: '+1 day', status: 'Awaiting approval', requestedBy: 'Rohan Kapoor', at: '2026-10-07T19:10:00' }],

  messages: [{ id: 'M-1', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-09-28T15:52:00', status: 'Read' }],
  nextAction: { label: 'Customer to approve button change CR-0420', owner: 'Rohan Kapoor' },
  activity: [
  { id: 'A1', at: '2026-09-28T15:30:00', who: 'Aarav Bedi', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-09-28T15:50:00', who: 'Ritu Sharma', what: 'Advance ₹27,800 received by card', kind: 'payment' },
  { id: 'A3', at: '2026-10-01T10:00:00', who: 'Vikram Rathore', what: 'Production started', kind: 'production' },
  { id: 'A4', at: '2026-10-07T19:10:00', who: 'Aarav Bedi', what: 'Change request CR-0420 raised — awaiting customer approval', kind: 'change' }]

},
{
  id: 'DZ-10288', customerId: 'C-1003', createdAt: '2026-09-24T11:00:00', deliveryDate: '2026-10-12', status: 'Ready for Trial', priority: 'Regular',
  occasion: 'Sangeet — 15 Oct', designer: 'Nisha Arora', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Anarkali', subCategory: 'Floor Length', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2110', meters: 7, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Hand', samplerId: 'SMP-114', placement: 'Yoke and sleeve band', versions: [] },
    attachments: [], construction: ['Full lining', 'Concealed zip'], finishing: ['Lace edging'],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 14, Bust: 33, Waist: 27, 'Yoke Length': 13, 'Full Length': 56, Flare: 180, 'Sleeve Length': 6, Armhole: 15.5 }, unit: 'in',
    photos: [], notes: 'Cap sleeves. Side zip.', customFields: [],
    stage: 'trial'
  }],

  payments: [{ id: 'PAY-5540', amount: 15700, method: 'UPI', reference: 'UPI 8812 3301 0021', at: '2026-09-24T11:30:00', by: 'Ritu Sharma', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Nisha Arora', at: '2026-09-24T11:25:00', version: 1 },
  { role: 'Customer', name: 'Kavya Iyer', at: '2026-09-24T11:26:00', version: 1 }],

  trial: { date: '2026-10-08', time: '11:30', status: 'Scheduled' },
  alterations: [], changeRequests: [],
  messages: [
  { id: 'M-1', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-09-24T11:32:00', status: 'Read' },
  { id: 'M-2', channel: 'WhatsApp', template: 'Ready for trial', at: '2026-10-06T17:00:00', status: 'Read' },
  { id: 'M-3', channel: 'WhatsApp', template: 'Trial reminder — today 11:30', at: '2026-10-08T08:00:00', status: 'Delivered' }],

  nextAction: { label: 'Trial today at 11:30', owner: 'Nisha Arora' },
  activity: [
  { id: 'A1', at: '2026-09-24T11:00:00', who: 'Nisha Arora', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-09-24T11:30:00', who: 'Ritu Sharma', what: 'Advance ₹15,700 received via UPI', kind: 'payment' },
  { id: 'A3', at: '2026-10-04T16:40:00', who: 'Deepa Joshi', what: 'Passed QC (9/9 checks)', kind: 'qc' },
  { id: 'A4', at: '2026-10-05T14:10:00', who: 'Arjun Singh', what: 'Delivered to Khan Market store', kind: 'logistics' },
  { id: 'A5', at: '2026-10-06T17:00:00', who: 'System', what: 'Customer notified — ready for trial', kind: 'communication' }]

},
{
  id: 'DZ-10276', customerId: 'C-1004', createdAt: '2026-09-15T13:20:00', deliveryDate: '2026-10-10', status: 'Alteration', priority: 'Regular',
  occasion: 'Festive', designer: 'Tanvi Kohli', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Blouse', subCategory: 'Regular Blouse', urgency: 'Regular',
    fabric: { source: 'Customer', meters: 0, pieces: [{ id: 'FP-1', material: 'Kanjivaram saree blouse piece (wine)', length: 0.9, unit: 'm', notes: 'Attached to saree — cut carefully' }] },
    embroidery: { mode: 'None', versions: [] }, attachments: [], construction: ['Hooks & eyes'], finishing: ['Piping'],
    measurementSource: 'Sample garment', measurementVerified: true, measurements: { Shoulder: 15, Bust: 37, 'Under Bust': 32, Waist: 31, 'Blouse Length': 15, 'Sleeve Length': 11, 'Sleeve Round': 12.5, Armhole: 17, 'Front Neck Depth': 6.5, 'Back Neck Depth': 8 }, unit: 'in',
    photos: [], notes: '', customFields: [], stage: 'alteration'
  },
  {
    id: 'G2', category: 'Blouse', subCategory: 'Regular Blouse', urgency: 'Regular',
    fabric: { source: 'Customer', meters: 0, pieces: [{ id: 'FP-2', material: 'Cotton silk blouse piece (mustard)', length: 1, unit: 'm', notes: '' }] },
    embroidery: { mode: 'None', versions: [] }, attachments: [{ trimId: 'TRM-311', qty: 2 }], construction: ['Hooks & eyes'], finishing: ['Piping'],
    measurementSource: 'Sample garment', measurementVerified: true, measurements: { Shoulder: 15, Bust: 37, 'Under Bust': 32, Waist: 31, 'Blouse Length': 15, 'Sleeve Length': 11, 'Sleeve Round': 12.5, Armhole: 17, 'Front Neck Depth': 6.5, 'Back Neck Depth': 8 }, unit: 'in',
    photos: [], notes: 'Lace on sleeve hem.', customFields: [], stage: 'store'
  }],

  payments: [{ id: 'PAY-5502', amount: 4200, method: 'Cash', reference: 'Receipt R-2290', at: '2026-09-15T13:40:00', by: 'Kabir Sethi', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Tanvi Kohli', at: '2026-09-15T13:35:00', version: 1 },
  { role: 'Customer', name: 'Meera Shah', at: '2026-09-15T13:36:00', version: 1 }],

  trial: { date: '2026-10-03', time: '17:00', status: 'Completed', notes: 'Bust loose by ~1". Armhole tight on wine blouse.' },
  alterations: [
  { id: 'ALT-1', at: '2026-10-03T17:30:00', issue: 'Armhole tight', notes: 'Release armhole 0.5" on wine blouse', type: 'Small', status: 'Resolved', charge: 0, garmentId: 'G1' },
  { id: 'ALT-2', at: '2026-10-06T18:10:00', issue: 'Bust loose', notes: 'Take in 1" at side seams and re-dart. Re-set hooks.', type: 'Major', status: 'In workshop', charge: 0, billing: 'Free', round: 2, garmentId: 'G1', recordedBy: 'Tanvi Kohli' }],

  changeRequests: [],
  messages: [{ id: 'M-1', channel: 'WhatsApp', template: 'Alteration update', at: '2026-10-06T18:20:00', status: 'Read' }],
  risk: { severity: 'attention', message: 'Second alteration in progress — any further alteration is chargeable', owner: 'Tanvi Kohli' },
  nextAction: { label: 'Workshop to return wine blouse after bust adjustment', owner: 'Imran Sheikh' },
  activity: [
  { id: 'A1', at: '2026-09-15T13:20:00', who: 'Tanvi Kohli', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-09-15T13:40:00', who: 'Kabir Sethi', what: 'Advance ₹4,200 received in cash', kind: 'payment' },
  { id: 'A3', at: '2026-10-03T17:00:00', who: 'Tanvi Kohli', what: 'Trial completed — 2 fit notes', kind: 'trial' },
  { id: 'A4', at: '2026-10-03T17:30:00', who: 'Store Tailor', what: 'Alteration 1 (small) resolved in store', kind: 'alteration' },
  { id: 'A5', at: '2026-10-06T18:10:00', who: 'Tanvi Kohli', what: 'Alteration 2 (major) sent to workshop', kind: 'alteration' }]

},
{
  id: 'DZ-10305', customerId: 'C-1005', createdAt: '2026-10-06T18:30:00', deliveryDate: '2026-10-09', status: 'Confirmed', priority: 'Express',
  occasion: 'Work event — 9 Oct', designer: 'Aarav Bedi', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Kurta', subCategory: 'Angrakha', urgency: 'Express 24h',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2130', meters: 2.75, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [{ trimId: 'TRM-321', qty: 8 }], construction: [], finishing: ['Contrast facing'],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 14, Chest: 34, Waist: 29, Hip: 37, 'Kurta Length': 38, 'Sleeve Length': 22, Armhole: 16, Neck: 13.5 }, unit: 'in',
    photos: [], notes: 'Rust contrast facing on the overlap.', customFields: [], stage: 'review'
  }],

  payments: [{ id: 'PAY-5588', amount: 9520, method: 'UPI', reference: 'UPI 4410 2287 9901', at: '2026-10-06T18:45:00', by: 'Ritu Sharma', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Aarav Bedi', at: '2026-10-06T18:40:00', version: 1 },
  { role: 'Customer', name: 'Priya Nair', at: '2026-10-06T18:41:00', version: 1 }],

  alterations: [], changeRequests: [], messages: [{ id: 'M-1', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-10-06T18:47:00', status: 'Read' }],
  risk: { severity: 'critical', message: 'Express (24h) — work has not started and it is due tomorrow', owner: 'Vikram Rathore' },
  nextAction: { label: 'Review and assign to a tailor now', owner: 'Vikram Rathore' },
  activity: [
  { id: 'A1', at: '2026-10-06T18:30:00', who: 'Aarav Bedi', what: 'Express order created', kind: 'created' },
  { id: 'A2', at: '2026-10-06T18:45:00', who: 'Ritu Sharma', what: 'Full payment ₹9,520 received via UPI', kind: 'payment' },
  { id: 'A3', at: '2026-10-08T09:00:00', who: 'System', what: 'Escalated to Production Head — not started', kind: 'production' }]

},
{
  id: 'DZ-10270', customerId: 'C-1006', createdAt: '2026-09-12T16:00:00', deliveryDate: '2026-10-08', status: 'Ready for Pickup', priority: 'Regular',
  occasion: 'Reception', designer: 'Aarav Bedi', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Home delivery', deliveryCharge: 500, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Bandhgala', subCategory: 'Jodhpuri', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2133', meters: 3, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [{ trimId: 'TRM-320', qty: 7 }], construction: ['Full lining'], finishing: ['Piping'],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 17.5, Chest: 39, Waist: 33, Hip: 38, Length: 30, 'Sleeve Length': 24.5, Neck: 15, Bicep: 12.5 }, unit: 'in',
    photos: [], notes: '', customFields: [], stage: 'store'
  }],

  payments: [{ id: 'PAY-5490', amount: 14400, method: 'Card', reference: 'ICICI •••• 9081', at: '2026-09-12T16:20:00', by: 'Kabir Sethi', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Aarav Bedi', at: '2026-09-12T16:15:00', version: 1 },
  { role: 'Customer', name: 'Ishaan Malhotra', at: '2026-09-12T16:16:00', version: 1 }],

  trial: { date: '2026-10-04', time: '12:00', status: 'Completed', notes: 'Perfect fit.' },
  alterations: [], changeRequests: [],
  messages: [{ id: 'M-1', channel: 'SMS', template: 'Ready for pickup', at: '2026-10-05T11:00:00', status: 'Delivered' }],
  nextAction: { label: 'Confirm address and schedule home delivery', owner: 'Sunil Mehta' },
  activity: [
  { id: 'A1', at: '2026-09-12T16:00:00', who: 'Aarav Bedi', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-09-12T16:20:00', who: 'Kabir Sethi', what: 'Advance ₹14,400 received by card', kind: 'payment' },
  { id: 'A3', at: '2026-10-04T12:20:00', who: 'Aarav Bedi', what: 'Trial completed — no alterations', kind: 'trial' },
  { id: 'A4', at: '2026-10-05T11:00:00', who: 'System', what: 'Customer notified by SMS — ready for pickup', kind: 'communication' }]

},
{
  id: 'DZ-10299', customerId: 'C-1007', createdAt: '2026-09-27T12:00:00', deliveryDate: '2026-10-16', status: 'In Production', priority: 'Regular',
  occasion: 'Cocktail — 19 Oct', designer: 'Tanvi Kohli', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Home delivery', deliveryCharge: 500, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Gown', subCategory: 'Evening Gown', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2120', meters: 4, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [], construction: ['Boning', 'Concealed zip'], finishing: ['Hand-rolled hem'],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 14, Bust: 34, Waist: 27, Hip: 37, 'Full Length': 60, 'Sleeve Length': 0 }, unit: 'in',
    photos: [], notes: 'Off-shoulder, corseted bodice.', customFields: [], stage: 'qc', assignee: 'Geeta Bai',
    doneBy: { cutting: 'Rafiq Ahmed', stitching: 'Imran Sheikh', hemming: 'Geeta Bai' },
    qc: { rechecks: 0, reworkOpen: true, arrivedAt: '2026-10-07T14:00:00' }
  }],

  payments: [{ id: 'PAY-5555', amount: 16300, method: 'UPI', reference: 'UPI 7720 1183 0042', at: '2026-09-27T12:30:00', by: 'Ritu Sharma', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Tanvi Kohli', at: '2026-09-27T12:25:00', version: 1 },
  { role: 'Customer', name: 'Zoya Khan', at: '2026-09-27T12:26:00', version: 1 }],

  alterations: [], changeRequests: [], messages: [{ id: 'M-1', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-09-27T12:32:00', status: 'Read' }],
  risk: { severity: 'warning', message: 'Failed QC — uneven hem. Sent back to Hemming (rework 1)', owner: 'Geeta Bai' },
  nextAction: { label: 'Redo hem and resubmit to QC', owner: 'Geeta Bai' },
  activity: [
  { id: 'A1', at: '2026-09-27T12:00:00', who: 'Tanvi Kohli', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-09-27T12:30:00', who: 'Ritu Sharma', what: 'Advance ₹16,300 received via UPI', kind: 'payment' },
  { id: 'A3', at: '2026-10-07T15:20:00', who: 'Deepa Joshi', what: 'Failed QC — uneven hem (1.5cm drop at back left)', kind: 'qc' },
  { id: 'A4', at: '2026-10-07T15:22:00', who: 'System', what: 'Rework routed to Hemming — Geeta Bai', kind: 'rework' }]

},
{
  id: 'DZ-10260', customerId: 'C-1001', createdAt: '2026-08-12T14:00:00', deliveryDate: '2026-08-30', status: 'Closed', priority: 'Regular',
  occasion: 'Festive', designer: 'Nisha Arora', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Blouse', subCategory: 'Regular Blouse', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2115', meters: 1.25, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Machine', samplerId: 'SMP-122', placement: 'Back panel', versions: [] },
    attachments: [], construction: ['Hooks & eyes'], finishing: [],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 14.5, Bust: 34, Waist: 28, 'Blouse Length': 14 }, unit: 'in',
    photos: [], notes: '', customFields: [], stage: 'delivery'
  }],

  payments: [
  { id: 'PAY-5101', amount: 4500, method: 'UPI', reference: 'UPI 1102 7781 3390', at: '2026-08-12T14:20:00', by: 'Ritu Sharma', kind: 'Advance' },
  { id: 'PAY-5233', amount: 1931, method: 'UPI', reference: 'UPI 1102 9910 0023', at: '2026-08-30T12:00:00', by: 'Kabir Sethi', kind: 'Balance' }],

  signatures: [{ role: 'Customer', name: 'Ananya Mehra', at: '2026-08-12T14:15:00', version: 1 }],
  trial: { date: '2026-08-27', time: '11:00', status: 'Completed' },
  alterations: [], changeRequests: [], messages: [{ id: 'M-1', channel: 'WhatsApp', template: 'Final invoice & thank you', at: '2026-08-30T12:05:00', status: 'Read' }],
  nextAction: { label: 'Order closed', owner: '—' },
  activity: [
  { id: 'A1', at: '2026-08-12T14:00:00', who: 'Nisha Arora', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-08-30T12:00:00', who: 'Kabir Sethi', what: 'Handed over and order closed', kind: 'closure' }]

},
{
  id: 'DZ-10308', customerId: 'C-1008', createdAt: '2026-10-05T17:40:00', deliveryDate: '2026-10-24', status: 'Confirmed', priority: 'Regular',
  occasion: 'Diwali', designer: 'Aarav Bedi', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Kurta', subCategory: 'Regular Kurta', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2115', meters: 2.5, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [{ trimId: 'TRM-321', qty: 6 }], construction: [], finishing: [],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 17.5, Chest: 38, Waist: 33, Hip: 38, 'Kurta Length': 39, 'Sleeve Length': 24, Armhole: 18.5, Neck: 15 }, unit: 'in',
    photos: [], notes: '', customFields: [], stage: 'review'
  },
  {
    id: 'G2', category: 'Salwar', subCategory: 'Churidar', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2115', meters: 2, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [], construction: [], finishing: [],
    measurementSource: 'Designer', measurementVerified: false, measurements: { Waist: 33, Hip: 38, Length: 41 }, unit: 'in',
    photos: [], notes: 'Thigh, knee, ankle to be confirmed.', customFields: [], stage: 'review'
  }],

  payments: [{ id: 'PAY-5580', amount: 3900, method: 'Cash', reference: 'Receipt R-2341', at: '2026-10-05T17:55:00', by: 'Kabir Sethi', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Aarav Bedi', at: '2026-10-05T17:50:00', version: 1 },
  { role: 'Customer', name: 'Nikhil Rao', at: '2026-10-05T17:51:00', version: 1 }],

  alterations: [], changeRequests: [], messages: [{ id: 'M-1', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-10-05T17:58:00', status: 'Read' }],
  risk: { severity: 'attention', message: 'Advance incomplete — 40% paid of 70% required. Churidar measurements incomplete.', owner: 'Kabir Sethi' },
  nextAction: { label: 'Collect remaining advance and complete churidar measurements', owner: 'Kabir Sethi' },
  activity: [
  { id: 'A1', at: '2026-10-05T17:40:00', who: 'Aarav Bedi', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-10-05T17:55:00', who: 'Kabir Sethi', what: 'Partial advance ₹3,900 received in cash (manager override)', kind: 'payment' }]

},
{
  id: 'DZ-10295', customerId: 'C-1009', createdAt: '2026-09-26T10:00:00', deliveryDate: '2026-10-28', status: 'In Production', priority: 'Regular',
  occasion: 'Wedding in Goa — 6 Nov', designer: 'Nisha Arora', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Home delivery', deliveryCharge: 3500, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Lehenga', subCategory: 'Party Lehenga', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2124', meters: 5, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Hand', samplerId: 'SMP-130', placement: 'Hem border and waistband', versions: [] },
    attachments: [{ trimId: 'TRM-302', qty: 6 }], construction: ['Can-can', 'Full lining'], finishing: ['Piping'],
    measurementSource: 'Customer', measurementVerified: true, measurements: { Waist: 27, Hip: 36, Length: 40, Flare: 110 }, unit: 'in',
    photos: [], notes: 'Lightweight can-can for travel. Ships to Dubai.', customFields: [], stage: 'marking', assignee: 'Rafiq Ahmed'
  }],

  payments: [{ id: 'PAY-5550', amount: 25100, method: 'Bank transfer', reference: 'SWIFT ENBD-88123', at: '2026-09-26T16:00:00', by: 'Anjali Desai', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Nisha Arora', at: '2026-09-26T10:30:00', version: 1 },
  { role: 'Customer', name: "Sara D'Souza", at: '2026-09-26T12:10:00', version: 1 }],

  alterations: [], changeRequests: [],
  messages: [
  { id: 'M-1', channel: 'Email', template: 'Remote measurement guide', at: '2026-09-02T10:00:00', status: 'Read' },
  { id: 'M-2', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-09-26T12:15:00', status: 'Read' }],

  nextAction: { label: 'Master marking in progress', owner: 'Rafiq Ahmed' },
  activity: [
  { id: 'A1', at: '2026-09-10T15:00:00', who: 'Nisha Arora', what: 'Verified customer-submitted measurements over video call', kind: 'measurement' },
  { id: 'A2', at: '2026-09-26T10:00:00', who: 'Nisha Arora', what: 'Order created (remote)', kind: 'created' },
  { id: 'A3', at: '2026-09-26T16:00:00', who: 'Anjali Desai', what: 'Advance ₹25,100 received by bank transfer', kind: 'payment' },
  { id: 'A4', at: '2026-10-06T10:00:00', who: 'Vikram Rathore', what: 'Assigned marking to Rafiq Ahmed', kind: 'assignment' }]

},
{
  id: 'DZ-10297', customerId: 'C-1010', createdAt: '2026-09-27T17:00:00', deliveryDate: '2026-10-11', status: 'In Production', priority: 'Regular',
  occasion: 'Everyday', designer: 'Tanvi Kohli', productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
  garments: [
  {
    id: 'G1', category: 'Kurta', subCategory: 'Straight Kurta', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2130', meters: 2.5, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [], construction: [], finishing: [],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Shoulder: 14, Chest: 35, Waist: 30, Hip: 39, 'Kurta Length': 42, 'Sleeve Length': 21, Armhole: 16, Neck: 13.5 }, unit: 'in',
    photos: [], notes: 'Side slits 10".', customFields: [], stage: 'logistics'
  },
  {
    id: 'G2', category: 'Salwar', subCategory: 'Palazzo', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2130', meters: 2.5, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [], construction: [], finishing: [],
    measurementSource: 'Designer', measurementVerified: true, measurements: { Waist: 30, Hip: 39, Length: 39, Thigh: 23, Knee: 17, Ankle: 22 }, unit: 'in',
    photos: [], notes: 'Elastic back waist.', customFields: [], stage: 'logistics'
  }],

  payments: [{ id: 'PAY-5557', amount: 6000, method: 'UPI', reference: 'UPI 3310 2290 1180', at: '2026-09-27T17:20:00', by: 'Ritu Sharma', kind: 'Advance' }],
  signatures: [
  { role: 'Designer', name: 'Tanvi Kohli', at: '2026-09-27T17:15:00', version: 1 },
  { role: 'Customer', name: 'Tara Bhatia', at: '2026-09-27T17:16:00', version: 1 }],

  alterations: [], changeRequests: [], messages: [{ id: 'M-1', channel: 'WhatsApp', template: 'Order confirmation', at: '2026-09-27T17:22:00', status: 'Read' }],
  nextAction: { label: 'Runner pickup to Khan Market store', owner: 'Arjun Singh' },
  activity: [
  { id: 'A1', at: '2026-09-27T17:00:00', who: 'Tanvi Kohli', what: 'Order created', kind: 'created' },
  { id: 'A2', at: '2026-10-07T17:40:00', who: 'Imran Sheikh', what: 'Stitching complete — sent to QC', kind: 'production' },
  { id: 'A3', at: '2026-10-08T08:15:00', who: 'Deepa Joshi', what: 'Both pieces passed QC and finishing', kind: 'qc' },
  { id: 'A4', at: '2026-10-08T09:40:00', who: 'Pooja Verma', what: 'Packed, QR labels printed — 2 bags on trip MV-7710', kind: 'logistics' }]

},
qcOrder({
  id: 'DZ-10312', customerId: 'C-1003', createdAt: '2026-09-20T12:00:00', deliveryDate: '2026-10-08', priority: 'Express', designer: 'Nisha Arora',
  garment: {
    category: 'Lehenga', subCategory: 'Bridal Lehenga', urgency: 'Regular',
    fabric: { source: 'Customer', meters: 0, pieces: [{ id: 'FP-1', material: 'Silk (customer provided)', colour: 'Blush pink', length: 6, unit: 'm', notes: 'Handle carefully — no spare' }] },
    embroidery: {
      mode: 'Custom', technique: 'Hand', placement: 'Front panel, kalis and border', approvedVersionId: 'DZA-BL-2024',
      versions: [{ id: 'DZA-BL-2024', label: 'DZA-BL-2024', note: 'Hand embroidery, mirror work', at: '2026-09-21T11:00:00', status: 'Approved', image: IMG.lehenga }]
    },
    attachments: [{ trimId: 'TRM-320', qty: 12 }],
    measurements: { Waist: 27, Hip: 37, 'Lehenga Length': 41, Bust: 34, 'Blouse Length': 14, 'Sleeve Length': 10 },
    photos: [IMG.lehenga], notes: 'Hand embroidery, mirror work. Size M.',
    doneBy: { embroidery: 'Meera Sahu', stitching: 'Imran Sheikh', finishing: 'Geeta Bai' },
    qc: { rechecks: 1, arrivedAt: '2026-10-08T09:05:00' }
  },
  activity: [
  { id: 'A2', at: '2026-10-07T11:20:00', who: 'Deepa Joshi', what: 'Failed QC — missing beads in floral motif (front panel)', kind: 'qc' },
  { id: 'A3', at: '2026-10-08T09:05:00', who: 'Meera Sahu', what: 'Rework done — ready for QC', kind: 'rework' }]

}),
qcOrder({
  id: 'DZ-10315', customerId: 'C-1005', createdAt: '2026-09-25T12:00:00', deliveryDate: '2026-10-08', priority: 'Express', designer: 'Tanvi Kohli',
  garment: {
    category: 'Blouses', subCategory: 'Designer Blouse', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2140', meters: 1, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Hand', samplerId: 'SMP-114', placement: 'Back border', versions: [] },
    attachments: [{ trimId: 'TRM-321', qty: 2 }],
    measurements: { Bust: 34, Waist: 28, 'Blouse Length': 14, 'Sleeve Length': 11, Armhole: 15, 'Back Neck Depth': 9 },
    photos: [IMG.blouse], notes: 'Deep U back with tie-up dori. Gold border on sleeves.',
    doneBy: { embroidery: 'Lakshmi Devi', stitching: 'Imran Sheikh', finishing: 'Geeta Bai' },
    qc: { rechecks: 0, arrivedAt: '2026-10-08T07:40:00' }
  }
}),
qcOrder({
  id: 'DZ-10309', customerId: 'C-1004', createdAt: '2026-09-22T12:00:00', deliveryDate: '2026-10-07', priority: 'Regular', designer: 'Nisha Arora',
  garment: {
    category: 'Anarkali', subCategory: 'Pattern Anarkali', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2110', meters: 6, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Hand', samplerId: 'SMP-141', placement: 'Yoke and hem border', versions: [] },
    attachments: [],
    measurements: { Shoulder: 14, Bust: 33, Waist: 27, 'Yoke Length': 13, 'Full Length': 56, 'Sleeve Length': 6 },
    photos: [IMG.anarkali], notes: 'Cap sleeves, gota trim on hem. Side zip.',
    doneBy: { embroidery: 'Farhan Ali', stitching: 'Imran Sheikh', finishing: 'Rani Devi' },
    qc: { rechecks: 0, arrivedAt: '2026-10-07T16:30:00' }
  }
}),
qcOrder({
  id: 'DZ-10317', customerId: 'C-1008', createdAt: '2026-09-30T12:00:00', deliveryDate: '2026-10-09', priority: 'Regular', designer: 'Aarav Bedi',
  garment: {
    category: 'Kurta & Kurta Sets', subCategory: 'Pattern Kurta – Simple', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2130', meters: 2.5, pieces: [] },
    embroidery: { mode: 'Sampler', technique: 'Hand', samplerId: 'SMP-114', placement: 'Yoke', versions: [] },
    attachments: [],
    measurements: { Shoulder: 17, Chest: 39, Waist: 34, 'Kurta Length': 41, 'Sleeve Length': 24, Neck: 15 },
    photos: [IMG.kurta], notes: 'Chikankari on the yoke only.',
    doneBy: { embroidery: 'Lakshmi Devi', stitching: 'Suresh Kumar', finishing: 'Geeta Bai' },
    qc: { rechecks: 0, arrivedAt: '2026-10-08T08:20:00' }
  }
}),

/* Passed QC — waiting for Packaging */
packOrder({
  id: 'DZ-10320', customerId: 'C-1006', createdAt: '2026-09-24T12:00:00', deliveryDate: '2026-10-08', priority: 'Express', designer: 'Nisha Arora',
  garments: [
  { subCategory: 'Sharara Set', category: 'Indo-Western & Occasion Wear', photo: IMG.anarkali, notes: 'Fold the sharara along the pleats. Dupatta rolled, not folded.', trimId: 'TRM-330', qty: 4, packageId: 'PKG-10320-A' },
  { subCategory: 'Designer Blouse', category: 'Blouses', photo: IMG.blouse, notes: 'Pack with tie-up dori tucked inside.', trimId: 'TRM-350', qty: 6, packageId: 'PKG-10320-A' }],

  stage: 'packaging', passedAt: '2026-10-08T08:50:00',
  returnItems: [
  { id: 'R-10320-1', name: 'Sample blouse', kind: 'sample', quantity: 1, note: 'Customer’s fit reference' },
  { id: 'R-10320-2', name: 'Leftover fabric · georgette', kind: 'fabric', quantity: 1, note: 'About 0.8 m — return' }]

}),
packOrder({
  id: 'DZ-10323', customerId: 'C-1004', createdAt: '2026-09-25T12:00:00', deliveryDate: '2026-10-09', priority: 'Regular', designer: 'Aarav Bedi',
  garments: [{ subCategory: 'Pattern Kurta Set', category: 'Kurta & Kurta Sets', photo: IMG.kurta, notes: 'Dupatta has mirror work — fold with tissue.', packageId: 'PKG-10323-A' }],
  stage: 'packaging', passedAt: '2026-10-08T07:30:00',
  returnItems: [{ id: 'R-10323-1', name: 'Sample kurta', kind: 'sample', quantity: 1, note: 'Old kurta the customer gave for size' }]
}),
packOrder({
  id: 'DZ-10322', customerId: 'C-1002', createdAt: '2026-09-29T12:00:00', deliveryDate: '2026-10-10', priority: 'Regular', designer: 'Tanvi Kohli',
  garments: [{ subCategory: 'Pattern Kurta Set', category: 'Kurta & Kurta Sets', photo: IMG.kurta, notes: 'Customer wants it on a hanger, not folded.' }],
  stage: 'packaging', passedAt: '2026-10-08T09:10:00', deliveryMode: 'Home delivery'
}),
packOrder({
  id: 'DZ-10318', customerId: 'C-1007', createdAt: '2026-09-18T12:00:00', deliveryDate: '2026-10-07', priority: 'Regular', designer: 'Aarav Bedi',
  garments: [{ subCategory: 'Pattern Anarkali – Simple', category: 'Anarkali', photo: IMG.anarkali, notes: 'Gota trim on hem — wrap in tissue.', trimId: 'TRM-302', qty: 3, packageId: 'PKG-10318-A' }],
  stage: 'packaging', passedAt: '2026-10-07T17:20:00'
}),

/* Packed — on the shelf, on the way, or at the store */
packOrder({
  id: 'DZ-10319', customerId: 'C-1009', createdAt: '2026-09-21T12:00:00', deliveryDate: '2026-10-09', priority: 'Regular', designer: 'Nisha Arora',
  garments: [{ subCategory: 'Pattern Lehenga', category: 'Lehenga', photo: IMG.lehenga, notes: 'Can-can packed separately in the same box.', packageId: 'PKG-10319-A' }],
  stage: 'packaging', passedAt: '2026-10-07T15:00:00'
}),
packOrder({
  id: 'DZ-10314', customerId: 'C-1010', createdAt: '2026-09-19T12:00:00', deliveryDate: '2026-10-09', priority: 'Express', designer: 'Tanvi Kohli',
  garments: [
  { subCategory: 'Pattern Lehenga – Complicated', category: 'Lehenga', photo: IMG.lehenga, notes: 'Heavy — keep flat.', packageId: 'PKG-10314-A', stage: 'store' },
  { subCategory: 'Saree Petticoat', category: 'Pants & Bottom Wear', photo: IMG.kurta, notes: '', packageId: 'PKG-10314-B' }],

  stage: 'logistics', passedAt: '2026-10-07T12:00:00'
}),
packOrder({
  id: 'DZ-10311', customerId: 'C-1003', createdAt: '2026-09-23T12:00:00', deliveryDate: '2026-10-09', priority: 'Regular', designer: 'Nisha Arora',
  garments: [{ subCategory: 'Basic Kurta', category: 'Kurta & Kurta Sets', photo: IMG.kurta, notes: '', packageId: 'PKG-10311-A' }],
  stage: 'logistics', passedAt: '2026-10-07T16:40:00'
}),
packOrder({
  id: 'DZ-10313', customerId: 'C-1001', createdAt: '2026-09-23T12:00:00', deliveryDate: '2026-10-10', priority: 'Regular', designer: 'Aarav Bedi', store: 'Vasant Kunj',
  garments: [{ subCategory: 'Darted Blouse', category: 'Blouses', photo: IMG.blouse, notes: '', packageId: 'PKG-10313-A' }],
  stage: 'logistics', passedAt: '2026-10-07T18:00:00'
}),
packOrder({
  id: 'DZ-10310', customerId: 'C-1005', createdAt: '2026-09-17T12:00:00', deliveryDate: '2026-10-08', priority: 'Regular', designer: 'Nisha Arora',
  garments: [{ subCategory: 'Basic Anarkali', category: 'Anarkali', photo: IMG.anarkali, notes: '', packageId: 'PKG-10310-A' }],
  stage: 'store', passedAt: '2026-10-06T15:00:00'
}),
packOrder({
  id: 'DZ-10316', customerId: 'C-1008', createdAt: '2026-09-20T12:00:00', deliveryDate: '2026-10-08', priority: 'Regular', designer: 'Tanvi Kohli',
  garments: [{ subCategory: 'Co-ord Set – Simple Pattern', category: 'Co-ord Sets', photo: IMG.kurta, notes: '', packageId: 'PKG-10316-A' }],
  stage: 'logistics', passedAt: '2026-10-07T11:00:00', deliveryMode: 'Home delivery'
}),

/* In the workshop — one garment at each of the quieter stages */
qcOrder({
  id: 'DZ-10324', customerId: 'C-1005', createdAt: '2026-10-08T10:30:00', deliveryDate: '2026-10-30', priority: 'Regular', designer: 'Tanvi Kohli',
  stage: 'acknowledgement', next: { label: 'Acknowledge the order', owner: 'Vikram Rathore' },
  garment: {
    category: 'Blouses', subCategory: 'Princess Cut Blouse', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2130', meters: 1, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [],
    measurements: { Bust: 34, Waist: 28, Shoulder: 14, 'Blouse Length': 14, Armhole: 16 },
    photos: [IMG.blouse], notes: 'Deep back with dori.'
  }
}),
qcOrder({
  id: 'DZ-10325', customerId: 'C-1010', createdAt: '2026-10-04T12:00:00', deliveryDate: '2026-10-22', priority: 'Regular', designer: 'Nisha Arora',
  stage: 'material', next: { label: 'Issue fabric from stock', owner: 'Material' },
  garment: {
    category: 'Kurta & Kurta Sets', subCategory: 'Pattern Kurta Set', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2115', meters: 4.5, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [],
    measurements: { Shoulder: 15, Chest: 36, Waist: 30, 'Kurta Length': 44, 'Sleeve Length': 22, Neck: 14 },
    photos: [IMG.kurta], notes: ''
  }
}),
qcOrder({
  id: 'DZ-10326', customerId: 'C-1001', createdAt: '2026-10-02T12:00:00', deliveryDate: '2026-10-20', priority: 'Regular', designer: 'Aarav Bedi',
  stage: 'dyeing', next: { label: 'Dye to shade', owner: 'Dyeing' },
  garment: {
    category: 'Lehenga', subCategory: 'Lehenga', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2124', meters: 5, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [],
    measurements: { Waist: 28, Hip: 37, 'Lehenga Length': 41 },
    photos: [IMG.lehenga], notes: 'Match the dupatta shade card.'
  }
}),
qcOrder({
  id: 'DZ-10327', customerId: 'C-1006', createdAt: '2026-09-28T12:00:00', deliveryDate: '2026-10-13', priority: 'Express', designer: 'Tanvi Kohli',
  stage: 'finishing', next: { label: 'Finishing', owner: 'Finishing' },
  garment: {
    category: 'Anarkali', subCategory: 'Basic Anarkali', urgency: 'Express 3d',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2130', meters: 4, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [],
    measurements: { Bust: 35, Waist: 30, Shoulder: 14.5, Length: 52, 'Sleeve Length': 21, Armhole: 17 },
    photos: [IMG.anarkali], notes: 'Hand-stitched hem.',
    doneBy: { stitching: 'Imran Sheikh' }
  }
}),
qcOrder({
  id: 'DZ-10328', customerId: 'C-1009', createdAt: '2026-09-27T12:00:00', deliveryDate: '2026-10-12', priority: 'Regular', designer: 'Nisha Arora',
  stage: 'ironing', next: { label: 'Iron and fold', owner: 'Ironing' },
  garment: {
    category: 'Blouses', subCategory: 'Darted Blouse', urgency: 'Regular',
    fabric: { source: 'Darzaan', fabricId: 'FAB-2115', meters: 1, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, attachments: [],
    measurements: { Bust: 36, Waist: 31, Shoulder: 15, 'Blouse Length': 15, Armhole: 17 },
    photos: [IMG.blouse], notes: '',
    doneBy: { stitching: 'Suresh Kumar', finishing: 'Rani Devi' },
    qc: { rechecks: 0, arrivedAt: '2026-10-07T15:00:00', passedAt: '2026-10-08T10:00:00' }
  }
})];


/* ------------------------------------------------------------------ */
/* Sample orders past QC (packaging, logistics, store)                 */
/* ------------------------------------------------------------------ */

function packOrder(p: {
  id: string;customerId: string;createdAt: string;deliveryDate: string;priority: Order['priority'];designer: string;
  garments: {subCategory: string;category: string;photo: string;notes: string;trimId?: string;qty?: number;packageId?: string;stage?: Garment['stage'];}[];
  stage: Garment['stage'];passedAt: string;deliveryMode?: Order['deliveryMode'];store?: string;returnItems?: Order['returnItems'];
}): Order {
  return {
    returnItems: p.returnItems,
    id: p.id, customerId: p.customerId, createdAt: p.createdAt, deliveryDate: p.deliveryDate,
    // Past QC: at the store it's ready to collect; packing / on the way is still before the store.
    status: p.stage === 'store' && p.garments.every((g) => (g.stage ?? p.stage) === 'store') ? 'Ready for Pickup' : 'In Production', priority: p.priority,
    occasion: '', designer: p.designer, productionOwner: 'Vikram Rathore', store: p.store ?? 'Khan Market', deliveryMode: p.deliveryMode ?? 'Store pickup', deliveryCharge: 0, discount: 0,
    garments: p.garments.map((g, i) => ({
      id: `G${i + 1}`, category: g.category, subCategory: g.subCategory, urgency: 'Regular',
      fabric: { source: 'Darzaan', fabricId: 'FAB-2110', meters: 3, pieces: [] },
      embroidery: { mode: 'None', versions: [] },
      attachments: g.trimId ? [{ trimId: g.trimId, qty: g.qty ?? 1 }] : [],
      construction: [], finishing: [], measurementSource: 'Designer', measurementVerified: true, measurements: {}, unit: 'in',
      photos: [g.photo], notes: g.notes, customFields: [], stage: g.stage ?? p.stage, packageId: g.packageId,
      qc: { rechecks: 0, passedAt: p.passedAt, passedBy: 'Deepa Joshi' }
    })),
    payments: [], signatures: [], alterations: [], changeRequests: [], messages: [],
    nextAction: { label: p.stage === 'packaging' ? 'Prepare package' : p.stage === 'store' ? 'Ready at store' : 'On the way', owner: p.stage === 'packaging' ? 'Manoj Tiwari' : 'Arjun Singh' },
    activity: [
    { id: 'A1', at: p.createdAt, who: p.designer, what: 'Order created', kind: 'created' },
    { id: 'A2', at: p.passedAt, who: 'Deepa Joshi', what: 'Passed QC', kind: 'qc' }]

  };
}

/* ------------------------------------------------------------------ */
/* Sample orders waiting at QC                                         */
/* ------------------------------------------------------------------ */

function qcOrder(p: {
  id: string;customerId: string;createdAt: string;deliveryDate: string;priority: Order['priority'];designer: string;
  garment: Omit<Garment, 'id' | 'stage' | 'construction' | 'finishing' | 'measurementSource' | 'measurementVerified' | 'unit' | 'customFields'>;
  activity?: Order['activity'];
  /** Defaults to waiting at QC; other stages fill the rest of the production board. */
  stage?: StageKey;
  next?: Order['nextAction'];
}): Order {
  return {
    id: p.id, customerId: p.customerId, createdAt: p.createdAt, deliveryDate: p.deliveryDate, status: 'In Production', priority: p.priority,
    occasion: '', designer: p.designer, productionOwner: 'Vikram Rathore', store: 'Khan Market', deliveryMode: 'Store pickup', deliveryCharge: 0, discount: 0,
    garments: [{ ...p.garment, id: 'G1', stage: p.stage ?? 'qc', construction: [], finishing: [], measurementSource: 'Designer', measurementVerified: true, unit: 'in', customFields: [] }],
    payments: [], signatures: [], alterations: [], changeRequests: [], messages: [],
    nextAction: p.next ?? { label: 'Quality check', owner: 'Deepa Joshi' },
    activity: [{ id: 'A1', at: p.createdAt, who: p.designer, what: 'Order created', kind: 'created' }, ...(p.activity ?? [])]
  };
}