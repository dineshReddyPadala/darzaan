import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangleIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { AddInventoryItemModal, type ItemKind, type Sampler } from '../components/inventory/AddInventoryItemModal';
import { useApp } from '../contexts/AppContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { QrGlyph } from '../components/ui/QrGlyph';
import { Tabs } from '../components/ui/Tabs';
import { useSyncedList } from '../hooks/useSyncedList';
import { samplers as seedSamplers } from '../data/catalog';
import { fabrics as seedFabrics, trims as seedTrims, type Fabric, type Trim } from '../data/inventory';
import { cn } from '../utils/cn';
import { inr } from '../utils/format';
import { chipClass, inputClass, pageClass, panelClass } from '../utils/styles';
type Tab = 'fabrics' | 'trims' | 'embroidery';
const trimCats = ['All', 'Border', 'Lace', 'Buttons', 'Tassels', 'Zips', 'Hooks', 'Pads', 'Boning'] as const;
const kindForTab: Record<Tab, ItemKind> = {
  fabrics: 'fabric',
  trims: 'trim',
  embroidery: 'sampler'
};
const tabForKind: Record<ItemKind, Tab> = {
  fabric: 'fabrics',
  trim: 'trims',
  sampler: 'embroidery'
};
export function Inventory() {
  const {
    can
  } = useApp();
  const [params] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [tab, setTab] = useState<Tab>(params.get('tab') as Tab || (initialQ.startsWith('TRM') ? 'trims' : 'fabrics'));
  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState<(typeof trimCats)[number]>('All');
  const [fabrics, setFabrics] = useSyncedList<Fabric[]>('inventoryFabrics', seedFabrics);
  const [trims, setTrims] = useSyncedList<Trim[]>('inventoryTrims', seedTrims);
  const [samplers, setSamplers] = useSyncedList<Sampler[]>('inventorySamplers', seedSamplers);
  const [adding, setAdding] = useState(false);
  const canAdd = can('inventory', 'create') || can('inventory', 'update');
  const low = [...fabrics.filter((f) => f.stock < f.reorderLevel).map((f) => `${f.type} ${f.name}`), ...trims.filter((t) => t.stock < t.reorderLevel).map((t) => t.name)];
  const s = q.toLowerCase();
  const nextId = (kind: ItemKind) => {
    const list: {
      id: string;
    }[] = kind === 'fabric' ? fabrics : kind === 'trim' ? trims : samplers;
    const prefix = kind === 'fabric' ? 'FAB' : kind === 'trim' ? 'TRM' : 'SMP';
    const max = list.reduce((m, x) => Math.max(m, Number(x.id.split('-')[1]) || 0), 0);
    return `${prefix}-${max + 1}`;
  };
  return <div className={pageClass}>
      <PageHeader title="Inventory" actions={canAdd ? <Button size="lg" icon={<PlusIcon className="h-5 w-5" />} onClick={() => setAdding(true)}>Add item</Button> : undefined} />
      <AddInventoryItemModal open={adding} initialKind={kindForTab[tab]} nextId={nextId} onClose={() => setAdding(false)} onAdd={(item) => {
      if (item.kind === 'fabric') setFabrics((p) => [item.data, ...p]);else if (item.kind === 'trim') setTrims((p) => [item.data, ...p]);else setSamplers((p) => [item.data, ...p]);
      setTab(tabForKind[item.kind]);
      setQ('');
      setCat('All');
    }} />
      {low.length > 0 && <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-attention-soft px-5 py-4">
          <AlertTriangleIcon className="h-5 w-5 text-attention" />
          <p className="flex-1 text-[15px]"><span className="font-semibold">{low.length} items below reorder level:</span> <span className="text-ink-muted">{low.join(', ')}</span></p>
          <Button variant="secondary" onClick={() => toast.success('Purchase requests raised with suppliers')}>Reorder all</Button>
        </div>}
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{
      key: 'fabrics',
      label: 'Fabrics & swatches',
      count: fabrics.length
    }, {
      key: 'trims',
      label: 'Trims & construction',
      count: trims.length
    }, {
      key: 'embroidery',
      label: 'Embroidery samplers',
      count: samplers.length
    }]} />
      <div className="relative my-5 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or SKU" className={`${inputClass} pl-12`} aria-label="Search inventory" />
      </div>

      {tab === 'fabrics' && (() => {
        const rows = fabrics.filter((f) => `${f.id} ${f.type} ${f.name}`.toLowerCase().includes(s));
        if (rows.length === 0) return <div className={cn(panelClass, 'px-5 py-16 text-center')}>
            <p className="text-[15px] font-medium text-ink-muted">{fabrics.length === 0 ? 'No fabrics yet' : 'No fabrics match your search.'}</p>
            {canAdd && fabrics.length === 0 && <Button className="mt-4" icon={<PlusIcon className="h-5 w-5" />} onClick={() => setAdding(true)}>Add item</Button>}
          </div>;
        return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((f) => {
        const out = f.stock === 0;
        const lowS = !out && f.stock < f.reorderLevel;
        return <article key={f.id} className={cn(panelClass, 'flex flex-col overflow-hidden', q && f.id.toLowerCase() === s && 'ring-2 ring-brand')}>
                <div className="flex flex-1 flex-col p-4">
                  {/* Header: name & meta · QR — same height on every card */}
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[15px]">
                        <span className="truncate font-medium">{f.id}</span>
                        {out ? <Badge tone="critical">Out</Badge> : lowS ? <Badge tone="attention">Low</Badge> : null}
                      </p>
                      <p className="truncate text-sm text-ink-muted">{f.supplier}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white p-0.5 ring-1 ring-inset ring-line"><QrGlyph value={f.id} size={40} /></span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-baseline justify-between text-sm"><span className="text-ink-muted">Stock</span><span className="tabular"><span className={cn('font-semibold', out ? 'text-critical' : lowS ? 'text-attention' : 'text-ink')}>{f.stock} m</span> <span className="text-ink-muted">/ reorder at {f.reorderLevel} m</span></span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken"><div className={cn('h-full rounded-full', out ? 'bg-critical' : lowS ? 'bg-attention' : 'bg-success')} style={{
                  width: `${Math.min(100, f.stock / (f.reorderLevel * 3) * 100)}%`
                }} /></div>
                  </div>

                  {/* Footer pinned to the bottom so every card's rows line up */}
                  <div className="min-h-5 flex-1" aria-hidden />
                  <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
                    <dl className="flex gap-8 text-sm">
                      <div><dt className="text-ink-muted">Selling</dt><dd className="font-medium tabular">{inr(f.pricePerM)}/m</dd></div>
                      <div><dt className="text-ink-muted">Used (30d)</dt><dd className="font-medium tabular">{f.usage30d} m</dd></div>
                    </dl>
                    {out || lowS ? <Button variant="secondary" size="sm" onClick={() => toast.success(`Reorder raised with ${f.supplier}`)}>Reorder</Button> : <span className="h-9" aria-hidden />}
                  </div>
                </div>
              </article>;
      })}
        </div>;
      })()}

      {tab === 'trims' && <>
          <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
            {trimCats.map((c) => <button key={c} onClick={() => setCat(c)} className={chipClass(cat === c)}>{c}</button>)}
          </div>
          <div className={panelClass}>
            <div className="hidden grid-cols-[minmax(0,1.6fr)_100px_120px_110px_110px_110px] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid">
              <span>Item</span><span>Category</span><span>Stock</span><span>Location</span><span>Cost</span><span>Price</span>
            </div>
            <ul className="divide-y divide-line">
              {(() => {
                const rows = trims.filter((t) => (cat === 'All' || t.category === cat) && `${t.id} ${t.name}`.toLowerCase().includes(s));
                if (rows.length === 0) return <li className="px-5 py-16 text-center">
                    <p className="text-[15px] font-medium text-ink-muted">{trims.length === 0 ? 'No trims yet' : 'Nothing matches.'}</p>
                    {canAdd && trims.length === 0 && <Button className="mt-4" onClick={() => setAdding(true)}>Add item</Button>}
                  </li>;
                return rows.map((t) => {
            const lowT = t.stock < t.reorderLevel;
            return <li key={t.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1.6fr)_100px_120px_110px_110px_110px] lg:items-center">
                    <div className="flex items-center gap-3">
                      <QrGlyph value={t.id} size={36} />
                      <div>
                        <p className="text-[15px] font-medium">{t.name}</p>
                        <p className="text-sm text-ink-subtle">{t.id} · {t.supplier}</p>
                      </div>
                    </div>
                    <span className="hidden text-[15px] text-ink-muted lg:block">{t.category}</span>
                    <span className={cn('text-right text-[15px] tabular lg:text-left', lowT && 'font-semibold text-attention')}>{t.stock} {t.unit}{lowT && ' · low'}</span>
                    <span className="hidden text-[15px] text-ink-muted lg:block">{t.location}</span>
                    <span className="hidden text-[15px] tabular lg:block">{inr(t.cost)}</span>
                    <span className="hidden text-[15px] tabular lg:block">{inr(t.price)}</span>
                  </li>;
          });
              })()}
            </ul>
          </div>
        </>}

      {tab === 'embroidery' && (() => {
        const rows = samplers.filter((x) => `${x.id} ${x.name}`.toLowerCase().includes(s));
        if (rows.length === 0) return <div className={cn(panelClass, 'px-5 py-16 text-center')}>
            <p className="text-[15px] font-medium text-ink-muted">{samplers.length === 0 ? 'No embroidery samplers yet' : 'Nothing matches.'}</p>
            {canAdd && samplers.length === 0 && <Button className="mt-4" onClick={() => setAdding(true)}>Add item</Button>}
          </div>;
        return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((x) => <article key={x.id} className={cn(panelClass, 'overflow-hidden')}>
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="text-[16px] font-semibold">{x.name}</p>
                  <p className="text-sm text-ink-subtle">{x.id} · {x.technique} · {inr(x.price)}</p>
                </div>
                <QrGlyph value={x.id} size={44} />
              </div>
            </article>)}
        </div>;
      })()}
    </div>;
}