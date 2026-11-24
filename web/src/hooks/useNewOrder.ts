import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { usePriceRequests } from '../contexts/PriceRequestsContext';
import { ADVANCE_PCT, categories, categoryDef, detailsFor, HOME_DELIVERY_CHARGE, listPrice, measurementsFor, REGULAR_LEAD_DAYS, urgencyOptions } from '../data/catalog';
import { fabrics } from '../data/inventory';
import { locations as fallbackLocations, type StoreLocation } from '../data/locations';
import { readHydration } from '../services/sync';
import { readSession } from '../services/session';
import type { DeliveryMode, DraftQuote, Garment, Order, PaymentMethod, Role, Urgency } from '../types';
import { isFullDay, loadForDate, suggestDeliveryDate } from '../utils/capacity';
import { nowIso, TODAY_ISO, todayPlus } from '../utils/format';
import { computeTotals } from '../utils/pricing';
import { canOverrideCapacity } from '../utils/roles';

export const STEPS = [
{ key: 'customer', label: 'Customer' },
{ key: 'garments', label: 'Garments' },
{ key: 'pricing', label: 'Delivery' },
{ key: 'review', label: 'Review' },
{ key: 'payment', label: 'Payment & signature' }] as
const;

export type StepKey = (typeof STEPS)[number]['key'];

/** Who may change a confirmed design price. */
const PRICE_EDITORS: Role[] = ['admin'];

/** Default fabric length for a category (0 = a service on the customer's own garment). */
export function defaultMetersFor(category: string): number {
  return categoryDef(category)?.meters ?? 2;
}

/** Services and alterations are done on the customer's own garment — no fabric to pick. */
export function needsFabric(g: Pick<Garment, 'category'>): boolean {
  return defaultMetersFor(g.category) > 0;
}

const defaultDeliveryDate = () => suggestDeliveryDate(REGULAR_LEAD_DAYS);

export function blankGarment(n: number, category = categories[0].name): Garment {
  const cat = categoryDef(category) ?? categories[0];
  return {
    id: `G${n}`, category: cat.name, subCategory: '', price: undefined, urgency: 'Regular', deliveryDate: defaultDeliveryDate(),
    fabric: { source: 'Darzaan', meters: cat.meters, pieces: [] },
    embroidery: { mode: 'None', versions: [] }, lining: false, attachments: [], construction: [], finishing: [],
    measurementSource: 'Designer', measurementVerified: true, measurements: {}, extraMeasurements: [], unit: 'in', photos: [], notes: '', customFields: [], stage: 'review'
  };
}

function garmentsFromQuote(q: DraftQuote): Garment[] {
  return q.items.map((item, i) => {
    const cat = categories.find((c) => !c.deletedAt && c.subCategories.some((s) => !s.deletedAt && s.name === item)) ?? categories.find((c) => !c.deletedAt) ?? categories[0];
    const g = blankGarment(i + 1, cat.name);
    const fabricName = q.fabrics[i] ?? q.fabrics[0];
    const fab = fabrics.find((f) => `${f.type} — ${f.name}` === fabricName);
    return { ...g, subCategory: item, price: listPrice(cat.name, item), fabric: fab ? { source: 'Darzaan', fabricId: fab.id, meters: cat.meters, pieces: [] } : g.fabric };
  });
}

/** Everything a garment still needs before the order can move on, in the order the form asks for it. */
export function garmentIssue(g: Garment, n: number): string | null {
  const name = g.subCategory || `Garment ${n}`;
  if (!g.subCategory) return `Garment ${n}: choose a sub-category.`;
  if (g.embroidery.mode === 'Custom' && !g.embroidery.approvedVersionId) return `${name}: upload and save the custom design.`;
  if (g.embroidery.mode === 'Custom' && !g.customQuote) return `${name}: ask the workshop for a price.`;
  if (g.embroidery.mode === 'Custom' && g.customQuote?.status === 'Declined') return `${name}: the workshop can’t make this design — replace it and ask again.`;
  if (g.embroidery.mode === 'Sampler' && !g.embroidery.samplerId) return `${name}: scan a sampler or switch embroidery off.`;
  if (needsFabric(g)) {
    if (g.fabric.source === 'Darzaan') {
      const f = fabrics.find((x) => x.id === g.fabric.fabricId);
      if (!f) return `${name}: choose a fabric.`;
      if (f.stock < g.fabric.meters) return `${name}: only ${f.stock} m of ${f.name} in stock.`;
    } else {
      if (g.fabric.pieces.length === 0) return `${name}: add the customer’s fabric.`;
      const other = g.fabric.pieces.find((p) => p.material === 'Other' && !p.materialDetail?.trim());
      if (other) return `${name}: describe the “Other” material.`;
    }
  }
  if (g.lining && !g.liningFabric) return `${name}: choose a lining fabric.`;
  const missing = missingMeasurements(g);
  if (missing.length) return `${name}: enter ${missing.length === 1 ? missing[0] : `${missing.length} missing measurements`}.`;
  const details = missingDetails(g);
  if (details.length) return `${name}: answer ${details.length === 1 ? details[0] : `${details.length} fit details`}.`;
  return null;
}

