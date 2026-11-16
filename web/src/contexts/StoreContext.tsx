import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { differenceInMinutes, parseISO } from 'date-fns';
import { ESCALATE_AFTER_HOURS, MAX_CONTACT_ATTEMPTS, RACK_SPOTS, floorDrafts as seedDrafts, floorRequests as seedRequests, messageTemplates, swatchLoans as seedLoans, type MessageKey } from '../data/store';
import type { CashClose, FloorDraft, FloorRequest, SwatchLoan } from '../types';
import { inr, nowIso, TODAY_ISO, uid } from '../utils/format';
import { roleDefs } from '../utils/roles';
import { useSyncedList } from '../hooks/useSyncedList';
import { publicBooking } from '../services/api';
import { apiMode } from '../services/mode';
import { useApp } from './AppContext';
type NewRequest = Omit<FloorRequest, 'id' | 'at' | 'by' | 'status'>;
export interface WebBooking {
  name: string;
  mobile: string;
  city: string;
  garments: string[];
  visit: string;
  note: string;
}
const digits = (s: string) => s.replace(/\D/g, '').slice(-10);
interface StoreValue {
  managerName: string;
  managerInStore: boolean;
  setManagerInStore: (v: boolean) => void;
  /** Store-floor roles that run counters, trials and handovers. */
  isFloor: boolean;
  isManager: boolean;
  rackFor: (orderId: string, garmentId: string) => string;
  setRack: (orderId: string, garmentId: string, spot: string) => void;
  reportNotOnRack: (orderId: string, garmentId: string, label: string) => void;
  sendMessage: (orderId: string, key: MessageKey) => void;
  requests: FloorRequest[];
  requestApproval: (r: NewRequest) => FloorRequest | null;
  decideRequest: (id: string, approve: boolean, note: string) => void;
  isEscalated: (r: FloorRequest) => boolean;
  approvedFor: (orderId: string, kind: FloorRequest['kind']) => FloorRequest | undefined;
  waitingFor: (orderId: string, kind: FloorRequest['kind']) => FloorRequest | undefined;
  drafts: FloorDraft[];
  saveDraft: (d: Omit<FloorDraft, 'id' | 'at' | 'by'>) => void;
  /** A customer's consultation booking from the public storefront. Lands with the Designer as a draft. */
  submitWebBooking: (b: WebBooking) => {
    draftId: string;
    returning: boolean;
  };
  updateDraft: (id: string, patch: Partial<FloorDraft>) => void;
  loans: SwatchLoan[];
  lendSwatch: (fabricId: string, label: string, customerId: string, due: string) => void;
  returnSwatch: (id: string) => void;
  closes: CashClose[];
  submitClose: (c: Omit<CashClose, 'id' | 'date' | 'by' | 'status'>) => void;
  confirmClose: (id: string) => void;
}
const StoreContext = createContext<StoreValue | null>(null);
const FLOOR_ROLES = ['admin', 'store_manager', 'salesperson'];
const ORDER_UPDATE = {
  entity: 'order',
  action: 'update'
} as const;

