import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import type { FollowUp } from '../../hooks/useTodayAgenda';
import { cn } from '../../utils/cn';
import { inr } from '../../utils/format';
interface WaitingItem {
  id: string;
  kind: string;
  orderId?: string;
  reason: string;
  status: 'Waiting' | 'Approved' | 'Declined';
  amount?: number;
  decisionNote?: string;
}
const actionClass = 'shrink-0 text-sm font-medium text-brand hover:underline';

/** Between-customer work, folded into one line. When opened: one list, one line per item, one action each. */
export function FollowUpsDisclosure({
  followUps,
  waiting



}: {followUps: FollowUp[];waiting: WaitingItem[];}) {
  const {
    sendMessage,
    returnSwatch,
    managerName,
    isEscalated,
    requests
  } = useStore();
  const [open, setOpen] = useState(false);
  const manager = managerName.split(' ')[0];
  const lateIds = new Set(waiting.filter((w) => {
    const r = requests.find((x) => x.id === w.id);
    return w.status === 'Waiting' && r ? isEscalated(r) : false;
  }).map((w) => w.id));
  const openWaiting = waiting.filter((w) => w.status === 'Waiting');
  const parts = [followUps.length ? `${followUps.length} to follow up` : null, openWaiting.length ? `${openWaiting.length} waiting on ${manager}` : null].filter(Boolean);
  if (!parts.length && !waiting.length) return <p className="px-6 py-4 text-sm text-ink-subtle">Nothing carried over.</p>;
  const row = (key: string, label: React.ReactNode, right: React.ReactNode) => <li key={key} className="flex items-center justify-between gap-4 py-2.5">
      <span className="min-w-0 text-[15px] leading-snug">{label}</span>
      {right}
    </li>;
  return <div>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors duration-150 ease-out hover:bg-canvas">
        <span className="flex-1 text-[15px] text-ink-muted">
          {parts.length ? parts.join(' · ') : `${waiting.length} answered by ${manager}`}
          {lateIds.size > 0 && <span className="font-medium text-attention"> · over 2 h</span>}
        </span>
        <ChevronDownIcon className={cn('h-4 w-4 text-ink-subtle transition-transform duration-200 ease-out', open && 'rotate-180')} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div initial={{
        height: 0,
        opacity: 0
      }} animate={{
        height: 'auto',
        opacity: 1
      }} exit={{
        height: 0,
        opacity: 0
      }} transition={{
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1]
      }} className="overflow-hidden">
            <ul className="divide-y divide-line px-6 pb-4">
              {followUps.map((f) => row(f.id, f.title, f.kind === 'no-show' && f.orderId ? <button onClick={() => sendMessage(f.orderId!, 'reschedule')} className={actionClass}>Send link</button> : f.kind === 'uncollected' && f.orderId ? <button onClick={() => sendMessage(f.orderId!, 'pickup')} className={actionClass}>Remind</button> : f.kind === 'swatch' && f.loanId ? <button onClick={() => returnSwatch(f.loanId!)} className={actionClass}>Mark returned</button> : null))}
              {waiting.map((w) => row(w.id, <>
                    {w.kind}{w.amount ? ` ${inr(w.amount)}` : ''}
                    {w.orderId && <Link to={`/orders/${w.orderId}`} className="ml-2 font-mono text-xs text-ink-subtle hover:underline">{w.orderId}</Link>}
                  </>, <span className={cn('shrink-0 text-sm', w.status === 'Approved' ? 'text-success' : w.status === 'Declined' ? 'text-critical' : lateIds.has(w.id) ? 'font-medium text-attention' : 'text-ink-subtle')}>
                    {w.status === 'Waiting' ? lateIds.has(w.id) ? `${manager} · over 2 h` : `With ${manager}` : w.status}
                  </span>))}
            </ul>
          </motion.div>}
      </AnimatePresence>
    </div>;
}