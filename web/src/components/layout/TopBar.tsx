import React from 'react';
import { BellIcon, QrCodeIcon, SearchIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { apiMode } from '../../services/mode';
import { BrandMark } from './BrandMark';
import { RoleSwitcher } from './RoleSwitcher';
interface TopBarProps {
  onSearch: () => void;
  onScan: () => void;
  onNotifications: () => void;
}
const iconBtn = 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-muted transition-colors duration-150 ease-out hover:bg-sunken hover:text-ink';
export function TopBar({
  onSearch,
  onScan,
  onNotifications
}: TopBarProps) {
  const { notifications } = useApp();
  const unread = notifications.filter((n) => !n.read).length;
  return <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 md:px-6">
      <div className="shrink-0 md:hidden">
        <BrandMark size={32} />
      </div>

      <button onClick={onSearch} className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-canvas px-3.5 text-left text-[15px] text-ink-subtle transition-colors duration-150 ease-out hover:border-line-strong lg:max-w-md">
        <SearchIcon className="h-5 w-5 shrink-0" />
        <span className="truncate">Search orders, customers, fabrics…</span>
        <kbd className="ml-auto hidden rounded-md border border-line-strong bg-surface px-1.5 py-0.5 text-xs font-medium text-ink-subtle lg:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {!apiMode && <span className="hidden rounded-full bg-attention-soft px-2.5 py-1 text-xs font-medium text-attention md:inline">Demo data</span>}
        <button onClick={onScan} title="Scan an order tag, fabric swatch or garment label" aria-label="Scan QR code or barcode" className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-sunken">
          <QrCodeIcon className="h-5 w-5 text-brand" />
          <span className="hidden whitespace-nowrap sm:inline">Scan QR</span>
        </button>
        
        <button onClick={onNotifications} title="Notifications" aria-label={`Notifications, ${unread} unread`} className={iconBtn}>
          <BellIcon className="h-5 w-5" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white ring-2 ring-surface">{unread}</span>}
        </button>
        <div className="ml-1 flex items-center border-l border-line pl-2">
          <RoleSwitcher />
        </div>
      </div>
    </header>;
}