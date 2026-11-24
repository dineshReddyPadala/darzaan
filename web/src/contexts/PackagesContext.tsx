import React, { createContext, useCallback, useContext, useState } from 'react';
import { toast } from 'sonner';
import { seedPackages, WORKSHOP_NAME } from '../data/packages';
import type { Order, StageKey } from '../types';
import type { Destination, Discrepancy, PackageEvent, PackageRecord, PackageStatus } from '../types/packaging';
import { nowIso } from '../utils/format';
import { deriveStatus } from '../utils/orders';
import { checklistFor, nextPackageId, otpFor } from '../utils/packages';
import { useApp } from './AppContext';
import { useSharedState } from '../hooks/useSharedState';

/** What the store's scan means. */
export type ReceiveOutcome = {
  kind: 'unreadable';
} | {
  kind: 'not-found';
  code: string;
} | {
  kind: 'wrong-store';
  pkg: PackageRecord;
} | {
  kind: 'not-dispatched';
  pkg: PackageRecord;
} | {
  kind: 'already';
  pkg: PackageRecord;
} | {
  kind: 'received';
  pkg: PackageRecord;
};
export interface NewPackage {
  order: Order;
  garmentIds: string[];
  destination: Destination;
  deadline: string;
  instructions: string;
}

/** Simulated unreadable label — lets the prototype show the scan-error state. */
export const UNREADABLE = '__unreadable__';
const onTheRoad = (s: PackageStatus) => s === 'Assigned to runner' || s === 'Picked up' || s === 'In transit';
interface PackagesValue {
  packages: PackageRecord[];
  getPackage: (code: string) => PackageRecord | undefined;
  forOrder: (orderId: string) => PackageRecord[];
  /** Production Assistant / Head / Store Manager send finished garments to packing from the Workflow tab. */
  mayPrepare: boolean;
  isLogistics: boolean;
  isRunner: boolean;
  myStore: string;
  createPackage: (p: NewPackage) => string;
  toggleItem: (id: string, itemId: string) => void;
  /** Packed and labelled; optionally handed to a driver in the same step. */
  markPacked: (id: string, driver?: string) => void;
  reportMissingAtPacking: (id: string, itemIds: string[], note: string) => void;
  assignDriver: (id: string, driver: string) => void;
  removeDriver: (id: string) => void;
  /** Store scan: validates the destination and marks it delivered. */
  receiveAtStore: (code: string, typed: boolean) => ReceiveOutcome;
  /** Home delivery: the customer's OTP confirms the handover. */
  deliverHome: (id: string, otp: string) => boolean;
  raiseDiscrepancy: (id: string, d: Pick<Discrepancy, 'itemIds' | 'issue' | 'note'>) => void;
  resolveDiscrepancy: (id: string) => void;
  resolveProblem: (id: string) => void;
}
const Ctx = createContext<PackagesValue | null>(null);
export function PackagesProvider({
  children


}: {children: React.ReactNode;}) {
  const {
    role,
    roleDef,
    user,
    updateOrder,
    logActivity,
    notify
  } = useApp();
  const [packages, setPackages] = useSharedState<PackageRecord[]>('packages', seedPackages);
  const mayPrepare = !!roleDef.oversight || role === 'production_assistant' || role === 'production_head';
  const isLogistics = role === 'logistics';
  const isRunner = role === 'runner';
  const myStore = roleDef.user.location;
  const getPackage = useCallback((code: string) => packages.find((p) => p.id.toLowerCase() === code.trim().toLowerCase()), [packages]);
  const forOrder = useCallback((orderId: string) => packages.filter((p) => p.orderId === orderId), [packages]);
  const save = (next: PackageRecord) => setPackages((prev) => prev.map((p) => p.id === next.id ? next : p));
  const event = (p: PackageRecord, to: PackageStatus | undefined, where: string, extra?: Partial<PackageEvent>): PackageEvent => ({
    at: nowIso(),
    by: user.name,
    where,
    from: to ? p.status : undefined,
    to,
    ...extra
  });

  /** Status change + audit entry. Previous entries are never overwritten. */
  const move = (p: PackageRecord, to: PackageStatus, where: string, extra?: Partial<PackageEvent>): PackageRecord => ({
    ...p,
    status: to,
    history: [...p.history, event(p, to, where, extra)]
  });
  const note = (p: PackageRecord, where: string, text: string, extra?: Partial<PackageEvent>): PackageRecord => ({
    ...p,
    history: [...p.history, event(p, undefined, where, {
      scanOnly: true,
      note: text,
      ...extra
    })]
  });
  const setStage = (p: PackageRecord, stage: StageKey) => updateOrder(p.orderId, (o) => {
    const ids = p.items.map((i) => i.garmentId);
    const updated = {
      ...o,
      garments: o.garments.map((g) => ids.includes(g.id) ? {
        ...g,
        stage,
        assignee: undefined
      } : g)
    };
    return {
      ...updated,
      status: deriveStatus(updated)
    };
  });
  const withDriver = (p: PackageRecord, driver: string): PackageRecord => {
    const at = nowIso();
    const home = p.destination.kind === 'customer';
    const otp = home ? otpFor(p) : undefined;
    return {
      ...move(p, 'Assigned to runner', WORKSHOP_NAME, {
        note: driver
      }),
      runner: driver,
      assignedAt: at,
      pickedUpBy: driver,
      pickedUpAt: at,
      otp
    };
  };
  const announce = (p: PackageRecord, driver: string) => {
    setStage(p, 'logistics');
    logActivity(p.orderId, `${p.id} out for delivery with ${driver}`, 'logistics');
    notify({
      category: 'Logistics',
      severity: 'info',
      title: 'New delivery',
      body: `${p.orderId} · ${p.destination.name}`,
      href: '/route',
      hrefLabel: 'Open deliveries',
      audience: ['runner']
    });
    if (p.destination.kind === 'store') notify({
      category: 'Logistics',
      severity: 'info',
      title: 'Package on its way',
      body: `${p.orderId} · with ${driver}`,
      href: '/receiving',
      hrefLabel: 'Open receiving',
      audience: ['admin', 'store_manager']
    });
    if (p.destination.kind === 'customer') toast(`Demo · OTP ${otpFor(p)} sent to ${p.destination.name}`);
  };
  const createPackage: PackagesValue['createPackage'] = ({
    order,
    garmentIds,
    destination,
    deadline,
    instructions
  }) => {
    const openForOrder = packages.filter((p) => p.orderId === order.id && p.status !== 'Delivered' && p.status !== 'Problem');
    const sameGarments = (p: (typeof packages)[number]) => {
      const ids = new Set(p.items.filter((i) => i.category === 'garment').map((i) => i.garmentId));
      return garmentIds.length === ids.size && garmentIds.every((id) => ids.has(id));
    };
    const duplicate = openForOrder.find(sameGarments);
    if (duplicate) {
      toast.info('Package already sent to packing', { description: duplicate.id });
      return duplicate.id;
    }
    const id = nextPackageId(order.id, packages);
    const at = nowIso();
    const first = !packages.some((p) => p.orderId === order.id);
    const rec: PackageRecord = {
      id,
      orderId: order.id,
      destination,
      packer: 'Logistics',
      deadline,
      instructions,
      status: 'Packaging assigned',
      createdBy: user.name,
      createdAt: at,
      items: checklistFor(order, garmentIds, first),
      checked: [],
      history: [{
        at,
        by: user.name,
        where: WORKSHOP_NAME,
        to: 'Packaging assigned',
        note: 'Sent to packing'
      }]
    };
    setPackages((prev) => [...prev, rec]);
    updateOrder(order.id, (o) => ({
      ...o,
      garments: o.garments.map((g) => garmentIds.includes(g.id) ? {
        ...g,
        packageId: id
      } : g)
    }));
    logActivity(order.id, `Package ${id} sent to Logistics for ${destination.name}`, 'logistics');
    notify({
      category: 'Logistics',
      severity: 'info',
      title: 'Ready to pack',
      body: `${order.id} · for ${destination.name}`,
      href: `/packing/${id}`,
      hrefLabel: 'Pack',
      audience: ['logistics']
    });
    toast.success(`${order.id} sent to Logistics`, {
      description: `${rec.items.length} item${rec.items.length > 1 ? 's' : ''} on the checklist.`
    });
    return id;
  };
  const toggleItem: PackagesValue['toggleItem'] = (id, itemId) => {
    const p = getPackage(id);
    if (!p || p.status !== 'Packaging assigned') return;
    const checked = p.checked ?? [];
    save({
      ...p,
      checked: checked.includes(itemId) ? checked.filter((x) => x !== itemId) : [...checked, itemId]
    });
  };
  const markPacked: PackagesValue['markPacked'] = (id, driver) => {
    const p = getPackage(id);
    if (!p || p.status !== 'Packaging assigned') return;
    const packed = {
      ...move(p, 'Ready for dispatch', WORKSHOP_NAME, {
        note: `${p.items.length} item${p.items.length > 1 ? 's' : ''} checked · label attached`
      }),
      packedAt: nowIso()
    };
    save(driver ? withDriver(packed, driver) : packed);
    logActivity(p.orderId, `${p.id} packed by ${user.name}`, 'logistics');
    if (driver) announce(p, driver);
    toast.success(`${p.orderId} packed`, {
      description: driver ? `Out for delivery with ${driver}.` : 'Assign a driver from the shipment page.'
    });
  };
  const reportMissingAtPacking: PackagesValue['reportMissingAtPacking'] = (id, itemIds, text) => {
    const p = getPackage(id);
    if (!p || p.status !== 'Packaging assigned') return;
    const names = p.items.filter((i) => itemIds.includes(i.garmentId)).map((i) => i.label).join(', ');
    const full = `${names}${text ? ` — ${text}` : ''}`;
    save({
      ...move(p, 'Problem', WORKSHOP_NAME, {
        note: `Missing item — ${full}`
      }),
      checked: (p.checked ?? []).filter((x) => !itemIds.includes(x)),
      problem: {
        kind: 'Missing item',
        note: full,
        at: nowIso(),
        by: user.name,
        from: 'Packaging assigned',
        itemIds
      }
    });
    logActivity(p.orderId, `Packing on hold: ${full} missing`, 'logistics');
    notify({
      category: 'Action Required',
      severity: 'warning',
      title: 'Packing on hold',
      body: `${p.orderId} · ${names} missing`,
      orderId: p.orderId,
      audience: ['production_assistant', 'production_head', 'admin']
    });
    toast(`${p.orderId} on hold`, {
      description: 'Shown under Needs attention.'
    });
  };
  const assignDriver: PackagesValue['assignDriver'] = (id, driver) => {
    const p = getPackage(id);
    if (!p) return;
    if (p.status === 'Ready for dispatch') {
      save(withDriver(p, driver));
      announce(p, driver);
      toast.success(`${driver} assigned`, {
        description: `${p.orderId} is out for delivery.`
      });
      return;
    }
    if (onTheRoad(p.status) && p.runner !== driver) {
      save({
        ...note(p, WORKSHOP_NAME, `Driver changed from ${p.runner} to ${driver}`),
        runner: driver,
        pickedUpBy: driver,
        assignedAt: nowIso()
      });
      logActivity(p.orderId, `${p.id} driver changed to ${driver}`, 'logistics');
      toast.success(`Driver changed to ${driver}`);
    }
  };
  const removeDriver: PackagesValue['removeDriver'] = (id) => {
    const p = getPackage(id);
    if (!p || !onTheRoad(p.status)) return;
    save({
      ...move(p, 'Ready for dispatch', WORKSHOP_NAME, {
        note: `${p.runner} removed`
      }),
      runner: undefined,
      manifestId: undefined,
      assignedAt: undefined,
      pickedUpAt: undefined,
      pickedUpBy: undefined
    });
    setStage(p, 'packaging');
    toast(`${p.orderId} back to packed`, {
      description: 'Assign another driver when ready.'
    });
  };
  const receiveAtStore: PackagesValue['receiveAtStore'] = (code, typed) => {
    if (code === UNREADABLE) return {
      kind: 'unreadable'
    };
    const p = getPackage(code);
    if (!p) return {
      kind: 'not-found',
      code: code.trim().toUpperCase()
    };
    if (p.destination.kind !== 'store' || p.destination.name !== myStore) {
      save(note(p, myStore, `Scanned at ${myStore} — wrong store`, {
        exception: true,
        typed
      }));
      notify({
        category: 'Action Required',
        severity: 'warning',
        title: 'Package at the wrong store',
        body: `${p.orderId} scanned at ${myStore} · goes to ${p.destination.name}`,
        href: `/shipments/${p.id}`,
        hrefLabel: 'Open shipment',
        audience: ['logistics']
      });
      return {
        kind: 'wrong-store',
        pkg: p
      };
    }
    if (p.status === 'Delivered') {
      save(note(p, myStore, 'Scanned again — no change', {
        typed
      }));
      return {
        kind: 'already',
        pkg: p
      };
    }
    if (!onTheRoad(p.status)) return {
      kind: 'not-dispatched',
      pkg: p
    };
    const done: PackageRecord = {
      ...move(p, 'Delivered', myStore, {
        note: `Received at ${myStore}`,
        deliveryScan: true,
        typed
      }),
      deliveredBy: p.runner,
      deliveredAt: nowIso(),
      receivedBy: user.name
    };
    save(done);
    setStage(p, 'store');
    logActivity(p.orderId, `${p.id} received at ${myStore} by ${user.name}`, 'logistics');
    toast.success(`${p.orderId} received`, {
      description: 'Check the contents below.'
    });
    return {
      kind: 'received',
      pkg: done
    };
  };
  const deliverHome: PackagesValue['deliverHome'] = (id, otp) => {
    const p = getPackage(id);
    if (!p || p.destination.kind !== 'customer' || !onTheRoad(p.status)) return false;
    if (otp.trim() !== otpFor(p)) {
      save(note(p, 'Customer home', 'Wrong OTP entered', {
        exception: true
      }));
      return false;
    }
    save({
      ...move(p, 'Delivered', 'Customer home', {
        note: 'OTP confirmed by customer'
      }),
      deliveredBy: user.name,
      deliveredAt: nowIso(),
      handover: {
        recipient: p.destination.name,
        relation: 'Customer'
      }
    });
    setStage(p, 'delivery');
    logActivity(p.orderId, `${p.id} delivered to ${p.destination.name} · OTP confirmed`, 'delivery');
    toast.success('Delivered', {
      description: `${p.orderId} · OTP confirmed`
    });
    return true;
  };
  const raiseDiscrepancy: PackagesValue['raiseDiscrepancy'] = (id, d) => {
    const p = getPackage(id);
    if (!p || p.status !== 'Delivered') return;
    const names = p.items.filter((i) => d.itemIds.includes(i.garmentId)).map((i) => i.label).join(', ');
    const text = `${d.issue}: ${names}${d.note ? ` — ${d.note}` : ''}`;
    save({
      ...note(p, myStore, text, {
        exception: true
      }),
      discrepancy: {
        ...d,
        at: nowIso(),
        by: user.name
      }
    });
    logActivity(p.orderId, `Discrepancy on ${p.id} · ${text}`, 'logistics');
    notify({
      category: 'Action Required',
      severity: 'warning',
      title: `Discrepancy · ${d.issue.toLowerCase()} item`,
      body: `${p.orderId} · ${names}`,
      href: `/shipments/${p.id}`,
      hrefLabel: 'Open shipment',
      audience: ['logistics', 'admin']
    });
    toast.error('Discrepancy raised', {
      description: 'Logistics has been told.'
    });
  };
  const resolveDiscrepancy: PackagesValue['resolveDiscrepancy'] = (id) => {
    const p = getPackage(id);
    if (!p?.discrepancy || p.discrepancy.resolvedAt) return;
    save({
      ...note(p, WORKSHOP_NAME, 'Discrepancy resolved', {
        reviewed: true
      }),
      discrepancy: {
        ...p.discrepancy,
        resolvedAt: nowIso(),
        resolvedBy: user.name
      }
    });
    toast.success('Discrepancy resolved');
  };
  const resolveProblem: PackagesValue['resolveProblem'] = (id) => {
    const p = getPackage(id);
    if (!p?.problem) return;
    const back = p.problem.from;
    const text = back === 'Packaging assigned' ? 'Item found — packing resumed' : `Resolved — back to ${back.toLowerCase()}`;
    save({
      ...move(p, back, WORKSHOP_NAME, {
        note: text,
        reviewed: true
      }),
      problem: undefined
    });
    logActivity(p.orderId, `${p.id} issue resolved`, 'logistics');
    toast.success(text);
  };
  return <Ctx.Provider value={{
    packages,
    getPackage,
    forOrder,
    mayPrepare,
    isLogistics,
    isRunner,
    myStore,
    createPackage,
    toggleItem,
    markPacked,
    reportMissingAtPacking,
    assignDriver,
    removeDriver,
    receiveAtStore,
    deliverHome,
    raiseDiscrepancy,
    resolveDiscrepancy,
    resolveProblem
  }}>
      {children}
    </Ctx.Provider>;
}
export function usePackages() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePackages must be used inside PackagesProvider');
  return v;
}