import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BoxIcon, ClipboardListIcon, ContactIcon, ListChecksIcon, SearchIcon, TruckIcon, UserIcon, type LucideIcon } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useLogistics } from "../../contexts/LogisticsContext";
import { canAccess, canOpenOrder, orderLink } from "../../utils/roles";
import { fabrics as seedFabrics, trims as seedTrims } from "../../data/inventory";
import { storedOrSample } from "../../services/sync";
import { teamList } from "../../utils/team";
import { garmentsSummary } from "../../utils/orders";
interface Result {
  id: string;
  group: string;
  title: string;
  sub: string;
  to: string;
  icon: LucideIcon;
}
export function SearchDialog({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const {
    orders,
    customers,
    customerName,
    role,
    roleDef
  } = useApp();
  const {
    movements,
    deliveries
  } = useLogistics();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
    }
  }, [open]);
  // Search only returns what this role can open.
  const may = {
    orders: canOpenOrder(role),
    customers: canAccess(role, 'customers'),
    tasks: canAccess(role, 'production') || canAccess(role, 'qc'),
    inventory: canAccess(role, 'inventory'),
    team: canAccess(role, 'team'),
    trips: roleDef.logisticsTabs.includes('trips') || roleDef.logisticsTabs.includes('packaging') || roleDef.logisticsTabs.includes('receiving'),
    deliveries: roleDef.logisticsTabs.includes('deliveries')
  };
  const fabrics = storedOrSample('inventoryFabrics', seedFabrics);
  const trims = storedOrSample('inventoryTrims', seedTrims);
  const people = teamList();
  const placeholder = may.customers ? 'Try an order number, a mobile number, or a fabric' : may.orders ? 'Try an order number or garment' : may.deliveries ? 'Try an order number or a delivery' : 'Try a trip or a bag tag';
  const results = useMemo<Result[]>(() => {
    const s = q.trim().toLowerCase();
    if (!s) {
      if (may.orders) return orders.slice(0, 5).map((o) => ({
        id: o.id,
        group: 'Recent orders',
        title: `${o.id} · ${customerName(o.customerId)}`,
        sub: garmentsSummary(o),
        to: orderLink(role, o.id) ?? '/',
        icon: ClipboardListIcon
      }));
      if (may.deliveries) return deliveries.slice(0, 5).map((d) => ({
        id: d.id,
        group: 'Home deliveries',
        title: `${d.id} · ${d.orderId}`,
        sub: d.status,
        to: '/logistics?tab=deliveries',
        icon: TruckIcon
      }));
      return movements.filter((m) => m.status !== 'Received').slice(0, 5).map((m) => ({
        id: m.id,
        group: 'Open trips',
        title: `${m.id} · ${m.from} → ${m.to}`,
        sub: `${m.bags.length} bag${m.bags.length > 1 ? 's' : ''} · ${m.status}`,
        to: '/logistics?tab=trips',
        icon: TruckIcon
      }));
    }
    const digits = s.replace(/\D/g, '');
    const r: Result[] = [];
    if (may.orders) orders.filter((o) => String(o.id).toLowerCase().includes(s) || customerName(o.customerId).toLowerCase().includes(s) || garmentsSummary(o).toLowerCase().includes(s)).forEach((o) => r.push({
      id: o.id,
      group: 'Orders',
      title: `${o.id} · ${customerName(o.customerId)}`,
      sub: `${garmentsSummary(o)} · ${o.status}`,
      to: orderLink(role, o.id) ?? '/',
      icon: ClipboardListIcon
    }));
    if (may.trips) movements.filter((m) => m.id.toLowerCase().includes(s) || m.bags.some((b) => b.tag.toLowerCase().includes(s))).forEach((m) => r.push({
      id: m.id,
      group: 'Trips',
      title: `${m.id} · ${m.from} → ${m.to}`,
      sub: `${m.bags.map((b) => b.tag).join(', ')} · ${m.status}`,
      to: `/logistics?tab=${roleDef.logisticsTabs.includes('trips') ? 'trips' : roleDef.logisticsTabs[0]}`,
      icon: TruckIcon
    }));
    if (may.deliveries) deliveries.filter((d) => d.id.toLowerCase().includes(s) || d.orderId.toLowerCase().includes(s)).forEach((d) => r.push({
      id: d.id,
      group: 'Home deliveries',
      title: `${d.id} · ${d.orderId}`,
      sub: d.status,
      to: '/logistics?tab=deliveries',
      icon: TruckIcon
    }));
    if (may.customers) customers.filter((c) => c.name.toLowerCase().includes(s) || String(c.id).toLowerCase().includes(s) || digits.length >= 3 && c.mobile.replace(/\D/g, '').includes(digits)).forEach((c) => r.push({
      id: c.id,
      group: 'Customers',
      title: c.name,
      sub: `${c.mobile} · ${c.id}`,
      to: `/customers/${c.id}`,
      icon: UserIcon
    }));
    if (may.tasks && may.orders) orders.flatMap((o) => (o.tasks ?? []).map((t) => ({ order: o, task: t }))).filter(({ task }) => task.name.toLowerCase().includes(s) || task.id.toLowerCase().includes(s)).forEach(({ order, task }) => r.push({
      id: task.id,
      group: 'Production tasks',
      title: task.name,
      sub: `${task.id} · ${order.id} · ${task.assignee ?? 'Unassigned'}`,
      to: orderLink(role, order.id, 'workflow') ?? '/',
      icon: ListChecksIcon
    }));
    if (may.inventory) [...fabrics.map((f) => ({
      id: f.id,
      name: `${f.type} — ${f.name}`
    })), ...trims.map((t) => ({
      id: t.id,
      name: t.name
    }))].filter((f) => f.name.toLowerCase().includes(s) || f.id.toLowerCase().includes(s)).forEach((f) => r.push({
      id: f.id,
      group: 'Inventory',
      title: f.name,
      sub: f.id,
      to: `/inventory?q=${f.id}`,
      icon: BoxIcon
    }));
    if (may.team) people.filter((e) => e.name.toLowerCase().includes(s) || String(e.id).toLowerCase().includes(s)).forEach((e) => r.push({
      id: String(e.id),
      group: 'Team',
      title: e.name,
      sub: `${e.role} · ${e.id}`,
      to: `/team`,
      icon: ContactIcon
    }));
    return r.slice(0, 14);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, orders, customers, customerName, role, movements, deliveries, fabrics, trims, people]);
  const go = (r: Result) => {
    onClose();
    navigate(r.to);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  let lastGroup = '';
  return <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.15
    }}>
          <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden />
          <motion.div role="dialog" aria-modal="true" aria-label="Search" className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-surface shadow-pop" initial={{
        opacity: 0,
        scale: 0.97,
        y: -8
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.98
      }} transition={{
        duration: 0.18,
        ease: [0.23, 1, 0.32, 1]
      }}>
            <div className="flex items-center gap-3 border-b border-line px-5">
              <SearchIcon className="h-5 w-5 text-ink-subtle" />
              <input autoFocus value={q} onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }} onKeyDown={onKey} placeholder={placeholder} className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-subtle" />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 && <p className="px-4 py-10 text-center text-ink-muted">{q ? `No matches for “${q}”.` : 'Nothing to show yet.'}</p>}
              {results.map((r, i) => {
            const header = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            return <React.Fragment key={`${r.group}-${r.id}`}>
                    {header && <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{header}</p>}
                    <button onMouseEnter={() => setActive(i)} onClick={() => go(r)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${i === active ? 'bg-sunken' : ''}`}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-ink-muted">
                        <r.icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium">{r.title}</span>
                        <span className="block truncate text-sm text-ink-subtle">{r.sub}</span>
                      </span>
                    </button>
                  </React.Fragment>;
          })}
            </div>
          </motion.div>
        </motion.div>}
    </AnimatePresence>;
}