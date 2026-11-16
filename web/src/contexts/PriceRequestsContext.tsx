import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useSyncedList } from '../hooks/useSyncedList';
import { differenceInMinutes, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { priceRequests as seedRequests } from '../data/priceRequests';
import type { PriceRequest, Role } from '../types';
import { inr, nowIso, uid } from '../utils/format';
import { useApp } from './AppContext';

/** Who prices custom designs, and who hears back. */
export const PRICER: Role = 'production_head';
const PRICER_NAME = 'Vikram Rathore';
/** Prototype only: how long before the workshop's price drops in by itself. */
const AUTO_CONFIRM_MS = 7000;
const STORE_ROLES: Role[] = ['admin', 'store_manager', 'salesperson'];
/** After this long without an answer the workshop is reminded and the store is told to call. */
export const REMIND_AFTER_MIN = 30;
const PERM = {
  entity: 'production_task',
  action: 'update'
} as const;
export type NewPriceRequest = Omit<PriceRequest, 'id' | 'status' | 'messages' | 'requestedAt' | 'requestedBy'>;
interface PriceRequestsValue {
  requests: PriceRequest[];
  /** Waiting on the workshop (new, or the store answered a question). */
  open: PriceRequest[];
  get: (id?: string) => PriceRequest | undefined;
  create: (r: NewPriceRequest, autoAmount?: number) => string;
  cancel: (id: string) => void;
  /** Ties a draft's request to the saved order so a late answer updates it. */
  link: (id: string, orderId: string, garmentId: string) => void;
  confirm: (id: string, amount: number, extraDays: number) => void;
  ask: (id: string, text: string) => void;
  decline: (id: string, text: string) => void;
  reply: (id: string, text: string) => void;
}
const Ctx = createContext<PriceRequestsValue | null>(null);
export function minutesWaiting(r: Pick<PriceRequest, 'requestedAt'>): number {
  return Math.max(0, differenceInMinutes(parseISO(nowIso()), parseISO(r.requestedAt)));
}
export function PriceRequestsProvider({
  children


}: {children: React.ReactNode;}) {
  const {
    user,
    notify,
    updateOrder
  } = useApp();
  const [requests, setRequests] = useSyncedList<PriceRequest[]>('priceRequests', seedRequests);
  const patch = useCallback((id: string, fn: (r: PriceRequest) => PriceRequest) => setRequests((prev) => prev.map((r) => r.id === id ? fn(r) : r)), []);
  const get = useCallback((id?: string) => requests.find((r) => r.id === id), [requests]);
  const tellPricer = useCallback((r: PriceRequest, title: string, body: string) => notify({
    category: 'Action Required',
    severity: 'attention',
    title,
    body,
    href: `/production?price=${r.id}`,
    hrefLabel: 'Price it',
    audience: [PRICER]
  }), [notify]);
  const tellStore = useCallback((r: PriceRequest, title: string, body: string, severity: 'info' | 'attention' | 'warning' = 'info') => notify({
    category: 'Order Updates',
    severity,
    title,
    body,
    orderId: r.orderId,
    audience: STORE_ROLES
  }), [notify]);
  const create = useCallback((input: NewPriceRequest, autoAmount?: number) => {
    const r: PriceRequest = {
      ...input,
      id: uid('PR'),
      status: 'Pending',
      messages: [],
      requestedAt: nowIso(),
      requestedBy: user.name
    };
    setRequests((prev) => [r, ...prev]);
    // Prototype: the Production Head answers on his own after a few seconds if nobody prices it first.
    if (autoAmount) {
      window.setTimeout(() => setRequests((prev) => prev.map((x) => x.id === r.id && x.status === 'Pending' ? {
        ...x,
        status: 'Confirmed',
        amount: autoAmount,
        extraDays: 0,
        answeredBy: PRICER_NAME,
        answeredAt: nowIso()
      } : x)), AUTO_CONFIRM_MS);
    }
    tellPricer(r, 'Price needed · custom design', `${r.garmentLabel} for ${r.customerName} — sent by ${r.requestedBy}. The store is carrying on with the order.`);
    toast('Sent to the workshop for a price', {
      description: 'Carry on — the price drops in as soon as it’s confirmed.'
    });
    return r.id;
  }, [user.name, tellPricer]);
  const cancel = useCallback((id: string) => patch(id, (r) => ({
    ...r,
    status: 'Cancelled'
  })), [patch]);
  const link = useCallback((id: string, orderId: string, garmentId: string) => patch(id, (r) => ({
    ...r,
    orderId,
    garmentId
  })), [patch]);

  /** Write the answer onto a saved order (drafts pick it up from the order form). */
  const syncOrder = useCallback((r: PriceRequest, status: 'Confirmed' | 'Question' | 'Declined', amount?: number, extraDays?: number, activity?: string) => {
    if (!r.orderId || !r.garmentId) return;
    updateOrder(r.orderId, (o) => ({
      ...o,
      garments: o.garments.map((g) => g.id === r.garmentId && g.customQuote ? {
        ...g,
        customQuote: {
          ...g.customQuote,
          status,
          amount,
          extraDays,
          confirmedBy: status === 'Confirmed' ? user.name : undefined
        }
      } : g),
      activity: activity ? [...o.activity, {
        id: uid('A'),
        at: nowIso(),
        who: `${user.name} · Production Head`,
        what: activity,
        kind: 'production' as const
      }] : o.activity
    }), PERM);
  }, [updateOrder, user.name]);
  const confirm = useCallback((id: string, amount: number, extraDays: number) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    const at = nowIso();
    patch(id, (x) => ({
      ...x,
      status: 'Confirmed',
      amount,
      extraDays,
      answeredBy: user.name,
      answeredAt: at
    }));
    const days = extraDays ? ` · needs ${extraDays} extra day${extraDays > 1 ? 's' : ''}` : '';
    syncOrder(r, 'Confirmed', amount, extraDays, `Custom design priced at ${inr(amount)}${days}`);
    tellStore(r, `Design price confirmed · ${inr(amount)}`, r.orderId ? `${r.garmentLabel} on ${r.orderId} — the order total is updated. Let ${r.customerName} know${days}.` : `${r.garmentLabel} for ${r.customerName} — added to the order summary${days}.`, extraDays ? 'attention' : 'info');
    toast.success(`Price sent to the store · ${inr(amount)}`);
  }, [requests, patch, user.name, syncOrder, tellStore]);
  const ask = useCallback((id: string, text: string) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    patch(id, (x) => ({
      ...x,
      status: 'Question',
      messages: [...x.messages, {
        from: 'workshop',
        who: user.name,
        text,
        at: nowIso()
      }]
    }));
    syncOrder(r, 'Question');
    tellStore(r, 'Workshop has a question about a design', `${r.garmentLabel} for ${r.customerName}: “${text}”`, 'attention');
    toast.success('Question sent to the store');
  }, [requests, patch, user.name, syncOrder, tellStore]);
  const decline = useCallback((id: string, text: string) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    patch(id, (x) => ({
      ...x,
      status: 'Declined',
      answeredBy: user.name,
      answeredAt: nowIso(),
      messages: [...x.messages, {
        from: 'workshop',
        who: user.name,
        text,
        at: nowIso()
      }]
    }));
    syncOrder(r, 'Declined', undefined, undefined, `Custom design can’t be made as drawn: ${text}`);
    tellStore(r, 'Workshop can’t make this design', `${r.garmentLabel} for ${r.customerName}: “${text}”`, 'warning');
    toast('Sent back to the store');
  }, [requests, patch, user.name, syncOrder, tellStore]);
  const reply = useCallback((id: string, text: string) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    patch(id, (x) => ({
      ...x,
      status: 'Pending',
      messages: [...x.messages, {
        from: 'store',
        who: user.name,
        text,
        at: nowIso()
      }]
    }));
    syncOrder(r, 'Question');
    tellPricer(r, 'Store answered your question', `${r.garmentLabel} for ${r.customerName}: “${text}”`);
    toast.success('Reply sent to the workshop');
  }, [requests, patch, user.name, syncOrder, tellPricer]);

  // Nudge the workshop once if a request has waited too long.
  useEffect(() => {
    const check = () => {
      requests.filter((r) => r.status === 'Pending' && !r.remindedAt && minutesWaiting(r) >= REMIND_AFTER_MIN).forEach((r) => {
        patch(r.id, (x) => ({
          ...x,
          remindedAt: nowIso()
        }));
        tellPricer(r, `Still waiting · ${minutesWaiting(r)} min`, `${r.garmentLabel} for ${r.customerName} — the store is waiting on this price.`);
      });
    };
    check();
    const t = window.setInterval(check, 30_000);
    return () => window.clearInterval(t);
  }, [requests, patch, tellPricer]);
  const open = useMemo(() => requests.filter((r) => r.status === 'Pending').sort((a, b) => a.requestedAt.localeCompare(b.requestedAt)), [requests]);
  const value = useMemo(() => ({
    requests,
    open,
    get,
    create,
    cancel,
    link,
    confirm,
    ask,
    decline,
    reply
  }), [requests, open, get, create, cancel, link, confirm, ask, decline, reply]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function usePriceRequests(): PriceRequestsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePriceRequests must be used inside PriceRequestsProvider');
  return ctx;
}