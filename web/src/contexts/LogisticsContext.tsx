import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useSyncedList } from '../hooks/useSyncedList';
import { toast } from 'sonner';
import { deliveryJobs as seedJobs, issueSeverity, logisticsIssues as seedIssues, movements as seedMoves, REATTEMPT_CHARGE, STORE, WORKSHOP } from '../data/logistics';
import type { Bag, DeliveryAttempt, DeliveryJob, LogisticsIssue, LogisticsIssueType, Movement, Order, PaymentMethod } from '../types';
import { inr, nowIso, uid } from '../utils/format';
import { deriveStatus, stageLabel } from '../utils/orders';
import { orderTotals } from '../utils/pricing';
import { ownsStage, stageOwnerLabel } from '../utils/roles';
import { useApp } from './AppContext';
import { useStore } from './StoreContext';
export interface ReceiveResult {
  tone: 'success' | 'attention' | 'critical';
  title: string;
  lines: string[];
}
interface LogisticsValue {
  movements: Movement[];
  deliveries: DeliveryJob[];
  issues: LogisticsIssue[];
  mayRun: boolean;
  mayDeliver: boolean;
  mayReceive: boolean;
  mayPack: boolean;
  addPackedBag: (order: Order, garmentId: string, label: string) => void;
  confirmPickup: (id: string, scanned: Record<string, string | true>, photo: boolean, leaveReason: string) => void;
  confirmDrop: (id: string) => void;
  handOver: (id: string, runner: string, note: string) => void;
  reportTransit: (id: string, type: LogisticsIssueType, tags: string[], note: string, eta?: string) => void;
  receive: (id: string, scannedTags: string[]) => ReceiveResult | null;
  resolveIssue: (id: string, resolution: string) => void;
  confirmAddress: (jobId: string, address: string) => void;
  schedule: (jobId: string, assignee: string, date: string, window: string) => void;
  startRun: (jobId: string) => void;
  completeDelivery: (jobId: string, receivedBy: {
    name: string;
    relation: string;
  }, collect: {
    amount: number;
    method: PaymentMethod;
  } | null) => void;
  failAttempt: (jobId: string, outcome: DeliveryAttempt['outcome'], note: string) => void;
  reattemptCharge: (job: DeliveryJob) => number;
}
const LogisticsContext = createContext<LogisticsValue | null>(null);
const TASK = {
  entity: 'production_task',
  action: 'update'
} as const;
export function LogisticsProvider({
  children


}: {children: React.ReactNode;}) {
  const {
    role,
    roleDef,
    user,
    orders,
    getOrder,
    updateOrder,
    logActivity,
    customerName
  } = useApp();
  const [movements, setMovements] = useSyncedList<Movement[]>('movements', seedMoves);
  const [jobs, setJobs] = useSyncedList<DeliveryJob[]>('deliveries', seedJobs);
  const [issues, setIssues] = useSyncedList<LogisticsIssue[]>('logisticsIssues', seedIssues);
  const mayPack = !!roleDef.oversight || ownsStage(role, 'packaging');
  const mayRun = !!roleDef.oversight || ownsStage(role, 'logistics') || !!roleDef.delivers;
  const mayDeliver = !!roleDef.oversight || role === 'runner';
  const {
    managerInStore
  } = useStore();
  // The Salesperson may confirm receipts only while the manager is marked away.
  const mayReceive = !!roleDef.oversight || ownsStage(role, 'store') || role === 'store_manager' || role === 'salesperson' && !managerInStore;
  const RECEIVE_PERM = roleDef.perms.production_task?.includes('update') ? TASK : {
    entity: 'order',
    action: 'update'
  } as const;

  /** Re-checks permission at the moment of acting, so a stale screen can’t perform a blocked action. */
  const allow = useCallback((ok: boolean, what: string) => {
    if (!ok) toast.error('Not part of your role', {
      description: `${roleDef.label} can’t ${what}.`
    });
    return ok;
  }, [roleDef.label]);

  // Home-delivery orders that are ready but have no job yet get one automatically.
  const deliveries = useMemo(() => {
    const auto = orders.filter((o) => o.deliveryMode === 'Home delivery' && o.status === 'Ready for Pickup' && !jobs.some((j) => j.orderId === o.id)).map<DeliveryJob>((o) => ({
      id: `DL-${o.id.slice(3)}`,
      orderId: o.id,
      address: '',
      addressConfirmed: false,
      status: 'To schedule',
      attempts: []
    }));
    return [...jobs, ...auto];
  }, [orders, jobs]);

  // Garments released to logistics from anywhere (board, station, packaging) always land on a trip.
  useEffect(() => {
    const onTrip = new Set(movements.flatMap((m) => m.bags.filter((b) => b.state !== 'Received').map((b) => b.tag)));
    orders.forEach((o) => o.garments.forEach((g) => {
      // Garments in a package travel on the package record, not as a loose bag.
      if (g.stage === 'logistics' && !g.packageId && !onTrip.has(`${o.id}-${g.id}`)) addPackedBag(o, g.id, g.subCategory);
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);
  const patchMove = (id: string, fn: (m: Movement) => Movement) => setMovements((p) => p.map((m) => m.id === id ? fn(m) : m));
  const upsertJob = (job: DeliveryJob) => setJobs((p) => p.some((j) => j.id === job.id) ? p.map((j) => j.id === job.id ? job : j) : [...p, job]);
  const findJob = (id: string) => deliveries.find((j) => j.id === id);
  const custody = (what: string) => ({
    at: nowIso(),
    who: `${user.name} · ${roleDef.label}`,
    what
  });
  const raise = (type: LogisticsIssueType, ref: string, orderIds: string[], note: string, owner: string) => {
    const issue: LogisticsIssue = {
      id: uid('LI'),
      type,
      ref,
      orderIds,
      note,
      at: nowIso(),
      by: user.name,
      severity: issueSeverity[type],
      owner,
      status: 'Open'
    };
    setIssues((p) => [issue, ...p]);
  };
  const addPackedBag: LogisticsValue['addPackedBag'] = (order, garmentId, label) => {
    const to = `${order.store} Store`;
    const bag: Bag = {
      tag: `${order.id}-${garmentId}`,
      orderId: order.id,
      garmentId,
      label,
      state: 'Waiting'
    };
    const express = order.priority === 'Express';
    setMovements((prev) => {
      if (prev.some((m) => m.status !== 'Received' && m.bags.some((b) => b.tag === bag.tag && b.state !== 'Received'))) return prev;
      const open = prev.find((m) => m.status === 'Awaiting pickup' && m.from === WORKSHOP && m.to === to);
      if (open) {
        return prev.map<Movement>((m) => m.id === open.id ? {
          ...m,
          priority: express ? 'Express' : m.priority,
          bags: [...m.bags.filter((b) => b.tag !== bag.tag), bag],
          custody: [...m.custody, custody(`Bag ${bag.tag} added`)]
        } : m);
      }
      return [{
        id: uid('MV'),
        from: WORKSHOP,
        to,
        runner: 'Arjun Singh',
        status: 'Awaiting pickup',
        priority: express ? 'Express' : 'Regular',
        bags: [bag],
        lastScan: {
          at: nowIso(),
          location: 'Packaging — Okhla'
        },
        custody: [custody(`Trip opened — bag ${bag.tag} ready`)]
      }, ...prev];
    });
  };
  const confirmPickup: LogisticsValue['confirmPickup'] = (id, scanned, photo, leaveReason) => {
    if (!allow(mayRun, 'confirm a pickup')) return;
    const m = movements.find((x) => x.id === id);
    if (!m || m.status !== 'Awaiting pickup' || !photo) return;
    const taken = m.bags.filter((b) => scanned[b.tag]);
    const left = m.bags.filter((b) => !scanned[b.tag]);
    if (!taken.length) return;
    const manual = taken.filter((b) => typeof scanned[b.tag] === 'string');
    patchMove(id, (x) => ({
      ...x,
      status: 'In transit',
      bags: taken.map<Bag>((b) => ({
        ...b,
        state: 'On board',
        manualReason: typeof scanned[b.tag] === 'string' ? scanned[b.tag] as string : undefined
      })),
      lastScan: {
        at: nowIso(),
        location: `${x.from} — picked up`
      },
      custody: [...x.custody, custody(`Picked up ${taken.length} of ${x.bags.length} bag${x.bags.length > 1 ? 's' : ''} with photo${manual.length ? ` (${manual.length} entered by hand)` : ''}`)]
    }));
    // Bags that weren’t ready stay behind on a fresh trip so nothing is silently dropped.
    if (left.length) {
      const nid = uid('MV');
      setMovements((p) => [{
        ...m,
        id: nid,
        status: 'Awaiting pickup',
        bags: left.map<Bag>((b) => ({
          ...b,
          state: 'Waiting'
        })),
        custody: [...m.custody, custody(`Left behind from ${m.id}: ${leaveReason || 'not ready'}`)]
      }, ...p]);
      raise('Bag not ready', m.id, [...new Set(left.map((b) => b.orderId))], `${left.map((b) => b.label).join(', ')} left behind — ${leaveReason || 'not ready'}. Moved to trip ${nid}.`, m.from === WORKSHOP ? 'Vikram Rathore' : 'Kabir Sethi');
    }
    [...new Set(taken.map((b) => b.orderId))].forEach((oid) => logActivity(oid, `Picked up by ${m.runner} — trip ${m.id} (scan + photo)`, 'logistics'));
    toast.success(`${m.id} picked up`, {
      description: left.length ? `${left.length} bag${left.length > 1 ? 's' : ''} left behind on a new trip.` : 'Destination and customer trackers updated.'
    });
  };
  const confirmDrop: LogisticsValue['confirmDrop'] = (id) => {
    if (!allow(mayRun, 'confirm a drop-off')) return;
    const m = movements.find((x) => x.id === id);
    if (!m || m.status !== 'In transit') return;
    const toWorkshop = m.to === WORKSHOP;
    patchMove(id, (x) => ({
      ...x,
      eta: undefined,
      status: toWorkshop ? 'Received' : 'At destination',
      bags: x.bags.map<Bag>((b) => b.state === 'On board' ? {
        ...b,
        state: toWorkshop ? 'Received' : 'At destination'
      } : b),
      lastScan: {
        at: nowIso(),
        location: `${x.to} — dropped`
      },
      custody: [...x.custody, custody(toWorkshop ? 'Dropped and signed for at workshop gate' : 'Dropped at store counter — waiting for store count')]
    }));
    [...new Set(m.bags.map((b) => b.orderId))].forEach((oid) => logActivity(oid, `Dropped at ${m.to} by ${m.runner} — trip ${m.id}`, 'logistics'));
    toast.success(`${m.id} dropped at ${m.to}`, {
      description: toWorkshop ? 'Workshop notified.' : 'Store will scan and count the bags.'
    });
  };
  const handOver: LogisticsValue['handOver'] = (id, runner, note) => {
    if (!allow(mayRun, 'hand over a trip')) return;
    const m = movements.find((x) => x.id === id);
    if (!m || runner === m.runner) return;
    patchMove(id, (x) => ({
      ...x,
      runner,
      custody: [...x.custody, custody(`Handed from ${x.runner} to ${runner}${note ? ` — ${note}` : ''}`)]
    }));
    toast.success(`${m.id} handed to ${runner}`);
  };
  const reportTransit: LogisticsValue['reportTransit'] = (id, type, tags, note, eta) => {
    if (!allow(mayRun, 'report a trip problem')) return;
    const m = movements.find((x) => x.id === id);
    if (!m) return;
    const hit = m.bags.filter((b) => tags.includes(b.tag));
    const orderIds = [...new Set((hit.length ? hit : m.bags).map((b) => b.orderId))];
    if (type === 'Running late') {
      patchMove(id, (x) => ({
        ...x,
        eta,
        custody: [...x.custody, custody(`Running late — new arrival ${eta}${note ? ` (${note})` : ''}`)]
      }));
      raise(type, id, orderIds, `New arrival ${eta}. ${note}`.trim(), m.to === WORKSHOP ? 'Vikram Rathore' : 'Kabir Sethi');
      toast.success(`${m.to} told you’ll arrive at ${eta}`);
      return;
    }
    const state: Bag['state'] = type === 'Damaged in transit' ? 'Damaged' : 'Missing';
    patchMove(id, (x) => ({
      ...x,
      bags: x.bags.map<Bag>((b) => tags.includes(b.tag) ? {
        ...b,
        state
      } : b),
      custody: [...x.custody, custody(`${type}: ${hit.map((b) => b.tag).join(', ')}${note ? ` — ${note}` : ''}`)]
    }));
    hit.forEach((b) => {
      const o = getOrder(b.orderId);
      if (!o) return;
      // A damaged garment goes straight back to finishing with priority; a missing one is escalated.
      updateOrder(o.id, (x) => {
        const garments = type === 'Damaged in transit' && b.garmentId ? x.garments.map((g) => g.id === b.garmentId ? {
          ...g,
          stage: 'finishing' as const,
          assignee: undefined
        } : g) : x.garments;
        const updated = {
          ...x,
          garments,
          risk: {
            severity: issueSeverity[type],
            message: `${type} — ${b.label} on trip ${m.id}${note ? `: ${note}` : ''}`,
            owner: x.productionOwner
          }
        };
        return {
          ...updated,
          status: deriveStatus(updated)
        };
      }, TASK);
      logActivity(o.id, type === 'Damaged in transit' ? `${b.label} damaged in transit (photo) — returned to ${stageOwnerLabel('finishing')} with priority` : `${b.label} reported missing on trip ${m.id} — escalated`, 'logistics');
    });
    raise(type, id, orderIds, `${hit.map((b) => b.label).join(', ')}${note ? ` — ${note}` : ''}`, 'Vikram Rathore');
    toast.success(type === 'Damaged in transit' ? 'Sent back to finishing' : 'Escalated to the manager');
  };
  const receive: LogisticsValue['receive'] = (id, scannedTags) => {
    if (!allow(mayReceive, 'confirm a receipt')) return null;
    const m = movements.find((x) => x.id === id);
    if (!m) return null;
    const expected = m.bags.filter((b) => b.state === 'On board' || b.state === 'At destination');
    const got = expected.filter((b) => scannedTags.includes(b.tag));
    const missing = expected.filter((b) => !scannedTags.includes(b.tag));
    if (!got.length) return {
      tone: 'critical',
      title: 'Nothing scanned',
      lines: ['Scan every bag before confirming.']
    };
    const lines: string[] = [];
    got.forEach((b) => {
      const o = getOrder(b.orderId);
      const g = o?.garments.find((x) => x.id === b.garmentId);
      if (!o || !g) return;
      if (g.stage !== 'logistics') {
        lines.push(`${b.tag}: not released by packaging (${stageLabel(g.stage)}) — held, workshop told.`);
        return;
      }
      updateOrder(o.id, (x) => {
        const updated = {
          ...x,
          garments: x.garments.map((y) => y.id === g.id ? {
            ...y,
            stage: 'store' as const
          } : y)
        };
        const waiting = updated.garments.filter((y) => y.stage !== 'store' && y.stage !== 'delivery');
        return {
          ...updated,
          status: deriveStatus(updated),
          nextAction: waiting.length ? {
            label: `Waiting for ${waiting.map((y) => y.subCategory).join(', ')} before trial`,
            owner: x.productionOwner
          } : {
            label: 'Book trial',
            owner: stageOwnerLabel('trial')
          }
        };
      }, RECEIVE_PERM);
      logActivity(o.id, `${b.label} received at ${m.to} — trip ${m.id} counted`, 'logistics');
      const after = getOrder(o.id);
      const others = (after ?? o).garments.filter((y) => y.id !== g.id && y.stage !== 'store' && y.stage !== 'delivery');
      if (others.length) lines.push(`${o.id}: ${o.garments.length - others.length} of ${o.garments.length} garments here — trial waits for ${others.map((y) => y.subCategory).join(', ')}.`);
    });
    patchMove(id, (x) => ({
      ...x,
      status: 'Received',
      bags: x.bags.map<Bag>((b) => scannedTags.includes(b.tag) ? {
        ...b,
        state: 'Received'
      } : missing.some((mm) => mm.tag === b.tag) ? {
        ...b,
        state: 'Missing'
      } : b),
      lastScan: {
        at: nowIso(),
        location: `${x.to} — received`
      },
      custody: [...x.custody, custody(`Received ${got.length} of ${expected.length} at ${x.to}`)]
    }));
    if (missing.length) {
      raise('Short count', id, [...new Set(missing.map((b) => b.orderId))], `${missing.map((b) => b.tag).join(', ')} not in the bag. Last scan: ${m.lastScan.location}. Runner ${m.runner} asked to trace.`, 'Kabir Sethi');
      return {
        tone: 'attention',
        title: `${missing.length} bag${missing.length > 1 ? 's' : ''} missing`,
        lines: [`Received ${got.length} of ${expected.length}. ${missing.map((b) => b.tag).join(', ')} flagged — last seen at ${m.lastScan.location}.`, ...lines]
      };
    }
    return {
      tone: 'success',
      title: 'Receipt confirmed',
      lines: [`${got.length} bag${got.length > 1 ? 's' : ''} counted. Customers told their garments reached the store.`, ...lines]
    };
  };
  const resolveIssue: LogisticsValue['resolveIssue'] = (id, resolution) => {
    if (!allow(mayRun || mayReceive || mayDeliver, 'resolve logistics issues')) return;
    setIssues((p) => p.map((i) => i.id === id ? {
      ...i,
      status: 'Resolved',
      resolution
    } : i));
    toast.success('Issue resolved');
  };
  const reattemptCharge = (job: DeliveryJob) => job.attempts.filter((a) => a.outcome !== 'Delivered').length >= 2 ? REATTEMPT_CHARGE : 0;
  const notify = (orderId: string, template: string) => updateOrder(orderId, (o) => ({
    ...o,
    messages: [...o.messages, {
      id: uid('M'),
      channel: 'WhatsApp',
      template,
      at: nowIso(),
      status: 'Delivered'
    }]
  }), TASK);
  const confirmAddress: LogisticsValue['confirmAddress'] = (jobId, address) => {
    if (!allow(mayDeliver, 'edit delivery addresses')) return;
    const j = findJob(jobId);
    if (!j || !address.trim()) return;
    upsertJob({
      ...j,
      address: address.trim(),
      addressConfirmed: true
    });
    logActivity(j.orderId, `Delivery address confirmed with customer: ${address.trim()}`, 'logistics');
    toast.success('Address confirmed');
  };
  const schedule: LogisticsValue['schedule'] = (jobId, assignee, date, window) => {
    if (!allow(mayDeliver, 'schedule deliveries')) return;
    const j = findJob(jobId);
    if (!j || !j.addressConfirmed) return;
    const charge = reattemptCharge(j);
    if (charge) updateOrder(j.orderId, (o) => ({
      ...o,
      deliveryCharge: o.deliveryCharge + charge
    }), TASK);
    upsertJob({
      ...j,
      assignee,
      slot: {
        date,
        window
      },
      status: 'Scheduled'
    });
    notify(j.orderId, `Delivery scheduled — ${date} ${window}`);
    logActivity(j.orderId, `Home delivery ${j.attempts.length ? 're-' : ''}scheduled for ${date}, ${window} with ${assignee}${charge ? ` (re-attempt charge ${inr(charge)})` : ''}`, 'logistics');
    toast.success('Delivery scheduled', {
      description: `${customerName(getOrder(j.orderId)?.customerId ?? '')} notified on WhatsApp.`
    });
  };
  const startRun: LogisticsValue['startRun'] = (jobId) => {
    if (!allow(mayDeliver, 'start deliveries')) return;
    const j = findJob(jobId);
    if (!j || j.status !== 'Scheduled') return;
    upsertJob({
      ...j,
      status: 'Out for delivery'
    });
    notify(j.orderId, 'Out for delivery');
    logActivity(j.orderId, `Out for delivery with ${j.assignee}`, 'logistics');
    toast.success('Marked out for delivery', {
      description: 'Customer told it’s on the way.'
    });
  };
  const completeDelivery: LogisticsValue['completeDelivery'] = (jobId, receivedBy, collect) => {
    if (!allow(mayDeliver, 'complete deliveries')) return;
    const j = findJob(jobId);
    const o = j && getOrder(j.orderId);
    if (!j || !o || j.status !== 'Out for delivery') return;
    const due = orderTotals(o).balance;
    if (due > 0) {
      if (!collect || collect.amount !== due) {
        toast.error('Balance not collected', {
          description: `${inr(due)} must be collected before handing over.`
        });
        return;
      }
      const ok = updateOrder(o.id, (x) => ({
        ...x,
        payments: [...x.payments, {
          id: uid('PAY'),
          amount: collect.amount,
          method: collect.method,
          reference: `${collect.method} at door — ${j.id}`,
          at: nowIso(),
          by: user.name,
          kind: 'Balance'
        }]
      }), {
        entity: 'payment',
        action: 'create'
      });
      if (!ok) return;
      logActivity(o.id, `Balance ${inr(collect.amount)} collected at the door via ${collect.method}${collect.method === 'Cash' ? ' — to hand over to accounts' : ''}`, 'payment');
    }
    updateOrder(o.id, (x) => ({
      ...x,
      status: 'Closed',
      risk: undefined,
      garments: x.garments.map((g) => ({
        ...g,
        stage: 'delivery' as const
      })),
      nextAction: {
        label: 'Order closed',
        owner: '—'
      },
      messages: [...x.messages, {
        id: uid('M'),
        channel: 'WhatsApp',
        template: 'Final invoice',
        at: nowIso(),
        status: 'Delivered'
      }, {
        id: uid('M'),
        channel: 'WhatsApp',
        template: 'Thank you & feedback request',
        at: nowIso(),
        status: 'Delivered'
      }]
    }), TASK);
    upsertJob({
      ...j,
      status: 'Delivered',
      receivedBy,
      collected: due > 0 && collect ? {
        ...collect,
        handedToAccounts: collect.method !== 'Cash'
      } : undefined,
      attempts: [...j.attempts, {
        at: nowIso(),
        outcome: 'Delivered',
        note: `Received by ${receivedBy.name} (${receivedBy.relation})`,
        by: user.name
      }]
    });
    logActivity(o.id, `Delivered to ${receivedBy.name} (${receivedBy.relation}) — photo + signature. Order closed.`, 'logistics');
    toast.success('Delivered — order closed', {
      description: 'Final invoice and thank-you sent.'
    });
  };
  const failAttempt: LogisticsValue['failAttempt'] = (jobId, outcome, note) => {
    if (!allow(mayDeliver, 'record delivery attempts')) return;
    const j = findJob(jobId);
    if (!j || j.status !== 'Out for delivery') return;
    const attempt: DeliveryAttempt = {
      at: nowIso(),
      outcome,
      note,
      by: user.name
    };
    const refused = outcome === 'Refused';
    upsertJob({
      ...j,
      status: refused ? 'Returned to store' : 'Attempt failed',
      addressConfirmed: outcome === 'Address problem' ? false : j.addressConfirmed,
      attempts: [...j.attempts, attempt]
    });
    const type: LogisticsIssueType = refused ? 'Refused at door' : outcome === 'Not home' ? 'Customer not home' : 'Address problem';
    raise(type, j.id, [j.orderId], note || type, refused ? 'Kabir Sethi' : 'Sunil Mehta');
    updateOrder(j.orderId, (o) => ({
      ...o,
      risk: {
        severity: issueSeverity[type],
        message: `${type} on delivery attempt ${j.attempts.length + 1}${note ? `: ${note}` : ''}`,
        owner: refused ? 'Kabir Sethi' : 'Sunil Mehta'
      },
      nextAction: refused ? {
        label: 'Call customer about refused delivery',
        owner: 'Kabir Sethi'
      } : {
        label: 'Reschedule home delivery',
        owner: 'Sunil Mehta'
      }
    }), TASK);
    logActivity(j.orderId, `Delivery attempt failed — ${type}${note ? `: ${note}` : ''}${refused ? '. Garment returning to store.' : ''}`, 'logistics');
    toast.success(refused ? 'Returning to store' : 'Attempt recorded', {
      description: refused ? 'Store manager alerted.' : 'Reschedule from the Home delivery list.'
    });
  };
  const value: LogisticsValue = {
    movements,
    deliveries,
    issues,
    mayRun,
    mayDeliver,
    mayReceive,
    mayPack,
    addPackedBag,
    confirmPickup,
    confirmDrop,
    handOver,
    reportTransit,
    receive,
    resolveIssue,
    confirmAddress,
    schedule,
    startRun,
    completeDelivery,
    failAttempt,
    reattemptCharge
  };
  return <LogisticsContext.Provider value={value}>{children}</LogisticsContext.Provider>;
}
export function useLogistics(): LogisticsValue {
  const ctx = useContext(LogisticsContext);
  if (!ctx) throw new Error('useLogistics must be used inside LogisticsProvider');
  return ctx;
}
export { STORE, WORKSHOP };