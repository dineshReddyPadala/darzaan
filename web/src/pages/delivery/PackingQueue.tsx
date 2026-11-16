import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon, ScanLineIcon, StoreIcon, ZapIcon } from 'lucide-react';
import { DeliveryStateBadge } from '../../components/delivery/DeliveryStateBadge';
import { ScanDialog } from '../../components/packages/ScanDialog';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilterMenu } from '../../components/ui/FilterMenu';
import { PageHeader } from '../../components/ui/PageHeader';
import { useApp } from '../../contexts/AppContext';
import { UNREADABLE, usePackages } from '../../contexts/PackagesContext';
import { STORES } from '../../data/packages';
import { useScanLookup } from '../../hooks/useScanLookup';
import { cn } from '../../utils/cn';
import { fmtDateTime, TODAY_ISO } from '../../utils/format';
import { deliveryState, deliveryStateLabel, deliveryStates, garmentNames, pieceCount, readyToPackage, shipmentHref, type DeliveryState } from '../../utils/packages';
import { kpiTileClass, orderListClass, orderListPanelClass, pageClass } from '../../utils/styles';
type Filter = 'all' | DeliveryState;
const cols = 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_72px_150px_190px_24px]';
/** Table order follows the work: ready to pack first, then packing, packed, out for delivery, problems, delivered. */
const rank: Record<DeliveryState, number> = {
  ready: 0,
  packing: 1,
  packed: 2,
  transit: 3,
  attention: 4,
  delivered: 5
};
const tiles: DeliveryState[] = ['ready', 'packed', 'transit', 'attention'];

