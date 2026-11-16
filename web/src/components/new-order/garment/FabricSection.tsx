import React from 'react';
import { toast } from 'sonner';
import { AlertTriangleIcon, CheckIcon, PackageIcon, PlusIcon, StoreIcon, Trash2Icon } from 'lucide-react';
import { fabrics } from '../../../data/inventory';
import type { NewOrderState } from '../../../hooks/useNewOrder';
import type { FabricPiece, FabricSelection, Garment } from '../../../types';
import { cn } from '../../../utils/cn';
import { inr, uid } from '../../../utils/format';
import { chipClass, inputClass, textareaClass } from '../../../utils/styles';
import { Button } from '../../ui/Button';
import { useConfirm } from '../../../hooks/useConfirm';
import { Field } from '../../ui/Field';
import { PhotoCapture } from '../../ui/PhotoCapture';
import { ScanQrPanel } from '../ScanQrPanel';
const materials = ['Silk', 'Raw silk', 'Banarasi', 'Chanderi', 'Georgette', 'Chiffon', 'Organza', 'Velvet', 'Cotton', 'Linen', 'Crepe', 'Net', 'Other'];
const conditions: NonNullable<FabricPiece['condition']>[] = ['New', 'Pre-washed', 'Has marks or flaws'];
const blankPiece = (): FabricPiece => ({
  id: uid('FP'),
  material: '',
  length: 2,
  unit: 'm',
  notes: '',
  condition: 'New'
});

