import React, { useMemo, useState } from 'react';
import { CircleCheckIcon, ClockIcon, HomeIcon, NavigationIcon, PhoneIcon, ScanLineIcon, StoreIcon } from 'lucide-react';
import { OtpModal } from '../../components/delivery/OtpModal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { useApp } from '../../contexts/AppContext';
import { usePackages } from '../../contexts/PackagesContext';
import { storeInfo } from '../../data/packages';
import type { PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { fmtDate, fmtTime, TODAY_ISO } from '../../utils/format';
import { isLate, itemQty, onTheRoad } from '../../utils/packages';
import { pageClass } from '../../utils/styles';
type Tab = 'todo' | 'done';
const mapsLink = (p: PackageRecord) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.destination.name} ${p.destination.detail}`)}`;

/** Delivery Runner: what to deliver and where. Stores scan packages in; homes need the customer's OTP. */
export function DriverDeliveries() {
  const {
    user,
    getOrder,
    customerName
  } = useApp();
  const {
    packages
  } = usePackages();
  const [tab, setTab] = useState<Tab>('todo');
  const [otpFor, setOtpFor] = useState<PackageRecord | null>(null);
  const todo = useMemo(() => packages.filter((p) => p.runner === user.name && onTheRoad(p.status)).sort((a, b) => a.deadline.localeCompare(b.deadline)), [packages, user.name]);
  const done = useMemo(() => packages.filter((p) => p.runner === user.name && p.status === 'Delivered' && p.deliveredAt?.startsWith(TODAY_ISO)), [packages, user.name]);
  const list = tab === 'todo' ? todo : done;
  const customerOf = (p: PackageRecord) => {
    const o = getOrder(p.orderId);
    return o ? customerName(o.customerId) : '';
  };
  return <div className={cn(pageClass, 'max-w-3xl')}>
      <PageHeader title="Deliveries" />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{
      key: 'todo',
      label: 'To deliver',
      count: todo.length
    }, {
      key: 'done',
      label: 'Delivered today',
      count: done.length
    }]} />

      <ul className="mt-5 space-y-4">
        {list.map((p) => {
        const home = p.destination.kind === 'customer';
        const store = !home ? storeInfo(p.destination.name) : undefined;
        const Icon = home ? HomeIcon : StoreIcon;
        const late = isLate(p);
        return <li key={p.id} className="rounded-2xl border border-line bg-surface shadow-soft">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-muted"><span className="font-mono font-medium text-ink">{p.orderId}</span> · {customerOf(p)}</p>
                    <p className="mt-2 flex items-center gap-2 text-[19px] font-semibold leading-tight"><Icon className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden />{p.destination.name}</p>
                    <p className="mt-1 text-[15px] text-ink-muted">{p.destination.detail}</p>
                  </div>
                  {tab === 'todo' ? <Badge tone={home ? 'brand' : 'neutral'}>{home ? 'Home delivery' : 'Store'}</Badge> : <Badge tone="success"><CircleCheckIcon className="h-3.5 w-3.5" aria-hidden />{fmtTime(p.deliveredAt!)}</Badge>}
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {store && <div><dt className="text-ink-subtle">Store contact</dt><dd><a href={`tel:${store.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 font-medium hover:underline"><PhoneIcon className="h-3.5 w-3.5" aria-hidden />{store.contact} · {store.phone}</a></dd></div>}
                  {store && <div><dt className="text-ink-subtle">Open</dt><dd className="font-medium">{store.hours}</dd></div>}
                  <div><dt className="text-ink-subtle">Package</dt><dd className="font-medium"><span className="font-mono">{p.id}</span> · {p.items.reduce((s, i) => s + itemQty(i), 0)} pcs</dd></div>
                  <div><dt className="text-ink-subtle">Deliver by</dt><dd className={cn('font-medium', late && tab === 'todo' && 'text-critical')}>{fmtDate(p.deadline, 'EEE d MMM')}{late && tab === 'todo' ? ' · late' : ''}</dd></div>
                </dl>
                {p.instructions && tab === 'todo' && <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-sm text-ink-muted">{p.instructions}</p>}
              </div>

              {tab === 'todo' && <div className="flex flex-col gap-2 border-t border-line p-4 sm:flex-row sm:items-center">
                  <a href={mapsLink(p)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sunken px-4 text-[15px] font-medium text-ink hover:bg-line sm:w-auto">
                    <NavigationIcon className="h-4 w-4" aria-hidden />Directions
                  </a>
                  <span className="flex-1" />
                  {home ? <Button size="lg" icon={<CircleCheckIcon className="h-5 w-5" />} onClick={() => setOtpFor(p)}>Mark as delivered</Button> : <p className="flex items-center gap-2 text-sm text-ink-muted"><ScanLineIcon className="h-4 w-4" aria-hidden />Hand it over — the store scans it in</p>}
                </div>}
            </li>;
      })}
        {list.length === 0 && <li className="rounded-2xl border border-dashed border-line-strong px-5 py-12 text-center text-[15px] text-ink-muted">
            {tab === 'todo' ? <><ClockIcon className="mx-auto mb-2 h-6 w-6 text-ink-subtle" aria-hidden />Nothing to deliver right now.</> : 'Nothing delivered yet today.'}
          </li>}
      </ul>

      <OtpModal p={otpFor} onClose={() => setOtpFor(null)} />
    </div>;
}