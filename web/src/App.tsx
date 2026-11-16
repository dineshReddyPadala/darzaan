import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { RequireAuth, StoreShell } from './components/layout/RequireAuth';
import { RoleGate, RoleHome } from './components/layout/RoleGate';
import { AppProvider } from './contexts/AppContext';
import { LogisticsProvider } from './contexts/LogisticsContext';
import { PackagesProvider } from './contexts/PackagesContext';
import { PriceRequestsProvider } from './contexts/PriceRequestsContext';
import { QcProvider } from './contexts/QcContext';
import { LegacyRedirect } from './components/layout/LegacyRedirect';
import { StoreProvider } from './contexts/StoreContext';
import { useEffect } from 'react';

const lazyPage = (loader: () => Promise<Record<string, React.ComponentType>>) => lazy(async () => {
  const module = await loader();
  const component = Object.values(module)[0];
  return { default: component };
});

const Today = lazyPage(() => import('./pages/Today'));
const CalendarPage = lazyPage(() => import('./pages/CalendarPage'));
const CustomerProfile = lazyPage(() => import('./pages/CustomerProfile'));
const Customers = lazyPage(() => import('./pages/Customers'));
const CustomerTracker = lazyPage(() => import('./pages/CustomerTracker'));
const Dashboard = lazyPage(() => import('./pages/Dashboard'));
const Inventory = lazyPage(() => import('./pages/Inventory'));
const NewOrder = lazyPage(() => import('./pages/NewOrder'));
const OrderConfirmation = lazyPage(() => import('./pages/OrderConfirmation'));
const OrderDetail = lazyPage(() => import('./pages/OrderDetail'));
const Orders = lazyPage(() => import('./pages/Orders'));
const Payments = lazyPage(() => import('./pages/Payments'));
const DesignSystem = lazyPage(() => import('./pages/DesignSystem'));
const Production = lazyPage(() => import('./pages/Production'));
const QcInspectionPage = lazyPage(() => import('./pages/qc/QcInspectionPage'));
const QcQueuePage = lazyPage(() => import('./pages/qc/QcQueuePage'));
const Reports = lazyPage(() => import('./pages/Reports'));
const Settings = lazyPage(() => import('./pages/Settings'));
const Storefront = lazyPage(() => import('./pages/Storefront'));
const PrintTemplates = lazyPage(() => import('./pages/PrintTemplates'));
const Team = lazyPage(() => import('./pages/Team'));
const EmployeeForm = lazyPage(() => import('./pages/EmployeeForm'));
const EmployeeDetail = lazyPage(() => import('./pages/EmployeeDetail'));
const Categories = lazyPage(() => import('./pages/Categories'));
const CategoryEditor = lazyPage(() => import('./pages/CategoryEditor'));
const AuditLog = lazyPage(() => import('./pages/AuditLog'));
const Consultations = lazyPage(() => import('./pages/Consultations'));
const StoreLocations = lazyPage(() => import('./pages/StoreLocations'));
const DriverDeliveries = lazyPage(() => import('./pages/delivery/DriverDeliveries'));
const PackingQueue = lazyPage(() => import('./pages/delivery/PackingQueue'));
const PackOrder = lazyPage(() => import('./pages/delivery/PackOrder'));
const ShipmentDetail = lazyPage(() => import('./pages/delivery/ShipmentDetail'));
const StoreReceiving = lazyPage(() => import('./pages/delivery/StoreReceiving'));
const Login = lazyPage(() => import('./pages/Login'));
const ForgotPassword = lazyPage(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyPage(() => import('./pages/ResetPassword'));
const ChangePassword = lazyPage(() => import('./pages/ChangePassword'));
const NotFound = lazyPage(() => import('./pages/NotFound'));

function ScreenFallback() {
  return <div className="p-6" aria-hidden>
    <div className="h-8 w-48 animate-pulse rounded-lg bg-sunken" />
    <div className="mt-6 h-40 animate-pulse rounded-2xl bg-sunken" />
  </div>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function App() {
  return <BrowserRouter>
      <ScrollToTop />
      <AppProvider>
        <Toaster position="top-center" toastOptions={{
        style: {
          borderRadius: 14,
          border: '1px solid #ECE8DF',
          background: '#FFFFFF',
          color: '#2E2D26',
          fontFamily: 'Inter'
        }
      }} />
        <PriceRequestsProvider>
        <QcProvider>
        <StoreProvider>
        <LogisticsProvider>
        <PackagesProvider>
        <Suspense fallback={<ScreenFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/track/:id" element={<CustomerTracker />} />
          <Route path="/shop" element={<Storefront />} />
          <Route path="/printtemplates" element={<PrintTemplates />} />
          <Route path="/designsystem" element={<DesignSystem />} />
          <Route path="/designsytem" element={<DesignSystem />} />
          <Route element={<RequireAuth />}>
            <Route path="change-password" element={<ChangePassword />} />
            <Route element={<StoreShell />}>
            <Route index element={<RoleHome />} />
            <Route path="today" element={<RoleGate screen="today"><Today /></RoleGate>} />
            <Route path="dashboard" element={<RoleGate screen="dashboard"><Dashboard /></RoleGate>} />
            <Route path="customers" element={<RoleGate screen="customers"><Customers /></RoleGate>} />
            <Route path="customers/:id" element={<RoleGate screen="customers"><CustomerProfile /></RoleGate>} />
            <Route path="orders" element={<RoleGate screen="orders"><Orders /></RoleGate>} />
            <Route path="orders/new" element={<RoleGate screen="orders" perm={{
                      entity: 'order',
                      action: 'create'
                    }}><NewOrder /></RoleGate>} />
            <Route path="orders/:id" element={<RoleGate screen="orders" orderView><OrderDetail /></RoleGate>} />
            <Route path="orders/:id/confirmed" element={<RoleGate screen="orders"><OrderConfirmation /></RoleGate>} />
            <Route path="orders/:id/handover" element={<LegacyRedirect to="handover" />} />
            <Route path="calendar" element={<RoleGate screen="calendar"><CalendarPage /></RoleGate>} />
            <Route path="production" element={<RoleGate screen="production"><Production /></RoleGate>} />
            <Route path="qc" element={<RoleGate screen="qc"><QcQueuePage /></RoleGate>} />
            <Route path="qc/:orderId/:garmentId" element={<RoleGate screen="qc"><QcInspectionPage /></RoleGate>} />
            <Route path="qc/:orderId/:garmentId/inspect" element={<RoleGate screen="qc"><QcInspectionPage /></RoleGate>} />
            <Route path="inventory" element={<RoleGate screen="inventory"><Inventory /></RoleGate>} />
            <Route path="packing" element={<RoleGate screen="packing"><PackingQueue /></RoleGate>} />
            <Route path="packing/:id" element={<RoleGate screen="packing"><PackOrder /></RoleGate>} />
            <Route path="shipments/:id" element={<RoleGate screen="packing"><ShipmentDetail /></RoleGate>} />
            <Route path="route" element={<RoleGate screen="pickup"><DriverDeliveries /></RoleGate>} />
            <Route path="receiving" element={<RoleGate screen="handover"><StoreReceiving /></RoleGate>} />
            {['scan', 'logistics', 'shipments', 'dispatch', 'handover', 'receive', 'receive/:id', 'pickup', 'deliver'].map((p) => <Route key={p} path={p} element={<LegacyRedirect to="scan" />} />)}
            <Route path="payments" element={<RoleGate screen="payments"><Payments /></RoleGate>} />
            <Route path="reports" element={<RoleGate screen="reports"><Reports /></RoleGate>} />
            <Route path="team" element={<RoleGate screen="team"><Team /></RoleGate>} />
            <Route path="team/new" element={<RoleGate screen="team"><EmployeeForm /></RoleGate>} />
            <Route path="team/:id/edit" element={<RoleGate screen="team"><EmployeeForm /></RoleGate>} />
            <Route path="team/:id" element={<RoleGate screen="team"><EmployeeDetail /></RoleGate>} />
            <Route path="master/locations" element={<RoleGate screen="locations"><StoreLocations /></RoleGate>} />
            <Route path="master/categories" element={<RoleGate screen="categories"><Categories /></RoleGate>} />
            <Route path="master/categories/:name" element={<RoleGate screen="categories"><CategoryEditor /></RoleGate>} />
            <Route path="audit" element={<RoleGate screen="audit"><AuditLog /></RoleGate>} />
            <Route path="consultations" element={<RoleGate screen="consultations"><Consultations /></RoleGate>} />
            <Route path="settings" element={<RoleGate screen="settings"><Settings /></RoleGate>} />
            <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
        </Suspense>
        </PackagesProvider>
        </LogisticsProvider>
        </StoreProvider>
        </QcProvider>
        </PriceRequestsProvider>
      </AppProvider>
    </BrowserRouter>;
}