/** A stable default spot so seeded garments already "sit" somewhere on the rack. */
function defaultSpot(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i += 1) h = (h * 31 + tag.charCodeAt(i)) % 997;
  return RACK_SPOTS[h % RACK_SPOTS.length];
}
export function StoreProvider({
  children


}: {children: React.ReactNode;}) {
  const {
    role,
    roleDef,
    user,
    getOrder,
    updateOrder,
    logActivity,
    notify,
    customerName,
    customers,
    addWebCustomer
  } = useApp();
  const managerName = roleDefs.store_manager.user.name;
  const [managerInStore, setInStore] = useState(true);
  const [rack, setRackMap] = useState<Record<string, string>>({});
  const [requests, setRequests] = useSyncedList<FloorRequest[]>('floorRequests', seedRequests);
  const [drafts, setDrafts] = useSyncedList<FloorDraft[]>('floorDrafts', seedDrafts);
  const [loans, setLoans] = useSyncedList<SwatchLoan[]>('swatchLoans', seedLoans);
  const [closes, setCloses] = useSyncedList<CashClose[]>('cashCloses', []);
  const isFloor = FLOOR_ROLES.includes(role);
  const isManager = !!roleDef.oversight;
  const deny = useCallback((what: string) => {
    toast.error('Not part of your role', {
      description: `${roleDef.label} can’t ${what}.`
    });
  }, [roleDef.label]);
  const setManagerInStore = useCallback((v: boolean) => {
    if (!isManager) return deny('change the manager’s status');
    setInStore(v);
    toast.success(v ? 'Marked in store' : 'Marked away', {
      description: v ? 'Receipts come to you again.' : 'The floor can confirm receipts; you’ll get a summary of each.'
    });
  }, [isManager, deny]);
  const rackFor = useCallback((orderId: string, garmentId: string) => rack[`${orderId}-${garmentId}`] ?? defaultSpot(`${orderId}-${garmentId}`), [rack]);
  const setRack = useCallback((orderId: string, garmentId: string, spot: string) => {
    if (!isFloor) return deny('move garments on the rack');
    setRackMap((p) => ({
      ...p,
      [`${orderId}-${garmentId}`]: spot
    }));
    const g = getOrder(orderId)?.garments.find((x) => x.id === garmentId);
    logActivity(orderId, `${g?.subCategory ?? garmentId} placed on ${spot}`, 'logistics');
  }, [isFloor, deny, getOrder, logActivity]);
  const reportNotOnRack = useCallback((orderId: string, garmentId: string, label: string) => {
    if (!isFloor) return deny('report missing garments');
    const spot = rackFor(orderId, garmentId);
    updateOrder(orderId, (o) => ({
      ...o,
      risk: {
        severity: 'warning',
        message: `${label} not on ${spot} — store searching`,
        owner: managerName
      }
    }));
    logActivity(orderId, `${label} not found on ${spot} — last recorded at the store. Manager alerted.`, 'logistics');
    notify({
      category: 'Action Required',
      severity: 'warning',
      title: `${label} not on the rack`,
      body: `${orderId} · expected on ${spot}. Raised by ${user.name}.`,
      orderId
    });
    toast.success('Manager alerted', {
      description: `${managerName} has the last known location.`
    });
  }, [isFloor, deny, rackFor, updateOrder, logActivity, notify, user.name, managerName]);
  const sendMessage = useCallback((orderId: string, key: MessageKey) => {
    const tpl = messageTemplates.find((t) => t.key === key)!;
    const o = getOrder(orderId);
    if (!o) return;
    const attempts = (o.trial?.contactAttempts ?? 0) + (key === 'reschedule' ? 1 : 0);
    const escalate = key === 'reschedule' && attempts >= MAX_CONTACT_ATTEMPTS;
    const ok = updateOrder(orderId, (x) => ({
      ...x,
      trial: key === 'reschedule' && x.trial ? {
        ...x.trial,
        contactAttempts: attempts
      } : x.trial,
      risk: escalate ? {
        severity: 'warning',
        message: `No reply after ${attempts} reschedule messages`,
        owner: managerName
      } : x.risk,
      messages: [...x.messages, {
        id: uid('M'),
        channel: 'WhatsApp',
        template: tpl.label,
        at: nowIso(),
        status: 'Delivered'
      }]
    }), ORDER_UPDATE);
    if (!ok) return;
    logActivity(orderId, `WhatsApp sent: ${tpl.label}${key === 'reschedule' ? ` (attempt ${attempts})` : ''}`, 'communication');
    if (escalate) notify({
      category: 'Customer',
      severity: 'warning',
      title: 'Customer not responding',
      body: `${customerName(o.customerId)} · ${orderId} — ${attempts} reschedule messages without reply.`,
      orderId
    });
    toast.success(`${tpl.label} sent`, {
      description: escalate ? `Third attempt — passed to ${managerName}.` : `To ${customerName(o.customerId)} on WhatsApp.`
    });
  }, [getOrder, updateOrder, logActivity, notify, customerName, managerName]);
  const requestApproval = useCallback((r: NewRequest) => {
    if (!isFloor) {
      deny('send requests to the manager');
      return null;
    }
    const req: FloorRequest = {
      ...r,
      id: uid('FR'),
      at: nowIso(),
      by: user.name,
      status: 'Waiting'
    };
    setRequests((p) => [req, ...p]);
    if (r.orderId) logActivity(r.orderId, `Asked ${managerName}: ${r.kind}${r.amount ? ` ${inr(r.amount)}` : ''} — ${r.reason}`, 'change');
    notify({
      category: 'Action Required',
      severity: 'attention',
      title: `${r.kind} request from the floor`,
      body: `${r.orderId ?? customerName(r.customerId ?? '')} · ${r.reason}`,
      orderId: r.orderId
    });
    toast.success(`Sent to ${managerName}`, {
      description: managerInStore ? 'You’ll see the answer in “Waiting on manager”.' : `${managerName} is away — sent to their phone.`
    });
    return req;
  }, [isFloor, deny, user.name, logActivity, notify, customerName, managerName, managerInStore]);
  const decideRequest = useCallback((id: string, approve: boolean, note: string) => {
    if (!isManager) return deny('approve floor requests');
    const r = requests.find((x) => x.id === id);
    if (!r || r.status !== 'Waiting') return;
    if (approve && r.orderId) {
      if (r.kind === 'Discount' && r.amount) updateOrder(r.orderId, (o) => ({
        ...o,
        discount: o.discount + (r.amount ?? 0)
      }));
      if (r.kind === 'Waive alteration charge') {
        updateOrder(r.orderId, (o) => {
          const idx = [...o.alterations].reverse().findIndex((a) => a.charge > 0);
          if (idx < 0) return o;
          const real = o.alterations.length - 1 - idx;
          return {
            ...o,
            alterations: o.alterations.map((a, i) => i === real ? {
              ...a,
              charge: 0
            } : a),
            risk: undefined
          };
        });
      }
    }
    setRequests((p) => p.map((x) => x.id === id ? {
      ...x,
      status: approve ? 'Approved' : 'Declined',
      decidedBy: user.name,
      decisionNote: note
    } : x));
    if (r.orderId) logActivity(r.orderId, `${r.kind}${r.amount ? ` ${inr(r.amount)}` : ''} ${approve ? 'approved' : 'declined'} by ${user.name}${note ? ` — ${note}` : ''}`, 'change');
    notify({
      category: 'Order Updates',
      severity: approve ? 'info' : 'attention',
      title: `${r.kind} ${approve ? 'approved' : 'declined'}`,
      body: `${r.orderId ?? ''} · answered by ${user.name}`,
      orderId: r.orderId
    });
    toast.success(approve ? 'Approved' : 'Declined', {
      description: `${r.by} sees the answer on the floor.`
    });
  }, [isManager, deny, requests, updateOrder, user.name, logActivity, notify]);
  const isEscalated = useCallback((r: FloorRequest) => r.status === 'Waiting' && differenceInMinutes(parseISO(nowIso()), parseISO(r.at)) >= ESCALATE_AFTER_HOURS * 60, []);
  const approvedFor = useCallback((orderId: string, kind: FloorRequest['kind']) => requests.find((r) => r.orderId === orderId && r.kind === kind && r.status === 'Approved'), [requests]);
  const waitingFor = useCallback((orderId: string, kind: FloorRequest['kind']) => requests.find((r) => r.orderId === orderId && r.kind === kind && r.status === 'Waiting'), [requests]);
  const saveDraft = useCallback((d: Omit<FloorDraft, 'id' | 'at' | 'by'>) => {
    if (!isFloor) return deny('start draft orders');
    const draft: FloorDraft = {
      ...d,
      id: uid('FD'),
      at: nowIso(),
      by: user.name
    };
    setDrafts((p) => [draft, ...p]);
    notify({
      category: 'Action Required',
      severity: draft.flagged.length ? 'attention' : 'info',
      title: 'Draft order to price',
      body: `${customerName(d.customerId)} · ${d.garments.join(', ')}${draft.flagged.length ? ` · verify ${draft.flagged.join(', ')}` : ''}`
    });
    toast.success(d.status === 'Customer undecided' ? 'Draft saved with a follow-up' : `Sent to ${d.assignedTo || 'the store'} to price`, {
      description: d.status === 'Customer undecided' ? 'It reopens when the customer returns.' : 'Customer told the price comes by WhatsApp.'
    });
  }, [isFloor, deny, user.name, notify, customerName]);
  const submitWebBooking = useCallback((b: WebBooking) => {
    const existing = customers.find((c) => digits(c.mobile) === digits(b.mobile));
    let customerId = existing?.id;
    if (!existing) {
      customerId = uid('C');
      const mobile = b.mobile.trim();
      addWebCustomer({
        id: customerId,
        name: b.name.trim(),
        mobile,
        whatsapp: mobile,
        whatsappAvailable: true,
        email: '',
        city: b.city.trim() || 'New Delhi',
        since: TODAY_ISO,
        tier: 'New',
        designer: '',
        preferences: [],
        notes: 'Signed up on the website.',
        remote: false,
        measurementProfiles: []
      });
    }
    const assignedTo = existing?.designer || '';
    const draft: FloorDraft = {
      id: uid('FD'),
      customerId: customerId!,
      garments: b.garments,
      fabric: null,
      photos: 0,
      measurements: {},
      flagged: [],
      note: b.note.trim(),
      assignedTo,
      at: nowIso(),
      by: 'Website',
      status: 'With designer',
      source: 'Storefront',
      visit: b.visit
    };
    setDrafts((p) => [draft, ...p]);
    if (apiMode) void publicBooking(b).catch(() => undefined);
    notify({
      category: 'Customer',
      severity: 'info',
      title: 'Consultation booked online',
      body: `${b.name.trim()} · ${b.visit} · ${b.garments.join(', ') || 'Not sure yet'}${existing ? ' · returning customer' : ''}`
    });
    return {
      draftId: draft.id,
      returning: !!existing
    };
  }, [customers, addWebCustomer, notify]);
  const updateDraft = useCallback((id: string, patch: Partial<FloorDraft>) => setDrafts((p) => p.map((d) => d.id === id ? {
    ...d,
    ...patch
  } : d)), []);
  const lendSwatch = useCallback((fabricId: string, label: string, customerId: string, due: string) => {
    if (!isFloor) return deny('lend swatches');
    setLoans((p) => [{
      id: uid('SW'),
      fabricId,
      label,
      customerId,
      out: TODAY_ISO,
      due
    }, ...p]);
    toast.success('Swatch lent', {
      description: `${label} to ${customerName(customerId)} — due back ${due}.`
    });
  }, [isFloor, deny, customerName]);
  const returnSwatch = useCallback((id: string) => {
    setLoans((p) => p.map((l) => l.id === id ? {
      ...l,
      returnedAt: TODAY_ISO
    } : l));
    toast.success('Swatch back in stock');
  }, []);
  const submitClose = useCallback((c: Omit<CashClose, 'id' | 'date' | 'by' | 'status'>) => {
    if (!isFloor) return deny('close the day');
    const diff = c.cashCounted - c.cashRecorded;
    setCloses((p) => [{
      ...c,
      id: uid('EOD'),
      date: TODAY_ISO,
      by: user.name,
      status: 'Waiting for manager'
    }, ...p]);
    notify({
      category: 'Payments',
      severity: diff ? 'warning' : 'info',
      title: diff ? `Cash ${diff < 0 ? 'short' : 'over'} by ${inr(Math.abs(diff))}` : 'Day closed — cash matches',
      body: `${user.name} counted ${inr(c.cashCounted)} against ${inr(c.cashRecorded)} recorded.${c.note ? ` ${c.note}` : ''}`
    });
    toast.success('Day closed', {
      description: `Hand the cash to ${managerName} — they confirm it.`
    });
  }, [isFloor, deny, user.name, notify, managerName]);
  const confirmClose = useCallback((id: string) => {
    if (!isManager) return deny('confirm the day’s cash');
    setCloses((p) => p.map((c) => c.id === id ? {
      ...c,
      status: 'Confirmed',
      confirmedBy: user.name
    } : c));
    toast.success('Cash confirmed');
  }, [isManager, deny, user.name]);
  const value = useMemo<StoreValue>(() => ({
    managerName,
    managerInStore,
    setManagerInStore,
    isFloor,
    isManager,
    rackFor,
    setRack,
    reportNotOnRack,
    sendMessage,
    requests,
    requestApproval,
    decideRequest,
    isEscalated,
    approvedFor,
    waitingFor,
    drafts,
    saveDraft,
    submitWebBooking,
    updateDraft,
    loans,
    lendSwatch,
    returnSwatch,
    closes,
    submitClose,
    confirmClose
  }), [managerName, managerInStore, setManagerInStore, isFloor, isManager, rackFor, setRack, reportNotOnRack, sendMessage, requests, requestApproval, decideRequest, isEscalated, approvedFor, waitingFor, drafts, saveDraft, submitWebBooking, updateDraft, loans, lendSwatch, returnSwatch, closes, submitClose, confirmClose]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}