/** Logistics: today's packages, packing first. Scan an order slip to open its checklist. */
export function PackingQueue() {
  const {
    getOrder,
    customerName
  } = useApp();
  const {
    packages
  } = usePackages();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>('all');
  const [dest, setDest] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Everything still moving, plus what was delivered today.
  const rows = useMemo(() => packages.filter((p) => p.status !== 'Delivered' || p.deliveredAt?.startsWith(TODAY_ISO) || p.discrepancy && !p.discrepancy.resolvedAt).map((p) => {
    const o = getOrder(p.orderId);
    return {
      p,
      o,
      state: deliveryState(p),
      customer: o ? customerName(o.customerId) : ''
    };
  }).sort((a, b) => rank[a.state] - rank[b.state] || a.p.createdAt.localeCompare(b.p.createdAt)), [packages, getOrder, customerName]);

  /** Order slip (DZ-…) or package label (PKG-…) → that order's checklist. */
  const resolve = (raw: string): string | null => {
    if (raw === UNREADABLE) return 'Couldn’t read that label. Hold it flat and scan again, or type the order number.';
    const code = raw.trim().toUpperCase();
    const orderId = code.startsWith('PKG-') ? `DZ-${code.split('-')[1]}` : code.startsWith('DZ-') ? code : `DZ-${code}`;
    const pkg = packages.find((p) => p.id === code) ?? packages.find((p) => p.orderId === orderId && p.status !== 'Delivered') ?? packages.find((p) => p.orderId === orderId);
    if (pkg) {
      navigate(shipmentHref(pkg));
      return null;
    }
    const order = getOrder(orderId);
    if (!order) return `No order ${orderId}. Check the number on the slip.`;
    if (order.garments.some(readyToPackage)) return `${orderId} hasn’t been sent to packing yet.`;
    return `${orderId} isn’t ready to pack — it’s still in production.`;
  };
  const scanner = useScanLookup((code) => setError(resolve(code)));
  useEffect(() => {
    const code = params.get('code');
    if (!code) return;
    setError(resolve(code));
    setParams({}, {
      replace: true
    });
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const count = (k: Filter) => rows.filter((r) => k === 'all' || r.state === k).length;
  const list = rows.filter((r) => filter === 'all' || r.state === filter).filter((r) => dest === 'all' || r.p.destination.name === dest || dest === 'home' && r.p.destination.kind === 'customer');
  const samples = [...rows.filter((r) => r.state === 'ready' || r.state === 'packing').slice(0, 3).map((r) => ({
    code: r.p.orderId,
    hint: `${r.customer} · order slip`
  })), {
    code: 'DZ-10399',
    hint: 'Order not in the system'
  }, {
    code: UNREADABLE,
    label: 'Smudged label',
    hint: 'Can’t be read'
  }];
  return <div className={pageClass}>
      <PageHeader title="Shipments" actions={<Button size="lg" icon={<ScanLineIcon className="h-5 w-5" />} onClick={() => {
      setError(null);
      scanner.setOpen(true);
    }}>Scan order ID</Button>} />

      {error && <p role="alert" className="-mt-2 mb-6 rounded-xl bg-critical-soft px-4 py-3 text-[15px] font-medium text-critical">{error}</p>}

      <section aria-label="At a glance" className="no-scrollbar -mx-4 mb-8 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:px-0">
        {tiles.map((k) => {
        const n = count(k);
        const alert = k === 'attention' && n > 0;
        const on = filter === k;
        return <button key={k} type="button" aria-pressed={on} onClick={() => setFilter(on ? 'all' : k)} className={cn(kpiTileClass, 'text-left transition-colors duration-150 ease-out hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand', alert && 'border-critical/30', on && 'border-brand bg-brand-soft hover:border-brand')}>
              <span className="whitespace-nowrap text-sm text-ink-muted">{deliveryStateLabel[k]}</span>
              <span className={cn('mt-1 text-[28px] font-semibold leading-none tabular', alert ? 'text-critical' : 'text-ink')}>{n}</span>
            </button>;
      })}
      </section>

      <div className="mb-4 flex min-h-10 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold leading-10">Orders <span className="ml-1 text-[15px] font-normal tabular text-ink-subtle">{list.length}</span></h2>
        <div className="flex flex-wrap items-center gap-2">
          <FilterMenu<string> label="Destination" value={dest} defaultValue="all" onChange={setDest} options={[{
          value: 'all',
          label: 'All destinations'
        }, ...STORES.map((s) => ({
          value: s.name,
          label: s.name
        })), {
          value: 'home',
          label: 'Home delivery'
        }]} />
          <FilterMenu<Filter> label="Status" value={filter} defaultValue="all" onChange={setFilter} options={(['all', ...deliveryStates] as Filter[]).map((k) => ({
          value: k,
          label: k === 'all' ? 'All' : deliveryStateLabel[k],
          count: count(k)
        }))} />
        </div>
      </div>

      <div className={orderListPanelClass}>
        <div className={cn('hidden gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid', cols)}>
          <span>Order</span><span>Destination</span><span>Pieces</span><span>Ready since</span><span>Status</span><span />
        </div>
        <ul className={orderListClass}>
          {list.map(({
          p,
          o,
          state,
          customer
        }) => {
          const express = o?.priority === 'Express';
          const DestIcon = p.destination.kind === 'store' ? StoreIcon : HomeIcon;
          const dest = p.destination.kind === 'store' ? p.destination.name : `Home · ${p.destination.name}`;
          const href = shipmentHref(p);
          const sub = state === 'attention' && p.problem ? <p className="mt-1 truncate text-sm text-critical">{p.problem.note}</p> : state === 'attention' && p.discrepancy ? <p className="mt-1 truncate text-sm text-critical">Discrepancy · {p.discrepancy.issue.toLowerCase()}</p> : state === 'packing' ? <p className="mt-1 text-sm tabular text-ink-subtle">{p.checked?.length ?? 0} of {p.items.length} checked</p> : state === 'packed' ? <p className="mt-1 text-sm text-attention">No driver</p> : state === 'transit' && p.runner ? <p className="mt-1 truncate text-sm text-ink-subtle">{p.runner}</p> : null;
          return <li key={p.id}>
                <Link to={href} className="flex h-full flex-col rounded-2xl border border-line-strong bg-surface p-4 shadow-soft transition-[border-color] duration-150 ease-out hover:border-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-sm font-semibold">{p.orderId}</span>
                    <span className="flex flex-wrap justify-end gap-1.5">{express && <Badge tone="critical"><ZapIcon className="h-3 w-3" />Express</Badge>}<DeliveryStateBadge state={state} /></span>
                  </div>
                  <p className="mt-2 truncate text-[17px] font-semibold">{customer}</p>
                  <p className="truncate text-[15px] text-ink-muted">{garmentNames(p)}</p>
                  {sub}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[15px]">
                    <span className="flex min-w-0 items-center gap-1.5 font-medium"><DestIcon className="h-4 w-4 shrink-0 text-brass" aria-hidden /><span className="truncate">{dest}</span></span>
                    <span className="shrink-0 tabular text-ink-muted">{pieceCount(p)} pcs</span>
                  </div>
                </Link>

                <Link to={href} className={cn('group hidden items-center gap-x-4 px-5 py-4 transition-colors duration-150 ease-out hover:bg-canvas focus-visible:bg-canvas focus-visible:outline-none lg:grid', cols)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{p.orderId}</span>
                      {express && <Badge tone="critical"><ZapIcon className="h-3 w-3" />Express</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-[15px] font-semibold">{customer}</p>
                    <p className="truncate text-sm text-ink-subtle">{garmentNames(p)}</p>
                  </div>
                  <p className="flex min-w-0 items-center gap-1.5 text-[15px] font-medium"><DestIcon className="h-4 w-4 shrink-0 text-brass" aria-hidden /><span className="truncate">{dest}</span></p>
                  <p className="text-[15px] tabular">{pieceCount(p)}</p>
                  <p className="text-sm text-ink-muted">{fmtDateTime(p.createdAt)}</p>
                  <div className="min-w-0"><DeliveryStateBadge state={state} />{sub}</div>
                  <ChevronRightIcon className="h-5 w-5 text-ink-subtle transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>;
        })}
          {list.length === 0 && <li className="px-5 py-12 text-center text-ink-muted sm:col-span-2">
              {rows.length ? 'Nothing matches.' : 'Nothing to pack right now.'}
            </li>}
        </ul>
      </div>

      <ScanDialog open={scanner.open} busy={scanner.busy} onClose={() => scanner.setOpen(false)} title="Scan order ID" samples={samples} onResult={scanner.run} />
    </div>;
}