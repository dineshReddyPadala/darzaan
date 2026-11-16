/** Built-in role ids shipped with the app. Custom roles are free-form strings. */
export type BuiltinRole =
/** Owner-level access across every screen, store and setting. */
'admin' |
'store_manager' |
'salesperson' |
'production_head' |
'production_assistant' |
/** Workshop maker. Views assigned orders and can mark their own tasks done. */
'tailor'
/** Delivery Runner — scans packages at pickup and at the destination. */ |
'runner'
/** Packs finished orders, prints labels, assigns runners and watches deliveries. */ |
'logistics' |
'qc' |
'accountant';

/** Catalog role id — built-in or custom. */
export type Role = BuiltinRole | (string & {});

export type RoleGroup = 'Store' | 'Production' | 'Office';

export type PermEntity =
'order' |
'garment' |
'measurement' |
'production_task' |
'trial' |
'alteration' |
'payment' |
'inventory' |
'customer' |
'team';

export type PermAction = 'create' | 'update' | 'delete';

export interface Perm {
  entity: PermEntity;
  action: PermAction;
}

export type OrderStatus =
'Draft' |
'Confirmed' |
'In Production' |
'Ready for Trial' |
'Alteration' |
'Ready for Pickup' |
'Closed' |
'Cancelled';

export type Severity = 'info' | 'attention' | 'warning' | 'critical';

export type StageKey =
'acknowledgement' |
'review' |
'scheduling' |
'material' |
'dyeing' |
'marking' |
'embroidery' |
'cutting' |
'stitching' |
'hemming' |
'finishing' |
'qc' |
'ironing' |
'packaging' |
'logistics' |
'store' |
'trial' |
'alteration' |
'delivery';

export type Urgency = 'Regular' | 'Express 3d' | 'Express 2d' | 'Express 24h';
export type MeasurementSource = 'Designer' | 'Customer' | 'Profile' | 'Sample garment';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank transfer';
export type DeliveryMode = 'Store pickup' | 'Home delivery';

export type CustomFieldType =
'Text' |
'Number' |
'Dropdown' |
'Multi-select' |
'Radio' |
'Checkbox' |
'Date' |
'Image' |
'File' |
'Measurement' |
'Currency';

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  value: string;
}

export interface MeasurementProfile {
  id: string;
  label: string;
  category: string;
  source: MeasurementSource;
  verified: boolean;
  takenBy: string;
  date: string;
  values: Record<string, number>;
}

export interface Customer {
  id: string;
  storeId?: number;
  name: string;
  mobile: string;
  whatsapp: string;
  whatsappAvailable: boolean;
  email: string;
  city: string;
  since: string;
  tier: 'New' | 'Returning' | 'VIP';
  designer: string;
  preferences: string[];
  notes: string;
  remote: boolean;
  measurementProfiles: MeasurementProfile[];
  /** How the customer tends to be in fittings — helps the team prepare. */
  behaviour?: CustomerBehaviour;
}

export type CustomerBehaviour = 'Easy-going' | 'Particular' | 'Demanding' | 'Difficult';

export interface FabricPiece {
  id: string;
  material: string;
  length: number;
  unit: 'm' | 'yd';
  notes: string;
  photo?: string;
  colour?: string;
  condition?: 'New' | 'Pre-washed' | 'Has marks or flaws';
  /** Free-text material when "Other" is picked. */
  materialDetail?: string;
}

export interface FabricSelection {
  source: 'Darzaan' | 'Customer';
  fabricId?: string;
  meters: number;
  pieces: FabricPiece[];
  /** Colour for the garment — scanned from the shade card or picked by HEX. */
  colourHex?: string;
  colourName?: string;
  /** Shade card code when the colour was scanned. */
  colourCode?: string;
}

export interface SketchVersion {
  id: string;
  label: string;
  note: string;
  at: string;
  status: 'Draft' | 'Shared' | 'Approved' | 'Superseded';
  customerComment?: string;
  image?: string;
}

export interface EmbroiderySelection {
  mode: 'None' | 'Sampler' | 'Custom';
  technique?: 'Hand' | 'Machine' | 'Both';
  samplerId?: string;
  placement?: string;
  versions: SketchVersion[];
  approvedVersionId?: string;
}

export interface AttachmentLine {
  trimId: string;
  qty: number;
}

