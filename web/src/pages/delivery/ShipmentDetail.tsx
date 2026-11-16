import React, { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, PackageSearchIcon, PhoneIcon, PrinterIcon, RepeatIcon, TriangleAlertIcon, UserMinusIcon, UserPlusIcon } from 'lucide-react';
import { AssignDriverModal } from '../../components/delivery/AssignDriverModal';
import { DeliveryStateBadge } from '../../components/delivery/DeliveryStateBadge';
import { DestinationDetails } from '../../components/delivery/DestinationDetails';
import { ShipmentTracker } from '../../components/delivery/ShipmentTracker';
import { PackageLabelModal } from '../../components/packages/PackageLabelModal';
import { PackageHistory } from '../../components/packages/PackageTimeline';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button, buttonClass } from '../../components/ui/Button';
import { InfoCard, InfoLine, SectionCard } from '../../components/ui/InfoCard';
import { useApp } from '../../contexts/AppContext';
import { usePackages } from '../../contexts/PackagesContext';
import { driverInfo, storeInfo } from '../../data/packages';
import { cn } from '../../utils/cn';
import { fmtDate, fmtDateTime } from '../../utils/format';
import { atPacking, garmentNames, isLate, itemQty, onTheRoad } from '../../utils/packages';
import { pageClass } from '../../utils/styles';
const categoryLabel = {
  garment: 'Garment',
  sample: 'Customer sample',
  fabric: 'Fabric to return',
  belonging: 'Customer belonging'
} as const;

/**
 * The assigned driver: who, how to reach them, then the two things Logistics can do —
 * hand the package to someone else, or take it off this driver (asks first).
 */
function DriverDetails({
  name,
  vehicle,
  phone,
  assignedAt,
  canChange,
  canRemove,
  onChange,
  onRemove









}: {name: string;vehicle?: string;phone?: string;assignedAt?: string;canChange: boolean;canRemove: boolean;onChange: () => void;onRemove: () => void;}) {
  const [confirming, setConfirming] = useState(false);
  const [kind, plate] = (vehicle ?? '').split(' · ');
  const first = name.split(' ')[0];
  return <div>
      <div className="flex items-center gap-3">
        <Avatar name={name} size="lg" />
        <div className="min-w-0">
          <p className="text-[17px] font-semibold leading-tight">{name}</p>
          {assignedAt && <p className="mt-0.5 text-sm text-ink-muted">Assigned {fmtDateTime(assignedAt)}</p>}
        </div>
      </div>

      {(kind || plate) && <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
          {kind && <div className="min-w-0">
              <dt className="text-sm text-ink-muted">Vehicle</dt>
              <dd className="mt-0.5 truncate text-[15px] font-medium">{kind}</dd>
            </div>}
          {plate && <div className="min-w-0">
              <dt className="text-sm text-ink-muted">Number plate</dt>
              <dd className="mt-0.5 truncate font-mono text-[14px] font-medium">{plate}</dd>
            </div>}
        </dl>}

      {phone && <a href={`tel:${phone.replace(/\s/g, '')}`} className={buttonClass('secondary', 'md', 'mt-4 w-full')}>
          <PhoneIcon className="h-4 w-4" aria-hidden /> Call <span className="tabular">{phone}</span>
        </a>}

      {(canChange || canRemove) && (confirming ? <div role="alertdialog" aria-label={`Remove ${first}`} className="mt-4 rounded-xl bg-critical-soft p-4">
            <p className="text-[15px] font-medium text-critical">Take {first} off this delivery?</p>
            <p className="mt-1 text-sm text-ink">It goes back to Ready for dispatch until another driver is assigned.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>Keep {first}</Button>
              <Button variant="danger" onClick={() => {
          setConfirming(false);
          onRemove();
        }}>Remove</Button>
            </div>
          </div> : <div className="mt-4 border-t border-line pt-4">
            <div className="grid grid-cols-2 gap-2">
              {canChange && <Button variant="secondary" icon={<RepeatIcon className="h-4 w-4" />} onClick={onChange} className={canRemove ? undefined : 'col-span-2'}>Change driver</Button>}
              {canRemove && <Button variant="ghost" icon={<UserMinusIcon className="h-4 w-4" />} onClick={() => setConfirming(true)} className={cn('text-critical hover:bg-critical-soft hover:text-critical', !canChange && 'col-span-2')}>Remove driver</Button>}
            </div>
            <p className="mt-2 text-sm text-ink-muted">Change hands it to another driver. Remove puts it back to wait for one.</p>
          </div>)}
    </div>;
}

