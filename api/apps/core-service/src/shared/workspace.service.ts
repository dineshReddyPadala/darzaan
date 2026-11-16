import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/core';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { AppError } from '../../../../libs/common/src/http';
import { diffPriceRequests } from '../../../../libs/common/src/order-diff';
import {
  builtinRoleCatalog,
  canWithCatalog,
  mergeRoleCatalog,
  sanitizeRoleId,
  scopeFromCatalog,
  validateRoleCatalog,
  type RoleRecord,
} from '../../../../libs/common/src/role-catalog';
import { isPrivileged, type DataScope, type PermAction, type PermEntity } from '../../../../libs/common/src/roles';
import { booleanMap, defaultStoreSettings, normalizeStoreSettings } from '../../../../libs/common/src/store-settings';
import { asArray, entityId, isRecord, mergeAssignedOrder, mergeProtectedCustomer, mergeProtectedOrder, orderAssignedTo, presentAssignedOrder, presentCustomer, presentOrder, text } from '../../../../libs/common/src/scope';
import { cacheGet, cacheSet } from '../../../../libs/observability/src/cache';
import { IdempotencyService } from './idempotency.service';
import { draftsToEvents, saveOrderDocument } from './persist';
import { PrismaService } from './prisma.service';

const LIST_SNAPSHOT_KEYS = ['quotes', 'priceRequests', 'qcIssues', 'qcInspections', 'qcReworks', 'packages', 'movements', 'deliveries', 'logisticsIssues', 'floorRequests', 'floorDrafts', 'swatchLoans', 'cashCloses', 'inventoryFabrics', 'inventoryTrims', 'inventorySamplers', 'team', 'catalog', 'notificationSettings', 'reports'] as const;
const OBJECT_SNAPSHOT_KEYS = ['roles', 'storeSettings'] as const;
const ADMIN_ONLY_SNAPSHOTS = new Set<string>(['roles', 'catalog', 'locations', 'notificationSettings', 'storeSettings']);
const SNAPSHOT_KEYS = [...LIST_SNAPSHOT_KEYS, ...OBJECT_SNAPSHOT_KEYS] as const;
const COLLECTION_KEYS = [...SNAPSHOT_KEYS, 'locations'] as const;

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async roleCatalog(): Promise<Record<string, RoleRecord>> {
    const cached = await cacheGet('roles');
    if (cached) return mergeRoleCatalog(JSON.parse(cached));
    const snapshot = await this.prisma.snapshot.findUnique({ where: { key: 'roles' } });
    const catalog = mergeRoleCatalog(snapshot?.body);
    await cacheSet('roles', JSON.stringify(catalog), 30);
    return catalog;
  }

  private async scope(user: AuthUser) {
    return scopeFromCatalog(await this.roleCatalog(), user.role);
  }

  private async assert(user: AuthUser, entity: PermEntity, action: PermAction): Promise<void> {
    const catalog = await this.roleCatalog();
    if (!canWithCatalog(catalog, user.role, entity, action)) {
      throw new AppError(HttpStatus.FORBIDDEN, `${user.role} can’t ${action} ${entity.replace('_', ' ')} records`);
    }
  }

  async state(user: AuthUser) {
    const scope = await this.scope(user);
    const where = storeWhere(storeLimit(user, scope));
    const orders = await this.prisma.order.findMany({ where, orderBy: { updatedAt: 'desc' } });
    const customers = await this.prisma.customer.findMany({ where: { deletedAt: null, ...where }, orderBy: { updatedAt: 'desc' } });
    const snapshots = await this.prisma.snapshot.findMany();
    const byKey = new Map(snapshots.map((row) => [row.key, row.body]));
    let visibleOrders = orders
      .map((row) => orderDocument(row))
      .map((order) => presentOrder(order, scope));
    let visibleCustomers = customers.map((row) => presentCustomer(row.document as Record<string, unknown>, scope));
    if (user.role === 'tailor') {
      visibleOrders = visibleOrders.filter((order) => orderAssignedTo(order, user.name)).map((order) => presentAssignedOrder(order, user.name));
      const customerIds = new Set(visibleOrders.map((order) => String(order.customerId ?? '')));
      visibleCustomers = visibleCustomers.filter((customer) => customerIds.has(String(customer.id ?? '')));
    }
    const body: Record<string, unknown> = {
      orders: visibleOrders,
      customers: visibleCustomers,
      roles: mergeRoleCatalog(byKey.get('roles')),
    };
    for (const key of LIST_SNAPSHOT_KEYS) body[key] = byKey.get(key) ?? (key === 'notificationSettings' ? {} : []);
    const stores = await this.prisma.store.findMany({ where: { deletedAt: null }, orderBy: { id: 'asc' } });
    body.locations = stores.map(toLocation);
    body.storeSettings = await this.storeSettingsFor(user, body.locations, byKey.get('storeSettings'), byKey.get('notificationSettings'));
    return body;
  }

  async importSeed(user: AuthUser, payload: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'production' && !isPrivileged(user.role)) throw new AppError(HttpStatus.FORBIDDEN, 'Only an admin can load the workspace');
    const customers = asArray(payload.customers);
    const orders = asArray(payload.orders);
    await this.prisma.$transaction(async (tx) => {
      for (const customer of customers) await this.writeCustomer(tx, customer, null);
      for (const order of orders) await saveOrderDocument(tx, order, { correlationId: 'seed', emit: false });
      for (const key of SNAPSHOT_KEYS) {
        if (key in payload) await tx.snapshot.upsert({ where: { key }, create: { key, body: payload[key] as Prisma.InputJsonValue }, update: { body: payload[key] as Prisma.InputJsonValue } });
      }
      if (!('roles' in payload)) {
        const existingRoles = await tx.snapshot.findUnique({ where: { key: 'roles' } });
        if (!existingRoles) {
          const roles = builtinRoleCatalog();
          await tx.snapshot.create({ data: { key: 'roles', body: roles as unknown as Prisma.InputJsonValue } });
        }
      }
      if (Array.isArray(payload.locations) && (await tx.store.count()) === 0) {
        await replaceStores(tx, payload.locations.filter(isRecord));
      }
      const priceRequests = asArray(payload.priceRequests);
      for (const request of priceRequests) await this.writePriceRequest(tx, request);
    });
    return this.state(user);
  }

  async createOrder(user: AuthUser, order: Record<string, unknown>, key: string, correlationId: string) {
    await this.assert(user, 'order', 'create');
    const scope = await this.scope(user);
    const limit = storeLimit(user, scope);
    const place = await this.resolveStore(limit, order.storeId);
    const saved = mergeProtectedOrder(null, order, scope);
    saved.storeId = place.id;
    saved.store = text(saved.store) || place.label;
    const result = await this.idempotency.run('order.write', key, saved, async (tx) => {
      const written = await saveOrderDocument(tx, saved, { correlationId, emit: true });
      return { code: 201, body: presentOrder(written.order, scope) };
    });
    return result;
  }

  async updateOrder(user: AuthUser, id: string, order: Record<string, unknown>, key: string, correlationId: string, expectedVersion?: number) {
    const orderId = entityId(id);
    const existing = orderId ? await this.prisma.order.findUnique({ where: { id: orderId } }) : null;
    if (!existing) throw new AppError(HttpStatus.NOT_FOUND, 'That order is not on this desk');
    const scope = await this.scope(user);
    const limit = storeLimit(user, scope);
    if (limit != null && existing.storeId != null && existing.storeId !== limit) throw new AppError(HttpStatus.NOT_FOUND, 'That order is not on this desk');
    if (expectedVersion && existing.version !== expectedVersion) throw new AppError(HttpStatus.CONFLICT, 'This order was updated somewhere else. Reload it and try again.');
    const existingDocument = isRecord(existing.document) ? existing.document : {};
    if (user.role === 'tailor' && !orderAssignedTo(existingDocument, user.name)) {
      throw new AppError(HttpStatus.FORBIDDEN, 'That order is not assigned to you');
    }
    const merged = user.role === 'tailor'
      ? mergeAssignedOrder(existingDocument, { ...order, id: orderId }, user.name)
      : mergeProtectedOrder(existingDocument, { ...order, id: orderId }, scope);
    const place = await this.resolveStore(limit, merged.storeId, existing.storeId);
    merged.storeId = place.id;
    if (!text(merged.store)) merged.store = place.label;
    const result = await this.idempotency.run('order.write', key, merged, async (tx) => {
      const written = await saveOrderDocument(tx, merged, { correlationId, emit: true });
      const body = presentOrder(written.order, scope);
      return { code: 200, body: user.role === 'tailor' ? presentAssignedOrder(body, user.name) : body };
    });
    return result;
  }

  async saveCustomer(user: AuthUser, customer: Record<string, unknown>, key: string, creating: boolean) {
    await this.assert(user, 'customer', creating ? 'create' : 'update');
    const scope = await this.scope(user);
    const limit = storeLimit(user, scope);
    const id = entityId(customer.id);
    const existingRow = id ? await this.prisma.customer.findUnique({ where: { id } }) : null;
    if (!creating && !existingRow) throw new AppError(HttpStatus.NOT_FOUND, 'That customer is not on this desk');
    if (limit != null && existingRow?.storeId != null && existingRow.storeId !== limit) throw new AppError(HttpStatus.NOT_FOUND, 'That customer is not on this desk');
    const place = await this.resolveStore(limit, customer.storeId, existingRow?.storeId);
    const result = await this.idempotency.run('customer.write', key, customer, async (tx) => {
      const merged = mergeProtectedCustomer(existingRow ? (existingRow.document as Record<string, unknown>) : null, customer, scope);
      merged.storeId = place.id;
      const written = await this.writeCustomer(tx, merged, text(merged.store) || place.label);
      return { code: creating ? 201 : 200, body: presentCustomer(written, scope) };
    });
    return result;
  }

  async saveCollection(user: AuthUser, key: string, body: unknown, correlationId: string) {
    if (!COLLECTION_KEYS.includes(key as (typeof COLLECTION_KEYS)[number])) throw new AppError(HttpStatus.NOT_FOUND, 'Unknown collection');
    if (key === 'locations') {
      if (!isPrivileged(user.role)) throw new AppError(HttpStatus.FORBIDDEN, 'Only an admin can change these settings');
      const list = Array.isArray(body) ? body.filter(isRecord) : [];
      return this.prisma.$transaction((tx) => replaceStores(tx, list));
    }
    if (key === 'storeSettings') return this.saveStoreSettings(user, body);
    if (ADMIN_ONLY_SNAPSHOTS.has(key) && !isPrivileged(user.role)) {
      throw new AppError(HttpStatus.FORBIDDEN, 'Only an admin can change these settings');
    }
    if (key === 'roles') {
      return this.saveRoles(user, body);
    }
    if (key === 'team') {
      await this.assert(user, 'team', 'update');
    }
    const list = Array.isArray(body) ? body.filter(isRecord) : [];
    const stored: Prisma.InputJsonValue = Array.isArray(body)
      ? (list as Prisma.InputJsonValue)
      : isRecord(body)
        ? (body as Prisma.InputJsonValue)
        : [];
    await this.prisma.$transaction(async (tx) => {
      const previous = await tx.snapshot.findUnique({ where: { key } });
      const previousList = (previous && Array.isArray(previous.body) ? previous.body.filter(isRecord) : []) as Record<string, unknown>[];
      await tx.snapshot.upsert({ where: { key }, create: { key, body: stored }, update: { body: stored } });
      if (key === 'priceRequests') {
        const events = draftsToEvents(diffPriceRequests(previousList, list), correlationId);
        if (events.length) {
          await tx.outboxEvent.createMany({
            data: events.map((event) => ({
              id: event.eventId,
              type: event.type,
              version: event.version,
              aggregateId: event.aggregateId,
              payload: event as unknown as Prisma.InputJsonValue,
              correlationId: event.correlationId,
              causationId: event.causationId,
            })),
          });
        }
        for (const request of list) await this.writePriceRequest(tx, request);
        await tx.snapshot.update({ where: { key }, data: { body: list as Prisma.InputJsonValue } });
      }
      if (key === 'qcInspections') {
        for (const inspection of list) await this.writeInspection(tx, inspection);
        await tx.snapshot.update({ where: { key }, data: { body: list as Prisma.InputJsonValue } });
      }
      if (key === 'qcReworks') {
        for (const rework of list) await this.writeRework(tx, rework);
        await tx.snapshot.update({ where: { key }, data: { body: list as Prisma.InputJsonValue } });
      }
    });
    if (key === 'catalog') await cacheSet('catalog', JSON.stringify(stored), 60);
    return Array.isArray(body) ? list : stored;
  }

  /** A store-scoped actor stays in their store. Anyone else must name an active location. */
  private async resolveStore(limit: number | null | undefined, requested: unknown, existing?: number | null): Promise<{ id: number; label: string }> {
    const id = typeof limit === 'number' ? limit : entityId(requested) ?? existing ?? null;
    if (!id) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Choose a store location');
    const store = await this.prisma.store.findFirst({ where: { id, deletedAt: null } });
    if (!store) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Choose a store location');
    return { id: store.id, label: store.code || store.name };
  }

  private async saveStoreSettings(user: AuthUser, body: unknown) {
    if (!isPrivileged(user.role)) throw new AppError(HttpStatus.FORBIDDEN, 'Only an admin can change these settings');
    if (!isRecord(body)) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Store settings must be a map of storeId');
    const previous = await this.prisma.snapshot.findUnique({ where: { key: 'storeSettings' } });
    const stored: Record<string, Prisma.InputJsonValue> = {};
    if (isRecord(previous?.body)) {
      for (const [key, value] of Object.entries(previous.body)) stored[key] = value as Prisma.InputJsonValue;
    }
    const notes = await this.prisma.snapshot.findUnique({ where: { key: 'notificationSettings' } });
    const notifications = booleanMap(notes?.body);
    if (!user.storeId) throw new AppError(HttpStatus.FORBIDDEN, 'This account is not assigned to a store');
    if (!(user.storeId in body)) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Save the settings for your own store');
    stored[user.storeId] = normalizeStoreSettings(body[user.storeId], notifications) as unknown as Prisma.InputJsonValue;
    const saved = stored as Prisma.InputJsonValue;
    await this.prisma.snapshot.upsert({ where: { key: 'storeSettings' }, create: { key: 'storeSettings', body: saved }, update: { body: saved } });
    return { [user.storeId]: stored[user.storeId] };
  }

  private async storeSettingsFor(user: AuthUser, locations: unknown, storedBody: unknown, notificationsBody: unknown) {
    const rows = Array.isArray(locations) ? locations.filter(isRecord) : [];
    const notifications = booleanMap(notificationsBody);
    const stored: Record<string, Prisma.InputJsonValue> = {};
    if (isRecord(storedBody)) {
      for (const [key, value] of Object.entries(storedBody)) stored[key] = value as Prisma.InputJsonValue;
    }
    let missing = false;
    for (const row of rows) {
      const id = entityId(row.id);
      const key = id ? String(id) : text(row.id);
      if (!key || key in stored) continue;
      stored[key] = defaultStoreSettings(notifications) as unknown as Prisma.InputJsonValue;
      missing = true;
    }
    if (missing) {
      await this.prisma.snapshot.upsert({
        where: { key: 'storeSettings' },
        create: { key: 'storeSettings', body: stored as Prisma.InputJsonValue },
        update: { body: stored as Prisma.InputJsonValue },
      });
    }
    if (!user.storeId || !(user.storeId in stored)) return {};
    return { [user.storeId]: stored[user.storeId] };
  }

  private async saveRoles(user: AuthUser, body: unknown) {
    if (!isPrivileged(user.role)) throw new AppError(HttpStatus.FORBIDDEN, 'Only an admin can change roles');
    const catalog = mergeRoleCatalog(body);
    const error = validateRoleCatalog(catalog);
    if (error) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, error);
    for (const [id, role] of Object.entries(catalog)) {
      const cleanId = sanitizeRoleId(id);
      if (!cleanId || cleanId !== id) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, `Role id “${id}” is not valid`);
      role.id = cleanId;
      if (!role.label?.trim()) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, `Role ${id} needs a label`);
    }
    await this.prisma.snapshot.upsert({
      where: { key: 'roles' },
      create: { key: 'roles', body: catalog as unknown as Prisma.InputJsonValue },
      update: { body: catalog as unknown as Prisma.InputJsonValue },
    });
    await cacheSet('roles', JSON.stringify(catalog), 30);
    return catalog;
  }

  async saveInspection(user: AuthUser, inspection: Record<string, unknown>, key: string) {
    await this.assert(user, 'production_task', 'update');
    return this.idempotency.run('qc.inspection', key, inspection, async (tx) => {
      const written = await this.writeInspection(tx, inspection);
      return { code: 201, body: written };
    });
  }

  async board() {
    const garments = await this.prisma.garment.findMany({ where: { deletedAt: null }, orderBy: { stage: 'asc' } });
    const columns: Record<string, unknown[]> = {};
    for (const garment of garments) {
      const stage = garment.stage;
      columns[stage] ??= [];
      columns[stage].push(garment.document);
    }
    return { columns };
  }

  async roles() {
    return this.roleCatalog();
  }

  async kpis(user: AuthUser) {
    const cacheKey = `kpis:${user.role}:${user.storeId ?? user.store ?? 'all'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached) as Record<string, number>;
    const state = await this.state(user);
    const orders = asArray(state.orders);
    const body = {
      atRisk: orders.filter((order) => order.risk).length,
      awaitingPayment: orders.filter((order) => text(order.status) !== 'Cancelled' && text(order.status) !== 'Closed').length,
      inProduction: orders.filter((order) => order.status === 'In Production').length,
      readyTrial: orders.filter((order) => order.status === 'Ready for Trial').length,
      readyPickup: orders.filter((order) => order.status === 'Ready for Pickup').length,
      overdue: orders.filter((order) => text(order.deliveryDate) && text(order.deliveryDate) < new Date().toISOString().slice(0, 10) && !['Closed', 'Cancelled'].includes(text(order.status))).length,
    };
    await cacheSet(cacheKey, JSON.stringify(body), 30);
    return body;
  }

  async catalog() {
    const cached = await cacheGet('catalog');
    if (cached) return JSON.parse(cached) as unknown;
    const snapshot = await this.prisma.snapshot.findUnique({ where: { key: 'catalog' } });
    const body = snapshot?.body ?? [];
    await cacheSet('catalog', JSON.stringify(body), 60);
    return body;
  }

  async publicOrder(id: string) {
    const orderId = entityId(id);
    const order = orderId ? await this.prisma.order.findUnique({ where: { id: orderId }, include: { customer: true } }) : null;
    if (!order) throw new AppError(HttpStatus.NOT_FOUND, `We couldn’t find order ${id}.`);
    const customer = order.customer.document as Record<string, unknown>;
    return { order: order.document, customer: { id: customer.id, name: customer.name } };
  }

  async publicBooking(booking: Record<string, unknown>) {
    const name = text(booking.name).trim();
    const mobile = text(booking.mobile).trim();
    if (!name || mobile.replace(/\D/g, '').length < 10) throw new AppError(HttpStatus.BAD_REQUEST, 'Name and a mobile number are required');
    const customers = await this.prisma.customer.findMany();
    const digits = mobile.replace(/\D/g, '').slice(-10);
    const existing = customers.find((row) => String((row.document as Record<string, unknown>).mobile ?? '').replace(/\D/g, '').endsWith(digits));
    let customerId = existing?.id;
    const draft = {
      id: `FD-${randomUUID().slice(0, 8)}`,
      customerId: customerId ?? 0,
      garments: booking.garments ?? [],
      fabric: null,
      photos: 0,
      measurements: {},
      flagged: [],
      note: text(booking.note),
      assignedTo: existing ? text((existing.document as Record<string, unknown>).designer, 'Nisha Arora') : 'Nisha Arora',
      at: new Date().toISOString(),
      by: 'Website',
      status: 'With designer',
      source: 'Storefront',
      visit: text(booking.visit),
    };
    await this.prisma.$transaction(async (tx) => {
      if (!existing) {
        const written = await this.writeCustomer(tx, {
          name,
          mobile,
          whatsapp: mobile,
          whatsappAvailable: true,
          email: '',
          city: text(booking.city, 'New Delhi'),
          since: new Date().toISOString().slice(0, 10),
          tier: 'New',
          designer: 'Nisha Arora',
          preferences: [],
          notes: 'Signed up on the website.',
          remote: false,
          measurementProfiles: [],
        }, 'Khan Market');
        customerId = entityId(written.id) ?? undefined;
        draft.customerId = customerId ?? 0;
      }
      const current = await tx.snapshot.findUnique({ where: { key: 'floorDrafts' } });
      const list = current && Array.isArray(current.body) ? current.body : [];
      await tx.snapshot.upsert({
        where: { key: 'floorDrafts' },
        create: { key: 'floorDrafts', body: [draft, ...list] as Prisma.InputJsonValue },
        update: { body: [draft, ...list] as Prisma.InputJsonValue },
      });
    });
    return { draftId: draft.id, returning: Boolean(existing) };
  }

  private async writeCustomer(tx: Prisma.TransactionClient, customer: Record<string, unknown>, store: string | null): Promise<Record<string, unknown>> {
    const id = entityId(customer.id);
    const storeId = entityId(customer.storeId);
    const data = {
      name: text(customer.name),
      mobile: text(customer.mobile),
      email: text(customer.email),
      city: text(customer.city),
      tier: text(customer.tier, 'New'),
      designer: text(customer.designer),
      store: store ?? text(customer.store, 'Khan Market'),
      storeId: storeId ?? undefined,
      deletedAt: null,
    };
    const existing = id ? await tx.customer.findUnique({ where: { id } }) : null;
    if (existing) {
      const saved = { ...customer, id: existing.id, storeId: storeId ?? existing.storeId ?? undefined };
      await tx.customer.update({ where: { id: existing.id }, data: { ...data, document: saved as Prisma.InputJsonValue } });
      return saved;
    }
    const created = await tx.customer.create({ data: { ...data, document: {} as Prisma.InputJsonValue } });
    const saved = { ...customer, id: created.id, storeId };
    await tx.customer.update({ where: { id: created.id }, data: { document: saved as Prisma.InputJsonValue } });
    return saved;
  }

  private async writePriceRequest(tx: Prisma.TransactionClient, request: Record<string, unknown>): Promise<void> {
    const id = entityId(request.id);
    const data = {
      status: text(request.status, 'Pending'),
      orderId: entityId(request.orderId),
      garmentId: entityId(request.garmentId),
    };
    if (id) {
      request.id = id;
      await tx.priceRequest.upsert({
        where: { id },
        create: { id, ...data, document: request as Prisma.InputJsonValue },
        update: { ...data, document: request as Prisma.InputJsonValue },
      });
      return;
    }
    const created = await tx.priceRequest.create({ data: { ...data, document: {} as Prisma.InputJsonValue } });
    request.id = created.id;
    await tx.priceRequest.update({ where: { id: created.id }, data: { document: request as Prisma.InputJsonValue } });
  }

  private async writeInspection(tx: Prisma.TransactionClient, inspection: Record<string, unknown>): Promise<Record<string, unknown>> {
    const orderId = entityId(inspection.orderId);
    const garmentId = entityId(inspection.garmentId);
    let id = entityId(inspection.id);
    if (id && !(await tx.qcInspection.findUnique({ where: { id } }))) id = null;
    if (!id && orderId) {
      const found = await tx.qcInspection.findFirst({ where: { orderId, at: text(inspection.at), outcome: text(inspection.outcome) } });
      id = found?.id ?? null;
    }
    const data = { orderId, garmentId, outcome: text(inspection.outcome), at: text(inspection.at) };
    if (!id) {
      const created = await tx.qcInspection.create({ data: { ...data, document: {} as Prisma.InputJsonValue } });
      id = created.id;
    }
    inspection.id = id;
    if (orderId) inspection.orderId = orderId;
    if (garmentId) inspection.garmentId = garmentId;
    await tx.qcInspection.update({ where: { id }, data: { ...data, document: inspection as Prisma.InputJsonValue } });
    return inspection;
  }

  private async writeRework(tx: Prisma.TransactionClient, rework: Record<string, unknown>): Promise<void> {
    const orderId = entityId(rework.orderId);
    const garmentId = entityId(rework.garmentId);
    let id = entityId(rework.id);
    if (id && !(await tx.qcRework.findUnique({ where: { id } }))) id = null;
    if (!id && orderId) {
      const found = await tx.qcRework.findFirst({ where: { orderId, status: text(rework.status), garmentId } });
      id = found?.id ?? null;
    }
    const data = { orderId, garmentId, status: text(rework.status) };
    if (!id) {
      const created = await tx.qcRework.create({ data: { ...data, document: {} as Prisma.InputJsonValue } });
      id = created.id;
    }
    rework.id = id;
    await tx.qcRework.update({ where: { id }, data: { ...data, document: rework as Prisma.InputJsonValue } });
  }
}

/** null: every store. undefined: a store role with no store. A number: that store only. */
function storeLimit(user: AuthUser, scope: DataScope): number | null | undefined {
  if (user.role === 'admin' || scope.ownStoreOnly) return entityId(user.storeId) ?? undefined;
  return null;
}

function storeWhere(limit: number | null | undefined): { OR: [{ storeId: number }, { storeId: null }] } | { storeId: null } | undefined {
  if (limit === null) return undefined;
  if (typeof limit !== 'number') return { storeId: null };
  return { OR: [{ storeId: limit }, { storeId: null }] };
}

const ORDER_LISTS = ['garments', 'payments', 'alterations', 'changeRequests', 'activity', 'messages', 'signatures'] as const;

/** The saved document is what the desk renders. Older rows can omit the date and the lists. */
function orderDocument(row: { document: unknown; deliveryDate: string; createdAt: Date }): Record<string, unknown> {
  const document = isRecord(row.document) ? { ...row.document } : {};
  if (typeof document.deliveryDate !== 'string' || !document.deliveryDate) {
    document.deliveryDate = row.deliveryDate || row.createdAt.toISOString().slice(0, 10);
  }
  for (const key of ORDER_LISTS) {
    if (!Array.isArray(document[key])) document[key] = [];
  }
  return document;
}

function toLocation(row: { id: number; name: string; kind: string; address: string; phone: string; code: string | null; active: boolean }) {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind === 'workshop' ? 'workshop' : 'store',
    address: row.address,
    phone: row.phone,
    store: row.code ?? undefined,
    active: row.active,
  };
}

async function replaceStores(tx: Prisma.TransactionClient, rows: Record<string, unknown>[]) {
  const saved = [];
  const keep: number[] = [];
  for (const row of rows) {
    const name = text(row.name).trim();
    if (!name) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Name is required');
    const data = {
      name,
      kind: row.kind === 'workshop' ? 'workshop' : 'store',
      address: text(row.address).trim(),
      phone: text(row.phone).trim(),
      code: text(row.store).trim() || null,
      active: row.active !== false,
    };
    const id = entityId(row.id);
    const existing = id ? await tx.store.findUnique({ where: { id } }) : null;
    const record = existing
      ? await tx.store.update({ where: { id: existing.id }, data: { ...data, deletedAt: null } })
      : await tx.store.create({ data });
    keep.push(record.id);
    saved.push(toLocation(record));
  }
  await tx.store.updateMany({
    where: { deletedAt: null, ...(keep.length ? { id: { notIn: keep } } : {}) },
    data: { deletedAt: new Date() },
  });
  return saved;
}
