import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownIcon, ArrowUpIcon, CheckCircle2Icon, ChevronDownIcon, CopyIcon, Trash2Icon, UploadIcon, XIcon } from 'lucide-react';
import { categories, categoryDef, liningFabrics, liveCategories, liveSubs, measurementsFor, type SubCategoryDef } from '../../../data/catalog';
import { useConfirm } from '../../../hooks/useConfirm';
import { trims } from '../../../data/inventory';
import { garmentIssue, needsFabric, type NewOrderState } from '../../../hooks/useNewOrder';
import type { Garment } from '../../../types';
import { cn } from '../../../utils/cn';
import { inr } from '../../../utils/format';
import { garmentBreakdown } from '../../../utils/pricing';
import { inputClass, textareaClass } from '../../../utils/styles';
import { AttachmentsSection } from './AttachmentsSection';
import { ColourPicker } from './ColourPicker';
import { DesignSection } from './DesignSection';
import { FabricSection } from './FabricSection';
import { MeasurementsSection } from './MeasurementsSection';
import { Segmented } from '../../ui/Segmented';

/** Everything about one garment — what it is, design, attachments, fabric, colour, measurements — in one expandable card. */
export function GarmentCard({
  o,
  g,
  index,
  open,
  onToggle,
  onDuplicate







}: {o: NewOrderState;g: Garment;index: number;open: boolean;onToggle: () => void;onDuplicate: () => void;}) {
  const { confirm, dialog } = useConfirm();
  const total = o.garments.length;
  const cat = categoryDef(g.category) ?? liveCategories()[0] ?? categories[0];
  const picked = cat.subCategories.find((s) => s.name === g.subCategory && !s.deletedAt) ?? cat.subCategories.find((s) => s.name === g.subCategory);
  const legacy = !!g.subCategory && !picked;
  const issue = garmentIssue(g, index + 1);
  const b = garmentBreakdown(g);
  const id = (k: string) => `${g.id}-${k}`;
  const attachTotal = g.attachments.reduce((s, a) => s + (trims.find((t) => t.id === a.trimId)?.price ?? 0) * a.qty, 0);
  const fields = [...measurementsFor(g.category, g.subCategory), ...(g.extraMeasurements ?? [])];
  const measured = fields.filter((f) => g.measurements[f] !== undefined).length;
  return <section className="overflow-hidden rounded-2xl border border-line bg-surface" aria-labelledby={id('h')}>
      {dialog}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold tabular text-ink-muted">{index + 1}</span>
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="min-w-0">
            <span id={id('h')} className={cn('block truncate text-[16px] font-semibold', !g.subCategory && 'text-ink-muted')}>{g.subCategory || 'Choose a sub-category'}</span>
            <span className="block truncate text-sm text-ink-muted">
              {cat.name}
              {g.subCategory && <> · <span className="tabular">{inr(b.total)}</span></>}
              {!open && (issue ? <span className="text-attention"> · {issue.split(': ').slice(1).join(': ') || issue}</span> : <span className="text-success"> · Ready</span>)}
            </span>
          </span>
          <ChevronDownIcon className={cn('h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-150 ease-out', !open && '-rotate-90')} />
        </button>
        {!issue && <CheckCircle2Icon className="h-5 w-5 shrink-0 text-success" aria-label="Complete" />}
        <div className="flex items-center">
          <IconBtn label="Move up" disabled={index === 0} onClick={() => o.moveGarment(g.id, -1)}><ArrowUpIcon className="h-4 w-4" /></IconBtn>
          <IconBtn label="Move down" disabled={index === total - 1} onClick={() => o.moveGarment(g.id, 1)}><ArrowDownIcon className="h-4 w-4" /></IconBtn>
          <IconBtn label="Duplicate" onClick={onDuplicate}><CopyIcon className="h-4 w-4" /></IconBtn>
          <IconBtn label="Remove" danger disabled={total === 1} onClick={() => void confirm({
            title: `Remove garment ${index + 1}?`,
            description: 'It comes off this order. The other garments stay.',
          }).then((yes) => { if (yes) o.removeGarment(g.id); })}><Trash2Icon className="h-4 w-4" /></IconBtn>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.22,
        ease: [0.23, 1, 0.32, 1]
      }} className="overflow-hidden">
            <Part title="Garment">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
                <Label htmlFor={id('cat')} text="Category">
                  <select id={id('cat')} value={g.category} onChange={(e) => o.setCategory(g.id, e.target.value)} className={inputClass}>
                    {(!categoryDef(g.category) || cat.deletedAt) && <option value={g.category}>{cat.code}. {cat.name}</option>}
                    {liveCategories().map((c) => <option key={c.name} value={c.name}>{c.code}. {c.name}</option>)}
                  </select>
                </Label>
                <Label htmlFor={id('sub')} text="Sub-category">
                  <select id={id('sub')} value={g.subCategory} onChange={(e) => o.setSubCategory(g.id, e.target.value)} className={cn(inputClass, !g.subCategory && 'text-ink-subtle')} aria-invalid={!g.subCategory}>
                    <option value="" disabled>Choose…</option>
                    {legacy && <option value={g.subCategory}>{g.subCategory}</option>}
                    {grouped(liveSubs(cat.subCategories).concat(picked?.deletedAt ? [picked] : [])).map(([group, subs]) => group ? <optgroup key={group} label={group}>
                          {subs.map((s) => <option key={s.name} value={s.name}>{optionText(s)}</option>)}
                        </optgroup> : subs.map((s) => <option key={s.name} value={s.name}>{optionText(s)}</option>))}
                  </select>
                  {picked?.remark && <p className="mt-1.5 text-sm text-ink-muted">{picked.remark}</p>}
                </Label>
                <Label text="Price">
                  <div className={cn('flex h-12 items-center rounded-xl px-4 text-[16px] font-semibold tabular', g.price !== undefined ? 'bg-brand-soft text-brand-hover' : 'bg-sunken text-ink-muted')} aria-live="polite">
                    {g.price !== undefined ? inr(g.price) : 'Auto'}
                  </div>
                </Label>
              </div>
              <textarea rows={2} value={g.notes} onChange={(e) => o.updateGarment(g.id, {
            notes: e.target.value
          })} className={textareaClass} placeholder="Notes: silhouette, neckline, fit" aria-label="Notes for this garment" />
              <ReferenceUpload photos={g.photos} onChange={(photos) => o.updateGarment(g.id, {
            photos
          })} />
            </Part>

            <Part title="Design" aside={b.embroidery > 0 ? inr(b.embroidery) : undefined}>
              <DesignSection o={o} g={g} />
            </Part>

            <Part title="Lining">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,240px)_minmax(0,280px)] sm:items-end">
                <Segmented<'yes' | 'no'> ariaLabel="Lining" fullWidth value={g.lining ? 'yes' : 'no'} onChange={(v) => o.updateGarment(g.id, {
              lining: v === 'yes',
              liningFabric: v === 'yes' ? g.liningFabric : undefined
            })} options={[{
              value: 'no',
              label: 'No'
            }, {
              value: 'yes',
              label: 'Yes'
            }]} />
                {g.lining && <Label htmlFor={id('lining')} text="Lining fabric">
                    <select id={id('lining')} value={g.liningFabric ?? ''} onChange={(e) => o.updateGarment(g.id, {
                liningFabric: e.target.value
              })} aria-invalid={o.blocked === 'garments' && !g.liningFabric} className={cn(inputClass, !g.liningFabric && 'text-ink-subtle', o.blocked === 'garments' && !g.liningFabric && 'border-critical')}>
                      <option value="" disabled>Choose…</option>
                      {liningFabrics.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Label>}
              </div>
            </Part>

            <Part title="Attachments" aside={attachTotal > 0 ? inr(attachTotal) : undefined}>
              <AttachmentsSection o={o} g={g} />
            </Part>

            {needsFabric(g) ? <>
                <Part title="Fabric & material" aside={b.fabric > 0 ? inr(b.fabric) : undefined}>
                  <FabricSection o={o} g={g} />
                </Part>
                <Part title="Colour" aside={g.fabric.colourHex ? <span className="flex items-center gap-2"><span className="h-4 w-4 rounded ring-1 ring-inset ring-black/10" style={{
              backgroundColor: g.fabric.colourHex
            }} />{g.fabric.colourName ?? g.fabric.colourHex}</span> : undefined}>
                  <ColourPicker fabric={g.fabric} onChange={(patch) => o.updateGarment(g.id, (x) => ({
              ...x,
              fabric: {
                ...x.fabric,
                ...patch
              }
            }))} />
                </Part>
              </> : <Part title="Fabric & material"><p className="text-[15px] text-ink-muted">Done on the customer’s own garment.</p></Part>}

            <Part title="Measurements" aside={fields.length ? `${measured} of ${fields.length}` : undefined}>
              <MeasurementsSection o={o} g={g} />
            </Part>
          </motion.div>}
      </AnimatePresence>
    </section>;
}
function Part({
  title,
  aside,
  children




}: {title: string;aside?: React.ReactNode;children: React.ReactNode;}) {
  return <div className="space-y-4 border-t border-line px-4 py-5 md:px-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {aside && <span className="text-sm font-medium tabular text-ink-muted">{aside}</span>}
      </div>
      {children}
    </div>;
}
const optionText = (s: SubCategoryDef) => `${s.name} — ${inr(s.basePrice)}${s.remark ? ` · ${s.remark}` : ''}`;