/** Logistics: one shipment — progress, driver, destination, contents and history. Driver is assigned here. */
export function ShipmentDetail() {
  const {
    id = ''
  } = useParams();
  const {
    getOrder,
    getCustomer,
    customerName
  } = useApp();
  const {
    getPackage,
    isLogistics,
    removeDriver,
    resolveDiscrepancy
  } = usePackages();
  const [assignOpen, setAssignOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const p = getPackage(id);
  if (!p) {
    return <div className={pageClass}>
        <div className="mx-auto mt-16 max-w-sm text-center">
          <PackageSearchIcon className="mx-auto h-10 w-10 text-ink-subtle" strokeWidth={1.5} />
          <h1 className="mt-4 text-xl font-semibold">Shipment not found</h1>
          <Link to="/packing" className={buttonClass('primary', 'lg', 'mt-6')}>Back to Shipments</Link>
        </div>
      </div>;
  }
  if (atPacking(p) && isLogistics) return <Navigate to={`/packing/${p.id}`} replace />;
  const o = getOrder(p.orderId);
  const customer = o ? customerName(o.customerId) : '';
  const driver = driverInfo(p.runner);
  const store = p.destination.kind === 'store' ? storeInfo(p.destination.name) : undefined;
  const d = p.discrepancy;
  const canAssign = isLogistics && (p.status === 'Ready for dispatch' || onTheRoad(p.status));
  return <div className={pageClass}>
      <Link to="/packing" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"><ArrowLeftIcon className="h-4 w-4" /> Shipments</Link>
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[30px] font-medium leading-none tracking-tight">{p.id}</h1>
            <DeliveryStateBadge p={p} size="md" />
            {isLate(p) && <Badge tone="critical">Late</Badge>}
          </div>
          <p className="mt-2 text-[15px] text-ink-muted">
            <Link to={`/orders/${p.orderId}`} className="font-mono font-medium text-ink hover:underline">{p.orderId}</Link> · {customer} · {garmentNames(p)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="lg" icon={<PrinterIcon className="h-5 w-5" />} onClick={() => setLabelOpen(true)}>Label</Button>
          {isLogistics && p.status === 'Ready for dispatch' && <Button size="lg" icon={<UserPlusIcon className="h-5 w-5" />} onClick={() => setAssignOpen(true)}>Assign driver</Button>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          {d && <div role="alert" className={d.resolvedAt ? 'rounded-2xl border border-line bg-surface p-5' : 'rounded-2xl bg-critical-soft p-5 ring-1 ring-inset ring-critical/30'}>
              <div className="flex items-start gap-3">
                <TriangleAlertIcon className={d.resolvedAt ? 'mt-0.5 h-5 w-5 shrink-0 text-ink-subtle' : 'mt-0.5 h-5 w-5 shrink-0 text-critical'} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={d.resolvedAt ? 'font-semibold' : 'font-semibold text-critical'}>
                    {d.resolvedAt ? 'Discrepancy resolved' : `Discrepancy · ${d.issue.toLowerCase()}`}: {p.items.filter((i) => d.itemIds.includes(i.garmentId)).map((i) => i.label).join(', ')}
                  </p>
                  {d.note && <p className="mt-1 text-[15px]">{d.note}</p>}
                  <p className="mt-1 text-sm text-ink-muted">Raised by {d.by} · {fmtDateTime(d.at)}{d.resolvedAt ? ` · resolved by ${d.resolvedBy}` : ''}</p>
                  {!d.resolvedAt && isLogistics && <Button variant="secondary" className="mt-3" onClick={() => resolveDiscrepancy(p.id)}>Mark resolved</Button>}
                </div>
              </div>
            </div>}

          <SectionCard title="Delivery status">
            <ShipmentTracker p={p} />
          </SectionCard>

          <SectionCard title="Contents" count={p.items.length} flush>
            <ul className="divide-y divide-line">
              {p.items.map((i) => {
              const flagged = d && !d.resolvedAt && d.itemIds.includes(i.garmentId);
              return <li key={i.garmentId} className="flex items-center gap-4 px-5 py-3.5">
                    {i.photo ? <img src={i.photo} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" /> : <span className="h-11 w-11 shrink-0 rounded-lg bg-sunken" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{i.label}</p>
                      <p className="truncate text-sm text-ink-muted">{categoryLabel[i.category ?? 'garment']}{i.note ? ` · ${i.note}` : ''}</p>
                    </div>
                    {flagged && <Badge tone="critical">{d.issue}</Badge>}
                    <span className="shrink-0 tabular text-ink-muted">×{itemQty(i)}</span>
                  </li>;
            })}
            </ul>
          </SectionCard>

          <SectionCard title="Activity" count={p.history.length}>
            <PackageHistory p={p} />
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <InfoCard title="Driver">
            {p.runner ? <DriverDetails name={p.runner} vehicle={driver?.vehicle} phone={driver?.phone} assignedAt={p.assignedAt} canChange={canAssign} canRemove={isLogistics && onTheRoad(p.status)} onChange={() => setAssignOpen(true)} onRemove={() => removeDriver(p.id)} /> : p.status === 'Ready for dispatch' ? <div>
                <p className="text-[15px] text-attention">No driver yet</p>
                {isLogistics && <Button variant="secondary" fullWidth className="mt-3" icon={<UserPlusIcon className="h-4 w-4" />} onClick={() => setAssignOpen(true)}>Assign driver</Button>}
              </div> : <p className="text-[15px] text-ink-muted">—</p>}
          </InfoCard>

          <InfoCard title={p.destination.kind === 'store' ? 'Deliver to store' : 'Home delivery'}>
            <DestinationDetails kind={p.destination.kind === 'store' ? 'store' : 'customer'} name={p.destination.name} address={p.destination.detail} store={store} customerPhone={o ? getCustomer(o.customerId)?.mobile : undefined} />
          </InfoCard>

          <InfoCard title="Shipment">
            <dl className="space-y-1.5 text-[15px]">
              <InfoLine k="Deliver by" v={fmtDate(p.deadline, 'EEE d MMM')} tone={isLate(p) ? 'text-critical font-medium' : undefined} />
              {p.packedAt && <InfoLine k="Packed" v={fmtDateTime(p.packedAt)} />}
              {p.deliveredAt && <InfoLine k="Delivered" v={fmtDateTime(p.deliveredAt)} />}
              {p.receivedBy && <InfoLine k="Received by" v={p.receivedBy} />}
              <InfoLine k="Sent by" v={p.createdBy} />
            </dl>
            {p.instructions && <p className="mt-3 border-t border-line pt-3 text-sm text-ink-muted">{p.instructions}</p>}
          </InfoCard>
        </aside>
      </div>

      <AssignDriverModal p={assignOpen ? p : null} onClose={() => setAssignOpen(false)} />
      <PackageLabelModal p={labelOpen ? p : null} onClose={() => setLabelOpen(false)} />
    </div>;
}