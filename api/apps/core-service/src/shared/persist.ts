import { HttpStatus } from '@nestjs/common';
import { Prisma } from '../../../../generated/core';
import { createEvent, type DomainEvent } from '../../../../libs/common/src/events';
import { AppError } from '../../../../libs/common/src/http';
import { diffOrder, type EventDraft } from '../../../../libs/common/src/order-diff';
import { asArray, entityId, text } from '../../../../libs/common/src/scope';

type Tx = Prisma.TransactionClient;

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function saveOrderDocument(
  tx: Tx,
  order: Record<string, unknown>,
  options: { correlationId: string; emit: boolean },
): Promise<{ order: Record<string, unknown>; events: DomainEvent[] }> {
  const storeId = entityId(order.storeId);
  let customerId = entityId(order.customerId);
  const existingCustomer = customerId ? await tx.customer.findUnique({ where: { id: customerId } }) : null;
  if (!existingCustomer) {
    const created = await tx.customer.create({
      data: {
        name: 'Unknown customer',
        store: text(order.store, 'Khan Market'),
        storeId,
        document: json({}),
      },
    });
    const document = {
      id: created.id,
      name: 'Unknown customer',
      mobile: '',
      whatsapp: '',
      whatsappAvailable: false,
      email: '',
      city: '',
      since: '',
      tier: 'New',
      designer: '',
      preferences: [],
      notes: '',
      remote: false,
      measurementProfiles: [],
      storeId,
    };
    await tx.customer.update({ where: { id: created.id }, data: { document: json(document) } });
    customerId = created.id;
  }
  order.customerId = customerId;

  let orderId = entityId(order.id);
  let previous = orderId ? await tx.order.findUnique({ where: { id: orderId } }) : null;
  if (orderId && !previous) orderId = null;
  const row = {
    customerId: customerId!,
    status: text(order.status, 'Draft'),
    store: text(order.store, 'Khan Market'),
    storeId,
    deliveryDate: text(order.deliveryDate),
    priority: text(order.priority, 'Regular'),
    deletedAt: order.status === 'Cancelled' ? new Date() : null,
  };
  if (!previous) {
    const created = await tx.order.create({ data: { ...row, document: json({}), version: 1 } });
    orderId = created.id;
    previous = created;
  }
  order.id = orderId;
  if (storeId) order.storeId = storeId;

  await syncChildren(tx, orderId!, order);
  normalizeReadyPickupNextAction(order);

  const previousDocument = previous.document && Object.keys(previous.document as object).length
    ? (previous.document as Record<string, unknown>)
    : null;
  const drafts = options.emit ? diffOrder(previousDocument, order) : [];
  const events = drafts.map((draft) => createEvent({ ...draft, correlationId: options.correlationId }));
  await tx.order.update({
    where: { id: orderId! },
    data: { ...row, document: json(order), version: { increment: previousDocument ? 1 : 0 } },
  });
  if (events.length) {
    await tx.outboxEvent.createMany({
      data: events.map((event) => ({
        id: event.eventId,
        type: event.type,
        version: event.version,
        aggregateId: event.aggregateId,
        payload: json(event),
        correlationId: event.correlationId,
        causationId: event.causationId,
      })),
    });
  }
  return { order, events };
}

