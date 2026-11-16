import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}
export function Drawer({
  open,
  onClose,
  title,
  headerExtra,
  children
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return <AnimatePresence>
      {open && <motion.div className="fixed inset-0 z-50" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} exit={{
      opacity: 0
    }} transition={{
      duration: 0.18
    }}>
          <div className="absolute inset-0 bg-ink/25" onClick={onClose} aria-hidden />
          <motion.aside role="dialog" aria-modal="true" aria-label={title} className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-surface shadow-pop" initial={{
        x: 40,
        opacity: 0
      }} animate={{
        x: 0,
        opacity: 1
      }} exit={{
        x: 40,
        opacity: 0
      }} transition={{
        duration: 0.24,
        ease: [0.23, 1, 0.32, 1]
      }}>
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold">{title}</h2>
              <div className="flex items-center gap-1">
                {headerExtra}
                <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-subtle hover:bg-sunken hover:text-ink">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </motion.div>}
    </AnimatePresence>;
}