/** Component catalogue for /designsystem. Paths are real files in this project; props mirror their TypeScript interfaces. */

export interface PropSpec {
  name: string;
  type: string;
  defaultValue?: string;
  description: string;
}

export interface ComponentSpec {
  id: string;
  name: string;
  file: string;
  category: Category;
  purpose: string;
  props?: PropSpec[];
  states?: string;
  dos: string[];
  donts: string[];
  a11y?: string;
  code?: string;
}

export type Category = 'Actions' | 'Status' | 'Forms' | 'Navigation' | 'Containers' | 'Overlays & feedback' | 'Workflow & scanning' | 'Page states';

export const categories: Category[] = ['Actions', 'Status', 'Forms', 'Navigation', 'Containers', 'Overlays & feedback', 'Workflow & scanning', 'Page states'];

export const componentSpecs: ComponentSpec[] = [
{
  id: 'button',
  name: 'Button',
  file: 'components/ui/Button.tsx',
  category: 'Actions',
  purpose: 'Every action. buttonClass() gives the same styles to <Link> and <a>.',
  props: [
  { name: 'variant', type: "'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'", defaultValue: "'primary'", description: 'primary = the one main action; secondary = alternatives / Cancel; ghost = tertiary in toolbars; danger = irreversible; subtle = soft brand action inside a card' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'", description: 'sm 36px · md 44px · lg 56px (scan / confirm on the floor)' },
  { name: 'icon / iconRight', type: 'ReactNode', description: 'Lucide icon, h-4 w-4 (h-5 for lg)' },
  { name: 'fullWidth', type: 'boolean', description: 'Stretch in sheets, sticky footers and phone layouts' },
  { name: '...rest', type: 'ButtonHTMLAttributes', description: 'type defaults to "button"; disabled supported' }],

  states: 'default · hover (darker fill) · pressed (scale .98) · focus-visible (2px brand/40 ring, 2px offset) · disabled (45% opacity, no pointer)',
  dos: ['One primary per view or per dialog footer.', 'Label with a verb + object: "Print package QR label", "Mark step as done".', 'Put the primary on the right of a footer, Cancel (secondary) to its left.'],
  donts: ['Don’t use danger for anything reversible.', 'Don’t let a label wrap — shorten the layout, not the copy.', 'Don’t disable without saying why nearby (inline hint or validation message).'],
  a11y: 'Icon-only buttons need aria-label. Keep the 44px minimum on touch screens.',
  code: `import { Button, buttonClass } from './components/ui/Button';

<Button icon={<ScanLineIcon className="h-4 w-4" />}>Scan order ID</Button>
<Link to="/orders/new" className={buttonClass('primary', 'md')}>New order</Link>`
},
{
  id: 'chip',
  name: 'Filter chip',
  file: 'utils/styles.ts → chipClass(active)',
  category: 'Actions',
  purpose: 'Toggleable filter pills in a horizontal row (Orders, Inventory).',
  states: 'inactive (ring line-strong) · active (brand-soft fill, brand ring) · hover',
  dos: ['Use for 2–6 mutually exclusive quick filters.', 'Scroll the row sideways on phone (no-scrollbar).'],
  donts: ['Don’t use for more than ~6 options — use FilterMenu.', 'Don’t mix chips and KPI tiles that filter the same list.'],
  a11y: 'Render as <button aria-pressed={active}>.'
},
{
  id: 'badge',
  name: 'Badge',
  file: 'components/ui/Badge.tsx',
  category: 'Status',
  purpose: 'Status and short labels. Always text + colour.',
  props: [
  { name: 'tone', type: "'neutral' | 'brand' | 'success' | 'info' | 'attention' | 'warning' | 'critical'", defaultValue: "'neutral'", description: 'Map from domain status via utils/status.ts — never pick ad hoc' },
  { name: 'dot', type: 'boolean', description: 'Leading 6px dot' },
  { name: 'size', type: "'sm' | 'md'", defaultValue: "'sm'", description: 'sm 24px / 12px text · md 32px / 14px text' }],

  dos: ['One status badge per row or card.', 'Use orderStatusTone[status] for order statuses.'],
  donts: ['Don’t stack several badges on a card — pick the one that drives an action.', 'Don’t use a badge as a button.']
},
{
  id: 'delivery-state',
  name: 'DeliveryStateBadge',
  file: 'components/delivery/DeliveryStateBadge.tsx',
  category: 'Status',
  purpose: 'Package status as quiet text with a dot. Only "Needs attention" is emphasised (red, medium).',
  props: [
  { name: 'p', type: 'PackageRecord', description: 'Derives the state via deliveryState(p)' },
  { name: 'state', type: "'ready' | 'packing' | 'packed' | 'transit' | 'delivered' | 'attention'", description: 'Pass directly when there is no record' },
  { name: 'size', type: "'sm' | 'md'", description: '14px / 15px text' }],

  dos: ['Use in Shipments, Receiving, Calendar and package cards.'],
  donts: ['Don’t wrap it in a Badge — the dot style is intentional to reduce tag noise.']
},
{
  id: 'severity',
  name: 'SeverityIcon',
  file: 'components/ui/SeverityIcon.tsx',
  category: 'Status',
  purpose: 'Round icon that leads a notification, alert or exception row.',
  props: [
  { name: 'severity', type: "'info' | 'attention' | 'warning' | 'critical'", description: 'Icon + colour pair is fixed' },
  { name: 'size', type: "'sm' | 'md'", defaultValue: "'md'", description: '32px / 40px' }],

  dos: ['Pair with a sentence that names the problem.'],
  donts: ['Don’t use for decoration on headings.'],
  a11y: 'aria-hidden — the text carries the meaning.'
},
{
  id: 'field',
  name: 'Field + inputs',
  file: 'components/ui/Field.tsx · utils/styles.ts (inputClass, textareaClass)',
  category: 'Forms',
  purpose: 'Label wrapper for every input, select and textarea.',
  props: [
  { name: 'label', type: 'string', description: 'Short noun: "Contact number"' },
  { name: 'required', type: 'boolean', description: 'Shows an asterisk. Validation is still the caller’s job.' },
  { name: 'hint', type: 'string', description: '12px helper line under the control' }],

  states: 'default · focus (brand border + 2px brand/20 ring) · error (critical border + critical-soft fill + message) · disabled (sunken fill)',
  dos: ['Validate on Continue / submit, then live-update the error as the user fixes it.', 'Write the message as the fix: "Enter a 10-digit mobile number".', 'Use inputMode="numeric" for phone, OTP and measurements.'],
  donts: ['Don’t show errors before the user has tried to submit.', 'Don’t use placeholder text as the label.'],
  a11y: 'Field renders a <label>, so the control is labelled. Link error text with aria-describedby and set aria-invalid.'
},
{
  id: 'toggle',
  name: 'Toggle',
  file: 'components/ui/Toggle.tsx',
  category: 'Forms',
  purpose: 'On/off setting that applies immediately (Settings, notifications).',
  props: [
  { name: 'checked / onChange', type: 'boolean · (v) => void', description: 'Controlled' },
  { name: 'label', type: 'string', description: 'What is on' },
  { name: 'description', type: 'string', description: 'Optional one-line consequence' }],

  dos: ['Use for settings that save instantly.'],
  donts: ['Don’t use inside a form that has a Save button — use Segmented Yes / No.']
},
{
  id: 'segmented',
  name: 'Segmented',
  file: 'components/ui/Segmented.tsx',
  category: 'Forms',
  purpose: 'Pick one of 2–4 short options inline (Lining Yes / No, Small / Major, Fit preference).',
  props: [
  { name: 'options', type: '{ value: T; label: ReactNode }[]', description: '2–4 options' },
  { name: 'value / onChange', type: 'T · (v: T) => void', description: 'Controlled' },
  { name: 'size', type: "'md' | 'lg'", defaultValue: "'md'", description: '36px / 48px options' },
  { name: 'fullWidth', type: 'boolean', description: 'Stretch options evenly' },
  { name: 'ariaLabel', type: 'string', description: 'Required when there is no visible label' }],

  dos: ['Prefer over a dropdown when options fit on one line.'],
  donts: ['Don’t use for navigation between pages — use Tabs.']
},
{
  id: 'filtermenu',
  name: 'FilterMenu',
  file: 'components/ui/FilterMenu.tsx',
  category: 'Forms',
  purpose: 'One "Filter" button opening a list of mutually exclusive filters with counts.',
  props: [
  { name: 'options', type: '{ value; label; count? }[]', description: 'Counts reflect current data' },
  { name: 'value / defaultValue / onChange', type: 'T', description: 'Button shows the active filter when value ≠ defaultValue' },
  { name: 'label', type: 'string', defaultValue: "'Filter'", description: 'Button text' }],

  dos: ['Use when a list has more than ~6 filter values (destination, status).'],
  donts: ['Don’t offer filters that duplicate the KPI tiles above the list.']
},
{
  id: 'tabs',
  name: 'Tabs',
  file: 'components/ui/Tabs.tsx',
  category: 'Navigation',
  purpose: 'Switch between views of the same page (Order detail: Details / Workflow / Payments).',
  props: [
  { name: 'tabs', type: '{ key: T; label: string; count?: number }[]', description: 'Optional count pill' },
  { name: 'value / onChange', type: 'T', description: 'Sync with ?tab= in the URL so links and Back work' }],

  dos: ['Hide tabs a role can’t use instead of disabling them.', 'Keep labels to one or two words.'],
  donts: ['Don’t nest tabs inside tabs.'],
  a11y: 'role="tablist" / role="tab" / aria-selected. Add arrow-key movement when implementing.'
},
{
  id: 'pageheader',
  name: 'PageHeader',
  file: 'components/ui/PageHeader.tsx',
  category: 'Navigation',
  purpose: 'Title row at the top of every list page with actions on the right.',
  props: [
  { name: 'title', type: 'string', description: 'Same word as the nav item' },
  { name: 'subtitle', type: 'ReactNode', description: 'Only for a live count or context ("12 due today"). No taglines.' },
  { name: 'actions', type: 'ReactNode', description: 'Primary action last' }],

  dos: ['Put the page’s one primary action here (New order, Scan order ID).'],
  donts: ['Don’t add descriptive taglines under the title.']
},
{
  id: 'steprail',
  name: 'OrderStepRail (stepper)',
  file: 'components/new-order/OrderStepRail.tsx',
  category: 'Navigation',
  purpose: 'Vertical stepper for multi-step flows: order form, QC inspection, Pack order.',
  props: [
  { name: 'title / subtitle', type: 'string', description: 'Flow name above the steps' },
  { name: 'step / maxStep', type: 'number', description: 'Current step and the furthest step reached' },
  { name: 'onStep', type: '(i) => void', description: 'Only steps ≤ maxStep are clickable' },
  { name: 'steps', type: '{ key; label }[]', defaultValue: 'order form steps', description: 'Pass your own for other flows' }],

  dos: ['Pair with a progress bar on phone where the rail is hidden.', 'From Review, an Edit link jumps to a step and "Save & back to review" returns.'],
  donts: ['Don’t add "Step 2 of 5" text beside the rail — it already says so.']
},
{
  id: 'kpi',
  name: 'KPI / stat tile',
  file: 'utils/styles.ts → statTileClass, kpiTileClass',
  category: 'Containers',
  purpose: 'Number boxes at the top of a list. statTile filters the list on the same page; kpiTile is read-only.',
  states: 'default · hover (stronger border) · selected (brand ring, brand-soft fill) · alert (value in critical)',
  dos: ['Tapping filters the list below in place; tap again or "Show all" to clear.', 'Max 4–6 tiles; give the one that needs action visual weight.'],
  donts: ['Don’t navigate to another page from a tile.', 'Don’t show a tile with nothing to filter as tappable.'],
  a11y: 'Filtering tiles are <button aria-pressed>.'
},
{
  id: 'cards',
  name: 'InfoCard · InfoLine · SectionCard',
  file: 'components/ui/InfoCard.tsx',
  category: 'Containers',
  purpose: 'SectionCard = main-column block with a heading row. InfoCard = small side-rail card with a quiet title. InfoLine = label/value row inside a <dl>.',
  props: [
  { name: 'title', type: 'string', description: 'Card name' },
  { name: 'action', type: 'ReactNode', description: 'One link or ghost button at top right' },
  { name: 'count (SectionCard)', type: 'number', description: 'Shown after the title' },
  { name: 'flush (SectionCard)', type: 'boolean', description: 'Remove body padding for tables / lists' }],

  dos: ['Use panelClass for any other surface so radius, border and shadow match.'],
  donts: ['Don’t put cards inside cards.', 'Don’t add a coloured top border.']
},
{
  id: 'table',
  name: 'Order list / table',
  file: 'components/orders/OrderRow.tsx · utils/styles.ts (orderListClass, orderListPanelClass)',
  category: 'Containers',
  purpose: 'Lists of orders, packages and payments. Cards below lg, one ruled table from lg up.',
  states: 'loading (skeleton rows) · empty (message + one action) · filtered-empty ("No orders match" + Clear filter) · error (retry)',
  dos: ['Whole row is the tap target and opens the record.', 'Sort actionable statuses first (Needs attention, Ready for trial).', 'Right-align money and use tabular numbers.'],
  donts: ['Don’t add per-row icon buttons for actions available on the detail page.']
},
{
  id: 'avatar',
  name: 'Avatar',
  file: 'components/ui/Avatar.tsx',
  category: 'Containers',
  purpose: 'Initials for staff and customers. Colour is derived from the name, so it is stable.',
  props: [
  { name: 'name', type: 'string', description: 'Full name' },
  { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl'", defaultValue: "'md'", description: '32 · 40 · 48 · 64px' }],

  dos: ['Always show the name as text beside it.'],
  donts: ['Don’t rely on the avatar alone to identify a person — it is aria-hidden.']
},
{
  id: 'modal',
  name: 'Modal',
  file: 'components/ui/Modal.tsx',
  category: 'Overlays & feedback',
  purpose: 'Focused task or confirmation over the current page. Becomes a bottom sheet below sm.',
  props: [
  { name: 'open / onClose', type: 'boolean · () => void', description: 'Closes on Esc, scrim tap and ✕' },
  { name: 'title', type: 'string', description: 'Names the task: "Record payment"' },
  { name: 'description', type: 'string', description: 'Optional, one line' },
  { name: 'footer', type: 'ReactNode', description: 'Right-aligned actions: secondary then primary' },
  { name: 'size', type: "'md' | 'lg' | 'xl'", defaultValue: "'md'", description: '512 · 672 · 896px max width' }],

  dos: ['Use for anything that needs input before it can save (assign driver, OTP, discrepancy).', 'Keep the primary disabled until required fields are valid.'],
  donts: ['Don’t open a modal from a modal — close the first.', 'Don’t add an "Are you sure?" step for reversible actions.'],
  a11y: 'role="dialog" aria-modal. When implementing: trap focus, focus the first field on open, return focus on close.'
},
{
  id: 'drawer',
  name: 'Drawer',
  file: 'components/ui/Drawer.tsx',
  category: 'Overlays & feedback',
  purpose: 'Right-side panel for reference detail that keeps the list visible (check-in visit, notifications).',
  props: [
  { name: 'open / onClose', type: 'boolean · () => void', description: 'Esc closes' },
  { name: 'title', type: 'string', description: 'Panel title' },
  { name: 'headerExtra', type: 'ReactNode', description: 'Badge or action next to the title' }],

  dos: ['Use for read-mostly detail.'],
  donts: ['Don’t use for forms that save — use Modal (Receiving moved from drawer to modal for this reason).']
},
{
  id: 'toast',
  name: 'Toast',
  file: 'sonner · configured in App.tsx',
  category: 'Overlays & feedback',
  purpose: 'Short confirmation after an action that stays on the same page.',
  dos: ['State the result with specifics: "Payment of ₹4,000 recorded".', 'toast.error for failures the user can retry.'],
  donts: ['Don’t toast when the page already shows the change prominently.', 'Don’t put required decisions in a toast.'],
  code: `import { toast } from 'sonner';
toast.success('DZ-10320 packed · Arjun Singh assigned');`
},
{
  id: 'contextheader',
  name: 'ContextHeader',
  file: 'components/ui/ContextHeader.tsx',
  category: 'Workflow & scanning',
  purpose: 'Garment / order strip pinned at the top of step-by-step flows (order form, QC, packing).',
  props: [
  { name: 'title', type: 'ReactNode', description: 'The thing being worked on — biggest text' },
  { name: 'meta', type: 'ReactNode', description: '"DZ-10312 · Kavya Iyer"' },
  { name: 'due', type: 'ISO date', description: 'Renders "Due 8 Oct" + relative line, red when overdue' },
  { name: 'badges', type: 'ReactNode', description: 'Priority / status at the far right' }],

  dos: ['Keep visible while the user scrolls the step.'],
  donts: ['Don’t repeat the same info in the step body.']
},
{
  id: 'scan',
  name: 'ScanDialog',
  file: 'components/packages/ScanDialog.tsx',
  category: 'Workflow & scanning',
  purpose: 'Camera / connected scanner capture with a typed-ID fallback. Used for packages and order IDs.',
  props: [
  { name: 'open / onClose', type: 'boolean · () => void', description: '' },
  { name: 'title', type: 'string', defaultValue: "'Scan package label'", description: 'e.g. "Scan order ID"' },
  { name: 'samples', type: '{ code; hint; label? }[]', description: 'Prototype only — simulated labels in view. Remove in production.' },
  { name: 'onResult', type: '(code, manual) => void', description: 'Caller validates and shows the outcome' },
  { name: 'busy', type: 'boolean', description: 'Shows the "Looking up…" spinner' }],

  states: 'camera live · looking up (spinner) · found → close & route · not found · unreadable label · wrong destination · already processed · camera unavailable → typed entry',
  dos: ['Connected USB / Bluetooth scanners type into the focused field and end with Enter — accept that anywhere the dialog is open.', 'Fall back to "Type the ID" when camera permission is denied.'],
  donts: ['Don’t add a confirm step after a valid scan where the scan itself is the action (store receipt).'],
  a11y: 'Announce the result with aria-live="polite".'
},
{
  id: 'signature',
  name: 'SignaturePad',
  file: 'components/ui/SignaturePad.tsx',
  category: 'Workflow & scanning',
  purpose: 'Finger signature on the order form payment step (customer and staff).',
  props: [
  { name: 'label / signerName', type: 'string', description: 'Who signs' },
  { name: 'signed / onSignedChange', type: 'boolean', description: 'Controlled; Clear resets' }],

  dos: ['Require both signatures before Confirm order.'],
  donts: ['Don’t store only a boolean in production — persist the image with signer and time.']
},
{
  id: 'photo',
  name: 'PhotoCapture',
  file: 'components/ui/PhotoCapture.tsx',
  category: 'Workflow & scanning',
  purpose: 'Camera / file capture for QC defects, discrepancies, delivery proof.',
  props: [
  { name: 'photos / onChange', type: 'string[]', description: 'Object URLs in the prototype' },
  { name: 'label / hint', type: 'string', defaultValue: "'Capture photo'", description: '' }],

  dos: ['Keep optional unless the rule requires evidence.'],
  donts: ['Don’t block a flow on upload — upload in the background.']
},
{
  id: 'qr',
  name: 'QrGlyph',
  file: 'components/ui/QrGlyph.tsx',
  category: 'Workflow & scanning',
  purpose: 'Prototype stand-in for QR codes on labels and tags. Replace with a real QR encoder.',
  props: [
  { name: 'value', type: 'string', description: 'Encoded ID (PKG-10319-A)' },
  { name: 'size', type: 'number', defaultValue: '72', description: 'px' }],

  dos: ['Print the human-readable ID under every code.'],
  donts: ['Don’t ship QrGlyph — it is not scannable.']
},
{
  id: 'states',
  name: 'Empty · loading · error · success',
  file: 'Pattern — no shared component yet',
  category: 'Page states',
  purpose: 'Every list and detail screen needs these four. Build them once as shared components.',
  dos: ['Empty: one sentence + the one action that fills it.', 'Loading: skeletons shaped like the content; nothing for < 300ms.', 'Error: what failed + Try again; keep entered data.', 'Permission: hide what a role can’t do; a deep link shows "You don’t have access" + Go home.'],
  donts: ['Don’t show a full-page spinner over content that is already there.', 'Don’t use illustrations or decorative shapes.']
}];