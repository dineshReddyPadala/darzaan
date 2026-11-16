import React, { useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { measurementUnit } from '../../../data/catalog';
import { useConfirm } from '../../../hooks/useConfirm';
import { inputClass } from '../../../utils/styles';
import { AddBar, AddField } from './AddBar';

interface MeasurementFieldListProps {
  fields: string[];
  onChange: (fields: string[]) => void;
}

/** The numbers taken for a category — a searchable two-column list instead of a wall of chips. */
export function MeasurementFieldList({ fields, onChange }: MeasurementFieldListProps) {
  const [query, setQuery] = useState('');
  const [newField, setNewField] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? fields.filter((f) => f.toLowerCase().includes(q)) : fields;
  const { confirm, dialog } = useConfirm();
  const taken = fields.some((f) => f.toLowerCase() === newField.trim().toLowerCase());
  const remove = (field: string) => void confirm({
    title: `Remove ${field}?`,
    description: 'New orders will no longer ask for it. Measurements already saved on an order stay there.',
  }).then((yes) => {
    if (yes) onChange(fields.filter((item) => item !== field));
  });
  const add = () => {
    if (!newField.trim() || taken) return;
    onChange([...fields, newField.trim()]);
    setNewField('');
  };

  return <div>
      {dialog}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <div className="relative min-w-0 flex-1 basis-56">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search measurements" aria-label="Search measurements" className={`${inputClass} h-10 pl-9`} />
        </div>
        <span className="text-sm tabular text-ink-subtle">{q ? `${shown.length} of ${fields.length}` : `${fields.length} required`}</span>
      </div>
      {shown.length === 0 ? <p className="px-5 py-8 text-center text-sm text-ink-muted">{q ? `Nothing matches “${query}”.` : 'This category takes no measurements.'}</p> : <ul className="grid sm:grid-cols-2">
          {shown.map((f) => <li key={f} className="flex min-h-12 items-center gap-3 border-b border-line px-5 sm:odd:border-r">
              <span className="min-w-0 flex-1 truncate text-[15px]">{f}</span>
              <span className="text-xs text-ink-subtle">{measurementUnit(f)}</span>
              <button type="button" onClick={() => remove(f)} aria-label={`Remove ${f}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-subtle hover:bg-sunken hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <XIcon className="h-4 w-4" />
              </button>
            </li>)}
        </ul>}
      <AddBar onSubmit={add} disabled={!newField.trim() || taken} error={taken ? `“${newField.trim()}” is already on this chart.` : undefined}>
        <AddField label="New measurement">
          <input value={newField} onChange={(e) => setNewField(e.target.value)} placeholder="e.g. Dori length" className={`${inputClass} h-10`} />
        </AddField>
      </AddBar>
    </div>;
}