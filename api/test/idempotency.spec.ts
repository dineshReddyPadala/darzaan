import { decideIdempotency, lockUntil } from '../libs/common/src/idempotency';

describe('idempotency decisions', () => {
  const hash = 'abc';

  it('runs when the key is new', () => {
    expect(decideIdempotency(null, hash).type).toBe('execute');
  });

  it('replays a completed request with the same body', () => {
    const decision = decideIdempotency({ requestHash: hash, status: 'COMPLETED', responseCode: 201, responseBody: { id: 'DZ-1' }, lockedUntil: null }, hash);
    expect(decision).toEqual({ type: 'replay', code: 201, body: { id: 'DZ-1' } });
  });

  it('rejects the same key used with a different body', () => {
    expect(decideIdempotency({ requestHash: 'other', status: 'COMPLETED', responseCode: 201, responseBody: {}, lockedUntil: null }, hash).type).toBe('mismatch');
  });

  it('blocks a second caller while the lock is fresh', () => {
    expect(decideIdempotency({ requestHash: hash, status: 'IN_PROGRESS', responseCode: null, responseBody: null, lockedUntil: lockUntil() }, hash).type).toBe('in_progress');
  });

  it('allows a retry after the lock expires or the first attempt fails', () => {
    expect(decideIdempotency({ requestHash: hash, status: 'IN_PROGRESS', responseCode: null, responseBody: null, lockedUntil: new Date(Date.now() - 1000) }, hash).type).toBe('execute');
    expect(decideIdempotency({ requestHash: hash, status: 'FAILED', responseCode: null, responseBody: null, lockedUntil: null }, hash).type).toBe('execute');
  });
});

describe('concurrent duplicate claims', () => {
  it('lets one caller proceed and tells the other the request is in progress', async () => {
    const keys = new Set<string>();
    const claim = async (key: string) => {
      if (keys.has(key)) return 'conflict' as const;
      await Promise.resolve();
      if (keys.has(key)) return 'conflict' as const;
      keys.add(key);
      return 'ok' as const;
    };
    const [first, second] = await Promise.all([claim('order-1'), claim('order-1')]);
    expect([first, second].sort()).toEqual(['conflict', 'ok']);
  });
});
