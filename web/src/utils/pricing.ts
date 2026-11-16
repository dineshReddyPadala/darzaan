import {
  ALTERATION_CHARGE,
  ALTERATION_TIERS,
  CUSTOM_EMBROIDERY_PRICE,
  listPrice,
  samplers,
  urgencyOptions } from
'../data/catalog';
import { fabrics, trims } from '../data/inventory';
import type { Garment, Order } from '../types';

export const GST_RATE = 0.05;

export interface GarmentBreakdown {
  base: number;
  fabric: number;
  embroidery: number;
  attachments: number;
  construction: number;
  finishing: number;
  express: number;
  total: number;
  /** Custom design still waiting for production to confirm its price. */
  pricePending: boolean;
}

export function basePriceFor(category: string, subCategory: string): number {
  return listPrice(category, subCategory) ?? 0;
}

/** Custom design price: confirmed by production, or the old flat price on earlier orders. */
function customDesignPrice(g: Garment): {amount: number;pending: boolean;} {
  if (g.embroidery.mode !== 'Custom') return { amount: 0, pending: false };
  if (!g.customQuote) return { amount: CUSTOM_EMBROIDERY_PRICE, pending: false };
  return g.customQuote.status === 'Confirmed' ? { amount: designNet(g.customQuote), pending: false } : { amount: 0, pending: true };
}

/** Confirmed design price after any store edit and the customer's discount. */
export function designNet(q: NonNullable<Garment['customQuote']>): number {
  const gross = q.editedAmount ?? q.amount ?? 0;
  return Math.round(gross * (1 - (q.discountPct ?? 0) / 100));
}

/** Custom design whose price the workshop hasn't confirmed yet — it can't go into production. */
export function designPriceOpen(g: Garment): boolean {
  return g.embroidery.mode === 'Custom' && !!g.customQuote && g.customQuote.status !== 'Confirmed';
}

/** The next fit-fix round for a garment and what it costs: #1 free, #2 50%, #3+ 100%. */
export function nextAlterationRound(o: Pick<Order, 'alterations'>, garmentId: string): {round: number;pct: number;amount: number;} {
  const done = o.alterations.filter((a) => a.garmentId === garmentId && (a.round !== undefined || (a.billing ?? (a.charge > 0 ? 'Paid' : 'Free')) === 'Free')).length;
  const round = done + 1;
  const pct = ALTERATION_TIERS[Math.min(done, ALTERATION_TIERS.length - 1)];
  return { round, pct, amount: Math.round(ALTERATION_CHARGE * pct) };
}

export function urgencyPct(g: Pick<Garment, 'urgency'>): number {
  return urgencyOptions.find((u) => u.value === g.urgency)?.surchargePct ?? 0;
}

export function garmentBreakdown(g: Garment): GarmentBreakdown {
  const base = g.price ?? basePriceFor(g.category, g.subCategory);
  const fabricDef = g.fabric.source === 'Darzaan' ? fabrics.find((f) => f.id === g.fabric.fabricId) : undefined;
  const fabric = fabricDef ? fabricDef.pricePerM * g.fabric.meters : 0;
  const custom = customDesignPrice(g);
  const embroidery = g.embroidery.mode === 'Sampler' ? samplers.find((s) => s.id === g.embroidery.samplerId)?.price ?? 0 : custom.amount;
  const attachments = g.attachments.reduce((sum, a) => sum + (trims.find((t) => t.id === a.trimId)?.price ?? 0) * a.qty, 0);
  // Construction and finishing are no longer priced separately — they're chosen as attachments.
  const construction = 0;
  const finishing = 0;
  // Urgency is charged on the garment's value; Darzaan fabric is a material cost and isn't marked up.
  const value = base + embroidery + attachments + construction + finishing;
  const express = Math.round(value * urgencyPct(g));
  return { base, fabric, embroidery, attachments, construction, finishing, express, total: value + fabric + express, pricePending: custom.pending };
}

export function expressImpact(g: Garment, urgency: Garment['urgency']): number {
  return garmentBreakdown({ ...g, urgency }).express;
}

export interface Totals {
  subtotal: number;
  discount: number;
  gst: number;
  delivery: number;
  total: number;
  paid: number;
  balance: number;
  paidPct: number;
  /** Sum of urgency charges across garments (already inside subtotal). */
  urgency: number;
  /** Number of custom designs still waiting for a price. */
  pending: number;
}

export function computeTotals(garments: Garment[], discount: number, delivery: number, paid: number): Totals {
  const rows = garments.map(garmentBreakdown);
  const subtotal = rows.reduce((s, b) => s + b.total, 0);
  const taxable = Math.max(0, subtotal - discount);
  const gst = Math.round(taxable * GST_RATE);
  const total = taxable + gst + delivery;
  const balance = Math.max(0, total - paid);
  return {
    subtotal, discount, gst, delivery, total, paid, balance,
    paidPct: total > 0 ? Math.round(paid / total * 100) : 0,
    urgency: rows.reduce((s, b) => s + b.express, 0),
    pending: rows.filter((b) => b.pricePending).length
  };
}

export function orderTotals(o: Order): Totals {
  const paid = o.payments.reduce((s, p) => s + (p.kind === 'Refund' ? -p.amount : p.amount), 0);
  const alterationCharges = o.alterations.reduce((s, a) => s + a.charge, 0);
  const t = computeTotals(o.garments, o.discount, o.deliveryCharge, paid);
  const total = t.total + alterationCharges;
  return { ...t, total, balance: Math.max(0, total - paid), paidPct: total > 0 ? Math.round(paid / total * 100) : 0 };
}