/** Custom designs are priced by production in the background while the order form is filled. */
export interface CustomDesignQuote {
  status: 'Pending' | 'Question' | 'Confirmed' | 'Declined';
  amount?: number;
  requestedAt: string;
  confirmedBy?: string;
  /** Links the garment to its price request in the workshop's inbox. */
  requestId?: string;
  /** Extra working days the workshop needs for this design. */
  extraDays?: number;
  /** Price changed by the store after the workshop confirmed it. */
  editedAmount?: number;
  editedBy?: string;
  /** Discount on the design at the customer's request (10–15%). */
  discountPct?: number;
}

export interface PriceMessage {
  from: 'store' | 'workshop';
  who: string;
  text: string;
  at: string;
}

/** A custom design sent from the order form to the Production Head to price. */
export interface PriceRequest {
  id: string;
  status: 'Pending' | 'Question' | 'Confirmed' | 'Declined' | 'Cancelled';
  garmentLabel: string;
  category: string;
  fabric: string;
  customerName: string;
  dueDate: string;
  sketch?: string;
  description: string;
  placement?: string;
  requestedBy: string;
  requestedAt: string;
  /** Set once the order is confirmed, so a late answer updates the saved order. */
  orderId?: string;
  garmentId?: string;
  amount?: number;
  extraDays?: number;
  messages: PriceMessage[];
  answeredBy?: string;
  answeredAt?: string;
  remindedAt?: string;
}

export interface Garment {
  id: string;
  category: string;
  subCategory: string;
  /** Price picked up from the catalogue when the sub-category was chosen. */
  price?: number;
  urgency: Urgency;
  customQuote?: CustomDesignQuote;
  fabric: FabricSelection;
  embroidery: EmbroiderySelection;
  /** Whether the garment is lined. */
  lining?: boolean;
  /** Lining fabric chosen when lining is on. */
  liningFabric?: string;
  /** Yes/no and preference details from the measurement chart, e.g. { Padding: 'Yes', 'Fit preference': 'Slim' }. */
  details?: Record<string, string>;
  attachments: AttachmentLine[];
  construction: string[];
  finishing: string[];
  measurementSource: MeasurementSource;
  measurementVerified: boolean;
  measurements: Record<string, number>;
  unit: 'in' | 'cm';
  photos: string[];
  notes: string;
  customFields: CustomField[];
  stage: StageKey;
  /** Custom order of production steps for this garment (step keys); default order when absent. */
  stepOrder?: string[];
  assignee?: string;
  /** Production Assistant coordinating this garment. */
  productionAssistant?: string;
  /** Day the workshop plans to start making it (set by production planning). */
  plannedStart?: string;
  /** Working days the make is expected to take. */
  makeDays?: number;
  /** Who completed each stage — drives who a QC defect is attributed to. */
  doneBy?: Partial<Record<StageKey, string>>;
  qc?: GarmentQc;
  /** Set once Packaging puts the garment in a labelled package. */
  packageId?: string;
  /** This garment's own delivery date; falls back to the order's. */
  deliveryDate?: string;
  /** Names of measurements added by hand on top of the standard list. */
  extraMeasurements?: string[];
  /** Earlier workflow versions, closed each time the garment failed QC. */
  workflowVersions?: WorkflowVersion[];
}

/** A closed round of production for one garment — saved when QC fails and rework starts. */
export interface WorkflowVersion {
  version: number;
  startedAt?: string;
  endedAt: string;
  tasks: ProductionTask[];
  doneBy?: Partial<Record<StageKey, string>>;
}

/** A garment held at QC until the Production Head answers. */
export type QcDecisionKind = 'Rework' | 'Accept as is' | 'Remake';

export interface QcHold {
  kind: 'Second opinion' | 'Decision needed';
  question: string;
  at: string;
  by: string;
  photo?: string;
  /** Checks QC flagged, so a "Rework" answer knows where to send it. */
  checkKeys?: string[];
  decision?: QcDecisionKind;
  answer?: string;
  answeredBy?: string;
}

export interface GarmentQc {
  /** Times this garment came back to QC after rework or a packing gap. */
  rechecks: number;
  arrivedAt?: string;
  /** Passed, but waiting at QC until every garment in the order passes. */
  passedAt?: string;
  passedBy?: string;
  /** Out for rework; completing the rework returns it to QC. */
  reworkOpen?: boolean;
  hold?: QcHold;
}

