import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, GlobeIcon, MessageCircleIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { CustomerIntakeModal } from '../components/customers/CustomerIntakeModal';
import { employees as teamEmployees } from '../data/team';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { useApp } from '../contexts/AppContext';
import { fmtDate, inr } from '../utils/format';
import { orderTotals } from '../utils/pricing';
import { formatCustomerId, idMatchesQuery } from '../utils/displayIds';
import { chipClass, inputClass, pageClass, panelClass } from '../utils/styles';

function designerLabel(c: { designer?: string }, staffById: Map<string, string>): string {
  const d = (c.designer ?? '').trim();
  if (!d) return '—';
  if (staffById.has(d)) return staffById.get(d)!;
  if (/^[1-9]\d*$/.test(d) && staffById.has(d)) return staffById.get(d)!;
  return d;
}
const filters = ['All', 'VIP', 'Returning', 'New', 'International'] as const;
export function Customers() {
  const {
    customers,
    orders,
    can
  } = useApp();
  const staffById = useMemo(() => new Map(teamEmployees.flatMap((e) => [[String(e.id), e.name], [e.name.toLowerCase(), e.name]])), []);
  const designers = useMemo(() => [...new Set(customers.map((c) => c.designer).filter(Boolean))], [customers]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [designer, setDesigner] = useState('Any designer');
  const [intake, setIntake] = useState(false);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, '');
    return customers.filter((c) => {
      const own = orders.filter((o) => o.customerId === c.id);
      const matchQ = !s || c.name.toLowerCase().includes(s) || idMatchesQuery(c.id, s) || digits.length >= 3 && (c.mobile.replace(/\D/g, '').includes(digits) || c.whatsapp.replace(/\D/g, '').includes(digits)) || own.some((o) => idMatchesQuery(o.id, s));
      const matchF = filter === 'All' || (filter === 'International' ? c.remote : c.tier === filter);
      const matchD = designer === 'Any designer' || c.designer === designer;
      return matchQ && matchF && matchD;
    }).map((c) => {
      const own = orders.filter((o) => o.customerId === c.id);
      const last = own.map((o) => o.createdAt).sort().pop();
      const spend = own.reduce((s, o) => s + orderTotals(o).paid, 0);
      return {
        c,
        count: own.length,
        last,
        spend
      };
    });
  }, [customers, orders, q, filter, designer]);
  return <div className={pageClass}>
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} actions={can('customer', 'create') ? <Button size="lg" icon={<PlusIcon className="h-5 w-5" />} onClick={() => setIntake(true)}>New customer</Button> : undefined} />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, mobile, WhatsApp, customer ID or order number" className={`${inputClass} h-12 pl-12`} aria-label="Search customers" />
        </div>
        <select value={designer} onChange={(e) => setDesigner(e.target.value)} className={`${inputClass} h-12 lg:w-52`} aria-label="Designer">
          <option>Any designer</option>
          {designers.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {filters.map((f) => <button key={f} onClick={() => setFilter(f)} className={chipClass(filter === f)}>{f}</button>)}
      </div>

      <div className={panelClass}>
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_90px_110px_120px_24px] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle lg:grid">
          <span>Customer</span><span>Contact</span><span>Designer</span><span>Orders</span><span>Last order</span><span className="text-right">Lifetime paid</span><span />
        </div>
        <ul className="divide-y divide-line">
          {rows.map(({
          c,
          count,
          last,
          spend
        }) => <li key={c.id}>
              <Link to={`/customers/${c.id}`} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-canvas lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_90px_110px_120px_24px]">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-[15px] font-semibold">
                      {c.name}
                      {c.tier === 'VIP' && <Badge tone="brand">VIP</Badge>}
                      {c.remote && <GlobeIcon className="h-4 w-4 text-info" aria-label="International" />}
                    </p>
                    <p className="text-sm text-ink-subtle">{formatCustomerId(c.id)} · {c.city}</p>
                  </div>
                </div>
                <div className="hidden min-w-0 lg:block">
                  <p className="text-[15px] tabular">{c.mobile}</p>
                  <p className={`flex items-center gap-1 text-sm ${c.whatsappAvailable ? 'text-success' : 'text-ink-subtle'}`}>
                    <MessageCircleIcon className="h-3.5 w-3.5" /> {c.whatsappAvailable ? 'WhatsApp' : 'No WhatsApp'}
                  </p>
                </div>
                <span className="hidden text-[15px] text-ink-muted lg:block">{designerLabel(c, staffById)}</span>
                <span className="hidden text-[15px] tabular lg:block">{count}</span>
                <span className="hidden text-[15px] text-ink-muted lg:block">{last ? fmtDate(last) : '—'}</span>
                <span className="text-right text-[15px] font-medium tabular">{inr(spend)}</span>
                <ChevronRightIcon className="hidden h-5 w-5 text-ink-subtle lg:block" />
              </Link>
            </li>)}
          {rows.length === 0 && <li className="px-5 py-16 text-center">
              <p className="text-[15px] font-medium">No customers match.</p>
              {can('customer', 'create') && <Button className="mt-4" onClick={() => setIntake(true)}>Create a new customer</Button>}
            </li>}
        </ul>
      </div>
      <CustomerIntakeModal open={intake} onClose={() => setIntake(false)} />
    </div>;
}