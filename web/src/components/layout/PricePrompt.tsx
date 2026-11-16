import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { IndianRupeeIcon, XIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { minutesWaiting, PRICER, usePriceRequests } from '../../contexts/PriceRequestsContext';
import { Button } from '../ui/Button';

/** Prototype stand-in for a phone/iPad push: a new custom-design price pops up on any screen. */
export function PricePrompt() {
  const { role } = useApp();
  const { open } = usePriceRequests();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const onIt = new URLSearchParams(location.search).get('price');
  const r = role === PRICER ? [...open].reverse().find((x) => !dismissed.includes(x.id) && x.id !== onIt) : undefined;
  const hide = (id: string) => setDismissed((d) => [...d, id]);
  return <AnimatePresence>
      {r && <motion.aside key={r.id} role="alert" aria-label="Price needed" initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} className="fixed bottom-20 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-line-strong bg-surface p-4 shadow-pop md:bottom-6 md:right-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-attention-soft text-attention" aria-hidden>
              <IndianRupeeIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Price needed</p>
              <p className="truncate text-[15px]">{r.garmentLabel} · {r.customerName}</p>
              <p className="text-sm text-ink-muted">{r.requestedBy} · {minutesWaiting(r) < 1 ? 'just now' : `${minutesWaiting(r)} min ago`}</p>
            </div>
            <button type="button" onClick={() => hide(r.id)} aria-label="Dismiss" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors duration-150 ease-out hover:bg-sunken hover:text-ink">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => hide(r.id)}>Later</Button>
            <Button size="sm" onClick={() => {
          hide(r.id);
          navigate(`/production?price=${r.id}`);
        }}>Price it</Button>
          </div>
        </motion.aside>}
    </AnimatePresence>;
}