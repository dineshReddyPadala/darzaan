import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { NotificationsPanel } from './NotificationsPanel';
import { PricePrompt } from './PricePrompt';
import { ScannerDialog } from './ScannerDialog';
import { SearchDialog } from './SearchDialog';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({
      top: 0
    });
  }, [location.pathname]);
  return <div className="flex h-screen w-full overflow-hidden bg-canvas text-ink">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onSearch={() => setSearchOpen(true)} onScan={() => setScanOpen(true)} onNotifications={() => setNotifOpen(true)} />
        <main id="main-scroll" className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScannerDialog open={scanOpen} onClose={() => setScanOpen(false)} />
      <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
      <PricePrompt />
    </div>;
}