import React, { useEffect, useState } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { inputClass } from '../../../utils/styles';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
interface Row {
  name: string;
  value: string;
}
const blank = (): Row => ({
  name: '',
  value: ''
});

/** Add one or more measurements that aren't on the standard list. Inches only. */
export function AddMeasurementModal({
  open,
  garmentName,
  taken,
  onClose,
  onSave










}: {open: boolean;garmentName: string; /** Names already on this garment — can't be added twice. */taken: string[];onClose: () => void;onSave: (rows: {name: string;value?: number;}[]) => void;}) {
  const [rows, setRows] = useState<Row[]>([blank()]);
  useEffect(() => {
    if (open) setRows([blank()]);
  }, [open]);
  const clean = rows.map((r) => ({
    name: r.name.trim(),
    value: r.value
  })).filter((r) => r.name);
  const dup = clean.find((r, i) => taken.some((t) => t.toLowerCase() === r.name.toLowerCase()) || clean.findIndex((x) => x.name.toLowerCase() === r.name.toLowerCase()) !== i);
  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => j === i ? {
    ...r,
    ...patch
  } : r));
  const save = () => {
    onSave(clean.map((r) => ({
      name: r.name,
      value: r.value === '' ? undefined : Number(r.value)
    })));
    onClose();
  };
  return <Modal open={open} onClose={onClose} title="Add measurements" description={garmentName} footer={<>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!clean.length || !!dup}>Add {clean.length > 1 ? `${clean.length} measurements` : 'measurement'}</Button>
        </>}>
      <div className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_140px_40px] gap-3 text-sm font-medium text-ink-muted">
          <span>Name</span>
          <span>Value</span>
          <span />
        </div>
        {rows.map((r, i) => <div key={i} className="grid grid-cols-[minmax(0,1fr)_140px_40px] items-center gap-3">
            <input autoFocus={i === rows.length - 1} value={r.name} onChange={(e) => set(i, {
          name: e.target.value
        })} placeholder="e.g. Armhole depth" className={inputClass} aria-label={`Measurement ${i + 1} name`} />
            <div className="relative">
              <input inputMode="decimal" value={r.value} onChange={(e) => set(i, {
            value: e.target.value.replace(/[^0-9.]/g, '')
          })} placeholder="—" className={`${inputClass} pr-9 tabular`} aria-label={`Measurement ${i + 1} value in inches`} />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">in</span>
            </div>
            <button type="button" onClick={() => setRows((rs) => rs.length > 1 ? rs.filter((_, j) => j !== i) : [blank()])} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-subtle hover:text-critical" aria-label={`Remove row ${i + 1}`}>
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>)}
        <button type="button" onClick={() => setRows((rs) => [...rs, blank()])} className="inline-flex h-10 items-center gap-1.5 text-[15px] font-medium text-brand hover:underline">
          <PlusIcon className="h-4 w-4" /> Another row
        </button>
        {dup && <p className="text-sm text-critical">“{dup.name}” is already on this garment.</p>}
      </div>
    </Modal>;
}