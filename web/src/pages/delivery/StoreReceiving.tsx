import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRightIcon, CircleAlertIcon, CircleCheckIcon, ScanLineIcon, TriangleAlertIcon } from 'lucide-react';
import { DeliveryStateBadge } from '../../components/delivery/DeliveryStateBadge';
import { DiscrepancyModal } from '../../components/delivery/DiscrepancyModal';
import { ScanDialog } from '../../components/packages/ScanDialog';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { useApp } from '../../contexts/AppContext';
import { type ReceiveOutcome, UNREADABLE, usePackages } from '../../contexts/PackagesContext';
import { useScanLookup } from '../../hooks/useScanLookup';
import type { PackageRecord } from '../../types/packaging';
import { formatOrderId, formatPackageId } from '../../utils/displayIds';
import { cn } from '../../utils/cn';
import { fmtDate, fmtDateTime } from '../../utils/format';
import { garmentNames, isLate, itemQty, latestUpdate, onTheRoad } from '../../utils/packages';
import { orderListClass, orderListPanelClass, pageClass } from '../../utils/styles';
type Tab = 'incoming' | 'received';
const cols = 'lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_140px_120px_170px_24px]';

/** Store: scan a package in, check what's inside, raise a discrepancy if anything is missing. */
export function StoreReceiving() {
  const {
    getOrder,
    customerName
  } = useApp();
  const {
    packages,
    getPackage,
    myStore,
    receiveAtStore
  } = usePackages();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>('incoming');
  const [openId, setOpenId] = useState<string | null>(null);
  const [banner, setBanner] = useState<ReceiveOutcome | null>(null);
  const [discFor, setDiscFor] = useState<PackageRecord | null>(null);
  const mine = useMemo(() => packages.filter((p) => p.destination.kind === 'store' && p.destination.name === myStore), [packages, myStore]);
  const incoming = mine.filter((p) => onTheRoad(p.status));
  const received = mine.filter((p) => p.status === 'Delivered').sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''));
  const list = tab === 'incoming' ? incoming : received;
  const customerOf = (p: PackageRecord) => {
    const o = getOrder(p.orderId);
    return o ? customerName(o.customerId) : '';
  };
  const handle = (code: string, typed: boolean) => {
    const r = receiveAtStore(code, typed);
    if (r.kind === 'received' || r.kind === 'already') {
      setBanner(null);
      setTab('received');
      setOpenId(r.pkg.id);
      return;
    }
    setBanner(r);
  };
  const scanner = useScanLookup(handle);
  useEffect(() => {
    const code = params.get('code');
    if (!code) return;
    handle(code, false);
    setParams({}, {
      replace: true
    });
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const samples = [...incoming.slice(0, 2).map((p) => ({
    code: p.id,
    hint: `${p.orderId} · ${customerOf(p)}`
  })), ...packages.filter((p) => p.destination.name !== myStore && onTheRoad(p.status)).slice(0, 1).map((p) => ({
    code: p.id,
    hint: `For ${p.destination.name}`
  })), ...received.slice(0, 1).map((p) => ({
    code: p.id,
    hint: 'Already received'
  })), {
    code: UNREADABLE,
    label: 'Smudged label',
    hint: 'Can’t be read'
  }];
  const open = openId ? getPackage(openId) ?? null : null;
  const bannerText = banner && (banner.kind === 'wrong-store' ? {
    title: `Not for this store — goes to ${banner.pkg.destination.name}`,
    body: `${banner.pkg.orderId} wasn’t received. Give it back to the driver; Logistics has been told.`
  } : banner.kind === 'not-dispatched' ? {
    title: `${banner.pkg.orderId} hasn’t left the workshop`,
    body: 'It can’t be received yet.'
  } : banner.kind === 'not-found' ? {
    title: 'Package not found',
    body: `${banner.code} isn’t on any order.`
  } : {
    title: 'Couldn’t read the label',
    body: 'Scan again, or type the ID under the barcode.'
  });
  return <div className={pageClass}>
      <PageHeader title="Receiving" subtitle={myStore} actions={<Button size="lg" icon={<ScanLineIcon className="h-5 w-5" />} onClick={() => scanner.setOpen(true)}>Scan package</Button>} />

      {bannerText && <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl bg-critical-soft px-5 py-4 ring-1 ring-inset ring-critical/30">
          <CircleAlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-critical" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-critical">{bannerText.title}</p>
            <p className="text-[15px]">{bannerText.body}</p>
          </div>
          <button type="button" onClick={() => setBanner(null)} className="h-9 shrink-0 rounded-lg px-2 text-sm font-medium text-ink-muted hover:text-ink">Dismiss</button>
        </div>}

      <Tabs<Tab> className="mb-5" value={tab} onChange={setTab} tabs={[{
      key: 'incoming',
      label: 'Incoming',
      count: incoming.length
    }, {
      key: 'received',
      label: 'Received',
      count: received.length
    }]} />

      <div className={orderListPanelClass}>
        <div className={cn('hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid', cols)}>
          <span>Order</span><span>Contents</span><span>Driver</span><span>{tab === 'incoming' ? 'Deliver by' : 'Received'}</span><span>Status</span><span />
        </div>
        <ul className={orderListClass}>
          {list.map((p) => {
          const disc = p.discrepancy && !p.discrepancy.resolvedAt;
          const last = latestUpdate(p);
          const when = tab === 'incoming' ? fmtDate(p.deadline, 'EEE d MMM') : fmtDateTime(p.deliveredAt ?? '');
          return <li key={p.id}>
                <button type="button" onClick={() => setOpenId(p.id)} className={cn('group flex h-full w-full flex-col rounded-2xl border border-line-strong bg-surface p-4 text-left shadow-soft hover:border-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:grid lg:items-center lg:gap-x-4 lg:rounded-none lg:border-0 lg:px-5 lg:py-4 lg:shadow-none lg:hover:bg-canvas', cols)}>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{customerOf(p)}</p>
                    <p className="font-mono text-sm text-ink-subtle">{formatOrderId(p.orderId)} · {formatPackageId(p.id, p.orderId)}</p>
                  </div>
                  <p className="mt-2 truncate text-[15px] text-ink-muted lg:mt-0">{garmentNames(p)} · {p.items.length} item{p.items.length > 1 ? 's' : ''}</p>
                  <p className="mt-1 truncate text-sm lg:mt-0"><span className="text-ink-subtle lg:hidden">Driver · </span>{p.runner ?? <span className="text-ink-subtle">—</span>}</p>
                  <p className={cn('mt-1 text-sm lg:mt-0', tab === 'incoming' && isLate(p) ? 'font-medium text-critical' : 'text-ink-muted')}>{when}</p>
                  <div className="mt-3 lg:mt-0">{disc ? <Badge tone="critical"><TriangleAlertIcon className="h-3.5 w-3.5" aria-hidden />Discrepancy</Badge> : tab === 'received' && p.destination.kind === 'store' && p.status === 'Delivered' ? <span className="text-sm text-ink">Received · {p.receivedBy ?? last.by}</span> : <DeliveryStateBadge p={p} />}</div>
                  <ChevronRightIcon className="hidden h-5 w-5 text-ink-subtle lg:block" aria-hidden />
                </button>
              </li>;
        })}
          {list.length === 0 && <li className="px-5 py-12 text-center text-ink-muted sm:col-span-2">{tab === 'incoming' ? 'Nothing on its way.' : 'Nothing received yet.'}</li>}
        </ul>
      </div>

      <Modal open={!!open} onClose={() => setOpenId(null)} size="lg" title={open ? `${customerOf(open)} · ${open.orderId}` : ''} footer={open?.status === 'Delivered' && !open.discrepancy ? <>
          <Button variant="ghost" onClick={() => setOpenId(null)}>Close</Button>
          <Button variant="secondary" icon={<TriangleAlertIcon className="h-4 w-4" />} onClick={() => {
        setDiscFor(open);
        setOpenId(null);
      }}>Raise discrepancy</Button>
        </> : undefined}>
        {open && <div className="space-y-5">
            {open.status === 'Delivered' ? <div className="flex items-start gap-3 rounded-xl bg-success-soft px-4 py-3 text-success ring-1 ring-inset ring-success/30">
                <CircleCheckIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p className="text-[15px]"><span className="font-semibold">Received</span><span className="text-ink"> · {fmtDateTime(open.deliveredAt ?? '')}{open.receivedBy ? ` · ${open.receivedBy}` : ''}</span></p>
              </div> : <p className="rounded-xl bg-canvas px-4 py-3 text-[15px] text-ink-muted">On its way with {open.runner}. Scan the label when it arrives.</p>}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[15px] sm:grid-cols-4">
              <div><dt className="text-sm text-ink-muted">Package</dt><dd className="font-mono font-medium">{open.id}</dd></div>
              <div><dt className="text-sm text-ink-muted">Driver</dt><dd className="font-medium">{open.runner ?? '—'}</dd></div>
              <div><dt className="text-sm text-ink-muted">Deliver by</dt><dd className={cn('font-medium', isLate(open) && 'text-critical')}>{fmtDate(open.deadline, 'EEE d MMM')}</dd></div>
              <div><dt className="text-sm text-ink-muted">Pieces</dt><dd className="font-medium tabular">{open.items.reduce((s, i) => s + itemQty(i), 0)}</dd></div>
            </dl>
            {open.instructions && <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink-muted">{open.instructions}</p>}
            <div>
              <h3 className="text-[15px] font-semibold">Contents <span className="font-normal tabular text-ink-subtle">{open.items.length}</span></h3>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                {open.items.map((i) => {
              const flagged = open.discrepancy && !open.discrepancy.resolvedAt && open.discrepancy.itemIds.includes(i.garmentId);
              return <li key={i.garmentId} className="flex items-center gap-3 px-4 py-3">
                      {i.photo ? <img src={i.photo} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <span className="h-10 w-10 shrink-0 rounded-lg bg-sunken" aria-hidden />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{i.label}</p>
                        {i.note && <p className="truncate text-sm text-ink-muted">{i.note}</p>}
                      </div>
                      {flagged && <Badge tone="critical">{open.discrepancy!.issue}</Badge>}
                      <span className="shrink-0 tabular text-ink-muted">×{itemQty(i)}</span>
                    </li>;
            })}
              </ul>
            </div>
            {open.discrepancy && <p className={cn('rounded-xl px-4 py-3 text-[15px]', open.discrepancy.resolvedAt ? 'bg-canvas text-ink-muted' : 'bg-critical-soft text-critical')}>
                {open.discrepancy.resolvedAt ? `Discrepancy resolved by ${open.discrepancy.resolvedBy}` : `Discrepancy sent to Logistics · ${fmtDateTime(open.discrepancy.at)}`}
                {open.discrepancy.note && <span className="block text-sm text-ink">{open.discrepancy.note}</span>}
              </p>}
          </div>}
      </Modal>

      <ScanDialog open={scanner.open} busy={scanner.busy} onClose={() => scanner.setOpen(false)} title="Scan package" samples={samples} onResult={scanner.run} />
      <DiscrepancyModal p={discFor} onClose={() => setDiscFor(null)} />
    </div>;
}