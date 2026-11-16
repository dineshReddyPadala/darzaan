import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FilePlus2Icon, MoonIcon, MoreHorizontalIcon, PackageOpenIcon } from 'lucide-react';
import { buttonClass } from '../ui/Button';

/** Occasional tasks, kept out of the way of serving customers. */
export function TodayMoreMenu({
  onDraft,
  onStock,
  onClose




}: {onDraft: () => void;onStock: () => void;onClose: () => void;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const item = (label: string, icon: React.ReactNode, fn: () => void) => <button role="menuitem" onClick={() => {
    setOpen(false);
    fn();
  }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-ink transition-colors duration-150 ease-out hover:bg-canvas">
      {icon}
      {label}
    </button>;
  return <div ref={ref} className="relative">
      <button aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={buttonClass('secondary', 'md', 'h-12 w-12 px-0')}>
        <MoreHorizontalIcon className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && <motion.div role="menu" initial={{
        opacity: 0,
        scale: 0.96,
        y: -4
      }} animate={{
        opacity: 1,
        scale: 1,
        y: 0
      }} exit={{
        opacity: 0,
        scale: 0.96,
        y: -4
      }} transition={{
        duration: 0.16,
        ease: [0.23, 1, 0.32, 1]
      }} className="absolute right-0 top-full z-30 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface py-1 shadow-pop">
            {item('Draft order for a walk-in', <FilePlus2Icon className="h-4 w-4 text-ink-subtle" />, onDraft)}
            {item('Lend swatch / issue trim', <PackageOpenIcon className="h-4 w-4 text-ink-subtle" />, onStock)}
            <div className="my-1 border-t border-line" />
            {item('Close the day', <MoonIcon className="h-4 w-4 text-ink-subtle" />, onClose)}
          </motion.div>}
      </AnimatePresence>
    </div>;
}