export type DefectSeverity = 'Minor' | 'Major' | 'Critical';

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  at: string;
  by: string;
  kind: 'Advance' | 'Balance' | 'Alteration' | 'Refund';
}

export interface Signature {
  role: 'Designer' | 'Customer';
  name: string;
  at: string;
  version: number;
}

export interface Trial {
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Missed';
  notes?: string;
  /** Reschedule messages sent after a no-show; three without reply escalates. */
  contactAttempts?: number;
}

export interface Alteration {
  id: string;
  at: string;
  issue: string;
  notes: string;
  type: 'Small' | 'Major';
  status: 'Open' | 'In workshop' | 'Resolved';
  charge: number;
  /** Free: no charge. Paid: the authorised user enters the price for what the customer asked for. */
  billing?: 'Free' | 'Paid';
  /** Fit-fix round on this garment (1 = free, 2 = 50%, 3+ = 100%). Absent for a customer's own request. */
  round?: number;
  garmentId?: string;
  recordedBy?: string;
}

export type TaskStatus = 'Pending' | 'In progress' | 'Done';

/** One unit of workshop work on an order, managed from the order's Workflow tab. */
export interface ProductionTask {
  id: string;
  garmentId: string;
  name: string;
  /** Production stage this task belongs to; finishing the stage's task moves the garment on. */
  stage: StageKey;
  assignee?: string;
  status: TaskStatus;
  instructions: string;
  updatedAt: string;
  updatedBy?: string;
  /** Sent back by QC — shown in amber on the Workflow tab. */
  rework?: boolean;
  photo?: string;
}

export interface ChangeRequest {
  id: string;
  field: string;
  before: string;
  after: string;
  priceImpact: number;
  dateImpact: string;
  status: 'Awaiting approval' | 'Approved' | 'Rejected';
  requestedBy: string;
  at: string;
}

export interface Message {
  id: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  template: string;
  at: string;
  status: 'Delivered' | 'Read' | 'Failed';
}

export type ActivityKind =
'created' |
'payment' |
'signature' |
'design' |
'measurement' |
'production' |
'assignment' |
'qc' |
'rework' |
'logistics' |
'trial' |
'alteration' |
'delivery' |
'closure' |
'communication' |
'change';

export interface ActivityEvent {
  id: string;
  at: string;
  who: string;
  what: string;
  kind: ActivityKind;
}

export interface Order {
  id: string;
  customerId: string;
  storeId?: number;
  createdAt: string;
  deliveryDate: string;
  status: OrderStatus;
  priority: 'Regular' | 'Express';
  occasion: string;
  designer: string;
  productionOwner: string;
  store: string;
  deliveryMode: DeliveryMode;
  deliveryCharge: number;
  discount: number;
  garments: Garment[];
  payments: Payment[];
  signatures: Signature[];
  trial?: Trial;
  alterations: Alteration[];
  changeRequests: ChangeRequest[];
  messages: Message[];
  risk?: {severity: Severity;message: string;owner: string;};
  nextAction: {label: string;owner: string;};
  activity: ActivityEvent[];
  /** Workshop tasks; created from the garments' stages the first time the Workflow tab is used. */
  tasks?: ProductionTask[];
  /** Things recorded at intake that go back with the order: sample garments, leftover fabric, belongings. */
  returnItems?: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  name: string;
  kind: 'sample' | 'fabric' | 'belonging';
  quantity: number;
  note?: string;
}

export interface DraftQuote {
  id: string;
  customerId: string;
  createdAt: string;
  items: string[];
  fabrics: string[];
  estimate: number;
  status: 'Draft' | 'Shared on WhatsApp';
  note: string;
  validUntil: string;
  deletedAt?: string;
}

export interface AppNotification {
  id: string;
  category: 'Action Required' | 'Order Updates' | 'Production' | 'Payments' | 'Customer' | 'Logistics' | 'System';
  severity: Severity;
  title: string;
  body: string;
  orderId?: string;
  /** Where "Open" goes when the alert isn't about a saved order. */
  href?: string;
  hrefLabel?: string;
  /** Only these roles see it. */
  audience?: Role[];
  at: string;
  read: boolean;
}