async function syncChildren(tx: Tx, orderId: number, order: Record<string, unknown>): Promise<void> {
  const garmentIds = new Map<string, number>();
  const keptGarments: number[] = [];
  const garments = [];
  for (const garment of asArray(order.garments)) {
    const previousKey = garment.id == null ? '' : String(garment.id);
    let id = entityId(garment.id);
    if (id) {
      const row = await tx.garment.findUnique({ where: { id } });
      if (!row || row.orderId !== orderId) id = null;
    }
    const data = {
      orderId,
      category: text(garment.category),
      subCategory: text(garment.subCategory),
      stage: text(garment.stage, 'store'),
      assignee: text(garment.assignee) || null,
      deletedAt: null,
      document: json({ ...garment, id: id ?? garment.id }),
    };
    const savedId = id
      ? (await tx.garment.update({ where: { id }, data })).id
      : (await tx.garment.create({ data: { ...data, document: json({}) } })).id;
    garment.id = savedId;
    if (previousKey) garmentIds.set(previousKey, savedId);
    keptGarments.push(savedId);
    await tx.garment.update({ where: { id: savedId }, data: { document: json(garment) } });
    await syncPieces(tx, savedId, garment);
    garments.push(garment);
  }
  order.garments = garments;
  const droppedGarments = { orderId, deletedAt: null, id: { notIn: keptGarments.length ? keptGarments : [-1] } };
  await tx.garmentFabricPiece.updateMany({ where: { deletedAt: null, garment: droppedGarments }, data: { deletedAt: new Date() } });
  await tx.embroideryVersion.updateMany({ where: { deletedAt: null, garment: droppedGarments }, data: { deletedAt: new Date() } });
  await tx.garment.updateMany({ where: droppedGarments, data: { deletedAt: new Date() } });

  order.activity = normalizeActivityList(asArray(order.activity));

  order.payments = await syncList(asArray(order.payments), async (payment) => {
    validatePayment(payment);
    let id = entityId(payment.id);
    if (id) {
      const row = await tx.payment.findUnique({ where: { id } });
      if (!row || row.orderId !== orderId) id = null;
    }
    const data = {
      orderId,
      amount: Math.round(typeof payment.amount === 'number' ? payment.amount : Number(payment.amount) || 0),
      method: text(payment.method, 'Cash'),
      reference: text(payment.reference),
      at: text(payment.at),
      by: text(payment.by),
      kind: text(payment.kind, 'Advance'),
      deletedAt: null,
    };
    const saved = id ? await tx.payment.update({ where: { id }, data }) : await tx.payment.create({ data });
    payment.id = saved.id;
    return saved.id;
  });
  await tx.payment.updateMany({ where: { orderId, deletedAt: null, id: { notIn: idsOf(order.payments) } }, data: { deletedAt: new Date() } });

  order.tasks = await syncList(asArray(order.tasks), async (task) => {
    const mapped = garmentIds.get(String(task.garmentId ?? ''));
    if (mapped) task.garmentId = mapped;
    let id = entityId(task.id);
    if (id) {
      const row = await tx.productionTask.findUnique({ where: { id } });
      if (!row || row.orderId !== orderId) id = null;
    }
    const data = {
      orderId,
      garmentId: entityId(task.garmentId),
      name: text(task.name),
      stage: text(task.stage),
      assignee: text(task.assignee) || null,
      status: text(task.status, 'Pending'),
      deletedAt: null,
      document: json(task),
    };
    const saved = id
      ? await tx.productionTask.update({ where: { id }, data })
      : await tx.productionTask.create({ data: { ...data, document: json({}) } });
    task.id = saved.id;
    await tx.productionTask.update({ where: { id: saved.id }, data: { document: json(task) } });
    return saved.id;
  });
  await tx.productionTask.updateMany({ where: { orderId, deletedAt: null, id: { notIn: idsOf(order.tasks) } }, data: { deletedAt: new Date() } });

  order.alterations = await syncList(asArray(order.alterations), async (alteration) => {
    let id = entityId(alteration.id);
    if (id) {
      const row = await tx.alteration.findUnique({ where: { id } });
      if (!row || row.orderId !== orderId) id = null;
    }
    const data = {
      orderId,
      status: text(alteration.status, 'Open'),
      charge: Math.round(typeof alteration.charge === 'number' ? alteration.charge : Number(alteration.charge) || 0),
      deletedAt: null,
      document: json(alteration),
    };
    const saved = id
      ? await tx.alteration.update({ where: { id }, data })
      : await tx.alteration.create({ data: { ...data, document: json({}) } });
    alteration.id = saved.id;
    await tx.alteration.update({ where: { id: saved.id }, data: { document: json(alteration) } });
    return saved.id;
  });
  await tx.alteration.updateMany({ where: { orderId, deletedAt: null, id: { notIn: idsOf(order.alterations) } }, data: { deletedAt: new Date() } });

  if (order.trial && typeof order.trial === 'object') {
    const trial = order.trial as Record<string, unknown>;
    let id = entityId(trial.id);
    if (id) {
      const row = await tx.trial.findUnique({ where: { id } });
      if (!row || row.orderId !== orderId) id = null;
    }
    const data = {
      orderId,
      date: text(trial.date),
      time: text(trial.time),
      status: text(trial.status, 'Scheduled'),
      deletedAt: null,
      document: json(trial),
    };
    const saved = id ? await tx.trial.update({ where: { id }, data }) : await tx.trial.create({ data: { ...data, document: json({}) } });
    trial.id = saved.id;
    await tx.trial.update({ where: { id: saved.id }, data: { document: json(trial) } });
    await tx.trial.updateMany({ where: { orderId, deletedAt: null, id: { not: saved.id } }, data: { deletedAt: new Date() } });
  } else {
    await tx.trial.updateMany({ where: { orderId, deletedAt: null }, data: { deletedAt: new Date() } });
  }

  order.activity = await syncList(order.activity as Record<string, unknown>[], async (activity) => {
    let id = entityId(activity.id);
    if (id) {
      const row = await tx.activityEvent.findUnique({ where: { id } });
      if (!row || row.orderId !== orderId) id = null;
    }
    const data = {
      orderId,
      at: text(activity.at),
      who: text(activity.who),
      what: text(activity.what),
      kind: text(activity.kind, 'created'),
      deletedAt: null,
    };
    const saved = id ? await tx.activityEvent.update({ where: { id }, data }) : await tx.activityEvent.create({ data });
    activity.id = saved.id;
    return saved.id;
  });
  await tx.activityEvent.updateMany({ where: { orderId, deletedAt: null, id: { notIn: idsOf(order.activity) } }, data: { deletedAt: new Date() } });
}

