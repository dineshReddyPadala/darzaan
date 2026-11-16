import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { customers as seedCustomers } from '../data/customers';
import { notifications as seedNotifications } from '../data/notifications';
import { orders as seedOrders } from '../data/orders';
import { quotes as seedQuotes } from '../data/quotes';
import type { ActivityKind, AppNotification, Customer, DraftQuote, Order, Perm, PermAction, PermEntity, Role } from '../types';
import { nowIso, uid } from '../utils/format';
import { useSharedState } from '../hooks/useSharedState';
import { createNotification, createOrder, markAllNotifications, markNotification, putCollection, removeNotification, saveCustomer, updateOrder as persistOrder } from '../services/api';
import { apiMode } from '../services/mode';
import { readSession } from '../services/session';
import { demoMode, demoRoleParam } from '../utils/demo';
import { can as roleCan, hasRole, namesMatch, notificationVisible, roleDefFor, workshopStages, type RoleDef } from '../utils/roles';
/** Sample data: every garment in the workshop has one production assistant, so each assistant's board has work. */
const SAMPLE_ASSISTANTS = ['Manoj Tiwari', 'Sunita Rao', 'Deepak Mehra'];
export const initialOrders: Order[] = seedOrders.map((o, oi) => ({
  ...o,
  garments: o.garments.map((g, gi) => g.productionAssistant || !workshopStages.includes(g.stage) ? g : {
    ...g,
    productionAssistant: SAMPLE_ASSISTANTS[(oi + gi) % SAMPLE_ASSISTANTS.length]
  })
}));
interface AppContextValue {
  role: Role;
  /** Switch the signed-in persona (prototype). Order data is kept across switches. */
  setRole: (r: Role) => void;
  roleDef: RoleDef;
  user: RoleDef['user'] & { email?: string; id?: string | number; storeId?: string | number };
  /** Orders this role is allowed to see. */
  orders: Order[];
  customers: Customer[];
  quotes: DraftQuote[];
  notifications: AppNotification[];
  can: (entity: PermEntity, action: PermAction) => boolean;
  /** Checks a permission at the moment of writing; shows a message and returns false when blocked. */
  guard: (perm: Perm) => boolean;
  getOrder: (id: string) => Order | undefined;
  getCustomer: (id: string) => Customer | undefined;
  customerName: (id: string) => string;
  addOrder: (o: Order) => Promise<Order | false>;
  updateOrder: (id: string, fn: (o: Order) => Order, perm?: Perm) => boolean;
  logActivity: (orderId: string, what: string, kind: ActivityKind) => void;
  addCustomer: (c: Customer) => Promise<Customer | false>;
  /** Customers who sign up themselves on the storefront — not tied to a staff role. */
  addWebCustomer: (c: Customer) => void;
  updateCustomer: (id: string, fn: (c: Customer) => Customer) => boolean;
  saveQuote: (q: DraftQuote) => void;
  removeQuote: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  snooze: (id: string) => void;
  /** Push an in-app alert (shown to the roles it’s relevant to). */
  notify: (n: Omit<AppNotification, 'id' | 'at' | 'read'>) => void;
}
const AppContext = createContext<AppContextValue | null>(null);
const ORDER_UPDATE: Perm = {
  entity: 'order',
  action: 'update'
};
const ROLE_KEY = 'darzaan.role';
function initialRole(fallback: Role): Role {
  if (apiMode) {
    const session = readSession();
    if (session?.user.role) return session.user.role;
  }
  const as = demoRoleParam();
  if (as && hasRole(as)) return as;
  try {
    const saved = localStorage.getItem(ROLE_KEY) as Role | null;
    if (saved && hasRole(saved)) return saved;
  } catch {

    /* storage unavailable */}
  return fallback;
}
export function AppProvider({
  defaultRole = 'admin',
  children



}: {defaultRole?: Role;children: React.ReactNode;}) {
  const [role, setRoleState] = useState<Role>(() => initialRole(defaultRole));
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    // The demo's live screen switches people per step without changing the app's saved role.
    if (demoMode) return;
    try {
      localStorage.setItem(ROLE_KEY, r);
    } catch {

      /* storage unavailable */}
  }, []);
  const [allOrders, setOrders] = useSharedState<Order[]>('orders', initialOrders);
  const [customers, setCustomers] = useSharedState<Customer[]>('customers', seedCustomers);
  const [quotes, setQuotes] = useSharedState<DraftQuote[]>('quotes', seedQuotes);
  const [notifications, setNotifications] = useSharedState<AppNotification[]>('notifications', seedNotifications);
  const roleDef = roleDefFor(role);
  const session = apiMode ? readSession() : null;
  const user: RoleDef['user'] & { email?: string; id?: string | number; storeId?: number } = session?.user
    ? { name: session.user.name, title: session.user.title, location: session.user.location, store: session.user.store, storeId: session.user.storeId, email: session.user.email, id: session.user.id }
    : roleDef.user;
  const orders = useMemo(() => {
    const ready = allOrders.map((order) => ({
      ...order,
      deliveryDate: order.deliveryDate || order.garments?.find((garment) => garment.deliveryDate)?.deliveryDate || order.createdAt?.slice(0, 10) || '',
      garments: order.garments ?? [],
      payments: order.payments ?? [],
      alterations: order.alterations ?? [],
      changeRequests: order.changeRequests ?? [],
      activity: order.activity ?? [],
    }));
    if (role === 'tailor') {
      return ready
        .filter((order) => (order.tasks ?? []).some((task) => namesMatch(task.assignee, user.name)) || order.garments.some((garment) => namesMatch(garment.assignee, user.name)))
        .map((order) => ({ ...order, tasks: (order.tasks ?? []).filter((task) => namesMatch(task.assignee, user.name)) }));
    }
    if (!roleDef.scope.ownStoreOnly) return ready;
    return ready.filter((order) => {
      if (user.storeId != null && order.storeId != null) return Number(order.storeId) === Number(user.storeId);
      return !!user.store && order.store === user.store;
    });
  }, [allOrders, role, roleDef, user.name, user.store, user.storeId]);
  const visibleNotifications = useMemo(() => notifications.filter((n) => notificationVisible(role, n)), [notifications, role]);
  const can = useCallback((entity: PermEntity, action: PermAction) => roleCan(role, entity, action), [role]);
  const guard = useCallback((perm: Perm) => {
    if (roleCan(role, perm.entity, perm.action)) return true;
    toast.error('Not part of your role', {
      description: `${roleDefFor(role).label} can’t ${perm.action} ${perm.entity.replace('_', ' ')} records.`
    });
    return false;
  }, [role]);
  const getOrder = useCallback((id: string) => orders.find((o) => String(o.id).toLowerCase() === id.toLowerCase()), [orders]);
  const getCustomer = useCallback((id: string) => customers.find((c) => String(c.id) === String(id)), [customers]);
  const customerName = useCallback((id: string) => customers.find((c) => String(c.id) === String(id))?.name ?? 'Unknown customer', [customers]);
  const addOrder = useCallback(async (o: Order) => {
    if (!guard({
      entity: 'order',
      action: 'create'
    })) return false;
    if (!apiMode) {
      setOrders((prev) => [o, ...prev]);
      return o;
    }
    try {
      const saved = await createOrder(o) as Order;
      setOrders((prev) => [saved, ...prev]);
      return saved;
    } catch {
      toast.error('Could not save the order. Try again.');
      return false;
    }
  }, [guard]);
  const updateOrder = useCallback((id: string, fn: (o: Order) => Order, perm: Perm = ORDER_UPDATE) => {
    if (!guard(perm)) return false;
    setOrders((prev) => {
      const next = prev.map((o) => String(o.id) === String(id) ? fn(o) : o);
      const changed = next.find((o) => String(o.id) === String(id));
      if (apiMode && changed) void persistOrder(changed).catch(() => toast.error('Could not save the order. Try again.'));
      return next;
    });
    return true;
  }, [guard]);
  const logActivity = useCallback((orderId: string, what: string, kind: ActivityKind) => setOrders((prev) => prev.map((o) => String(o.id) === String(orderId) ? {
    ...o,
    activity: [...o.activity, {
      id: uid('A'),
      at: nowIso(),
      who: `${user.name} · ${roleDef.label}`,
      what,
      kind
    }]
  } : o)), [user.name, roleDef.label]);
  const addCustomer = useCallback(async (c: Customer): Promise<Customer | false> => {
    if (!guard({
      entity: 'customer',
      action: 'create'
    })) return false;
    if (!apiMode) {
      setCustomers((prev) => [c, ...prev]);
      return c;
    }
    try {
      const saved = await saveCustomer(c, true) as Customer;
      setCustomers((prev) => [saved, ...prev]);
      return saved;
    } catch {
      toast.error('Could not save the customer. Try again.');
      return false;
    }
  }, [guard]);
  const addWebCustomer = useCallback((c: Customer) => {
    setCustomers((prev) => [c, ...prev]);
    if (apiMode) void saveCustomer(c, true).catch(() => undefined);
  }, []);
  const updateCustomer = useCallback((id: string, fn: (c: Customer) => Customer) => {
    if (!guard({
      entity: 'customer',
      action: 'update'
    })) return false;
    setCustomers((prev) => {
      const next = prev.map((c) => String(c.id) === String(id) ? fn(c) : c);
      const changed = next.find((c) => String(c.id) === String(id));
      if (apiMode && changed) void saveCustomer(changed, false).catch(() => toast.error('Could not save the customer. Try again.'));
      return next;
    });
    return true;
  }, [guard]);
  const saveQuote = useCallback((q: DraftQuote) => setQuotes((prev) => {
    const next = [q, ...prev.filter((p) => p.id !== q.id)];
    if (apiMode) void putCollection('quotes', next).catch(() => undefined);
    return next;
  }), []);
  const removeQuote = useCallback((id: string) => setQuotes((prev) => {
    const next = prev.map((quote) => quote.id === id ? { ...quote, deletedAt: new Date().toISOString() } : quote);
    if (apiMode) void putCollection('quotes', next).catch(() => undefined);
    return next;
  }), []);
  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    if (apiMode) void markNotification(id).catch(() => undefined);
  }, []);
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (apiMode) void markAllNotifications().catch(() => undefined);
  }, []);
  const snooze = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (apiMode) void removeNotification(id).catch(() => undefined);
  }, []);
  const notify = useCallback((n: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
    const item = { ...n, id: uid('N'), at: nowIso(), read: false };
    setNotifications((prev) => [item, ...prev]);
    if (apiMode) void createNotification(item).catch(() => undefined);
  }, []);
  const value = useMemo(() => ({
    role,
    setRole,
    roleDef,
    user,
    orders,
    customers,
    quotes: quotes.filter((quote) => !quote.deletedAt),
    notifications: visibleNotifications,
    can,
    guard,
    getOrder,
    getCustomer,
    customerName,
    addOrder,
    updateOrder,
    logActivity,
    addCustomer,
    addWebCustomer,
    updateCustomer,
    saveQuote,
    removeQuote,
    markRead,
    markAllRead,
    snooze,
    notify
  }), [role, setRole, roleDef, user, orders, customers, quotes, visibleNotifications, can, guard, getOrder, getCustomer, customerName, addOrder, updateOrder, logActivity, addCustomer, addWebCustomer, updateCustomer, saveQuote, removeQuote, markRead, markAllRead, snooze, notify]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}