export interface Employee {
  id: string | number;
  name: string;
  /** Display role / station label shown on the board. */
  role: string;
  station: string;
  location: string;
  status: 'On shift' | 'On break' | 'Off today';
  clockIn?: string;
  activeTasks: number;
  capacity: number;
  qcRejectRate: number;
  avgCycleHrs: number;
  tasksThisWeek: number;
  attendancePct: number;
  /** System role from the catalog (drives login permissions when linked). */
  roleId?: Role;
  /** Linked auth user id, when this person has a login. */
  userId?: string | number;
  email?: string;
  mobile?: string;
  /** Street, city and PIN, as one line. */
  address?: string;
  disabled?: boolean;
  deletedAt?: string;
  storeId?: string | number;
}

export interface StaffLogin {
  id: number;
  email: string;
  role: Role;
  name: string;
  title: string;
  location: string;
  store?: string;
  storeId?: number;
  mobile?: string;
  address?: string;
  disabled: boolean;
  disabledAt?: string | null;
  createdAt?: string;
}

export interface RoleRecord {
  id: Role;
  label: string;
  group: RoleGroup;
  builtin: boolean;
  home: string;
  screens: string[];
  perms: Partial<Record<PermEntity, PermAction[]>>;
  scope: {
    prices: boolean;
    payments: boolean;
    contacts: boolean;
    production: boolean;
    ownStoreOnly: boolean;
  };
  stages?: string[];
  oversight?: boolean;
  delivers?: boolean;
  boardReadOnly?: boolean;
  orderSheet?: boolean;
  orderTabs?: string[];
  logisticsTabs?: string[];
  kpis?: string[];
  responsibilities?: string[];
  deleted?: boolean;
}

export interface StationTask {
  id: string;
  orderId: string;
  garmentId: string;
  station: string;
  stage: StageKey;
  title: string;
  priority: 'Regular' | 'Express';
  due: string;
  estimateMins: number;
  status: 'Queued' | 'In progress' | 'Paused' | 'Done';
  instructions: string[];
  assignee: string;
}

export interface QcIssue {
  id: string;
  orderId: string;
  garment: string;
  issue: string;
  station: string;
  responsible: string;
  reworkMins: number;
  repeat: number;
  at: string;
  status: 'In rework' | 'With Production Head' | 'Resolved';
  garmentId?: string;
  kind?: 'Defect' | 'Incomplete' | 'Packing gap';
  checkKey?: string;
  defectType?: string;
  severity?: DefectSeverity;
  photo?: string;
  noPhotoReason?: string;
  /** Minor defect QC fixed on the spot; still counts against the worker. */
  fixedAtQc?: boolean;
  /** Reason QC gave when changing the auto-filled responsible worker. */
  blameChange?: string;
  escalated?: string;
  reworkNote?: string;
  /** Who inspected. */
  inspector?: string;
}

/* ------------------------------------------------------------------ */
/* QC workflow                                                         */
/* ------------------------------------------------------------------ */

export type QcResult = 'pass' | 'fail' | 'na';

export interface QcDefect {
  category: string;
  type: string;
  severity: DefectSeverity;
  location: string;
  description: string;
  photos: string[];
}

/** Work in progress for one garment — survives moving between the QC screens. */
export interface QcDraft {
  results: Record<string, QcResult>;
  photos: Record<string, string[]>;
  /** Measured values in inches, keyed by measurement name. */
  actuals?: Record<string, string>;
  /** Short note per failed check. */
  notes?: Record<string, string>;
  defect?: QcDefect;
}

export interface QcInspectionRecord {
  id: string;
  orderId: string;
  garmentId: string;
  round: number;
  results: Record<string, QcResult>;
  photos: Record<string, string[]>;
  actuals?: Record<string, string>;
  outcome: 'Pass' | 'Fail';
  at: string;
  by: string;
}

export type ReworkStep = 'Failed QC' | 'Assigned' | 'In rework' | 'Ready for QC';
export type ReworkPriority = 'High' | 'Medium' | 'Low';

