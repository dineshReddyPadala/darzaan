import { createHash } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/core';
import { AppError } from '../../../../libs/common/src/http';
import { decideIdempotency, idempotencyExpiry, lockUntil, type IdempotencyRow } from '../../../../libs/common/src/idempotency';
import { PrismaService } from './prisma.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(scope: string, key: string, body: unknown, work: (tx: Prisma.TransactionClient) => Promise<{ code: number; body: T }>): Promise<{ code: number; body: T; replayed: boolean }> {
    const requestHash = createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const existing = await this.prisma.idempotencyKey.findUnique({ where: { scope_key: { scope, key } } });
    const decision = decideIdempotency(existing ? toRow(existing) : null, requestHash);
    if (decision.type === 'replay') return { code: decision.code, body: decision.body as T, replayed: true };
    if (decision.type === 'in_progress') throw new AppError(HttpStatus.CONFLICT, 'This request is already being processed');
    if (decision.type === 'mismatch') throw new AppError(HttpStatus.UNPROCESSABLE_ENTITY, 'This idempotency key was already used for a different request');
    if (!existing) {
      try {
        await this.prisma.idempotencyKey.create({
          data: { scope, key, requestHash, status: 'IN_PROGRESS', lockedUntil: lockUntil(), expiresAt: idempotencyExpiry() },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new AppError(HttpStatus.CONFLICT, 'This request is already being processed');
        }
        throw error;
      }
    } else {
      const claimed = await this.prisma.idempotencyKey.updateMany({
        where: {
          id: existing.id,
          OR: [{ status: 'FAILED' }, { lockedUntil: null }, { lockedUntil: { lt: new Date() } }],
        },
        data: { status: 'IN_PROGRESS', requestHash, lockedUntil: lockUntil(), expiresAt: idempotencyExpiry() },
      });
      if (claimed.count !== 1) throw new AppError(HttpStatus.CONFLICT, 'This request is already being processed');
    }
    try {
      const result = await this.prisma.$transaction((tx) => work(tx));
      await this.prisma.idempotencyKey.update({
        where: { scope_key: { scope, key } },
        data: { status: 'COMPLETED', responseCode: result.code, responseBody: result.body as Prisma.InputJsonValue, lockedUntil: null },
      });
      return { ...result, replayed: false };
    } catch (error) {
      await this.prisma.idempotencyKey.update({
        where: { scope_key: { scope, key } },
        data: { status: 'FAILED', lockedUntil: null },
      }).catch(() => undefined);
      throw error;
    }
  }
}

function toRow(row: { requestHash: string; status: string; responseCode: number | null; responseBody: Prisma.JsonValue | null; lockedUntil: Date | null }): IdempotencyRow {
  return {
    requestHash: row.requestHash,
    status: row.status as IdempotencyRow['status'],
    responseCode: row.responseCode,
    responseBody: row.responseBody,
    lockedUntil: row.lockedUntil,
  };
}
