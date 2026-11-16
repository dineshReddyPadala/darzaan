import React, { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircleIcon, ArrowRightIcon, CheckCircle2Icon, InboxIcon, PlusIcon, PrinterIcon, RefreshCwIcon, ScanLineIcon, Trash2Icon } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ContextHeader } from '../ui/ContextHeader';
import { Drawer } from '../ui/Drawer';
import { Field } from '../ui/Field';
import { FilterMenu } from '../ui/FilterMenu';
import { InfoCard, InfoLine, SectionCard } from '../ui/InfoCard';
import { Modal } from '../ui/Modal';
import { PageHeader } from '../ui/PageHeader';
import { PhotoCapture } from '../ui/PhotoCapture';
import { QrGlyph } from '../ui/QrGlyph';
import { Segmented } from '../ui/Segmented';
import { SeverityIcon } from '../ui/SeverityIcon';
import { SignaturePad } from '../ui/SignaturePad';
import { Tabs } from '../ui/Tabs';
import { Toggle } from '../ui/Toggle';
import { DeliveryStateBadge } from '../delivery/DeliveryStateBadge';
import { OrderStepRail } from '../new-order/OrderStepRail';
import { ScanDialog } from '../packages/ScanDialog';
import { cn } from '../../utils/cn';
import { orderStatusTone, type Tone } from '../../utils/status';
import { chipClass, inputClass, statTileClass } from '../../utils/styles';
import type { OrderStatus } from '../../types';

const tones: Tone[] = ['neutral', 'brand', 'success', 'info', 'attention', 'warning', 'critical'];
const inFiveDays = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

/** Live, interactive example for each catalogue entry. */
export function ComponentPreview({ id }: {id: string;}) {
  switch (id) {
    case 'button':
      return <div className="space-y-5">
          <Row>
            <Button icon={<ScanLineIcon className="h-4 w-4" />}>Scan order ID</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="subtle" icon={<PlusIcon className="h-4 w-4" />}>Add task</Button>
            <Button variant="ghost">Show all</Button>
            <Button variant="danger" icon={<Trash2Icon className="h-4 w-4" />}>Cancel order</Button>
          </Row>
          <Row>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg" icon={<PrinterIcon className="h-5 w-5" />}>Print package QR label</Button>
            <Button disabled>Disabled</Button>
          </Row>
        </div>;
    case 'chip':
      return <ChipDemo />;
    case 'badge':
      return <div className="space-y-5">
          <Row>{tones.map((t) => <Badge key={t} tone={t}>{t}</Badge>)}</Row>
          <Row>
            <Badge tone="critical" dot size="md">Failed QC</Badge>
            <Badge tone="attention" dot size="md">Unassigned</Badge>
            <Badge tone="success" dot size="md">Passed recheck</Badge>
          </Row>
        </div>;
    case 'delivery-state':
      return <Row className="gap-6">{(['ready', 'packing', 'packed', 'transit', 'delivered', 'attention'] as const).map((s) => <DeliveryStateBadge key={s} state={s} />)}</Row>;
    case 'severity':
      return <div className="space-y-3">
          {(['critical', 'warning', 'attention', 'info'] as const).map((s) => <div key={s} className="flex items-center gap-3">
              <SeverityIcon severity={s} />
              <p className="text-[15px]">{severityCopy[s]}</p>
            </div>)}
        </div>;
    case 'field':
      return <FieldDemo />;
    case 'toggle':
      return <ToggleDemo />;
    case 'segmented':
      return <SegmentedDemo />;
    case 'filtermenu':
      return <FilterDemo />;
    case 'tabs':
      return <TabsDemo />;
    case 'pageheader':
      return <div className="rounded-xl bg-canvas">
          <PageHeader title="Shipments" actions={<Button icon={<ScanLineIcon className="h-4 w-4" />}>Scan order ID</Button>} />
        </div>;
    case 'steprail':
      return <StepDemo />;
    case 'kpi':
      return <KpiDemo />;
    case 'cards':
      return <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <SectionCard title="Packing checklist" count={5} action={<button className="text-sm font-medium text-brand hover:underline">Something missing?</button>}>
            <p className="text-[15px] text-ink-muted">Main-column content.</p>
          </SectionCard>
          <InfoCard title="Driver" action={<button className="text-sm font-medium text-brand hover:underline">Change</button>}>
            <dl className="space-y-1.5 text-[15px]">
              <InfoLine k="Name" v="Arjun Singh" />
              <InfoLine k="Vehicle" v="DL 3S AB 1234" />
              <InfoLine k="Assigned" v="2:14 pm" muted />
            </dl>
          </InfoCard>
        </div>;
    case 'table':
      return <TableDemo />;
    case 'avatar':
      return <Row>{(['sm', 'md', 'lg', 'xl'] as const).map((s, i) => <span key={s} className="flex items-center gap-2"><Avatar name={['Manoj Tiwari', 'Sunita Rao', 'Kavya Iyer', 'Arjun Singh'][i]} size={s} /><span className="text-xs text-ink-subtle">{s}</span></span>)}</Row>;
    case 'modal':
      return <ModalDemo />;
    case 'drawer':
      return <DrawerDemo />;
    case 'toast':
      return <Row>
          <Button variant="secondary" onClick={() => toast.success('Payment of ₹4,000 recorded')}>Success toast</Button>
          <Button variant="secondary" onClick={() => toast.error('Couldn’t save. Check your connection and try again.')}>Error toast</Button>
        </Row>;
    case 'contextheader':
      return <ContextHeader title="Pattern Anarkali" meta="DZ-10312 · Kavya Iyer" due={inFiveDays} badges={<Badge tone="warning">Express</Badge>} />;
    case 'scan':
      return <ScanDemo />;
    case 'signature':
      return <SignatureDemo />;
    case 'photo':
      return <PhotoDemo />;
    case 'qr':
      return <div className="inline-flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4">
          <QrGlyph value="PKG-10319-A" size={96} />
          <span className="font-mono text-sm">PKG-10319-A</span>
        </div>;
    case 'states':
      return <StatesDemo />;
    default:
      return null;
  }
}