/** Standard measurements for the garment's chart that are still empty. Ones added by hand are optional. */
export function missingMeasurements(g: Garment): string[] {
  return measurementsFor(g.category, g.subCategory).filter((f) => g.measurements[f] === undefined || Number.isNaN(g.measurements[f]) || g.measurements[f] <= 0);
}

/** Yes/no and preference details from the chart that haven't been answered. */
export function missingDetails(g: Garment): string[] {
  return detailsFor(g.category, g.subCategory).filter((d) => !g.details?.[d.name]?.trim()).map((d) => d.name);
}

function locationRows(): StoreLocation[] {
  return readHydration<StoreLocation[]>('locations') ?? fallbackLocations;
}

function signedInPlace(): { store: string; storeId?: number } {
  const session = readSession();
  const storeId = session?.user.storeId;
  const place = locationRows().find((row) => storeId != null && String(row.id) === String(storeId));
  return { storeId, store: place?.store || place?.name || session?.user.store || '' };
}

export function useNewOrder() {
  const { orders, quotes, getCustomer, addOrder, saveQuote, removeQuote, user, role } = useApp();
  const [params] = useSearchParams();
  const quote = quotes.find((q) => q.id === params.get('quote'));
  const quoteMode = params.get('mode') === 'quote';
  const initialCustomer = params.get('customer') ?? quote?.customerId;
  const startStep = params.get('step') === 'pricing' && quote ? 2 : initialCustomer ? 1 : 0;

  const [step, setStep] = useState<number>(startStep);
  const [maxStep, setMaxStep] = useState<number>(startStep);
  const [customerId, setCustomerId] = useState<string | undefined>(initialCustomer ?? undefined);
  const initialPlace = signedInPlace();
  const [placeId, setPlaceId] = useState(initialPlace.storeId != null ? String(initialPlace.storeId) : '');
  const [basics, setBasics] = useState({
    orderDate: TODAY_ISO,
    designer: getCustomer(initialCustomer ?? '')?.designer ?? '',
    assistant: '',
    whatsappUnavailable: initialCustomer ? !getCustomer(initialCustomer)?.whatsappAvailable : false
  });
  const counter = useRef(10);
  const [garments, setGarments] = useState<Garment[]>(() => quote ? garmentsFromQuote(quote) : [blankGarment(1)]);
  const [activeId, setActiveId] = useState<string>('G1');
  const [overrideReason, setOverrideReason] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('Store pickup');
  const [discountPct, setDiscountPct] = useState(0);
  const [payment, setPayment] = useState<{amount: number | null;method: PaymentMethod;reference: string;}>({ amount: null, method: 'UPI', reference: '' });
  const [signatures, setSignatures] = useState({ designer: false, customer: false });

  const customer = customerId ? getCustomer(customerId) : undefined;
  const orderNumber = useMemo(() => {
    const highest = orders.reduce((max, o) => Math.max(max, Number(String(o.id).replace(/\D/g, '')) || 0), 10000);
    return `DZ-${highest + 1}`;
  }, [orders]);
  const deliveryCharge = deliveryMode === 'Home delivery' ? HOME_DELIVERY_CHARGE : 0;
  const subtotalPreview = computeTotals(garments, 0, 0, 0).subtotal;
  const discountAmount = Math.round(subtotalPreview * discountPct / 100);
  const totals = computeTotals(garments, discountAmount, deliveryCharge, 0);
  const advanceRequired = Math.round(totals.total * ADVANCE_PCT);
  const amount = payment.amount ?? advanceRequired;
  const minDeliveryDate = todayPlus(REGULAR_LEAD_DAYS - 3);
  const regularDate = () => suggestDeliveryDate(REGULAR_LEAD_DAYS, orders);
  const active = garments.find((g) => g.id === activeId) ?? garments[0];

  const expressDue = (g: Garment) => {
    const d = urgencyOptions.find((u) => u.value === g.urgency)?.days;
    return d ? todayPlus(d) : g.deliveryDate ?? regularDate();
  };
  /** Each garment's own date; express garments are fixed to their express day. */
  const dateFor = (g: Garment) => g.urgency !== 'Regular' ? expressDue(g) : g.deliveryDate ?? regularDate();
  /** The order is delivered when its last garment is ready. */
  const deliveryDate = garments.map(dateFor).sort().pop() ?? regularDate();
  /** Regular garments booked on a day the workshop is already over capacity. */
  const overloaded = garments.filter((g) => g.urgency === 'Regular' && isFullDay(dateFor(g), orders));
  const load = Math.max(0, ...garments.filter((g) => g.urgency === 'Regular').map((g) => loadForDate(dateFor(g), orders) ?? 0));

  const updateGarment = (id: string, patch: Partial<Garment> | ((g: Garment) => Garment)) =>
  setGarments((prev) => prev.map((g) => g.id === id ? typeof patch === 'function' ? patch(g) : { ...g, ...patch } : g));

  /** Pick a sub-category: its catalogue price fills in straight away. */
  const setSubCategory = (id: string, subCategory: string) => {
    const g = garments.find((x) => x.id === id);
    if (!g) return;
    updateGarment(id, { subCategory, price: listPrice(g.category, subCategory) });
  };
  const setCategory = (id: string, category: string) => {
    const cat = categoryDef(category);
    if (!cat) return;
    updateGarment(id, (g) => ({
      ...g, category, subCategory: '', price: undefined, measurements: {}, extraMeasurements: [],
      fabric: cat.meters > 0 ? { ...g.fabric, meters: cat.meters } : { source: 'Customer', meters: 0, pieces: [] }
    }));
  };
  const setUrgency = (id: string, urgency: Urgency) => updateGarment(id, (g) => ({ ...g, urgency, deliveryDate: urgency === 'Regular' ? g.deliveryDate && g.deliveryDate >= minDeliveryDate ? g.deliveryDate : regularDate() : g.deliveryDate }));
  const setGarmentDate = (id: string, d: string) => {
    updateGarment(id, { deliveryDate: d });
    // Keep the reason while any garment is still on a full day; clear it once none are.
    const stillFull = isFullDay(d, orders) || garments.some((x) => x.id !== id && x.urgency === 'Regular' && isFullDay(dateFor(x), orders));
    if (!stillFull) setOverrideReason('');
  };

  /*
   * Custom designs: the store sends the saved design to the Production Head to price.
   * The form carries on; the answer drops in live. A confirmed price can be sent back to be checked again.
   */
  const pricing = usePriceRequests();
  const canEditPrice = PRICE_EDITORS.includes(role);
  const requestCustomPrice = (id: string, reconfirm = false) => {
    const g = garments.find((x) => x.id === id);
    const design = g?.embroidery.versions[g.embroidery.versions.length - 1];
    if (!g || !design) return;
    if (g.customQuote && !reconfirm && g.customQuote.status !== 'Declined') return;
    if (reconfirm && g.customQuote?.requestId) pricing.cancel(g.customQuote.requestId);
    const fab = fabrics.find((f) => f.id === g.fabric.fabricId);
    const previous = g.customQuote?.editedAmount ?? g.customQuote?.amount;
    const requestId = pricing.create({
      garmentLabel: g.subCategory || g.category,
      category: g.category,
      fabric: g.fabric.source === 'Darzaan' ? fab ? `${fab.type} — ${fab.name} · ${g.fabric.meters} m` : 'Darzaan fabric, not picked yet' : 'Customer’s own fabric',
      customerName: customer?.name ?? 'New customer',
      dueDate: dateFor(g),
      sketch: design.image,
      description: reconfirm && previous ? `Please reconfirm — store has ${previous.toLocaleString('en-IN')}. ${design.note}` : design.note,
      placement: g.embroidery.placement
    }, reconfirm && previous ? previous : Math.round(((g.price ?? listPrice(g.category, g.subCategory) ?? 3000) * 1.4 + 4000) / 500) * 500);
    updateGarment(id, { customQuote: { status: 'Pending', requestId, requestedAt: nowIso(), discountPct: g.customQuote?.discountPct } });
  };
  const cancelCustomPrice = (id: string) => {
    const rid = garments.find((x) => x.id === id)?.customQuote?.requestId;
    if (rid) pricing.cancel(rid);
    updateGarment(id, { customQuote: undefined });
  };
  const editCustomPrice = (id: string, amount: number) => updateGarment(id, (g) => g.customQuote ? { ...g, customQuote: { ...g.customQuote, editedAmount: amount, editedBy: user.name } } : g);
  const setDesignDiscount = (id: string, pct: number) => updateGarment(id, (g) => g.customQuote ? { ...g, customQuote: { ...g.customQuote, discountPct: pct || undefined } } : g);

  // Mirror the workshop's answer onto the draft garments as it arrives.
  useEffect(() => {
    setGarments((prev) => {
      let changed = false;
      const next = prev.map((g) => {
        const r = pricing.get(g.customQuote?.requestId);
        if (!r || !g.customQuote || r.status === 'Cancelled') return g;
        const status = r.status;
        if (status === g.customQuote.status && r.amount === g.customQuote.amount) return g;
        changed = true;
        if (status === 'Confirmed') toast.success(`Design price confirmed · ₹${(r.amount ?? 0).toLocaleString('en-IN')}`, { description: `${r.garmentLabel} · ${r.answeredBy}` });
        return { ...g, customQuote: { ...g.customQuote, status, amount: r.amount, confirmedBy: r.answeredBy, editedAmount: undefined, editedBy: undefined } };
      });
      return changed ? next : prev;
    });
  }, [pricing.requests]); // eslint-disable-line react-hooks/exhaustive-deps

  const addGarment = () => {
    counter.current += 1;
    const g = blankGarment(counter.current);
    setGarments((prev) => [...prev, g]);
    setActiveId(g.id);
    return g.id;
  };
  const duplicateGarment = (id: string) => {
    const src = garments.find((g) => g.id === id);
    if (!src) return;
    counter.current += 1;
    const copy: Garment = { ...structuredClone(src), id: `G${counter.current}`, customQuote: undefined, embroidery: src.embroidery.mode === 'Custom' ? { mode: 'None', versions: [] } : structuredClone(src.embroidery) };
    setGarments((prev) => {
      const i = prev.findIndex((g) => g.id === id);
      return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
    });
    setActiveId(copy.id);
    return copy.id;
  };
  const removeGarment = (id: string) => {
    setGarments((prev) => prev.length > 1 ? prev.filter((g) => g.id !== id) : prev);
    if (activeId === id) setActiveId(garments.find((g) => g.id !== id)?.id ?? garments[0].id);
  };
  const moveGarment = (id: string, dir: -1 | 1) =>
  setGarments((prev) => {
    const i = prev.findIndex((g) => g.id === id);
    const j = i + dir;
    if (j < 0 || j >= prev.length) return prev;
    const next = [...prev];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const stepIssue = (key: StepKey): string | null => {
    switch (key) {
      case 'customer':
        if (!placeId) return 'Choose a store location.';
        if (!customerId) return 'Enter the customer’s name to continue.';
        if (!customer?.name.trim()) return 'This customer has no name. Add it to continue.';
        return null;
      case 'garments':{
          for (let i = 0; i < garments.length; i++) {
            const issue = garmentIssue(garments[i], i + 1);
            if (issue) return issue;
          }
          return null;
        }
      case 'pricing':
        if (overloaded.length && !overrideReason.trim()) return `${overloaded[0].subCategory}: the workshop is full that day. Add a reason or pick another date.`;
        return null;
      case 'payment':
        if (amount <= 0) return 'Record the advance payment.';
        if (amount < advanceRequired && !canOverrideCapacity(role)) return `Advance must be at least 70% (₹${advanceRequired.toLocaleString('en-IN')}). A manager can approve less.`;
        if (!signatures.designer || !signatures.customer) return 'Both signatures are required.';
        return null;
      default:
        return null;
    }
  };

  const goTo = (i: number) => {
    setStep(i);
    setMaxStep((m) => Math.max(m, i));
  };

  /** Set when a step's Continue was pressed with something missing — the step shows the problem inline. */
  const [blocked, setBlocked] = useState<StepKey | null>(null);
  /** Set when the user jumped back from Review to edit; Continue then returns straight to Review. */
  const [returnToReview, setReturnToReview] = useState(false);
  const reviewIndex = STEPS.findIndex((s) => s.key === 'review');
  const editFromReview = (i: number, garmentId?: string) => {
    if (garmentId) setActiveId(garmentId);
    setReturnToReview(true);
    setBlocked(null);
    setStep(i);
  };

  const confirm = async (): Promise<string> => {
    const now = nowIso();
    const pct = Math.round(amount / totals.total * 100);
    const express = garments.filter((g) => g.urgency !== 'Regular');
    const place = locationRows().find((row) => String(row.id) === placeId);
    if (!place) return '';
    const order: Order = {
      id: orderNumber,
      customerId: customerId!,
      createdAt: now,
      deliveryDate,
      status: 'Confirmed',
      priority: express.length ? 'Express' : 'Regular',
      occasion: '',
      designer: basics.designer,
      productionOwner: 'Vikram Rathore',
      store: place.store || place.name,
      storeId: place.id,
      deliveryMode,
      deliveryCharge,
      discount: discountAmount,
      garments: garments.map((g, i) => ({ ...g, id: `G${i + 1}`, deliveryDate: dateFor(g), stage: 'acknowledgement' })),
      payments: [{ id: `PAY-${5600 + orders.length}`, amount, method: payment.method, reference: payment.reference || `${payment.method} · auto`, at: now, by: user.name, kind: 'Advance' }],
      signatures: [
      { role: 'Designer', name: basics.designer, at: now, version: 1 },
      { role: 'Customer', name: customer?.name ?? '', at: now, version: 1 }],

      alterations: [],
      changeRequests: [],
      messages: [{ id: 'M-1', channel: basics.whatsappUnavailable ? 'SMS' : 'WhatsApp', template: 'Order confirmation', at: now, status: 'Delivered' }],
      risk: amount < advanceRequired ? { severity: 'attention', message: `Advance incomplete — ${pct}% paid of 70% required`, owner: user.name } : undefined,
      nextAction: { label: express.length ? 'Express — review and assign immediately' : 'Production review', owner: 'Vikram Rathore' },
      activity: [
      { id: 'A1', at: now, who: user.name, what: quote ? `Order created from draft quote ${quote.id}` : 'Order created', kind: 'created' },
      { id: 'A2', at: now, who: customer?.name ?? '', what: 'Customer signed order (version 1)', kind: 'signature' },
      { id: 'A3', at: now, who: user.name, what: `${payment.method} payment of ₹${amount.toLocaleString('en-IN')} recorded`, kind: 'payment' },
      ...(overrideReason ? [{ id: 'A4', at: now, who: user.name, what: `Capacity override: ${overrideReason}`, kind: 'production' as const }] : []),
      { id: 'A5', at: now, who: 'System', what: `${garments.length} production task${garments.length > 1 ? 's' : ''} created and sent for review`, kind: 'production' },
      ...(totals.pending ? [{ id: 'A7', at: now, who: 'System', what: `${totals.pending} custom design price${totals.pending > 1 ? 's' : ''} still with production`, kind: 'production' as const }] : []),
      { id: 'A6', at: now, who: 'System', what: `Confirmation sent on ${basics.whatsappUnavailable ? 'SMS' : 'WhatsApp'}`, kind: 'communication' }]

    };
    const saved = await addOrder(order);
    if (!saved) return '';
    saved.garments.forEach((g) => {
      if (g.customQuote?.requestId) pricing.link(g.customQuote.requestId, String(saved.id), String(g.id));
    });
    if (quote) removeQuote(quote.id);
    return String(saved.id);
  };

  const saveAsQuote = (): string | null => {
    if (!customerId) return null;
    const id = quote?.id ?? `Q-${2045 + quotes.length}`;
    saveQuote({
      id,
      customerId,
      createdAt: nowIso(),
      items: garments.map((g) => g.subCategory),
      fabrics: garments.map((g) => {
        const f = fabrics.find((x) => x.id === g.fabric.fabricId);
        return g.fabric.source === 'Darzaan' && f ? `${f.type} — ${f.name}` : 'Customer fabric';
      }),
      estimate: totals.total,
      status: 'Draft',
      note: garments.map((g) => g.notes).filter(Boolean).join(' '),
      validUntil: todayPlus(14)
    });
    return id;
  };

  return {
    step, maxStep, goTo, setStep, quote, quoteMode,
    blocked, setBlocked, returnToReview, setReturnToReview, reviewIndex, editFromReview,
    customerId, setCustomerId, customer, basics, setBasics, placeId, setPlaceId,
    garments, active, activeId, setActiveId, updateGarment, setCategory, setSubCategory, setUrgency, setGarmentDate, dateFor,
    requestCustomPrice, cancelCustomPrice, editCustomPrice, setDesignDiscount, canEditPrice,
    addGarment, duplicateGarment, removeGarment, moveGarment,
    deliveryDate, minDeliveryDate, load, overloaded, overrideReason, setOverrideReason, deliveryMode, setDeliveryMode,
    discountPct, setDiscountPct, discountAmount, deliveryCharge, totals, advanceRequired, amount,
    payment, setPayment, signatures, setSignatures,
    orderNumber, stepIssue, confirm, saveAsQuote, expressDue, canOverride: canOverrideCapacity(role), user, orders
  };
}

export type NewOrderState = ReturnType<typeof useNewOrder>;