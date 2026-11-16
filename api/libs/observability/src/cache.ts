import Redis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');
const memory = new Map<string, { value: string; expiresAt: number }>();
let client: Redis | null = null;

function redis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true, enableOfflineQueue: false });
    client.on('error', (error) => logger.warn({ err: error.message }, 'redis unavailable'));
  }
  return client;
}

export async function cacheGet(key: string): Promise<string | null> {
  const store = redis();
  if (store) {
    try {
      if (store.status === 'wait') await store.connect();
      return await store.get(key);
    } catch {
      return null;
    }
  }
  const hit = memory.get(key);
  if (!hit || hit.expiresAt < Date.now()) return null;
  return hit.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const store = redis();
  if (store) {
    try {
      if (store.status === 'wait') await store.connect();
      await store.set(key, value, 'EX', ttlSeconds);
      return;
    } catch {
      return;
    }
  }
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheIncr(key: string, ttlSeconds: number): Promise<number> {
  const store = redis();
  if (store) {
    try {
      if (store.status === 'wait') await store.connect();
      const count = await store.incr(key);
      if (count === 1) await store.expire(key, ttlSeconds);
      return count;
    } catch {
      return 1;
    }
  }
  const hit = memory.get(key);
  const count = hit && hit.expiresAt > Date.now() ? Number(hit.value) + 1 : 1;
  memory.set(key, { value: String(count), expiresAt: Date.now() + ttlSeconds * 1000 });
  return count;
}

export async function redisHealthy(): Promise<boolean> {
  if (!process.env.REDIS_URL) return true;
  const store = redis();
  if (!store) return false;
  try {
    if (store.status === 'wait') await store.connect();
    return (await store.ping()) === 'PONG';
  } catch {
    return false;
  }
}
