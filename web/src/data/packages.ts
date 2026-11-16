import type { PackageRecord, ProblemKind } from '../types/packaging';

export const STORES = [
{ name: 'Khan Market Store', detail: '24 Middle Lane, Khan Market, New Delhi', phone: '+91 98110 24024', hours: '10:30 am – 8 pm', contact: 'Kabir Sethi' },
{ name: 'Vasant Kunj Store', detail: 'Ambience Mall, Vasant Kunj, New Delhi', phone: '+91 98110 31730', hours: '11 am – 9 pm', contact: 'Meera Kapoor' }];

export const WORKSHOP_NAME = 'Okhla Workshop';
export const DRIVERS = [
{ name: 'Arjun Singh', phone: '+91 98990 41120', vehicle: 'Two-wheeler · DL 3S CK 4412' },
{ name: 'Ravi Kumar', phone: '+91 98990 57781', vehicle: 'Van · DL 1L AB 7781' }];

export const RUNNERS = DRIVERS.map((d) => d.name);
export const storeInfo = (name: string) => STORES.find((s) => s.name === name);
export const driverInfo = (name?: string) => DRIVERS.find((d) => d.name === name);

/** Home addresses for customers who chose home delivery. */
export const customerAddresses: Record<string, string> = {
  'C-1002': '7 Aurangzeb Lane, Lutyens, New Delhi 110011',
  'C-1008': 'B-14, Greater Kailash II, New Delhi 110048'
};

export const defaultInstructions = 'Protect embroidery with tissue. Attach the package QR on top.';

export const deliveryProblems: ProblemKind[] = ['Damaged', 'Missing item', 'Other'];
export const homeProblems: ProblemKind[] = ['Not home', 'Refused', 'Wrong address', 'Damaged'];

const khan = { kind: 'store' as const, name: STORES[0].name, detail: STORES[0].detail };
const vasant = { kind: 'store' as const, name: STORES[1].name, detail: STORES[1].detail };
const W = WORKSHOP_NAME;
const L = 'Pooja Verma';