async function syncPieces(tx: Tx, garmentId: number, garment: Record<string, unknown>): Promise<void> {
  const fabric = garment.fabric && typeof garment.fabric === 'object' ? (garment.fabric as Record<string, unknown>) : null;
  const embroidery = garment.embroidery && typeof garment.embroidery === 'object' ? (garment.embroidery as Record<string, unknown>) : null;
  const keptPieces: number[] = [];
  if (fabric) {
    const pieces = [];
    for (const piece of asArray(fabric.pieces)) {
      let id = entityId(piece.id);
      if (id) {
        const row = await tx.garmentFabricPiece.findUnique({ where: { id } });
        if (!row || row.garmentId !== garmentId) id = null;
      }
      const data = {
        garmentId,
        material: text(piece.material),
        length: typeof piece.length === 'number' ? piece.length : Number(piece.length) || 0,
        unit: text(piece.unit, 'm'),
        notes: text(piece.notes),
        deletedAt: null,
      };
      const saved = id ? await tx.garmentFabricPiece.update({ where: { id }, data }) : await tx.garmentFabricPiece.create({ data });
      piece.id = saved.id;
      keptPieces.push(saved.id);
      pieces.push(piece);
    }
    fabric.pieces = pieces;
  }
  await tx.garmentFabricPiece.updateMany({ where: { garmentId, deletedAt: null, id: { notIn: keptPieces.length ? keptPieces : [-1] } }, data: { deletedAt: new Date() } });

  const keptSketches: number[] = [];
  if (embroidery) {
    const versions = [];
    for (const sketch of asArray(embroidery.versions)) {
      let id = entityId(sketch.id);
      if (id) {
        const row = await tx.embroideryVersion.findUnique({ where: { id } });
        if (!row || row.garmentId !== garmentId) id = null;
      }
      const data = {
        garmentId,
        label: text(sketch.label),
        note: text(sketch.note),
        status: text(sketch.status, 'Draft'),
        at: text(sketch.at),
        deletedAt: null,
      };
      const saved = id ? await tx.embroideryVersion.update({ where: { id }, data }) : await tx.embroideryVersion.create({ data });
      sketch.id = saved.id;
      keptSketches.push(saved.id);
      versions.push(sketch);
    }
    embroidery.versions = versions;
  }
  await tx.embroideryVersion.updateMany({ where: { garmentId, deletedAt: null, id: { notIn: keptSketches.length ? keptSketches : [-1] } }, data: { deletedAt: new Date() } });
}

