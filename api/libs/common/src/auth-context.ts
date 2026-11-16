import { createParamDecorator, ExecutionContext, HttpStatus } from '@nestjs/common';
import { AppError } from './http';
import { isRoleId } from './roles';
import { entityId } from './scope';

export interface AuthUser {
  sub: string;
  email: string;
  /** Catalog role id — built-in or custom. */
  role: string;
  name: string;
  store?: string;
  /** Location id this account belongs to. Absent when the person is not at a store. */
  storeId?: number;
  /** Set on access tokens issued before the person replaces a temporary password. */
  mustChangePassword?: boolean;
}

export function readUser(request: { headers: Record<string, string | string[] | undefined>; user?: AuthUser }): AuthUser {
  if (request.user) return request.user;
  const raw = request.headers['x-user'];
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header) throw new AppError(HttpStatus.UNAUTHORIZED, 'Sign in to continue');
  const parsed = JSON.parse(header) as AuthUser;
  if (!parsed?.sub || !isRoleId(parsed.role)) throw new AppError(HttpStatus.UNAUTHORIZED, 'Sign in to continue');
  return { ...parsed, storeId: entityId(parsed.storeId) ?? undefined };
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return readUser(ctx.switchToHttp().getRequest());
});