/** Sub-categories grouped under their heading (e.g. "Skirts") for the dropdown. */
function grouped(subs: SubCategoryDef[]): [string | null, SubCategoryDef[]][] {
  const out: [string | null, SubCategoryDef[]][] = [];
  for (const s of subs) {
    const key = s.group ?? null;
    const last = out[out.length - 1];
    if (last && last[0] === key) last[1].push(s);else out.push([key, [s]]);
  }
  return out;
}
function Label({
  text,
  htmlFor,
  children




}: {text: string;htmlFor?: string;children: React.ReactNode;}) {
  return <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-ink-muted">{text}</label>
      {children}
    </div>;
}

/** Compact dashed drop zone for reference photos. */
function ReferenceUpload({
  photos,
  onChange



}: {photos: string[];onChange: (p: string[]) => void;}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const read = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).filter((f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024).forEach((f) => {
      const r = new FileReader();
      r.onload = () => onChange([...photos, String(r.result)]);
      r.readAsDataURL(f);
    });
  };
  return <div onDragOver={(e) => {
    e.preventDefault();
    setOver(true);
  }} onDragLeave={() => setOver(false)} onDrop={(e) => {
    e.preventDefault();
    setOver(false);
    read(e.dataTransfer.files);
  }} className={cn('flex flex-wrap items-center gap-3 rounded-xl border border-dashed px-3 py-3 transition-colors duration-150 ease-out', over ? 'border-brand bg-brand-soft' : 'border-line-strong')}>
      {photos.map((p, i) => <span key={i} className="relative h-14 w-14 overflow-hidden rounded-lg ring-1 ring-line">
          <img src={p} alt={`Reference ${i + 1}`} className="h-full w-full object-cover" />
          <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} aria-label={`Remove reference ${i + 1}`} className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
            <XIcon className="h-3 w-3" />
          </button>
        </span>)}
      <button type="button" onClick={() => input.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-sunken px-3 text-sm font-medium hover:bg-line">
        <UploadIcon className="h-4 w-4" /> Reference images
      </button>
      <span className="text-sm text-ink-muted">or drop them here</span>
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => {
      read(e.target.files);
      e.target.value = '';
    }} />
    </div>;
}
function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children






}: {label: string;onClick: () => void;disabled?: boolean;danger?: boolean;children: React.ReactNode;}) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 ease-out hover:bg-sunken disabled:pointer-events-none disabled:text-line-strong', danger ? 'hover:text-critical' : 'hover:text-ink')}>
      {children}
    </button>;
}