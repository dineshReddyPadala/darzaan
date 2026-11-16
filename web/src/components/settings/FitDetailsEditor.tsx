import React, { useState } from 'react';
import { ChevronDownIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import type { DetailDef } from '../../data/catalog';
import { useConfirm } from '../../hooks/useConfirm';
import { cn } from '../../utils/cn';
import { inputClass } from '../../utils/styles';
import { Button } from '../ui/Button';
import { AddBar, AddField } from './catalog/AddBar';

type Kind = DetailDef['kind'];
interface FitDetailsEditorProps {
  details: DetailDef[];
  onChange: (details: DetailDef[]) => void;
}

const kindLabels: Record<Kind, string> = { yesno: 'Yes / No', choice: 'Pick one', note: 'Written note' };
const summary = (d: DetailDef) => d.kind === 'choice' ? d.options.join(' · ') || 'No options yet' : kindLabels[d.kind];
export const fitDetailInvalid = (d?: DetailDef) => !!d && (!d.name.trim() || d.kind === 'choice' && d.options.length < 2);

/** Fit details as a compact list: one line each, tap a row to edit it. Only one row is open at a time. */
export function FitDetailsEditor({ details, onChange }: FitDetailsEditorProps) {
  const { confirm, dialog } = useConfirm();
  const [openIndex, setOpen] = useState<number | null>(null);
  const [optionDraft, setOptionDraft] = useState('');
  // The list can shrink underneath us (Discard, remove) — never point past the end.
  const open = openIndex !== null && openIndex < details.length ? openIndex : null;

  const replace = (i: number, next: DetailDef) => onChange(details.map((d, j) => j === i ? next : d));
  const toggle = (i: number) => {
    setOpen(open === i ? null : i);
    setOptionDraft('');
  };
  const changeKind = (i: number, kind: Kind) => {
    const d = details[i];
    replace(i, kind === 'choice' ? { name: d.name, kind, options: d.kind === 'choice' ? d.options : [] } : { name: d.name, kind });
  };
  const addOption = (i: number) => {
    const d = details[i];
    const value = optionDraft.trim();
    if (d.kind !== 'choice' || !value || d.options.some((o) => o.toLowerCase() === value.toLowerCase())) return;
    replace(i, { ...d, options: [...d.options, value] });
    setOptionDraft('');
  };
  const remove = (i: number) => void confirm({
    title: `Delete ${details[i].name || 'this detail'}?`,
    description: 'It will leave the fit list. Orders already taken keep their answers.',
  }).then((yes) => {
    if (!yes) return;
    onChange(details.map((d, j) => j === i ? { ...d, deletedAt: new Date().toISOString() } : d));
    setOpen(null);
  });
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<Kind>('yesno');
  const newTaken = details.some((d) => !d.deletedAt && d.name.trim().toLowerCase() === newName.trim().toLowerCase());
  const live = details.map((d, i) => ({ d, i })).filter(({ d }) => !d.deletedAt);
  const addNew = () => {
    onChange([...details, newKind === 'choice' ? { name: newName.trim(), kind: 'choice', options: [] } : { name: newName.trim(), kind: newKind }]);
    // A pick-one detail still needs its options, so open it straight away.
    setOpen(newKind === 'choice' ? details.length : null);
    setNewName('');
    setNewKind('yesno');
  };

  return <div>
      {dialog}
      {live.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">No fit details for this category.</p>}
      <ul className="divide-y divide-line">
        {live.map(({ d, i }) => {
        const isOpen = open === i;
        const invalid = fitDetailInvalid(d);
        return <li key={i} className={cn(isOpen && 'bg-canvas')}>
              <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen} className="flex min-h-12 w-full items-center gap-3 px-5 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
                <span className={cn('min-w-0 flex-1 truncate text-[15px]', d.name ? 'text-ink' : 'italic text-ink-subtle')}>{d.name || 'Untitled detail'}</span>
                <span className={cn('max-w-[45%] truncate text-sm', invalid ? 'text-critical' : 'text-ink-subtle')}>{invalid ? 'Needs attention' : summary(d)}</span>
                <ChevronDownIcon className={cn('h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-150 ease-out', isOpen && 'rotate-180')} aria-hidden />
              </button>
              {isOpen && <div className="space-y-4 px-5 pb-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-ink-muted">Name</span>
                      <input autoFocus={!d.name} value={d.name} onChange={(e) => replace(i, { ...d, name: e.target.value })} aria-invalid={!d.name.trim()} className={cn(inputClass, 'h-10', !d.name.trim() && 'border-critical')} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-ink-muted">Answer</span>
                      <select value={d.kind} onChange={(e) => changeKind(i, e.target.value as Kind)} className={`${inputClass} h-10`}>
                        {(Object.keys(kindLabels) as Kind[]).map((k) => <option key={k} value={k}>{kindLabels[k]}</option>)}
                      </select>
                    </label>
                  </div>
                  {d.kind === 'choice' && <div>
                      <span className="mb-1.5 block text-sm font-medium text-ink-muted">Options</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {d.options.map((o) => <span key={o} className="inline-flex h-9 items-center gap-1 rounded-full bg-surface pl-3.5 pr-1 text-sm ring-1 ring-inset ring-line">
                            {o}
                            <button type="button" onClick={() => replace(i, { ...d, options: d.options.filter((x) => x !== o) })} aria-label={`Remove option ${o}`} className="flex h-7 w-7 items-center justify-center rounded-full text-ink-subtle hover:bg-sunken hover:text-ink"><XIcon className="h-3.5 w-3.5" /></button>
                          </span>)}
                        <form className="flex items-center gap-1" onSubmit={(e) => {
                  e.preventDefault();
                  addOption(i);
                }}>
                          <input value={optionDraft} onChange={(e) => setOptionDraft(e.target.value)} placeholder="Add option" aria-label={`Add option to ${d.name}`} className={`${inputClass} h-9 w-36 text-sm`} />
                          <button type="submit" aria-label="Add option" disabled={!optionDraft.trim()} className="flex h-9 w-9 items-center justify-center rounded-full text-brand hover:bg-brand-soft disabled:text-line-strong"><PlusIcon className="h-4 w-4" /></button>
                        </form>
                      </div>
                      {d.options.length < 2 && <p className="mt-1.5 text-sm text-critical">Add at least 2 options so staff have a choice.</p>}
                    </div>}
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="text-critical hover:bg-critical-soft hover:text-critical" icon={<Trash2Icon className="h-4 w-4" />} onClick={() => remove(i)}>Remove detail</Button>
                    <Button variant="secondary" size="sm" disabled={invalid} onClick={() => setOpen(null)}>Done</Button>
                  </div>
                </div>}
            </li>;
      })}
      </ul>
      <AddBar onSubmit={addNew} disabled={!newName.trim() || newTaken} error={newTaken ? `“${newName.trim()}” is already on this list.` : undefined}>
        <AddField label="New fit detail">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Tassels on dori" className={`${inputClass} h-10`} />
        </AddField>
        <AddField label="Answer" className="w-40">
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as Kind)} className={`${inputClass} h-10`}>
            {(Object.keys(kindLabels) as Kind[]).map((k) => <option key={k} value={k}>{kindLabels[k]}</option>)}
          </select>
        </AddField>
      </AddBar>
    </div>;
}