async function syncList(rows: Record<string, unknown>[], save: (row: Record<string, unknown>) => Promise<number>): Promise<Record<string, unknown>[]> {
  const next = [];
  for (const row of rows) {
    await save(row);
    next.push(row);
  }
  return next;
}

function idsOf(rows: unknown): number[] {
  const ids = asArray(rows).map((row) => entityId(row.id)).filter((id): id is number => id != null);
  return ids.length ? ids : [-1];
}

export function draftsToEvents(drafts: EventDraft[], correlationId: string): DomainEvent[] {
  return drafts.map((draft) => createEvent({ ...draft, correlationId }));
}

function validatePayment(payment: Record<string, unknown>): void {
  const method = text(payment.method, 'Cash');
  let reference = text(payment.reference);
  const by = text(payment.by);
  const marker = `${method} · `;
  if (reference.toLowerCase().startsWith(marker.toLowerCase())) {
    reference = reference.slice(marker.length).trim();
    payment.reference = reference;
  }
  if (method !== 'UPI') return;
  const ref = reference.trim();
  if (!ref || ref.toLowerCase() === 'auto' || (by && ref === by)) {
    throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'UPI payments need a transaction reference');
  }
}

function activityWhatKey(what: string): string {
  return what.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeActivityList(activities: Record<string, unknown>[]): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = activities.map((activity) => {
    let at = text(activity.at);
    if (!at || Number.isNaN(Date.parse(at))) at = new Date().toISOString();
    return { ...activity, at } as Record<string, unknown>;
  });
  rows.sort((a, b) => Date.parse(text(b.at)) - Date.parse(text(a.at)));
  const out: Record<string, unknown>[] = [];
  for (const row of rows) {
    const kind = text(row.kind, 'created');
    const what = activityWhatKey(text(row.what));
    const prev = out[out.length - 1];
    if (prev && text(prev.kind, 'created') === kind && activityWhatKey(text(prev.what)) === what) continue;
    out.push(row);
  }
  return out;
}

function orderPaidAmount(order: Record<string, unknown>): number {
  return asArray(order.payments).reduce((sum, payment) => {
    const amount = typeof payment.amount === 'number' ? payment.amount : Number(payment.amount) || 0;
    return sum + (text(payment.kind) === 'Refund' ? -amount : amount);
  }, 0);
}

function approximateOrderTotal(order: Record<string, unknown>): number {
  const subtotal = asArray(order.garments).reduce((sum, garment) => {
    const price = typeof garment.price === 'number' ? garment.price : Number(garment.price) || 0;
    return sum + price;
  }, 0);
  if (subtotal <= 0) return 0;
  const discount = typeof order.discount === 'number' ? order.discount : Number(order.discount) || 0;
  const delivery = typeof order.deliveryCharge === 'number' ? order.deliveryCharge : Number(order.deliveryCharge) || 0;
  const taxable = Math.max(0, subtotal - discount);
  const gst = Math.round(taxable * 0.05);
  const alterations = asArray(order.alterations).reduce((sum, row) => {
    const charge = typeof row.charge === 'number' ? row.charge : Number(row.charge) || 0;
    return sum + charge;
  }, 0);
  return taxable + gst + delivery + alterations;
}

function normalizeReadyPickupNextAction(order: Record<string, unknown>): void {
  if (text(order.status) !== 'Ready for Pickup') return;
  const total = approximateOrderTotal(order);
  const paid = orderPaidAmount(order);
  if (total <= 0 || paid < total) return;
  const current = order.nextAction && typeof order.nextAction === 'object' ? (order.nextAction as Record<string, unknown>) : {};
  order.nextAction = { ...current, label: 'Ready for pickup' };
}