/** Who supplies the fabric for this garment, and what it is. Lengths are in metres. */
export function FabricSection({
  o,
  g



}: {o: NewOrderState;g: Garment;}) {
  const setFabric = (patch: Partial<FabricSelection>) => o.updateGarment(g.id, (x) => ({
    ...x,
    fabric: {
      ...x.fabric,
      ...patch
    }
  }));
  return <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Fabric supplied by">
        <SourceCard on={g.fabric.source === 'Darzaan'} icon={<StoreIcon className="h-5 w-5" />} title="Darzaan fabric" onClick={() => setFabric({
        source: 'Darzaan'
      })} />
        <SourceCard on={g.fabric.source === 'Customer'} icon={<PackageIcon className="h-5 w-5" />} title="Customer’s fabric" onClick={() => setFabric({
        source: 'Customer',
        pieces: g.fabric.pieces.length ? g.fabric.pieces : [blankPiece()]
      })} />
      </div>
      {g.fabric.source === 'Darzaan' ? <DarzaanFabric g={g} setFabric={setFabric} /> : <CustomerFabric g={g} setFabric={setFabric} />}
    </div>;
}
function SourceCard({
  on,
  icon,
  title,
  onClick





}: {on: boolean;icon: React.ReactNode;title: string;onClick: () => void;}) {
  return <button type="button" role="radio" aria-checked={on} onClick={onClick} className={cn('flex h-14 items-center gap-3 rounded-xl px-4 text-left transition-[background-color,box-shadow] duration-150 ease-out', on ? 'bg-brand-soft ring-2 ring-brand' : 'bg-surface ring-1 ring-inset ring-line-strong hover:bg-canvas')}>
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', on ? 'bg-brand text-white' : 'bg-sunken text-ink-muted')}>{icon}</span>
      <span className="flex-1 text-[15px] font-semibold">{title}</span>
      {on && <CheckIcon className="h-5 w-5 text-brand" aria-hidden />}
    </button>;
}
function DarzaanFabric({
  g,
  setFabric



}: {g: Garment;setFabric: (p: Partial<FabricSelection>) => void;}) {
  const selected = fabrics.find((f) => f.id === g.fabric.fabricId);
  const scan = () => {
    const f = fabrics.find((x) => x.stock > 0 && x.id !== g.fabric.fabricId) ?? fabrics[0];
    setFabric({
      fabricId: f.id
    });
    toast.success(`Scanned swatch ${f.id} — ${f.type} ${f.name}`);
  };
  return <div className="space-y-4">
      <ScanQrPanel title="Scan swatch QR" hint="Scan the tag on the swatch." onScan={scan} picked={selected && {
      id: selected.id,
      name: `${selected.type} — ${selected.name}`,
      detail: `${inr(selected.pricePerM)}/m · ${selected.stock} m in stock`,
      color: selected.color
    }} fallback={<select value={g.fabric.fabricId ?? ''} onChange={(e) => setFabric({
      fabricId: e.target.value
    })} className={inputClass} aria-label="Choose a fabric">
            <option value="" disabled>Choose a fabric…</option>
            {fabrics.map((f) => <option key={f.id} value={f.id} disabled={f.stock === 0}>{f.id} · {f.type} {f.name} — {inr(f.pricePerM)}/m{f.stock === 0 ? ' · out of stock' : ''}</option>)}
          </select>} />
      {selected && <div className="flex flex-wrap items-end gap-4">
          <Field label="Length needed" className="w-40">
            <div className="relative">
              <input type="number" step={0.25} min={0.25} value={g.fabric.meters} onChange={(e) => setFabric({
            meters: Number(e.target.value)
          })} className={`${inputClass} pr-9 tabular`} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle">m</span>
            </div>
          </Field>
          <p className="ml-auto text-right">
            <span className="block text-sm text-ink-muted">Fabric cost</span>
            <span className="text-lg font-semibold tabular">{inr(selected.pricePerM * g.fabric.meters)}</span>
          </p>
          {g.fabric.meters > selected.stock && <p className="flex w-full items-center gap-2 text-sm font-medium text-critical"><AlertTriangleIcon className="h-4 w-4" /> Only {selected.stock} m available.</p>}
        </div>}
    </div>;
}
function CustomerFabric({
  g,
  setFabric



}: {g: Garment;setFabric: (p: Partial<FabricSelection>) => void;}) {
  const { confirm, dialog } = useConfirm();
  const pieces = g.fabric.pieces;
  const setPieces = (next: FabricPiece[]) => setFabric({
    pieces: next
  });
  const setPiece = (id: string, patch: Partial<FabricPiece>) => setPieces(pieces.map((p) => p.id === id ? {
    ...p,
    ...patch
  } : p));
  return <div className="space-y-4">
      {dialog}
      {pieces.map((p, i) => <div key={p.id} className="rounded-xl border border-line p-4">
          {pieces.length > 1 && <div className="mb-3 flex items-center justify-between">
              <p className="text-[15px] font-semibold">Piece {i + 1}</p>
              <button type="button" onClick={() => void confirm({
                title: `Remove piece ${i + 1}?`,
                description: 'This fabric piece comes off the garment.',
              }).then((yes) => { if (yes) setPieces(pieces.filter((x) => x.id !== p.id)); })} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-ink-muted hover:text-critical">
                <Trash2Icon className="h-4 w-4" /> Remove
              </button>
            </div>}
          <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
            <PhotoCapture photos={p.photo ? [p.photo] : []} onChange={(ph) => setPiece(p.id, {
          photo: ph[ph.length - 1]
        })} label="Photo" />
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Material">
                  <select value={materials.includes(p.material) ? p.material : ''} onChange={(e) => setPiece(p.id, {
                material: e.target.value
              })} className={inputClass}>
                    <option value="" disabled>Choose…</option>
                    {materials.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Length">
                  <div className="relative">
                    <input type="number" step={0.25} min={0} value={p.length} onChange={(e) => setPiece(p.id, {
                  length: Number(e.target.value),
                  unit: 'm'
                })} className={`${inputClass} pr-9 tabular`} />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-subtle">m</span>
                  </div>
                </Field>
                {p.material === 'Other' && <Field label="Describe the material" className="sm:col-span-2">
                    <input autoFocus value={p.materialDetail ?? ''} onChange={(e) => setPiece(p.id, {
                materialDetail: e.target.value
              })} placeholder="e.g. Tussar silk blend" className={inputClass} />
                  </Field>}
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-muted">Condition</p>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((c) => <button key={c} type="button" onClick={() => setPiece(p.id, {
                condition: c
              })} className={chipClass(p.condition === c)}>{c}</button>)}
                </div>
              </div>
              <textarea rows={2} value={p.notes} onChange={(e) => setPiece(p.id, {
            notes: e.target.value
          })} placeholder="Instructions for the workshop" aria-label="Instructions for the workshop" className={textareaClass} />
            </div>
          </div>
        </div>)}
      <Button variant="secondary" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setPieces([...pieces, {
      ...blankPiece(),
      length: 1
    }])}>Add another piece</Button>
    </div>;
}