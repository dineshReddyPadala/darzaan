import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftIcon, GlobeIcon, MailIcon, MapPinIcon, MessageCircleIcon, MoreHorizontalIcon, PhoneIcon, PlusIcon } from 'lucide-react';
import { MeasurementProfileCard } from '../components/customers/MeasurementProfileCard';
import { RemoteMeasurementModal } from '../components/customers/RemoteMeasurementModal';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { buttonClass } from '../components/ui/Button';
import { InfoCard, InfoLine, SectionCard } from '../components/ui/InfoCard';
import { Tabs } from '../components/ui/Tabs';
import { useApp } from '../contexts/AppContext';
import { fabrics } from '../data/inventory';
import { cn } from '../utils/cn';
import { dueLabel, fmtDate, fmtDateTime, inr } from '../utils/format';
import { employees as teamEmployees } from '../data/team';
import { formatCustomerId, formatOrderId } from '../utils/displayIds';
import { garmentTitle, isActive } from '../utils/orders';
import { ShirtIcon } from 'lucide-react';
import { orderTotals } from '../utils/pricing';
import { orderLink } from '../utils/roles';
import { orderStatusTone } from '../utils/status';
import { pageClass, panelClass } from '../utils/styles';
type Tab = 'details' | 'history';

/** Same structure as Order Details: header with one main action, then orders & measurements on the left, contact / money / preferences on the right. */
export function CustomerProfile() {
  const {
    id = ''
  } = useParams();
  const {
    getCustomer,
    orders,
    quotes,
    can,
    role
  } = useApp();
  const [tab, setTab] = useState<Tab>('details');
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);
  const c = getCustomer(id);
  if (!c) {
    return <div className={pageClass}>
        <p className="text-ink-muted">Customer not found.</p>
        <Link to="/customers" className={buttonClass('secondary', 'md', 'mt-4')}>Back to customers</Link>
      </div>;
  }
  const own = orders.filter((o) => o.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeOrders = own.filter(isActive);
  const pastOrders = own.filter((o) => !isActive(o));
  const ownQuotes = quotes.filter((q) => q.customerId === c.id);
  const payments = own.flatMap((o) => o.payments.map((p) => ({
    ...p,
    orderId: o.id
  }))).sort((a, b) => b.at.localeCompare(a.at));
  const paid = own.reduce((s, o) => s + orderTotals(o).paid, 0);
  const balance = own.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + orderTotals(o).balance, 0);
  const alterations = own.flatMap((o) => o.alterations.map((a) => ({
    ...a,
    orderId: o.id
  })));
  const trials = own.filter((o) => o.trial).map((o) => ({
    ...o.trial!,
    orderId: o.id
  }));
  const fabricHistory = own.flatMap((o) => o.garments.map((g) => ({
    g,
    orderId: o.id,
    fabric: g.fabric.source === 'Darzaan' ? fabrics.find((f) => f.id === g.fabric.fabricId) : undefined
  })));
  const menuItems = [{
    label: 'Message',
    run: () => toast.success(`Opening ${c.whatsappAvailable ? 'WhatsApp' : 'SMS'} chat with ${c.name}`)
  }, {
    label: 'Get measurements',
    run: () => setRemoteOpen(true)
  }, ...(can('order', 'create') ? [{
    label: 'New quote',
    to: `/orders/new?customer=${c.id}&mode=quote`
  }] : [])];
  return <div className={pageClass}>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> Customers
      </Link>

      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={c.name} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[30px] font-medium leading-none tracking-tight">{c.name}</h1>
              {c.tier === 'VIP' && <Badge tone="brand" size="md">VIP</Badge>}
              {c.tier === 'New' && <Badge tone="info" size="md">New</Badge>}
              {c.remote && <Badge tone="info" size="md"><GlobeIcon className="h-3.5 w-3.5" /> International</Badge>}
            </div>
            <p className="mt-2 text-[16px] text-ink-muted">
              {activeOrders.length ? `${activeOrders.length} active order${activeOrders.length > 1 ? 's' : ''}` : 'No active orders'} · Customer since {fmtDate(c.since, 'MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {can('order', 'create') && <Link to={`/orders/new?customer=${c.id}`} className={buttonClass('primary', 'lg')}><PlusIcon className="h-5 w-5" /> New order</Link>}
          <div className="relative" ref={menuRef}>
            <button type="button" aria-label="More actions" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface ring-1 ring-inset ring-line-strong transition-colors duration-150 ease-out hover:bg-sunken">
              <MoreHorizontalIcon className="h-5 w-5" />
            </button>
            {menu && <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-2xl border border-line bg-surface p-1.5 shadow-pop" role="menu">
                {menuItems.map((m) => 'to' in m && m.to ? <Link key={m.label} to={m.to} role="menuitem" className="block rounded-xl px-3 py-2.5 text-[15px] hover:bg-sunken">{m.label}</Link> : <button key={m.label} type="button" role="menuitem" onClick={() => {
              setMenu(false);
              'run' in m && m.run?.();
            }} className="block w-full rounded-xl px-3 py-2.5 text-left text-[15px] hover:bg-sunken">{m.label}</button>)}
              </div>}
          </div>
        </div>
      </header>

      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{
      key: 'details',
      label: 'Customer details'
    }, {
      key: 'history',
      label: 'History',
      count: payments.length + trials.length + alterations.length
    }]} />

      <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          {tab === 'details' && <>
              <SectionCard title="Orders" count={own.length} flush>
                {own.length ? <ul className="divide-y divide-line">
                    {[...activeOrders, ...pastOrders].map((o) => {
                const t = orderTotals(o);
                const to = orderLink(role, o.id);
                const active = isActive(o);
                const body = <>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm text-ink-muted">{formatOrderId(o.id)}</p>
                            <p className="truncate text-[15px] font-medium">{o.garments.map((g) => g.subCategory).join(', ')}</p>
                          </div>
                          <Badge tone={orderStatusTone[o.status]} dot>{o.status}</Badge>
                          <div className="hidden w-28 text-right sm:block">
                            <p className="text-sm font-medium tabular">{fmtDate(o.deliveryDate, 'd MMM')}</p>
                            <p className={cn('text-xs', active && dueLabel(o.deliveryDate).toLowerCase().includes('overdue') ? 'text-critical' : 'text-ink-subtle')}>{active ? dueLabel(o.deliveryDate) : 'Delivered'}</p>
                          </div>
                          <span className={cn('hidden w-24 text-right text-sm tabular md:block', t.balance > 0 && active ? 'font-medium text-attention' : 'text-ink-muted')}>{t.balance > 0 && active ? `${inr(t.balance)} due` : inr(t.total)}</span>
                        </>;
                return <li key={o.id}>{to ? <Link to={to} className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150 ease-out hover:bg-canvas">{body}</Link> : <div className="flex items-center gap-4 px-5 py-3.5">{body}</div>}</li>;
              })}
                  </ul> : <p className="px-5 py-10 text-center text-ink-muted">No orders yet.</p>}
                {ownQuotes.length > 0 && <div className="border-t border-line">
                    <p className="px-5 pt-4 text-xs font-medium text-ink-subtle">Draft quotes</p>
                    <ul className="divide-y divide-line">
                      {ownQuotes.map((q) => <li key={q.id} className="flex items-center gap-4 px-5 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium">{q.items.join(' · ')}</p>
                            <p className="truncate text-sm text-ink-subtle">{q.id}{q.note ? ` · ${q.note}` : ''}</p>
                          </div>
                          <span className="text-sm tabular">{inr(q.estimate)}</span>
                          <Link to={`/orders/new?quote=${q.id}`} className={buttonClass('secondary', 'md')}>Resume</Link>
                        </li>)}
                    </ul>
                  </div>}
              </SectionCard>

              <SectionCard title="Measurements" count={c.measurementProfiles.length} action={<button type="button" onClick={() => setRemoteOpen(true)} className="text-sm font-medium text-brand hover:underline">Request remotely</button>}>
                {c.measurementProfiles.length ? <div className="space-y-4">{c.measurementProfiles.map((p) => <MeasurementProfileCard key={p.id} profile={p} />)}</div> : <p className="py-4 text-center text-ink-muted">No measurements yet.</p>}
              </SectionCard>
            </>}

          {tab === 'history' && <>
              <SectionCard title="Payments" count={payments.length} flush>
                {payments.length ? <ul className="divide-y divide-line">
                    {payments.map((p) => <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium">{p.kind} · {p.method}</p>
                          <p className="truncate text-sm text-ink-subtle">{p.orderId} · {fmtDateTime(p.at)} · {p.by}</p>
                        </div>
                        <span className="text-[15px] font-semibold tabular">{inr(p.amount)}</span>
                      </li>)}
                  </ul> : <p className="px-5 py-10 text-center text-ink-muted">No payments yet.</p>}
              </SectionCard>

              <SectionCard title="Trials & alterations" count={trials.length + alterations.length} flush>
                {trials.length + alterations.length ? <ul className="divide-y divide-line">
                    {trials.map((t) => <li key={`t-${t.orderId}`} className="flex items-center gap-4 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-medium">Trial · {fmtDate(t.date, 'EEE, d MMM')}, {t.time}</p>
                          <p className="truncate text-sm text-ink-subtle">{t.orderId}{t.notes ? ` · ${t.notes}` : ''}</p>
                        </div>
                        <Badge tone={t.status === 'Completed' ? 'success' : t.status === 'Missed' ? 'critical' : 'info'}>{t.status}</Badge>
                      </li>)}
                    {alterations.map((a) => <li key={a.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium">Alteration · {a.issue}</p>
                          <p className="text-sm text-ink-subtle">{a.orderId} · {a.status}</p>
                        </div>
                        <Badge tone={a.charge ? 'attention' : 'success'}>{a.charge ? `Paid · ${inr(a.charge)}` : 'Free'}</Badge>
                      </li>)}
                  </ul> : <p className="px-5 py-10 text-center text-ink-muted">No trials or alterations yet.</p>}
              </SectionCard>

              <SectionCard title="Garments & fabrics" count={fabricHistory.length} flush>
                <ul className="divide-y divide-line">
                  {fabricHistory.map(({
                g,
                orderId,
                fabric
              }) => <li key={`${orderId}-${g.id}`} className="flex items-center gap-3 px-5 py-3">
                      {fabric?.color ? <span className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-inset ring-line" style={{ backgroundColor: fabric.color }} aria-hidden /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken text-ink-muted ring-1 ring-inset ring-line"><ShirtIcon className="h-5 w-5" aria-hidden /></span>}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium">{garmentTitle(g)}</p>
                        <p className="truncate text-sm text-ink-subtle">{fabric ? `${fabric.type} — ${fabric.name}` : g.fabric.pieces.map((p) => p.material).join(', ') || 'Customer’s fabric'} · {orderId}</p>
                      </div>
                    </li>)}
                </ul>
              </SectionCard>
            </>}
        </div>

        <aside className="space-y-5">
          <InfoCard title="Contact">
            <p className="flex items-center gap-1.5 text-[16px] font-semibold"><PhoneIcon className="h-4 w-4 text-ink-subtle" />{c.mobile}</p>
            <p className={cn('mt-1 flex items-center gap-1.5 text-sm', c.whatsappAvailable ? 'text-success' : 'text-ink-muted')}>
              <MessageCircleIcon className="h-3.5 w-3.5" />{c.whatsappAvailable ? 'On WhatsApp' : 'No WhatsApp — SMS & email'}
            </p>
            {c.email && <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-muted"><MailIcon className="h-3.5 w-3.5 shrink-0" />{c.email}</p>}
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><MapPinIcon className="h-3.5 w-3.5" />{c.city}</p>
            {(() => {
              const designer = (c.designer ?? '').trim();
              const byName = designer && !/^[1-9]\d*$/.test(designer) ? designer : teamEmployees.find((e) => String(e.id) === designer || e.name === designer)?.name;
              return byName ? <p className="mt-3 border-t border-line pt-3 text-sm text-ink-subtle">{byName} · Designer</p> : <p className="mt-3 border-t border-line pt-3 text-sm text-ink-subtle">{formatCustomerId(c.id)}</p>;
            })()}
          </InfoCard>

          <InfoCard title="Money">
            <dl className="space-y-1.5 text-[15px]">
              <InfoLine k="Paid so far" v={inr(paid)} />
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <dt className="font-semibold">Balance due</dt>
                <dd className={cn('text-lg font-semibold tabular', balance > 0 ? 'text-attention' : 'text-success')}>{balance > 0 ? inr(balance) : 'Nothing due'}</dd>
              </div>
            </dl>
          </InfoCard>

          {c.notes && <InfoCard title="Notes">
              <p className="text-[15px] leading-relaxed">{c.notes}</p>
            </InfoCard>}
        </aside>
      </div>

      <RemoteMeasurementModal open={remoteOpen} onClose={() => setRemoteOpen(false)} customer={c} />
    </div>;
}