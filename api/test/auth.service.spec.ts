import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthService } from '../apps/auth-service/src/auth/service';
import type { PrismaService } from '../apps/auth-service/src/shared/prisma.service';

describe('AuthService', () => {
  const user = {
    id: 1,
    email: 'aditi.malhotra@darzaan.test',
    role: 'admin',
    name: 'Aditi Malhotra',
    title: 'Admin',
    location: 'Khan Market Store',
    store: 'Khan Market',
    storeId: 1,
    passwordHash: '',
    disabledAt: null as Date | null,
  };

  beforeAll(async () => {
    user.passwordHash = await bcrypt.hash('Darzaan#2026', 4);
  });

  function service(overrides: Partial<Record<string, unknown>> = {}) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        findMany: jest.fn().mockResolvedValue([user]),
        create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
          ...user,
          ...data,
          disabledAt: null,
          createdAt: new Date(),
        })),
        update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...user, ...data })),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      passwordReset: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 1 }),
        update: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      ...overrides,
    };
    const mail = { send: jest.fn().mockResolvedValue(undefined) };
    return { prisma, mail, auth: new AuthService(prisma as unknown as PrismaService, new JwtService({ secret: 'test-secret' }), mail as never) };
  }

  const adminActor = { sub: '1', email: user.email, role: 'admin', name: user.name, store: 'Khan Market', storeId: 1 };

  it('returns an access token and a refresh token for a valid password', async () => {
    const { auth, prisma } = service();
    const result = await auth.login(user.email, 'Darzaan#2026', { requestId: 'req-1' });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user.role).toBe('admin');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'login.succeeded' }) }));
  });

  it('rejects a wrong password and writes an audit row', async () => {
    const { auth, prisma } = service();
    await expect(auth.login(user.email, 'nope', { requestId: 'req-2' })).rejects.toThrow('Those details do not match a staff account');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'login.failed' }) }));
  });

  it('rejects a disabled account on login', async () => {
    const { auth } = service({
      user: { findUnique: jest.fn().mockResolvedValue({ ...user, disabledAt: new Date() }) },
    });
    await expect(auth.login(user.email, 'Darzaan#2026', { requestId: 'req-3' })).rejects.toThrow('This account is disabled');
  });

  it('revokes the refresh family when a rotated token is presented again', async () => {
    const { auth, prisma } = service();
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 9,
      userId: user.id,
      familyId: 'family-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
      user,
    });
    await expect(auth.refresh('stolen-token')).rejects.toThrow('Sign in again');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { familyId: 'family-1', revokedAt: null } }));
  });

  it('lets an admin create a user with a custom role id', async () => {
    const { auth, prisma, mail } = service({
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
          ...data,
          disabledAt: null,
          createdAt: new Date(),
        })),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    });
    const result = await auth.createUser(adminActor, {
      email: 'lead@darzaan.test',
      name: 'Floor Lead',
      roleId: 'production_assistant',
      password: 'TempPass#1',
      mobile: '9810012345',
      address: '12 Lane\nNew Delhi\n110003',
    });
    expect(result.user.email).toBe('lead@darzaan.test');
    expect(result.user.mobile).toBe('9810012345');
    expect(result.password).toBe('TempPass#1');
    expect(result.emailed).toBe(true);
    expect(result.user.mustChangePassword).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ mobile: '9810012345', address: '12 Lane\nNew Delhi\n110003', storeId: null, mustChangePassword: true }),
    }));
    expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'lead@darzaan.test',
      subject: 'Your Darzaan login',
      text: expect.stringContaining('TempPass#1'),
    }));
  });

  it('lists audit rows for an admin and hides them from other roles', async () => {
    const createdAt = new Date('2026-11-06T10:00:00.000Z');
    const { auth } = service({
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 4,
            action: 'user.created',
            meta: { createdUserId: 'U-1' },
            createdAt,
            user: { id: user.id, name: user.name, email: user.email },
          },
        ]),
      },
    });
    const page = await auth.listAudit(adminActor, { take: 50 });
    expect(page.items).toEqual([
      expect.objectContaining({ id: 4, action: 'user.created', actor: expect.objectContaining({ email: user.email }) }),
    ]);
    expect(page.nextCursor).toBeNull();
    await expect(auth.listAudit({ sub: 'U-sales', email: 'x', role: 'salesperson', name: 'Ritu' }, {})).rejects.toThrow('Only an admin');
  });

  it('lets production list assistants and keeps them off other desks', async () => {
    const assistant = { id: 9, name: 'Manoj Tiwari', role: 'production_assistant', title: 'Production Assistant', location: 'Okhla Workshop', storeId: 2 };
    const { auth, prisma } = service({
      user: { findMany: jest.fn().mockResolvedValue([assistant]) },
    });
    const rows = await auth.listProductionAssistants({ sub: '5', email: 'vikram@darzaan.test', role: 'production_head', name: 'Vikram Rathore' });
    expect(rows).toEqual([expect.objectContaining({ id: 9, name: 'Manoj Tiwari', role: 'production_assistant' })]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { disabledAt: null, role: 'production_assistant' },
    }));
    await expect(auth.listProductionAssistants({ sub: '4', email: 'ritu@darzaan.test', role: 'salesperson', name: 'Ritu Sharma' })).rejects.toThrow('Only production or an admin');
  });

  it('forbids a non-admin from listing users', async () => {
    const { auth } = service();
    await expect(auth.listUsers({ sub: 'U-sales', email: 'x', role: 'salesperson', name: 'Ritu' })).rejects.toThrow('Only an admin');
  });

  it('disables a user and revokes refresh tokens', async () => {
    const { auth, prisma } = service();
    await auth.updateUser(adminActor, '2', { disabled: true });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ disabledAt: expect.any(Date) }) }));
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 2, revokedAt: null } }));
  });

  it('blocks a store admin from changing a person at another store', async () => {
    const { auth } = service({
      user: {
        findUnique: jest.fn().mockResolvedValue({ ...user, id: 8, storeId: 2 }),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    });
    await expect(auth.updateUser(adminActor, '8', { disabled: true })).rejects.toThrow('another store');
  });

  it('blocks an admin from disabling themselves', async () => {
    const { auth } = service();
    await expect(auth.updateUser(adminActor, '1', { disabled: true })).rejects.toThrow('You can’t disable your own account');
  });

  it('emails a reset link for a known account and stays quiet for an unknown one', async () => {
    const { auth, prisma, mail } = service();
    await expect(auth.forgotPassword('missing@darzaan.test')).resolves.toEqual({ ok: true });
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(auth.forgotPassword('missing@darzaan.test')).resolves.toEqual({ ok: true });
    expect(mail.send).toHaveBeenCalledTimes(1);
    expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      subject: 'Reset your Darzaan password',
      text: expect.stringContaining('/reset-password?token='),
    }));
  });

  it('replaces the password from a reset link once', async () => {
    const { auth, prisma } = service();
    const token = 'reset-token-value-long-enough';
    prisma.passwordReset.findUnique.mockResolvedValue({
      id: 4,
      userId: user.id,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    await expect(auth.resetPassword(token, 'FreshPass#1')).resolves.toEqual({ ok: true });
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ mustChangePassword: false, passwordHash: expect.any(String) }),
    }));
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    prisma.passwordReset.findUnique.mockResolvedValue({
      id: 4,
      userId: user.id,
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    await expect(auth.resetPassword(token, 'FreshPass#1')).rejects.toThrow('expired');
  });

  it('lets a signed-in person replace a temporary password', async () => {
    const { auth } = service({
      user: {
        findUnique: jest.fn().mockResolvedValue({ ...user, mustChangePassword: true }),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...user, ...data })),
      },
    });
    const result = await auth.changePassword(String(user.id), 'Darzaan#2026', 'ChosenPass#1');
    expect(result.user.mustChangePassword).toBe(false);
    expect(result.accessToken).toEqual(expect.any(String));
    await expect(auth.changePassword(String(user.id), 'wrong-password', 'ChosenPass#1')).rejects.toThrow('does not match');
  });
});