export const seedPackages: PackageRecord[] = [
{
  id: 'PKG-10323-A', orderId: 'DZ-10323', destination: khan, status: 'Problem',
  items: [
  { garmentId: 'G1', label: 'Pattern Kurta Set', category: 'garment', quantity: 3, note: 'Kurta, Pants, Dupatta' },
  { garmentId: 'R-10323-1', label: 'Sample kurta', category: 'sample', quantity: 1, note: 'Customer’s old kurta, given for size' },
  { garmentId: 'R-10323-2', label: 'Extra fabric · cotton silk', category: 'fabric', quantity: 1, note: 'About 1 m — return to customer' }],

  checked: ['G1', 'R-10323-2'],
  instructions: defaultInstructions, packer: L, deadline: '2026-10-09',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T07:45:00',
  problem: { kind: 'Missing item', note: 'Sample kurta — may still be at the store', at: '2026-10-08T08:30:00', by: L, from: 'Packaging assigned', itemIds: ['R-10323-1'] },
  history: [
  { at: '2026-10-08T07:45:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T08:30:00', by: L, where: W, from: 'Packaging assigned', to: 'Problem', note: 'Missing item — Sample kurta' }]

},
{
  id: 'PKG-10320-A', orderId: 'DZ-10320', destination: khan, status: 'Packaging assigned',
  items: [
  { garmentId: 'G1', label: 'Sharara Set', category: 'garment', quantity: 3, note: 'Kurta, Sharara, Dupatta' },
  { garmentId: 'G2', label: 'Designer Blouse', category: 'garment', quantity: 1, note: 'Tie-up dori tucked inside' },
  { garmentId: 'R-10320-1', label: 'Sample blouse', category: 'sample', quantity: 1, note: 'Customer’s fit reference' },
  { garmentId: 'R-10320-2', label: 'Leftover fabric · georgette', category: 'fabric', quantity: 1, note: 'About 0.8 m — return' }],

  checked: ['G1', 'G2'],
  instructions: 'Express. Fold the sharara along the pleats; roll the dupatta.', packer: L, deadline: '2026-10-08',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T09:00:00',
  history: [{ at: '2026-10-08T09:00:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' }]
},
{
  id: 'PKG-10318-A', orderId: 'DZ-10318', destination: khan, status: 'Packaging assigned',
  items: [
  { garmentId: 'G1', label: 'Pattern Anarkali – Simple', category: 'garment', quantity: 1, note: 'Gota trim on hem' },
  { garmentId: 'R-10318-1', label: 'Sample blouse', category: 'sample', quantity: 1, note: 'Return to customer' }],

  instructions: 'Gota trim on hem — wrap in tissue.', packer: L, deadline: '2026-10-07',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T08:40:00',
  history: [{ at: '2026-10-08T08:40:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' }]
},
{
  id: 'PKG-10319-A', orderId: 'DZ-10319', destination: khan, status: 'Ready for dispatch',
  items: [{ garmentId: 'G1', label: 'Pattern Lehenga', category: 'garment', quantity: 3, note: 'Lehenga skirt, Blouse, Dupatta' }],
  checked: ['G1'], packedAt: '2026-10-08T09:50:00',
  instructions: 'Can-can packed separately in the same box. Keep flat.', packer: L, deadline: '2026-10-09',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T09:10:00',
  history: [
  { at: '2026-10-08T09:10:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T09:50:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' }]

},
{
  id: 'PKG-10311-A', orderId: 'DZ-10311', destination: khan, status: 'Ready for dispatch',
  items: [{ garmentId: 'G1', label: 'Basic Kurta', category: 'garment', quantity: 1 }],
  checked: ['G1'], packedAt: '2026-10-08T10:05:00',
  instructions: defaultInstructions, packer: L, deadline: '2026-10-09',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T09:30:00',
  history: [
  { at: '2026-10-08T09:30:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T10:05:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' }]

},
{
  id: 'PKG-10313-A', orderId: 'DZ-10313', destination: vasant, status: 'Assigned to runner',
  items: [{ garmentId: 'G1', label: 'Darted Blouse', category: 'garment', quantity: 1 }],
  checked: ['G1'], packedAt: '2026-10-08T08:15:00', runner: 'Arjun Singh', manifestId: 'RUN-1008-A', assignedAt: '2026-10-08T08:20:00',
  instructions: defaultInstructions, packer: L, deadline: '2026-10-07',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T07:50:00',
  history: [
  { at: '2026-10-08T07:50:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T08:15:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' },
  { at: '2026-10-08T08:20:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Arjun Singh · RUN-1008-A' }]

},
{
  id: 'PKG-10314-B', orderId: 'DZ-10314', destination: khan, status: 'In transit',
  items: [{ garmentId: 'G2', label: 'Saree Petticoat', category: 'garment', quantity: 1 }],
  checked: ['G2'], packedAt: '2026-10-08T08:00:00', runner: 'Arjun Singh', manifestId: 'RUN-1008-A', assignedAt: '2026-10-08T08:20:00',
  instructions: 'Second package of this order.', packer: L, deadline: '2026-10-09',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T07:30:00', pickedUpBy: 'Arjun Singh', pickedUpAt: '2026-10-08T08:45:00',
  history: [
  { at: '2026-10-08T07:30:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T08:00:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' },
  { at: '2026-10-08T08:20:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Arjun Singh · RUN-1008-A' },
  { at: '2026-10-08T08:45:00', by: 'Arjun Singh', where: W, from: 'Assigned to runner', to: 'Picked up' },
  { at: '2026-10-08T08:45:00', by: 'Arjun Singh', where: W, from: 'Picked up', to: 'In transit' },
  { at: '2026-10-08T09:40:00', by: 'Arjun Singh', where: 'Vasant Kunj Store', scanOnly: true, exception: true, note: 'Wrong destination — scanned at Vasant Kunj Store' }]

},
{
  id: 'PKG-10316-A', orderId: 'DZ-10316', destination: { kind: 'customer', name: 'Nikhil Rao', detail: customerAddresses['C-1008'] }, status: 'In transit',
  items: [{ garmentId: 'G1', label: 'Co-ord Set – Simple Pattern', category: 'garment', quantity: 2, note: 'Top, Bottom' }],
  checked: ['G1'], packedAt: '2026-10-07T16:10:00', runner: 'Arjun Singh', manifestId: 'RUN-1008-A', assignedAt: '2026-10-08T08:20:00',
  instructions: 'Home delivery — hand only to Nikhil or family.', packer: L, deadline: '2026-10-08',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-07T15:40:00', pickedUpBy: 'Arjun Singh', pickedUpAt: '2026-10-08T08:40:00',
  history: [
  { at: '2026-10-07T15:40:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-07T16:10:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' },
  { at: '2026-10-08T08:20:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Arjun Singh · RUN-1008-A' },
  { at: '2026-10-08T08:40:00', by: 'Arjun Singh', where: W, from: 'Assigned to runner', to: 'Picked up' },
  { at: '2026-10-08T08:40:00', by: 'Arjun Singh', where: W, from: 'Picked up', to: 'In transit' }]

},
{
  id: 'PKG-10314-A', orderId: 'DZ-10314', destination: khan, status: 'Delivered',
  items: [{ garmentId: 'G1', label: 'Pattern Lehenga – Complicated', category: 'garment', quantity: 3, note: 'Lehenga skirt, Blouse, Dupatta' }],
  checked: ['G1'], packedAt: '2026-10-07T13:30:00', runner: 'Arjun Singh', manifestId: 'RUN-1007-A', assignedAt: '2026-10-07T14:30:00',
  instructions: 'Heavy — keep flat.', packer: L, deadline: '2026-10-09',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-07T12:40:00',
  pickedUpBy: 'Arjun Singh', pickedUpAt: '2026-10-07T15:00:00', deliveredBy: 'Arjun Singh', deliveredAt: '2026-10-07T17:55:00', receivedBy: 'Kabir Sethi',
  history: [
  { at: '2026-10-07T12:40:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-07T13:30:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' },
  { at: '2026-10-07T14:30:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Arjun Singh · RUN-1007-A' },
  { at: '2026-10-07T15:00:00', by: 'Arjun Singh', where: W, from: 'Assigned to runner', to: 'Picked up' },
  { at: '2026-10-07T15:00:00', by: 'Arjun Singh', where: W, from: 'Picked up', to: 'In transit' },
  { at: '2026-10-07T17:54:00', by: 'Arjun Singh', where: 'Khan Market Store', scanOnly: true, deliveryScan: true, note: 'Destination matched' },
  { at: '2026-10-07T17:55:00', by: 'Arjun Singh', where: 'Khan Market Store', from: 'In transit', to: 'Delivered', note: 'Delivered to Khan Market Store' }]

},
{
  id: 'PKG-10310-A', orderId: 'DZ-10310', destination: khan, status: 'Delivered',
  items: [{ garmentId: 'G1', label: 'Basic Anarkali', category: 'garment', quantity: 1 }],
  checked: ['G1'], packedAt: '2026-10-07T12:10:00', runner: 'Arjun Singh', manifestId: 'RUN-1007-A', assignedAt: '2026-10-07T14:30:00',
  instructions: defaultInstructions, packer: L, deadline: '2026-10-08',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-07T11:40:00', pickedUpBy: 'Arjun Singh', pickedUpAt: '2026-10-07T15:00:00', deliveredBy: 'Arjun Singh', deliveredAt: '2026-10-07T17:20:00', receivedBy: 'Neha Gupta',
  discrepancy: { itemIds: ['G1'], issue: 'Damaged', note: 'Hem stitching came loose in transit', at: '2026-10-07T17:40:00', by: 'Neha Gupta' },
  history: [
  { at: '2026-10-07T11:40:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-07T12:10:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' },
  { at: '2026-10-07T14:30:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Arjun Singh · RUN-1007-A' },
  { at: '2026-10-07T15:00:00', by: 'Arjun Singh', where: W, from: 'Assigned to runner', to: 'Picked up' },
  { at: '2026-10-07T15:00:00', by: 'Arjun Singh', where: W, from: 'Picked up', to: 'In transit' },
  // Delivery scan was skipped — the timeline shows it as missing.
  { at: '2026-10-07T17:20:00', by: 'Arjun Singh', where: 'Khan Market Store', from: 'In transit', to: 'Delivered', note: 'Delivered to Khan Market Store · typed in' }]

},
{
  id: 'PKG-10312-A', orderId: 'DZ-10312', destination: khan, status: 'In transit',
  items: [
  { garmentId: 'G1', label: 'Bridal Lehenga', category: 'garment', quantity: 3, note: 'Lehenga skirt, Blouse, Dupatta' },
  { garmentId: 'R-10312-1', label: 'Sample blouse', category: 'sample', quantity: 1, note: 'Customer’s fit reference' }],

  checked: ['G1', 'R-10312-1'], packedAt: '2026-10-08T07:40:00', runner: 'Ravi Kumar', assignedAt: '2026-10-08T07:50:00',
  instructions: 'Express. Heavy zardozi — keep flat in the garment box.', packer: L, deadline: '2026-10-08',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T07:00:00', pickedUpBy: 'Ravi Kumar', pickedUpAt: '2026-10-08T07:50:00',
  history: [
  { at: '2026-10-08T07:00:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T07:40:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '2 items checked · label attached' },
  { at: '2026-10-08T07:50:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Ravi Kumar' }]

},
{
  id: 'PKG-10322-A', orderId: 'DZ-10322', destination: khan, status: 'Assigned to runner',
  items: [
  { garmentId: 'G1', label: 'Bandhgala Jacket', category: 'garment', quantity: 1 },
  { garmentId: 'G2', label: 'Churidar', category: 'garment', quantity: 1 },
  { garmentId: 'R-10322-1', label: 'Extra fabric · raw silk', category: 'fabric', quantity: 1, note: 'About 0.5 m — return to customer' }],

  checked: ['G1', 'G2', 'R-10322-1'], packedAt: '2026-10-08T10:20:00', runner: 'Arjun Singh', assignedAt: '2026-10-08T10:25:00',
  instructions: defaultInstructions, packer: L, deadline: '2026-10-10',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T09:55:00',
  history: [
  { at: '2026-10-08T09:55:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T10:20:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '3 items checked · label attached' },
  { at: '2026-10-08T10:25:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Arjun Singh' }]

},
{
  id: 'PKG-10315-A', orderId: 'DZ-10315', destination: khan, status: 'Delivered',
  items: [
  { garmentId: 'G1', label: 'Palazzo Suit', category: 'garment', quantity: 3, note: 'Kurta, Palazzo, Dupatta' },
  { garmentId: 'R-10315-1', label: 'Sample kurta', category: 'sample', quantity: 1, note: 'Return to customer' }],

  checked: ['G1', 'R-10315-1'], packedAt: '2026-10-08T07:20:00', runner: 'Ravi Kumar', assignedAt: '2026-10-08T07:30:00',
  instructions: defaultInstructions, packer: L, deadline: '2026-10-08',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-08T06:50:00', pickedUpBy: 'Ravi Kumar', pickedUpAt: '2026-10-08T07:30:00', deliveredBy: 'Ravi Kumar', deliveredAt: '2026-10-08T09:05:00', receivedBy: 'Kabir Sethi',
  history: [
  { at: '2026-10-08T06:50:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-08T07:20:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '2 items checked · label attached' },
  { at: '2026-10-08T07:30:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Ravi Kumar' },
  { at: '2026-10-08T09:05:00', by: 'Kabir Sethi', where: 'Khan Market Store', from: 'Assigned to runner', to: 'Delivered', note: 'Received at Khan Market Store', deliveryScan: true }]

},
{
  id: 'PKG-10309-A', orderId: 'DZ-10309', destination: khan, status: 'Delivered',
  items: [{ garmentId: 'G1', label: 'Straight Kurta', category: 'garment', quantity: 2, note: 'Kurta, Pants' }],
  checked: ['G1'], packedAt: '2026-10-07T10:30:00', runner: 'Arjun Singh', assignedAt: '2026-10-07T14:30:00',
  instructions: defaultInstructions, packer: L, deadline: '2026-10-07',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-07T10:00:00', pickedUpBy: 'Arjun Singh', pickedUpAt: '2026-10-07T14:30:00', deliveredBy: 'Arjun Singh', deliveredAt: '2026-10-07T16:40:00', receivedBy: 'Neha Gupta',
  history: [
  { at: '2026-10-07T10:00:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-07T10:30:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '1 item checked · label attached' },
  { at: '2026-10-07T14:30:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Arjun Singh' },
  { at: '2026-10-07T16:40:00', by: 'Neha Gupta', where: 'Khan Market Store', from: 'Assigned to runner', to: 'Delivered', note: 'Received at Khan Market Store', deliveryScan: true }]

},
{
  id: 'PKG-10317-A', orderId: 'DZ-10317', destination: khan, status: 'Delivered',
  items: [
  { garmentId: 'G1', label: 'Sherwani', category: 'garment', quantity: 2, note: 'Sherwani, Churidar' },
  { garmentId: 'R-10317-1', label: 'Customer’s stole', category: 'belonging', quantity: 1, note: 'Given for colour match' }],

  checked: ['G1', 'R-10317-1'], packedAt: '2026-10-06T15:00:00', runner: 'Ravi Kumar', assignedAt: '2026-10-06T15:20:00',
  instructions: 'Keep the sherwani on a hanger inside the cover.', packer: L, deadline: '2026-10-07',
  createdBy: 'Manoj Tiwari', createdAt: '2026-10-06T14:20:00', pickedUpBy: 'Ravi Kumar', pickedUpAt: '2026-10-06T15:20:00', deliveredBy: 'Ravi Kumar', deliveredAt: '2026-10-06T17:10:00', receivedBy: 'Kabir Sethi',
  history: [
  { at: '2026-10-06T14:20:00', by: 'Manoj Tiwari', where: W, to: 'Packaging assigned', note: 'Passed QC · sent to packing' },
  { at: '2026-10-06T15:00:00', by: L, where: W, from: 'Packaging assigned', to: 'Ready for dispatch', note: '2 items checked · label attached' },
  { at: '2026-10-06T15:20:00', by: L, where: W, from: 'Ready for dispatch', to: 'Assigned to runner', note: 'Ravi Kumar' },
  { at: '2026-10-06T17:10:00', by: 'Kabir Sethi', where: 'Khan Market Store', from: 'Assigned to runner', to: 'Delivered', note: 'Received at Khan Market Store', deliveryScan: true }]

}];