export interface QcRework {
  id: string;
  orderId: string;
  garmentId: string;
  defect: QcDefect;
  team: string;
  /** Person responsible for the fix. */
  assignee: string;
  priority: ReworkPriority;
  due: string;
  instructions: string;
  status: ReworkStep;
  events: {step: ReworkStep;at: string;by: string;}[];
  /** Closed once the re-inspection is done. */
  closedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Store floor                                                         */
/* ------------------------------------------------------------------ */

export type FloorRequestKind = 'Discount' | 'Waive alteration charge' | 'Release without OTP' | 'Merge customers' | 'Refund' | 'Cancellation' | 'Dispute';

/** Something the store floor needs the manager to decide. */
export interface FloorRequest {
  id: string;
  kind: FloorRequestKind;
  orderId?: string;
  customerId?: string;
  amount?: number;
  reason: string;
  /** Callback time promised to the customer (disputes, cancellations). */
  callback?: string;
  at: string;
  by: string;
  status: 'Waiting' | 'Approved' | 'Declined';
  decidedBy?: string;
  decisionNote?: string;
}

/** An order started on the floor and handed to the Designer or Salesperson to price. */
export interface FloorDraft {
  id: string;
  customerId: string;
  garments: string[];
  fabric: {material: string;length: number;pieces: number;} | null;
  photos: number;
  measurements: Record<string, number>;
  /** Measurement names far from the customer's saved profile. */
  flagged: string[];
  note: string;
  assignedTo: string;
  at: string;
  by: string;
  status: 'With designer' | 'Priced' | 'Customer undecided';
  followUp?: string;
  /** Where the draft started. Missing means the store floor. */
  source?: 'Storefront';
  /** Storefront bookings: the consultation the customer picked, e.g. "Sat 17 Oct · 11:00–13:00". */
  visit?: string;
}

export interface SwatchLoan {
  id: string;
  fabricId: string;
  label: string;
  customerId: string;
  out: string;
  due: string;
  returnedAt?: string;
}

export interface CashClose {
  id: string;
  date: string;
  by: string;
  upi: number;
  cardBank: number;
  cashRecorded: number;
  cashCounted: number;
  note: string;
  status: 'Waiting for manager' | 'Confirmed';
  confirmedBy?: string;
}

/** Where one tagged bag (one garment or one fabric parcel) is on a trip. */
export type BagState = 'Waiting' | 'On board' | 'Left behind' | 'At destination' | 'Received' | 'Damaged' | 'Missing';

export interface Bag {
  tag: string;
  orderId: string;
  garmentId?: string;
  label: string;
  state: BagState;
  /** Set when the tag couldn’t be scanned and the code was typed in. */
  manualReason?: string;
}

export interface CustodyEvent {
  at: string;
  who: string;
  what: string;
}

/** A runner trip between workshop and store. */
export interface Movement {
  id: string;
  from: string;
  to: string;
  runner: string;
  status: 'Awaiting pickup' | 'In transit' | 'At destination' | 'Received';
  priority: 'Regular' | 'Express';
  bags: Bag[];
  lastScan: {at: string;location: string;};
  custody: CustodyEvent[];
  /** Revised arrival time after a delay report. */
  eta?: string;
}

export type LogisticsIssueType =
'Bag not ready' |
'Damaged in transit' |
'Bag missing' |
'Running late' |
'Short count' |
'Wrong bag' |
'Customer not home' |
'Address problem' |
'Refused at door';

export interface LogisticsIssue {
  id: string;
  type: LogisticsIssueType;
  /** Trip (MV-…) or delivery (DL-…) it was raised on. */
  ref: string;
  orderIds: string[];
  note: string;
  at: string;
  by: string;
  severity: Severity;
  owner: string;
  status: 'Open' | 'Resolved';
  resolution?: string;
}

export type DeliveryStatus = 'To schedule' | 'Scheduled' | 'Out for delivery' | 'Delivered' | 'Attempt failed' | 'Returned to store';

export interface DeliveryAttempt {
  at: string;
  outcome: 'Delivered' | 'Not home' | 'Address problem' | 'Refused';
  note: string;
  by: string;
}

/** A home delivery from the store to the customer’s door. */
export interface DeliveryJob {
  id: string;
  orderId: string;
  address: string;
  addressConfirmed: boolean;
  slot?: {date: string;window: string;};
  assignee?: string;
  status: DeliveryStatus;
  attempts: DeliveryAttempt[];
  receivedBy?: {name: string;relation: string;};
  collected?: {amount: number;method: PaymentMethod;handedToAccounts: boolean;};
}