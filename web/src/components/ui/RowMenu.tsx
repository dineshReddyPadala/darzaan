import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontalIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface RowAction {
  label: string;
  to?: string;
  onClick?: () => void;
  destructive?: boolean;
}

/** Three-dot menu for a table row. The menu is fixed so a scrolling table does not clip it. */
export function RowMenu({ label, items }: { label: string; items: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPlace({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    setOpen((value) => !value);
  };

  return <>
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={toggle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-ink"
    >
      <MoreHorizontalIcon className="h-4 w-4" />
    </button>
    {open && <div
      ref={menuRef}
      role="menu"
      style={{ top: place.top, right: place.right }}
      className="fixed z-50 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop"
    >
      {items.map((item) => {
        const className = cn('block w-full px-3 py-2 text-left text-sm hover:bg-sunken', item.destructive ? 'text-critical' : 'text-ink');
        if (item.to) {
          return <Link key={item.label} to={item.to} role="menuitem" className={className} onClick={() => setOpen(false)}>{item.label}</Link>;
        }
        return <button key={item.label} type="button" role="menuitem" className={className} onClick={() => { setOpen(false); item.onClick?.(); }}>{item.label}</button>;
      })}
    </div>}
  </>;
}