/** Order status → Badge tone, rendered from utils/status.ts. */
export function OrderStatusMap() {
  return <Row>{(Object.keys(orderStatusTone) as OrderStatus[]).map((s) => <Badge key={s} tone={orderStatusTone[s]}>{s}</Badge>)}</Row>;
}

const severityCopy = {
  critical: 'Wrong store — this package is for Vasant Kunj.',
  warning: 'Due in 2 days and not yet at Finishing.',
  attention: 'No assistant assigned.',
  info: 'Price confirmed by the workshop.'
};

function Row({ children, className }: {children: React.ReactNode;className?: string;}) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)}>{children}</div>;
}

function ChipDemo() {
  const [v, setV] = useState('active');
  return <Row>{['active', 'attention', 'ready', 'closed'].map((k) => <button key={k} aria-pressed={v === k} onClick={() => setV(k)} className={chipClass(v === k)}>{{ active: 'Active', attention: 'Needs attention', ready: 'Ready', closed: 'Closed' }[k]}</button>)}</Row>;
}

function FieldDemo() {
  const [phone, setPhone] = useState('98110');
  const [tried, setTried] = useState(true);
  const invalid = tried && !/^\d{10}$/.test(phone);
  return <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <Field label="Customer name" required>
        <input className={inputClass} defaultValue="Kavya Iyer" />
      </Field>
      <div>
        <Field label="Contact number" required>
          <input inputMode="numeric" value={phone} onChange={(e) => {setPhone(e.target.value.replace(/\D/g, ''));setTried(true);}} aria-invalid={invalid} aria-describedby="phone-err" className={cn(inputClass, invalid && 'border-critical bg-critical-soft/40 focus:border-critical focus:ring-critical/20')} />
        </Field>
        {invalid && <p id="phone-err" className="mt-1.5 flex items-center gap-1.5 text-sm text-critical"><AlertCircleIcon className="h-4 w-4" aria-hidden />Enter a 10-digit mobile number</p>}
      </div>
      <Field label="Lining fabric" hint="Only shown when Lining is Yes">
        <select className={inputClass} defaultValue="Satin">
          {['Cotton', 'Mul cotton', 'Satin', 'Shantoon', 'Crepe', 'Net'].map((f) => <option key={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Package ID">
        <input className={inputClass} value="PKG-10319-A" disabled readOnly />
      </Field>
    </div>;
}

function ToggleDemo() {
  const [a, setA] = useState(true);
  return <div className="max-w-md"><Toggle checked={a} onChange={setA} label="WhatsApp the customer when ready" description="Sends once the order reaches the store" /></div>;
}

function SegmentedDemo() {
  const [v, setV] = useState<'no' | 'yes'>('no');
  const [s, setS] = useState<'small' | 'major'>('major');
  return <Row className="gap-6">
      <Segmented ariaLabel="Lining" value={v} onChange={setV} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
      <Segmented ariaLabel="Alteration size" size="lg" value={s} onChange={setS} options={[{ value: 'small', label: 'Small' }, { value: 'major', label: 'Major' }]} />
    </Row>;
}

function FilterDemo() {
  const [v, setV] = useState<'all' | 'khan' | 'vasant' | 'home'>('all');
  return <FilterMenu value={v} defaultValue="all" onChange={setV} label="Destination" options={[{ value: 'all', label: 'All destinations', count: 14 }, { value: 'khan', label: 'Khan Market', count: 6 }, { value: 'vasant', label: 'Vasant Kunj', count: 5 }, { value: 'home', label: 'Home delivery', count: 3 }]} />;
}

function TabsDemo() {
  const [v, setV] = useState<'details' | 'workflow' | 'payments'>('workflow');
  return <div className="rounded-xl bg-surface px-4">
      <Tabs value={v} onChange={setV} tabs={[{ key: 'details', label: 'Order details' }, { key: 'workflow', label: 'Workflow', count: 2 }, { key: 'payments', label: 'Payments' }]} />
    </div>;
}

function StepDemo() {
  const [step, setStep] = useState(1);
  return <div className="flex flex-wrap items-start gap-6">
      <div className="w-60 rounded-2xl border border-line bg-surface">
        <OrderStepRail title="Pack order" subtitle="DZ-10320" step={step} maxStep={2} onStep={setStep} ariaLabel="Packing steps" steps={[{ key: 'check', label: 'Check items' }, { key: 'label', label: 'Print label' }, { key: 'driver', label: 'Assign driver' }]} />
      </div>
      <div className="min-w-[220px] flex-1">
        <p className="text-sm text-ink-muted">Phone progress bar</p>
        <div className="mt-2 h-1.5 rounded-full bg-sunken"><div className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out" style={{ width: `${(step + 1) / 3 * 100}%` }} /></div>
      </div>
    </div>;
}

function KpiDemo() {
  const [sel, setSel] = useState<string | null>('behind');
  const tiles = [{ k: 'ready', label: 'Ready to pack', v: 4 }, { k: 'behind', label: 'Behind', v: 3, alert: true }, { k: 'transit', label: 'Out for delivery', v: 6 }];
  return <div className="grid gap-3 sm:grid-cols-3">
      {tiles.map((t) => <button key={t.k} aria-pressed={sel === t.k} onClick={() => setSel(sel === t.k ? null : t.k)} className={cn(statTileClass, 'text-left', sel === t.k && 'border-brand bg-brand-soft ring-1 ring-brand/30')}>
          <span className="text-sm text-ink-muted">{t.label}</span>
          <span className={cn('mt-1 text-[28px] font-semibold leading-none tabular', t.alert ? 'text-critical' : 'text-ink')}>{t.v}</span>
        </button>)}
    </div>;
}

function TableDemo() {
  const rows: [string, string, string, OrderStatus, string][] = [['DZ-10320', 'Kavya Iyer', 'Pattern Anarkali', 'Ready for Trial', '₹18,400'], ['DZ-10312', 'Meera Shah', 'Bridal Lehenga', 'In Production', '₹64,000'], ['DZ-10299', 'Nikhil Rao', 'Bandhgala', 'Alteration', '₹22,500']];
  return <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      <table className="w-full text-left text-[15px]">
        <thead><tr className="border-b border-line text-xs text-ink-subtle">{['Order', 'Customer', 'Garment', 'Status', 'Total'].map((h, i) => <th key={h} scope="col" className={cn('px-4 py-3 font-medium', i === 4 && 'text-right')}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => <tr key={r[0]} tabIndex={0} className="cursor-pointer transition-colors duration-150 ease-out hover:bg-sunken/60 focus-visible:bg-sunken focus-visible:outline-none">
              <td className="px-4 py-3 tabular text-ink-muted">{r[0]}</td>
              <td className="px-4 py-3 font-medium">{r[1]}</td>
              <td className="px-4 py-3 text-ink-muted">{r[2]}</td>
              <td className="px-4 py-3"><Badge tone={orderStatusTone[r[3]]}>{r[3]}</Badge></td>
              <td className="px-4 py-3 text-right tabular">{r[4]}</td>
            </tr>)}
        </tbody>
      </table>
    </div>;
}

function ModalDemo() {
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  return <>
      <Button onClick={() => setOpen(true)}>Mark as delivered</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Enter the customer’s OTP" footer={<>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={otp.length !== 4} onClick={() => {setOpen(false);setOtp('');toast.success('DZ-10320 delivered to Nikhil Rao');}}>Confirm delivery</Button>
          </>}>
        <Field label="4-digit code" hint="The customer received it when the driver was assigned">
          <input autoFocus inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className={cn(inputClass, 'h-14 text-center text-2xl tracking-[0.5em] tabular')} />
        </Field>
      </Modal>
    </>;
}

function DrawerDemo() {
  const [open, setOpen] = useState(false);
  return <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Visit · Kavya Iyer">
        <p className="text-[15px] text-ink-muted">Read-mostly detail sits here while the list stays visible.</p>
      </Drawer>
    </>;
}

function ScanDemo() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  return <div className="flex flex-wrap items-center gap-4">
      <Button size="lg" icon={<ScanLineIcon className="h-5 w-5" />} onClick={() => setOpen(true)}>Scan package</Button>
      <p aria-live="polite" className="text-sm text-ink-muted">{result ?? 'No scan yet'}</p>
      <ScanDialog open={open} onClose={() => setOpen(false)} samples={[{ code: 'PKG-10319-A', hint: 'Khan Market' }, { code: 'PKG-10322-A', hint: 'Vasant Kunj' }, { code: 'XXX', hint: 'Smudged label', label: 'Unreadable' }]} onResult={(code, manual) => {setOpen(false);setResult(`${manual ? 'Typed' : 'Scanned'} ${code}`);}} />
    </div>;
}

function SignatureDemo() {
  const [signed, setSigned] = useState(false);
  return <div className="max-w-md"><SignaturePad label="Customer signature" signerName="Kavya Iyer" signed={signed} onSignedChange={setSigned} /></div>;
}

function PhotoDemo() {
  const [photos, setPhotos] = useState<string[]>([]);
  return <div className="max-w-md"><PhotoCapture photos={photos} onChange={setPhotos} label="Add a photo of the problem" hint="Optional" /></div>;
}

function StatesDemo() {
  return <div className="grid gap-4 md:grid-cols-2">
      <StateCard label="Empty">
        <InboxIcon className="h-6 w-6 text-ink-subtle" aria-hidden />
        <p className="mt-3 text-[15px] font-medium">No packages to receive</p>
        <p className="mt-1 text-sm text-ink-muted">Incoming packages for Khan Market show here.</p>
      </StateCard>
      <StateCard label="Loading">
        <div className="w-full space-y-3" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-3"><div className="h-9 w-9 animate-pulse rounded-full bg-sunken" /><div className="flex-1 space-y-1.5"><div className="h-3 w-2/3 animate-pulse rounded bg-sunken" /><div className="h-3 w-1/3 animate-pulse rounded bg-sunken" /></div></div>)}
        </div>
      </StateCard>
      <StateCard label="Error">
        <AlertCircleIcon className="h-6 w-6 text-critical" aria-hidden />
        <p className="mt-3 text-[15px] font-medium">Couldn’t load shipments</p>
        <p className="mt-1 text-sm text-ink-muted">Check the connection and try again.</p>
        <Button variant="secondary" size="sm" className="mt-4" icon={<RefreshCwIcon className="h-4 w-4" />}>Try again</Button>
      </StateCard>
      <StateCard label="Success">
        <CheckCircle2Icon className="h-6 w-6 text-success" aria-hidden />
        <p className="mt-3 text-[15px] font-medium">PKG-10319-A received</p>
        <p className="mt-1 text-sm text-ink-muted">3 pieces · Kabir · 2:14 pm</p>
        <Button variant="subtle" size="sm" className="mt-4" iconRight={<ArrowRightIcon className="h-4 w-4" />}>View contents</Button>
      </StateCard>
    </div>;
}

function StateCard({ label, children }: {label: string;children: React.ReactNode;}) {
  return <div className="rounded-2xl border border-line bg-surface">
      <p className="border-b border-line px-4 py-2 text-xs font-medium text-ink-subtle">{label}</p>
      <div className="flex min-h-[180px] flex-col items-center justify-center p-6 text-center">{children}</div>
    </div>;
}