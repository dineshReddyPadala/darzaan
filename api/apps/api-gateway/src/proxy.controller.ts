import { All, Controller, Get, Headers, HttpStatus, Req, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthUser } from '../../../libs/common/src/auth-context';
import { isRoleId } from '../../../libs/common/src/roles';
import { cacheIncr } from '../../../libs/observability/src/cache';
import { kafkaBus } from '../../../libs/messaging/src';
import { redisHealthy } from '../../../libs/observability/src/cache';
import { createLogger } from '../../../libs/observability/src/logger';
import { registry } from '../../../libs/observability/src/metrics';

const logger = createLogger('api-gateway');

const AUTH_URL = process.env.AUTH_URL ?? 'http://127.0.0.1:3001';
const CORE_URL = process.env.CORE_URL ?? 'http://127.0.0.1:3002';
const NOTIFICATION_URL = process.env.NOTIFICATION_URL ?? 'http://127.0.0.1:3003';

function targetFor(path: string): string {
  if (path.startsWith('/api/v1/auth')) return AUTH_URL;
  if (path.startsWith('/api/v1/notifications')) return NOTIFICATION_URL;
  return CORE_URL;
}

function isPublic(path: string): boolean {
  return path.startsWith('/api/v1/auth/login')
    || path.startsWith('/api/v1/auth/refresh')
    || path.startsWith('/api/v1/auth/forgot-password')
    || path.startsWith('/api/v1/auth/reset-password')
    || path.startsWith('/api/v1/public/');
}

function passwordChangeOnly(path: string): boolean {
  return path.startsWith('/api/v1/auth/change-password')
    || path.startsWith('/api/v1/auth/logout')
    || path.startsWith('/api/v1/auth/me');
}

@Controller()
export class ProxyController {
  constructor(private readonly jwt: JwtService) {}

  @Get('health/live')
  live() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async ready() {
    const redis = await redisHealthy();
    const kafka = process.env.KAFKA_BROKERS ? await kafkaBus.health().catch(() => false) : true;
    return { status: redis && kafka ? 'ok' : 'degraded', redis: redis ? 'up' : 'down', kafka: kafka ? 'up' : 'down' };
  }

  @Get('metrics')
  metrics() {
    return registry.metrics();
  }

  @All('api/*')
  async proxy(@Req() request: FastifyRequest, @Res() reply: FastifyReply, @Headers('x-forwarded-for') forwarded?: string) {
    const path = request.url.split('?')[0];
    const ip = forwarded?.split(',')[0]?.trim() || request.ip || 'local';
    const hits = await cacheIncr(`rate:${ip}`, 60);
    if (hits > Number(process.env.RATE_LIMIT_PER_MINUTE ?? 120)) {
      reply.status(429).send({ error: { code: 'CONFLICT', message: 'Too many requests. Wait a minute and try again.', details: null, requestId: request.headers['x-request-id'] ?? '' } });
      return;
    }
    let user: AuthUser | undefined;
    if (!isPublic(path)) {
      const header = request.headers.authorization;
      const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
      if (!token) {
        reply.status(HttpStatus.UNAUTHORIZED).send({ error: { code: 'UNAUTHORIZED', message: 'Sign in to continue', details: null, requestId: request.headers['x-request-id'] ?? '' } });
        return;
      }
      try {
        const payload = await this.jwt.verifyAsync<AuthUser>(token);
        if (!payload?.sub || !isRoleId(payload.role)) throw new Error('role');
        user = payload;
      } catch {
        reply.status(HttpStatus.UNAUTHORIZED).send({ error: { code: 'UNAUTHORIZED', message: 'Sign in to continue', details: null, requestId: request.headers['x-request-id'] ?? '' } });
        return;
      }
      if (user.mustChangePassword && !passwordChangeOnly(path)) {
        reply.status(HttpStatus.FORBIDDEN).send({ error: { code: 'FORBIDDEN', message: 'Choose a new password before continuing', details: null, requestId: request.headers['x-request-id'] ?? '' } });
        return;
      }
    }
    const hopByHop = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'upgrade', 'proxy-connection', 'te', 'trailer', 'expect', 'x-user']);
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string' && !hopByHop.has(key)) headers[key] = value;
    }
    if (user) headers['x-user'] = JSON.stringify(user);
    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const upstream = `${targetFor(path)}${request.url}`;
    let response: Response;
    try {
      response = await fetch(upstream, {
        method: request.method,
        headers,
        body: hasBody ? JSON.stringify(request.body ?? {}) : undefined,
      });
    } catch (error) {
      const cause = error instanceof Error ? error.cause ?? error.message : error;
      logger.error({ upstream, cause }, 'upstream request failed');
      reply.status(HttpStatus.BAD_GATEWAY).send({ error: { code: 'INTERNAL', message: 'The service could not be reached. Try again.', details: null, requestId: request.headers['x-request-id'] ?? '' } });
      return;
    }
    const text = await response.text();
    reply.status(response.status);
    const type = response.headers.get('content-type');
    if (type) reply.header('content-type', type);
    const requestId = response.headers.get('x-request-id');
    if (requestId) reply.header('x-request-id', requestId);
    reply.send(text);
  }
}
