import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import type { AppNotification } from '../../types';
import { cn } from '../../utils/cn';
import { fmtDateTime } from '../../utils/format';
import { severityRank } from '../../utils/status';
import { canOpenOrder } from '../../utils/roles';
import { chipClass } from '../../utils/styles';
import { Drawer } from '../ui/Drawer';
import { SeverityIcon } from '../ui/SeverityIcon';
const categories: ('All' | AppNotification['category'])[] = ['All', 'Action Required', 'Order Updates', 'Production', 'Payments', 'Customer', 'Logistics', 'System'];
export function NotificationsPanel({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const {
    role,
    notifications,
    markRead,
    markAllRead,
    snooze
  } = useApp();
  const [cat, setCat] = useState<(typeof categories)[number]>('All');
  const [byPriority, setByPriority] = useState(true);
  const navigate = useNavigate();
  // Only offer the categories this role actually receives.
  const cats = categories.filter((c) => c === 'All' || notifications.some((n) => n.category === c));
  const list = notifications.filter((n) => cat === 'All' || n.category === cat).sort((a, b) => byPriority ? severityRank[a.severity] - severityRank[b.severity] : b.at.localeCompare(a.at));
  return <Drawer open={open} onClose={onClose} title="Notifications" headerExtra={<button onClick={markAllRead} className="h-9 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft">
          Mark all read
        </button>}>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3">
        {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={chipClass(cat === c)}>
            {c}
          </button>)}
      </div>
      <div className="flex items-center justify-between px-5 pb-2 text-sm text-ink-muted">
        <span>{list.length} notifications</span>
        <button onClick={() => setByPriority(!byPriority)} className="font-medium text-ink hover:underline">
          Sort: {byPriority ? 'Priority' : 'Newest'}
        </button>
      </div>
      <ul className="divide-y divide-line">
        {list.map((n) => <li key={n.id} className={cn('flex gap-3 px-5 py-4', !n.read && 'bg-brand-soft/40')}>
            <SeverityIcon severity={n.severity} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[15px] font-semibold leading-snug">{n.title}</p>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
              <p className="mt-1 text-xs text-ink-subtle">
                {n.category} · {fmtDateTime(n.at)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {n.orderId && canOpenOrder(role) && <button onClick={() => {
              markRead(n.id);
              onClose();
              navigate(`/orders/${n.orderId}`);
            }} className="h-9 rounded-lg bg-surface px-3 text-sm font-medium ring-1 ring-inset ring-line-strong hover:bg-sunken">
                    Open {n.orderId}
                  </button>}
                {n.href && <button onClick={() => {
              markRead(n.id);
              onClose();
              navigate(n.href!);
            }} className="h-9 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-hover">
                    {n.hrefLabel ?? 'Open'}
                  </button>}
                {!n.read && <button onClick={() => markRead(n.id)} className="h-9 rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-sunken">
                    Mark read
                  </button>}
                <button onClick={() => snooze(n.id)} className="h-9 rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-sunken">
                  Snooze
                </button>
              </div>
            </div>
          </li>)}
        {list.length === 0 && <li className="px-5 py-16 text-center text-ink-muted">You're all caught up.</li>}
      </ul>
    </Drawer>;
}