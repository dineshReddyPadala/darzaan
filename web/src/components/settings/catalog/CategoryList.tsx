import React, { useState } from 'react';
import { PlusIcon, SearchIcon } from 'lucide-react';
import type { CategoryDef } from '../../../data/catalog';
import { cn } from '../../../utils/cn';
import { inputClass, panelClass } from '../../../utils/styles';
import { Button } from '../../ui/Button';

interface CategoryListProps {
  categories: CategoryDef[];
  selected: string;
  changed: Set<string>;
  onSelect: (name: string) => void;
  onAdd: (name: string) => void;
}

/** Searchable master list — scales to hundreds of categories without pushing the editor off screen. */
export function CategoryList({ categories, selected, changed, onSelect, onAdd }: CategoryListProps) {
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const q = query.trim().toLowerCase();
  const live = categories.filter((c) => !c.deletedAt);
  const count = (c: CategoryDef) => c.subCategories.filter((s) => !s.deletedAt).length;
  const shown = q ? live.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || c.subCategories.some((s) => !s.deletedAt && s.name.toLowerCase().includes(q))) : live;
  const taken = categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  const add = () => {
    if (!name.trim() || taken) return;
    onAdd(name.trim());
    setName('');
    setAdding(false);
    setQuery('');
  };

  return <div className={cn(panelClass, 'flex flex-col overflow-hidden md:sticky md:top-20 md:max-h-[calc(100vh-7rem)]')}>
      <div className="border-b border-line p-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${live.length} categories`} aria-label="Search categories" className={`${inputClass} h-10 pl-9`} />
        </div>
      </div>
      <ul className="max-h-64 flex-1 overflow-y-auto p-1.5 md:max-h-none" aria-label="Categories">
        {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-muted">No category matches “{query}”.</li>}
        {shown.map((c) => {
        const on = c.name === selected;
        return <li key={c.name}>
              <button type="button" onClick={() => onSelect(c.name)} aria-current={on} aria-label={`${c.code}. ${c.name}, ${count(c)} items`} className={cn('flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand', on ? 'bg-brand-soft' : 'hover:bg-sunken')}>
                <span className={cn('w-5 shrink-0 text-xs font-semibold tabular', on ? 'text-brand' : 'text-ink-subtle')}>{c.code}</span>
                <span title={c.name} className={cn('min-w-0 flex-1 truncate text-[15px]', on ? 'font-medium text-brand-hover' : 'text-ink')}>{c.name}</span>
                {changed.has(c.name) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-attention" aria-label="Unsaved changes" />}
                <span className="shrink-0 text-xs tabular text-ink-subtle">{count(c)}</span>
              </button>
            </li>;
      })}
      </ul>
      <div className="border-t border-line p-3">
        {adding ? <form className="space-y-2" onSubmit={(e) => {
        e.preventDefault();
        add();
      }}>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" aria-label="New category name" className={`${inputClass} h-10`} />
            {taken && <p className="text-sm text-critical">That category already exists.</p>}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => {
            setAdding(false);
            setName('');
          }}>Cancel</Button>
              <Button type="submit" size="sm" icon={<PlusIcon className="h-4 w-4" />} disabled={!name.trim() || taken}>Add</Button>
            </div>
          </form> : <div className="flex justify-end"><Button variant="secondary" size="sm" icon={<PlusIcon className="h-4 w-4" />} onClick={() => setAdding(true)}>New category</Button></div>}
      </div>
    </div>;
}