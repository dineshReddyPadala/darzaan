import { customers as seedCustomers } from '../data/customers';
import { orders as seedOrders } from '../data/orders';
import { seedPackages } from '../data/packages';
import type { Role } from '../types';

const inBrowser = typeof window !== 'undefined';

/** True on /flow and inside the live screen it embeds — data is then shared between the two. */
export const demoMode = inBrowser && (window.self !== window.top || window.location.pathname.startsWith('/flow'));

/** The embedded screen is told which person to show via ?as=role. */
export function demoRoleParam(): Role | null {
  if (!inBrowser) return null;
  return new URLSearchParams(window.location.search).get('as') as Role | null;
}

export const DEMO_PREFIX = 'darzaan.demo.';
const STORY_KEY = DEMO_PREFIX + 'storyOrder';

/** Bump whenever sample data changes, so a demo tab never keeps showing an older, emptier copy. */
const DEMO_DATA_VERSION = '2026-10-26c';
const VERSION_KEY = DEMO_PREFIX + 'version';

/** Clears everything done during the demo so it starts from the sample data again. */
export function resetDemoData() {
  Object.keys(sessionStorage).filter((k) => k.startsWith(DEMO_PREFIX)).forEach((k) => sessionStorage.removeItem(k));
  try {
    sessionStorage.setItem(VERSION_KEY, DEMO_DATA_VERSION);
  } catch {

    /* storage unavailable */}
}

// Runs on load, before any screen reads demo data: drop data saved by an older version of the samples.
if (demoMode) {
  try {
    if (sessionStorage.getItem(VERSION_KEY) !== DEMO_DATA_VERSION) resetDemoData();
  } catch {

    /* storage unavailable */}
}

function read<T>(key: string): T | null {
  try {
    const v = sessionStorage.getItem(DEMO_PREFIX + key);
    return v ? JSON.parse(v) as T : null;
  } catch {
    return null;
  }
}

/** Remembers the order taken at the start of the story so every later chapter follows it. */
export function setStoryOrder(id: string) {
  try {
    sessionStorage.setItem(STORY_KEY, JSON.stringify(id));
  } catch {

    /* storage unavailable */}
}

export function storyOrderId(): string | null {
  return read<string>('storyOrder');
}

const OVERRIDE_KEY = DEMO_PREFIX + 'storyOverride';

/** When a chapter is opened directly, it follows a ready-made sample order instead of the story order. */
export function setStoryOverride(id: string | null) {
  try {
    if (id) sessionStorage.setItem(OVERRIDE_KEY, JSON.stringify(id));else sessionStorage.removeItem(OVERRIDE_KEY);
  } catch {

    /* storage unavailable */}
}

interface StoryOrder {id: string;createdAt: string;customerId: string;garments: {id: string;category: string;subCategory: string;}[];}

/**
 * The story's order, garment and package. A sample can name a garment too ("DZ-10301:G2").
 * Falls back to the sample data before any screen has saved it, then to the newest order.
 */
export function storyIds() {
  const orders = read<StoryOrder[]>('orders') ?? seedOrders as unknown as StoryOrder[];
  const [savedId, savedGarment] = (read<string>('storyOverride') ?? storyOrderId() ?? '').split(':');
  const order = orders.find((o) => o.id === savedId) ?? (seedOrders as unknown as StoryOrder[]).find((o) => o.id === savedId) ?? [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const garment = order?.garments.find((g) => g.id === savedGarment) ?? order?.garments[0];
  const pkgs = (read<{id: string;orderId: string;}[]>('packages') ?? seedPackages).filter((p) => order && p.orderId === order.id).sort((a, b) => b.id.localeCompare(a.id));
  return { orderId: order?.id ?? (savedId || 'DZ-10320'), garmentId: garment?.id ?? 'G1', packageId: pkgs[0]?.id ?? '', customerId: order?.customerId, garment: garment?.subCategory };
}

export function fillStory<T extends string | undefined>(s: T): T {
  if (!s) return s;
  const ids = storyIds();
  return s.replace(/\{order\}/g, ids.orderId).replace(/\{garment\}/g, ids.garmentId).replace(/\{pkg\}/g, ids.packageId) as T;
}

/**
 * The story is written around Kavya's Anarkali. When a chapter follows a different sample order,
 * the words follow that order's customer and garment instead. Used for prose and captions only, never selectors.
 */
export function tellStory<T extends string | undefined>(s: T): T {
  if (!s) return s;
  const ids = storyIds();
  if (!ids.customerId || ids.customerId === KAVYA) return fillStory(s);
  const list = read<{id: string;name: string;}[]>('customers') ?? seedCustomers;
  const name = list.find((c) => c.id === ids.customerId)?.name;
  if (!name) return fillStory(s);
  const first = name.split(' ')[0];
  let out = fillStory(s).replace(/Kavya Iyer/g, name).replace(/Kavya/g, first);
  if (ids.garment) out = out.replace(/\bAnarkali\b/g, ids.garment);
  return out as T;
}
const KAVYA = 'C-1003';