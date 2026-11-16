import React, { useEffect, useState } from 'react';
import type { PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

/** Packing exception: which items aren't here, plus a short note. Puts the order on hold. */
export function ReportMissingModal({
  p,
  open,
  onClose,
  onSubmit





}: {p: PackageRecord;open: boolean;onClose: () => void;onSubmit: (itemIds: string[], note: string) => void;}) {
  const unchecked = p.items.filter((i) => !(p.checked ?? []).includes(i.garmentId));
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) {
      setPicked(unchecked.length === 1 ? [unchecked[0].garmentId] : []);
      setNote('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setPicked((x) => x.includes(id) ? x.filter((y) => y !== id) : [...x, id]);
  return <Modal open={open} onClose={onClose} title="Report missing item" footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="danger" disabled={!picked.length} onClick={() => onSubmit(picked, note.trim())}>Put order on hold</Button>
    </>}>
      <div className="space-y-4">
        <ul className="space-y-2">
          {unchecked.map((i) => <li key={i.garmentId}>
              <label className={cn('flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl px-4 py-2 ring-1 ring-inset transition-colors duration-150 ease-out', picked.includes(i.garmentId) ? 'bg-critical-soft ring-critical/40' : 'ring-line hover:bg-canvas')}>
                <input type="checkbox" checked={picked.includes(i.garmentId)} onChange={() => toggle(i.garmentId)} className="h-5 w-5 accent-critical" />
                <span className="text-[15px] font-medium">{i.label}</span>
              </label>
            </li>)}
        </ul>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Short note, e.g. still at the store" aria-label="Note" className={cn(inputClass, 'h-auto py-3')} />
      </div>
    </Modal>;
}