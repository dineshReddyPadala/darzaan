import { createHash, randomBytes, randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { AuthUser } from '../../../../libs/common/src/auth-context';
import { AppError } from '../../../../libs/common/src/http';
import { entityId } from '../../../../libs/common/src/scope';
import { builtinRoleCatalog, catalogHasRole, mergeRoleCatalog } from '../../../../libs/common/src/role-catalog';
import { appOrigin, Mailer } from '../../../../libs/mail/src/mailer';
import { passwordResetEmail, welcomeEmail } from '../../../../libs/mail/src/templates';
import { createLogger } from '../../../../libs/observability/src/logger';
import { PrismaService } from '../shared/prisma.service';

const ACCESS_TTL = '15m';
const REFRESH_DAYS = 30;
const BCRYPT_COST = 12;
const RESET_TTL_MS = 60 * 60 * 1000;
const RESET_COOLDOWN_MS = 60_000;
const CORE_URL = process.env.CORE_URL ?? 'http://127.0.0.1:3002';
const logger = createLogger('auth-service');

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function parseAuditCursor(cursor?: string): { createdAt: Date; id: number } | null {
  if (!cursor) return null;
  const split = cursor.lastIndexOf('|');
  if (split <= 0) return null;
  const createdAt = new Date(cursor.slice(0, split));
  const id = entityId(cursor.slice(split + 1));
  if (!id || Number.isNaN(createdAt.getTime())) return null;
  return { createdAt, id };
}

function userIdOf(value: string): number {
  const id = entityId(value);
  if (!id) throw new AppError(HttpStatus.NOT_FOUND, 'That staff account was not found');
  return id;
}

function makePassword(length = 12): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789#@$';
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: Mailer,
  ) {}

  async login(email: string, password: string, meta: { requestId: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid || user.role === 'super_admin') {
      await this.prisma.auditLog.create({ data: { action: 'login.failed', meta: { email, requestId: meta.requestId } } });
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Those details do not match a staff account');
    }
    if (user.disabledAt) {
      await this.prisma.auditLog.create({ data: { userId: user.id, action: 'login.disabled', meta: { requestId: meta.requestId } } });
      throw new AppError(HttpStatus.UNAUTHORIZED, 'This account is disabled. Ask an admin to restore it.');
    }
    const tokens = await this.issue(user, randomUUID());
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'login.succeeded', meta: { requestId: meta.requestId } } });
    return { ...tokens, user: this.profile(user) };
  }

  async refresh(refreshToken: string) {
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) }, include: { user: true } });
    if (!row || row.expiresAt.getTime() < Date.now()) throw new AppError(HttpStatus.UNAUTHORIZED, 'Sign in again');
    if (row.user.role === 'super_admin') throw new AppError(HttpStatus.UNAUTHORIZED, 'Those details do not match a staff account');
    if (row.user.disabledAt) throw new AppError(HttpStatus.UNAUTHORIZED, 'This account is disabled. Ask an admin to restore it.');
    if (row.revokedAt) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: row.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.prisma.auditLog.create({ data: { userId: row.userId, action: 'refresh.reuse', meta: { familyId: row.familyId } } });
      throw new AppError(HttpStatus.UNAUTHORIZED, 'Sign in again');
    }
    const tokens = await this.issue(row.user, row.familyId);
    await this.prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date(), replacedById: tokens.refreshId } });
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: this.profile(row.user) };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  async me(userId: string) {
    const id = entityId(userId);
    const user = id ? await this.prisma.user.findUnique({ where: { id } }) : null;
    if (!user || user.disabledAt) throw new AppError(HttpStatus.UNAUTHORIZED, 'Sign in to continue');
    if (user.role === 'super_admin') throw new AppError(HttpStatus.UNAUTHORIZED, 'Those details do not match a staff account');
    return this.profile(user);
  }

  /** Names a production lead can put on a garment. No contact details. */
  async listProductionAssistants(actor: AuthUser) {
    if (actor.role !== 'admin' && actor.role !== 'production_head') {
      throw new AppError(HttpStatus.FORBIDDEN, 'Only production or an admin can assign a production assistant');
    }
    const rows = await this.prisma.user.findMany({
      where: { disabledAt: null, role: 'production_assistant' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, role: true, title: true, location: true, storeId: true },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      title: row.title,
      location: row.location,
      storeId: row.storeId ?? undefined,
    }));
  }

  async listUsers(actor: AuthUser) {
    this.requireAdmin(actor);
    const rows = await this.prisma.user.findMany({
      where: { NOT: { role: 'super_admin' }, OR: [{ storeId: actor.storeId ?? -1 }, { storeId: null }] },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.adminProfile(row));
  }

  async listAudit(actor: AuthUser, query: { cursor?: string; take?: number }) {
    this.requireAdmin(actor);
    const take = Math.min(100, Math.max(1, query.take ?? 50));
    const cursor = parseAuditCursor(query.cursor);
    const storeScope = { user: { OR: [{ storeId: actor.storeId ?? -1 }, { storeId: null }] } };
    const rows = await this.prisma.auditLog.findMany({
      where: cursor
        ? {
            AND: [
              storeScope,
              {
                OR: [
                  { createdAt: { lt: cursor.createdAt } },
                  { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
                ],
              },
            ],
          }
        : storeScope,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    const page = rows.slice(0, take);
    const last = page.at(-1);
    return {
      items: page.map((row) => ({
        id: row.id,
        action: row.action,
        at: row.createdAt.toISOString(),
        actor: row.user ? { id: row.user.id, name: row.user.name, email: row.user.email } : null,
        meta: row.meta ?? null,
      })),
      nextCursor: rows.length > take && last ? `${last.createdAt.toISOString()}|${last.id}` : null,
    };
  }

  async createUser(
    actor: AuthUser,
    input: { email: string; name: string; roleId: string; title?: string; location?: string; store?: string; storeId?: number | null; mobile?: string; address?: string; password?: string },
  ) {
    this.requireAdmin(actor);
    if (input.roleId === 'super_admin') throw new AppError(HttpStatus.FORBIDDEN, 'A super admin account cannot be created here');
    await this.assertRoleId(input.roleId);
    const storeId = this.assignStore(actor, input.storeId);
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(HttpStatus.CONFLICT, 'A staff account already uses that email');
    const password = input.password?.trim() || makePassword();
    if (password.length < 8) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Password must be at least 8 characters');
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    const catalog = await this.loadCatalog();
    const role = catalog[input.roleId];
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: input.roleId,
        name: input.name.trim(),
        title: input.title?.trim() || role?.label || input.roleId,
        location: input.location?.trim() || '',
        store: storeId ? input.store?.trim() || null : null,
        storeId,
        mobile: input.mobile?.trim() || null,
        address: input.address?.trim() || null,
        mustChangePassword: true,
      },
    });
    await this.prisma.auditLog.create({ data: { userId: entityId(actor.sub), action: 'user.created', meta: { createdUserId: user.id, role: user.role } } });
    const letter = welcomeEmail({ name: user.name, email: user.email, password, signInUrl: `${appOrigin()}/login` });
    let emailed = false;
    try {
      await this.mail.send({ to: user.email, ...letter });
      emailed = true;
    } catch (error) {
      logger.error({ userId: user.id, err: error instanceof Error ? error.message : 'mail failed' }, 'welcome email failed');
    }
    return { user: this.adminProfile(user), password, emailed };
  }

  async updateUser(
    actor: AuthUser,
    id: string,
    input: { name?: string; roleId?: string; title?: string; location?: string; store?: string | null; storeId?: number | null; mobile?: string; address?: string; disabled?: boolean },
  ) {
    this.requireAdmin(actor);
    const userId = userIdOf(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(HttpStatus.NOT_FOUND, 'That staff account was not found');
    if (!this.sameStore(actor, user.storeId)) throw new AppError(HttpStatus.FORBIDDEN, 'That account belongs to another store');
    if (input.roleId === 'super_admin') throw new AppError(HttpStatus.FORBIDDEN, 'A super admin account cannot be created here');
    if (input.roleId) await this.assertRoleId(input.roleId);
    if (input.disabled === true && entityId(actor.sub) === userId) {
      throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'You can’t disable your own account');
    }
    const data: {
      name?: string;
      role?: string;
      title?: string;
      location?: string;
      store?: string | null;
      storeId?: number | null;
      mobile?: string | null;
      address?: string | null;
      disabledAt?: Date | null;
    } = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.roleId !== undefined) data.role = input.roleId;
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.location !== undefined) data.location = input.location.trim();
    if (input.storeId !== undefined) {
      data.storeId = this.assignStore(actor, input.storeId);
      if (data.storeId == null) data.store = null;
    }
    if (input.store !== undefined && data.storeId !== null) data.store = input.store?.trim() || null;
    if (input.mobile !== undefined) data.mobile = input.mobile.trim() || null;
    if (input.address !== undefined) data.address = input.address.trim() || null;
    if (input.disabled === true) data.disabledAt = new Date();
    if (input.disabled === false) data.disabledAt = null;
    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    if (input.disabled === true) {
      await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    await this.prisma.auditLog.create({
      data: { userId: entityId(actor.sub), action: 'user.updated', meta: { updatedUserId: userId, disabled: input.disabled ?? null, role: updated.role } },
    });
    return this.adminProfile(updated);
  }

  async setPassword(actor: AuthUser, id: string, password?: string) {
    this.requireAdmin(actor);
    const userId = userIdOf(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(HttpStatus.NOT_FOUND, 'That staff account was not found');
    if (!this.sameStore(actor, user.storeId)) throw new AppError(HttpStatus.FORBIDDEN, 'That account belongs to another store');
    const next = password?.trim() || makePassword();
    if (next.length < 8) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Password must be at least 8 characters');
    const passwordHash = await bcrypt.hash(next, BCRYPT_COST);
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { passwordHash, mustChangePassword: true } });
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.prisma.auditLog.create({ data: { userId: entityId(actor.sub), action: 'user.password_reset', meta: { updatedUserId: userId } } });
    return { user: this.adminProfile(updated), password: next };
  }

  async forgotPassword(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user || user.disabledAt) return { ok: true };
    const recent = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id, usedAt: null, createdAt: { gt: new Date(Date.now() - RESET_COOLDOWN_MS) } },
    });
    if (recent) return { ok: true };
    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await this.prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt } });
    try {
      const letter = passwordResetEmail({ name: user.name, resetUrl: `${appOrigin()}/reset-password?token=${encodeURIComponent(token)}` });
      await this.mail.send({ to: user.email, ...letter });
    } catch (error) {
      await this.prisma.passwordReset.deleteMany({ where: { tokenHash } });
      logger.error({ userId: user.id, err: error instanceof Error ? error.message : 'mail failed' }, 'password reset email failed');
      throw new AppError(HttpStatus.BAD_GATEWAY, 'The email could not be sent. Try again.');
    }
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'password.reset_requested', meta: {} } });
    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const next = password.trim();
    if (next.length < 8) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Password must be at least 8 characters');
    const row = await this.prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    if (!row || row.usedAt || row.expiresAt.getTime() < Date.now() || row.user.disabledAt) {
      throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'This reset link has expired. Request a new one.');
    }
    const passwordHash = await bcrypt.hash(next, BCRYPT_COST);
    await this.prisma.user.update({ where: { id: row.userId }, data: { passwordHash, mustChangePassword: false } });
    await this.prisma.passwordReset.update({ where: { id: row.id }, data: { usedAt: new Date() } });
    await this.prisma.refreshToken.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.prisma.auditLog.create({ data: { userId: row.userId, action: 'password.reset', meta: {} } });
    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, password: string) {
    const id = entityId(userId);
    const user = id ? await this.prisma.user.findUnique({ where: { id } }) : null;
    if (!user || user.disabledAt) throw new AppError(HttpStatus.UNAUTHORIZED, 'Sign in to continue');
    const next = password.trim();
    if (next.length < 8) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Password must be at least 8 characters');
    if (next === currentPassword) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'Choose a different password');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'That password does not match');
    const passwordHash = await bcrypt.hash(next, BCRYPT_COST);
    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    const tokens = await this.issue(updated, randomUUID());
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'password.changed', meta: {} } });
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: this.profile(updated) };
  }

  private requireAdmin(actor: AuthUser): void {
    if (actor.role !== 'admin') throw new AppError(HttpStatus.FORBIDDEN, 'Only an admin can manage staff accounts');
  }

  /** A blank location is allowed. A chosen store must be the actor’s own store when they have one. */
  private assignStore(actor: AuthUser, requested?: number | null): number | null {
    const storeId = entityId(requested);
    if (!storeId) return null;
    if (actor.storeId != null && storeId !== actor.storeId) {
      throw new AppError(HttpStatus.FORBIDDEN, 'That account belongs to another store');
    }
    return storeId;
  }

  private sameStore(actor: AuthUser, storeId: number | null): boolean {
    if (storeId == null) return true;
    return actor.storeId != null && actor.storeId === storeId;
  }

  private async loadCatalog() {
    try {
      const response = await fetch(`${CORE_URL}/api/v1/roles`, {
        headers: { 'x-user': JSON.stringify({ sub: 'auth-service', email: 'auth@darzaan.internal', role: 'admin', name: 'Auth' }) },
      });
      if (response.ok) {
        const body = (await response.json()) as unknown;
        return mergeRoleCatalog(body);
      }
    } catch {
      /* core may be down during boot; fall back to built-ins */
    }
    return builtinRoleCatalog();
  }

  private async assertRoleId(roleId: string): Promise<void> {
    const catalog = await this.loadCatalog();
    if (!catalogHasRole(catalog, roleId)) throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, `Unknown role “${roleId}”`);
  }

  private async issue(user: { id: number; email: string; role: string; name: string; store: string | null; storeId?: number | null; mustChangePassword?: boolean | null }, familyId: string) {
    const accessToken = await this.jwt.signAsync(
      {
        sub: String(user.id),
        email: user.email,
        role: user.role,
        name: user.name,
        store: user.store ?? undefined,
        storeId: user.storeId ?? undefined,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
      { expiresIn: ACCESS_TTL },
    );
    const refreshToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
    const row = await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), familyId, expiresAt },
    });
    return { accessToken, refreshToken, refreshId: row.id };
  }

  private profile(user: { id: number; email: string; role: string; name: string; title: string; location: string; store: string | null; storeId?: number | null; mobile?: string | null; address?: string | null; mustChangePassword?: boolean | null }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      title: user.title,
      location: user.location,
      store: user.store ?? undefined,
      storeId: user.storeId ?? undefined,
      mobile: user.mobile ?? undefined,
      address: user.address ?? undefined,
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  }

  private adminProfile(user: {
    id: number;
    email: string;
    role: string;
    name: string;
    title: string;
    location: string;
    store: string | null;
    storeId?: number | null;
    disabledAt?: Date | null;
    createdAt?: Date;
  }) {
    return {
      ...this.profile(user),
      disabled: Boolean(user.disabledAt),
      disabledAt: user.disabledAt?.toISOString() ?? null,
      createdAt: user.createdAt?.toISOString(),
    };
  }
}
