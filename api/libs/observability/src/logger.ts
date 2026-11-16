import pino, { type Logger } from 'pino';

export function createLogger(service: string): Logger {
  return pino({
    level: process.env.LOG_LEVEL ?? 'info',
    base: { service },
    redact: ['req.headers.authorization', 'password', 'passwordHash', 'refreshToken', 'authorization'],
  });
}
