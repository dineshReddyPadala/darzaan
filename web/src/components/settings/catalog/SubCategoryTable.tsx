import React, { useState } from 'react';
import { SearchIcon, Trash2Icon } from 'lucide-react';
import { AddBar, AddField } from './AddBar';
import { liveSubs, type SubCategoryDef } from '../../../data/catalog';
import { useConfirm } from '../../../hooks/useConfirm';
import { inputClass } from '../../../utils/styles';
import { Button } from '../../ui/Button';

interface SubCategoryTableProps {
  items: SubCategoryDef[];
  onChange: (items: SubCategoryDef[]) => void;
}

const PAGE = 25;

/** Searchable, grouped price list for one category. Long lists load in pages. */
export function SubCategoryTable({ items, onChange }: SubCategoryTableProps) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const { confirm, dialog } = useConfirm();
  const q = query.trim().toLowerCase();
  const live = liveSubs(items);
  const indexed = items.map((s, i) => ({ s, i })).filter(({ s }) => !s.deletedAt);
  const matches = q ? indexed.filter(({ s }) => s.name.toLowerCase().includes(q) || s.group?.toLowerCase().includes(q) || s.remark?.toLowerCase().includes(q)) : indexed;
  const visible = matches.slice(0, limit);
  const taken = live.some((s) => s.name.toLowerCase() === newName.trim().toLowerCase());

  const setPrice = (i: number, raw: string) => onChange(items.map((s, j) => j === i ? { ...s, basePrice: Number(raw.replace(/\D/g, '')) || 0 } : s));
  const remove = (i: number) => void confirm({
    title: `Delete ${items[i].name}?`,
    description: 'It will leave this price list. Orders that already use it keep their price.',
  }).then((yes) => {
    if (yes) onChange(items.map((s, j) => j === i ? { ...s, deletedAt: new Date().toISOString() } : s));
  });
  const add = () => {
    if (!newName.trim() || taken) return;
    onChange([...items, { name: newName.trim(), basePrice: Number(newPrice) || items[0]?.basePrice || 0 }]);
    setNewName('');
    setNewPrice('');
  };

  return <div>
      {dialog}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
        <div className="relative min-w-0 flex-1 basis-56">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input value={query} onChange={(e) => {
          setQuery(e.target.value);
          setLimit(PAGE);
        }} placeholder="Search items" aria-label="Search sub-categories" className={`${inputClass} h-10 pl-9`} />
        </div>
        <span className="text-sm tabular text-ink-subtle">{q ? `${matches.length} of ${live.length}` : `${live.length} items`}</span>
      </div>
      <div className="hidden grid-cols-[minmax(0,1fr)_140px_40px] gap-3 border-b border-line px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-subtle sm:grid" aria-hidden>
        <span>Item</span><span>Price</span><span />
      </div>
      <ul className="divide-y divide-line">
        {visible.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-muted">{q ? `Nothing matches “${query}”.` : 'No items yet. Add the first one below.'}</li>}
        {visible.map(({ s, i }, n) => {
        const showGroup = s.group && s.group !== visible[n - 1]?.s.group;
        return <li key={`${s.name}-${i}`}>
              {showGroup && <p className="bg-canvas px-5 py-1.5 text-xs font-semibold text-ink-muted">{s.group}</p>}
              <div className="grid grid-cols-[minmax(0,1fr)_120px_40px] items-center gap-3 px-5 py-2.5 sm:grid-cols-[minmax(0,1fr)_140px_40px]">
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{s.name}</p>
                  {s.remark && <p className="truncate text-sm text-ink-subtle">{s.remark}</p>}
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
                  <input inputMode="numeric" value={s.basePrice} onChange={(e) => setPrice(i, e.target.value)} aria-label={`${s.name} price`} className={`${inputClass} h-10 pl-7 tabular`} />
                </div>
                <button type="button" onClick={() => remove(i)} aria-label={`Remove ${s.name}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-subtle hover:bg-critical-soft hover:text-critical focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            </li>;
      })}
      </ul>
      {matches.length > limit && <div className="border-t border-line px-5 py-2">
          <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>Show {Math.min(PAGE, matches.length - limit)} more</Button>
        </div>}
      <AddBar onSubmit={add} disabled={!newName.trim() || taken} error={taken ? `“${newName.trim()}” is already in this category.` : undefined}>
        <AddField label="New item">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Princess Cut" className={`${inputClass} h-10`} />
        </AddField>
        <AddField label="Price" className="w-32">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle">₹</span>
            <input inputMode="numeric" value={newPrice} onChange={(e) => setNewPrice(e.target.value.replace(/\D/g, ''))} placeholder={String(items[0]?.basePrice ?? 0)} className={`${inputClass} h-10 pl-7 tabular`} />
          </div>
        </AddField>
      </AddBar>
    </div>;
}