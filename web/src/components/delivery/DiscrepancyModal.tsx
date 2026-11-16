import React, { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { usePackages } from '../../contexts/PackagesContext';
import type { Discrepancy, PackageRecord } from '../../types/packaging';
import { cn } from '../../utils/cn';
import { itemQty } from '../../utils/packages';
import { textareaClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Segmented';

/** Store: pick what's missing or damaged in a delivered package and tell Logistics. */
export function DiscrepancyModal({
  p,
  onClose



}: {p: PackageRecord | null;onClose: () => void;}) {
  const {
    raiseDiscrepancy
  } = usePackages();
  const [ids, setIds] = useState<string[]>([]);
  const [issue, setIssue] = useState<Discrepancy['issue']>('Missing');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (p) {
      setIds([]);
      setIssue('Missing');
      setNote('');
    }
  }, [p]);
  const toggle = (id: string) => setIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  return <Modal open={!!p} onClose={onClose} title="Raise discrepancy" footer={<>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="danger" disabled={!ids.length} onClick={() => {
      if (p) raiseDiscrepancy(p.id, {
        itemIds: ids,
        issue,
        note: note.trim()
      });
      onClose();
    }}>Send to Logistics</Button>
    </>}>
      {p && <div className="space-y-5">
          <Segmented<Discrepancy['issue']> ariaLabel="Issue" fullWidth value={issue} onChange={setIssue} options={[{
        value: 'Missing',
        label: 'Missing'
      }, {
        value: 'Damaged',
        label: 'Damaged'
      }]} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink-muted">Which items?</legend>
            <ul className="space-y-2">
              {p.items.map((i) => {
            const on = ids.includes(i.garmentId);
            return <li key={i.garmentId}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(i.garmentId)} className={cn('flex min-h-[56px] w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left ring-1 ring-inset transition-colors duration-150 ease-out', on ? 'bg-critical-soft ring-critical/30' : 'bg-surface ring-line hover:bg-canvas')}>
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2', on ? 'border-critical bg-critical text-white' : 'border-line-strong')} aria-hidden>
                        {on && <CheckIcon className="h-4 w-4" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{i.label}</span>
                      <span className="shrink-0 tabular text-ink-muted">×{itemQty(i)}</span>
                    </button>
                  </li>;
          })}
            </ul>
          </fieldset>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-muted">Note</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={textareaClass} placeholder="e.g. Dupatta not in the box" />
          </label>
        </div>}
    </Modal>;
}