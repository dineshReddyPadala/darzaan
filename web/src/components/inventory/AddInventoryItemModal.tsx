import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { samplers } from '../../data/catalog';
import type { Fabric, Trim } from '../../data/inventory';
import { cn } from '../../utils/cn';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { QrGlyph } from '../ui/QrGlyph';
import { Segmented } from '../ui/Segmented';
export type ItemKind = 'fabric' | 'trim' | 'sampler';
export type Sampler = (typeof samplers)[number];
const trimCategories: Trim['category'][] = ['Border', 'Lace', 'Buttons', 'Tassels', 'Zips', 'Hooks', 'Pads', 'Boning'];
const swatchColors = ['#7E2338', '#B8954A', '#3F5D74', '#5C6E3A', '#8C3B4A', '#C5A253', '#2F4A3A', '#D9CBB0', '#1F2A44', '#7D7A75'];
interface Props {
  open: boolean;
  initialKind: ItemKind;
  nextId: (kind: ItemKind) => string;
  onClose: () => void;
  onAdd: (item: {
    kind: 'fabric';
    data: Fabric;
  } | {
    kind: 'trim';
    data: Trim;
  } | {
    kind: 'sampler';
    data: Sampler;
  }) => void;
}
const blank = {
  name: '',
  type: '',
  category: 'Border' as Trim['category'],
  unit: 'pcs',
  technique: 'Hand' as 'Hand' | 'Machine',
  color: swatchColors[0],
  stock: '',
  reorder: '',
  cost: '',
  price: '',
  location: '',
  supplier: ''
};
export function AddInventoryItemModal({
  open,
  initialKind,
  nextId,
  onClose,
  onAdd
}: Props) {
  const [kind, setKind] = useState<ItemKind>(initialKind);
  const [f, setF] = useState(blank);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setKind(initialKind);
      setF(blank);
      setTried(false);
    }
  }, [open, initialKind]);
  const set = (patch: Partial<typeof blank>) => setF((p) => ({
    ...p,
    ...patch
  }));
  const id = nextId(kind);
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const missing = !f.name.trim() || !f.price || kind === 'fabric' && !f.type.trim() || kind !== 'sampler' && (!f.stock || !f.supplier.trim()) || kind === 'trim' && !f.location.trim();
  const save = () => {
    setTried(true);
    if (missing) return;
    if (kind === 'fabric') {
      onAdd({
        kind,
        data: {
          id,
          name: f.name.trim(),
          type: f.type.trim(),
          color: f.color,
          pricePerM: num(f.price),
          stock: num(f.stock),
          reorderLevel: num(f.reorder),
          location: f.location.trim(),
          supplier: f.supplier.trim(),
          usage30d: 0
        }
      });
    } else if (kind === 'trim') {
      onAdd({
        kind,
        data: {
          id,
          name: f.name.trim(),
          category: f.category,
          unit: f.unit.trim() || 'pcs',
          price: num(f.price),
          cost: num(f.cost),
          stock: num(f.stock),
          reorderLevel: num(f.reorder),
          location: f.location.trim(),
          supplier: f.supplier.trim()
        }
      });
    } else {
      onAdd({
        kind,
        data: {
          id,
          name: f.name.trim(),
          technique: f.technique,
          price: num(f.price),
          color: f.color
        }
      });
    }
    toast.success(`${f.name.trim()} added`, {
      description: `${id} · QR label ready to print`
    });
    onClose();
  };
  const err = (bad: boolean) => cn(inputClass, tried && bad && 'border-critical focus:border-critical focus:ring-critical/20');
  return <Modal open={open} onClose={onClose} size="lg" title="Add inventory item" description="A SKU and QR label are generated so the item can be scanned onto orders." footer={<>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Add item</Button>
        </>}>
      <div className="space-y-5">
        <Segmented fullWidth value={kind} onChange={(k) => {
        setKind(k);
        setTried(false);
      }} options={[{
        value: 'fabric',
        label: 'Fabric'
      }, {
        value: 'trim',
        label: 'Trim / construction'
      }, {
        value: 'sampler',
        label: 'Embroidery sampler'
      }]} />

        <div className="flex items-center gap-4 rounded-xl border border-line bg-canvas p-3">
          <QrGlyph value={id} size={48} />
          <div>
            <p className="font-mono text-sm font-medium">{id}</p>
            <p className="text-sm text-ink-muted">Assigned automatically</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <input value={f.name} onChange={(e) => set({
            name: e.target.value
          })} className={err(!f.name.trim())} placeholder={kind === 'fabric' ? 'Emerald' : kind === 'trim' ? 'Gold zari border 2"' : 'Chikankari Buti'} />
          </Field>
          {kind === 'fabric' && <Field label="Fabric type" required>
              <input value={f.type} onChange={(e) => set({
            type: e.target.value
          })} className={err(!f.type.trim())} placeholder="Raw Silk" />
            </Field>}
          {kind === 'trim' && <Field label="Category" required>
              <select value={f.category} onChange={(e) => set({
            category: e.target.value as Trim['category']
          })} className={inputClass}>
                {trimCategories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>}
          {kind === 'sampler' && <Field label="Technique" required>
              <Segmented fullWidth value={f.technique} onChange={(t) => set({
            technique: t
          })} options={[{
            value: 'Hand',
            label: 'Hand'
          }, {
            value: 'Machine',
            label: 'Machine'
          }]} />
            </Field>}
        </div>

        {kind !== 'trim' && <div>
            <p className="mb-1.5 text-sm font-medium text-ink-muted">Swatch colour</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Swatch colour">
              {swatchColors.map((c) => <button key={c} role="radio" aria-checked={f.color === c} aria-label={c} onClick={() => set({
            color: c
          })} className={cn('h-9 w-9 rounded-full ring-offset-2 ring-offset-surface', f.color === c ? 'ring-2 ring-ink' : 'ring-1 ring-line-strong')} style={{
            backgroundColor: c
          }} />)}
            </div>
          </div>}

        {kind !== 'sampler' && <div className="grid gap-4 sm:grid-cols-3">
            <Field label={kind === 'fabric' ? 'Stock (m)' : 'Stock'} required>
              <input inputMode="numeric" value={f.stock} onChange={(e) => set({
            stock: e.target.value.replace(/[^\d.]/g, '')
          })} className={err(!f.stock)} placeholder="0" />
            </Field>
            {kind === 'trim' && <Field label="Unit">
                <input value={f.unit} onChange={(e) => set({
            unit: e.target.value
          })} className={inputClass} placeholder="pcs / m / sets" />
              </Field>}
            <Field label="Reorder at" hint="Alert below this level">
              <input inputMode="numeric" value={f.reorder} onChange={(e) => set({
            reorder: e.target.value.replace(/[^\d.]/g, '')
          })} className={inputClass} placeholder="0" />
            </Field>
          </div>}

        <div className="grid gap-4 sm:grid-cols-2">
          {kind === 'trim' && <Field label="Cost (₹)">
              <input inputMode="numeric" value={f.cost} onChange={(e) => set({
            cost: e.target.value.replace(/\D/g, '')
          })} className={inputClass} placeholder="0" />
            </Field>}
          <Field label={kind === 'fabric' ? 'Selling price per metre (₹)' : kind === 'sampler' ? 'Embroidery price (₹)' : 'Selling price (₹)'} required>
            <input inputMode="numeric" value={f.price} onChange={(e) => set({
            price: e.target.value.replace(/\D/g, '')
          })} className={err(!f.price)} placeholder="0" />
          </Field>
        </div>

        {kind !== 'sampler' && <div className="grid gap-4 sm:grid-cols-2">
            {kind === 'trim' && <Field label="Location" required>
              <input value={f.location} onChange={(e) => set({
            location: e.target.value
          })} className={err(!f.location.trim())} placeholder="Bin T1" />
            </Field>}
            <Field label="Supplier" required>
              <input value={f.supplier} onChange={(e) => set({
            supplier: e.target.value
          })} className={err(!f.supplier.trim())} placeholder="Surat Silk House" />
            </Field>
          </div>}

        {tried && missing && <p className="text-sm font-medium text-critical">Fill in the required fields marked *.</p>}
      </div>
    </Modal>;
}