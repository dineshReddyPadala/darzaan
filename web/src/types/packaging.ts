/** One physical package. Logistics packs and dispatches it; a Delivery Runner carries it to a store or a customer's home. */

export type PackageStatus =
'Packaging assigned' |
'Ready for dispatch' |
'Assigned to runner' |
'Picked up' |
'In transit' |
'Delivered' |
'Problem';

export type DestinationKind = 'store' | 'customer';
export interface Destination {
  kind: DestinationKind;
  /** Store name ("Khan Market Store") or customer name. */
  name: string;
  /** Address line shown under the name. */
  detail: string;
}

export type ItemCategory = 'garment' | 'sample' | 'fabric' | 'belonging';

export interface PackageItem {
  /** Garment id for finished garments; a unique key for samples, fabric and belongings. */
  garmentId: string;
  label: string;
  photo?: string;
  category?: ItemCategory;
  quantity?: number;
  note?: string;
}

export type ProblemKind = 'Missing item' | 'Damaged' | 'Not home' | 'Refused' | 'Wrong address' | 'Other';

export interface PackageProblem {
  kind: ProblemKind;
  note: string;
  at: string;
  by: string;
  photo?: string;
  /** Status the package was in when the problem was raised; resolving returns it there. */
  from: PackageStatus;
  /** Checklist items reported missing at packing. */
  itemIds?: string[];
}

/** Append-only audit entry: every scan and every status change. */
export interface PackageEvent {
  at: string;
  by: string;
  /** Workshop, store name or "Customer home". */
  where: string;
  from?: PackageStatus;
  to?: PackageStatus;
  /** Scan with no status change. */
  scanOnly?: boolean;
  /** The runner's scan at the destination that matched. */
  deliveryScan?: boolean;
  /** A scan that needs Logistics to look at it (e.g. wrong destination). */
  exception?: boolean;
  /** Logistics has reviewed the exceptions before this entry. */
  reviewed?: boolean;
  /** Code typed in instead of scanned. */
  typed?: boolean;
  note?: string;
}

/** Home delivery: who took the package at the door. */
export interface Handover {
  recipient: string;
  relation: 'Customer' | 'Family' | 'Other';
}

export interface PackageRecord {
  id: string;
  orderId: string;
  items: PackageItem[];
  destination: Destination;
  status: PackageStatus;
  instructions: string;
  packer: string;
  deadline: string;
  createdBy: string;
  createdAt: string;
  /** Checklist items ticked by Logistics. */
  checked?: string[];
  packedAt?: string;
  /** Dispatch: runner and manifest. */
  runner?: string;
  manifestId?: string;
  assignedAt?: string;
  pickedUpBy?: string;
  pickedUpAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  /** Photo taken when the customer confirmed the OTP. */
  proofPhoto?: string;
  handover?: Handover;
  /** Home delivery: code the customer reads out to the driver. */
  otp?: string;
  /** Store delivery: who scanned it in at the store. */
  receivedBy?: string;
  discrepancy?: Discrepancy;
  problem?: PackageProblem;
  history: PackageEvent[];
}

/** Raised by the receiving store after opening a delivered package. */
export interface Discrepancy {
  itemIds: string[];
  issue: 'Missing' | 'Damaged';
  note: string;
  at: string;
  by: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

/** One runner's run: the packages Logistics handed them together. */
export interface Manifest {
  id: string;
  runner: string;
  createdAt: string;
  createdBy: string;
  packageIds: string[];
}