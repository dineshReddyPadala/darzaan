import React, { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { cn } from '../../utils/cn';
import { isActive } from '../../utils/orders';
import { inputClass } from '../../utils/styles';
import { Avatar } from '../ui/Avatar';

/** Phone, name or the order number on the customer copy (typed or scanned) — straight to their visit. */
export function CheckInSearch({
  onPick


}: {onPick: (customerId: string) => void;}) {
  const {
    customers,
    orders
  } = useApp();
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const digits = s.replace(/\D/g, '');
    const byOrder = orders.find((o) => String(o.id).toLowerCase() === s || String(o.id).toLowerCase().endsWith(s));
    return customers.filter((c) => c.name.toLowerCase().includes(s) || digits.length >= 4 && c.mobile.replace(/\D/g, '').includes(digits) || byOrder?.customerId === c.id).slice(0, 5).map((c) => ({
      c,
      open: orders.filter((o) => o.customerId === c.id && isActive(o)).length
    }));
  }, [q, customers, orders]);
  const pick = (id: string) => {
    onPick(id);
    setQ('');
  };
  return <div className="relative w-full md:w-80">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && results[0] && pick(results[0].c.id)} placeholder="Check in — phone, name or order no." className={cn(inputClass, 'h-11 pl-10')} aria-label="Check in a customer" role="combobox" aria-expanded={results.length > 0} aria-controls="checkin-results" />
      {results.length > 0 && <ul id="checkin-results" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-pop">
          {results.map(({
        c,
        open
      }) => <li key={c.id} role="option" aria-selected={false}>
              <button onClick={() => pick(c.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ease-out hover:bg-canvas">
                <Avatar name={c.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{c.name}</span>
                  <span className="block text-sm text-ink-muted">{c.mobile}</span>
                </span>
                <span className="text-sm text-ink-subtle">{open ? `${open} open` : 'No open orders'}</span>
              </button>
            </li>)}
        </ul>}
    </div>;
}