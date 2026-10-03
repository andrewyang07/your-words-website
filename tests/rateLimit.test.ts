import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, getClientIdentifier, rateLimitedResponse, type RateLimitConfig, type RateLimitRedis } from '../lib/rateLimit';

const CONFIG: RateLimitConfig = { name: 'test', limit: 3, windowSeconds: 60 };
const T0 = 1_700_000_000_000; // fixed clock

function fakeRedis() {
  const counts = new Map<string, number>();
  const redis = {
    incr: vi.fn(async (key: string) => {
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return next;
    }),
    expire: vi.fn(async () => 1),
  } satisfies RateLimitRedis;
  return { redis, counts };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('checkRateLimit', () => {
  it('allows requests up to the limit and blocks the next one', async () => {
    const { redis } = fakeRedis();
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await checkRateLimit('ip1', CONFIG, { redis, now: T0 }));

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false, false]);
    expect(results.map((r) => r.remaining)).toEqual([2, 1, 0, 0, 0]);
    expect(results.every((r) => !r.degraded)).toBe(true);
  });

  it('only issues EXPIRE on the first hit of a window (command budget)', async () => {
    const { redis } = fakeRedis();
    for (let i = 0; i < 5; i++) await checkRateLimit('ip1', CONFIG, { redis, now: T0 });
    expect(redis.incr).toHaveBeenCalledTimes(5);
    expect(redis.expire).toHaveBeenCalledTimes(1);
  });

  it('reports Retry-After until the end of the current window', async () => {
    const { redis } = fakeRedis();
    const windowStart = Math.floor(T0 / 60_000) * 60_000;
    const r = await checkRateLimit('ip1', CONFIG, { redis, now: windowStart + 45_000 });
    expect(r.retryAfterSeconds).toBe(15);
  });

  it('tracks identifiers and scopes independently', async () => {
    const { redis } = fakeRedis();
    for (let i = 0; i < 4; i++) await checkRateLimit('ip1', CONFIG, { redis, now: T0 });
    expect((await checkRateLimit('ip1', CONFIG, { redis, now: T0 })).allowed).toBe(false);
    expect((await checkRateLimit('ip2', CONFIG, { redis, now: T0 })).allowed).toBe(true);
    expect((await checkRateLimit('ip1', { ...CONFIG, name: 'other' }, { redis, now: T0 })).allowed).toBe(true);
  });

  it('starts a fresh count in the next window', async () => {
    const { redis } = fakeRedis();
    for (let i = 0; i < 4; i++) await checkRateLimit('ip1', CONFIG, { redis, now: T0 });
    const next = await checkRateLimit('ip1', CONFIG, { redis, now: T0 + 60_000 });
    expect(next.allowed).toBe(true);
    expect(next.remaining).toBe(2);
  });

  it('lets a normal user favorite 20 verses in a row with the real increment limit', async () => {
    const { INCREMENT_RATE_LIMIT } = await import('../lib/rateLimit');
    const { redis } = fakeRedis();
    for (let i = 0; i < 20; i++) {
      expect((await checkRateLimit('ip1', INCREMENT_RATE_LIMIT, { redis, now: T0 })).allowed).toBe(true);
    }
  });

  it('fails open when Redis is not configured (null)', async () => {
    const r = await checkRateLimit('ip1', CONFIG, { redis: null });
    expect(r).toMatchObject({ allowed: true, degraded: true });
  });

  it('fails open when no KV env vars are set and no redis is injected', async () => {
    vi.stubEnv('KV_REST_API_URL', '');
    vi.stubEnv('KV_REST_API_TOKEN', '');
    const r = await checkRateLimit('ip1', CONFIG);
    expect(r).toMatchObject({ allowed: true, degraded: true });
  });

  it('fails open when Redis throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const redis: RateLimitRedis = { incr: vi.fn().mockRejectedValue(new Error('boom')), expire: vi.fn() };
    const r = await checkRateLimit('ip1', CONFIG, { redis, now: T0 });
    expect(r).toMatchObject({ allowed: true, degraded: true });
  });

  it('fails open when Redis hangs past the timeout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const redis: RateLimitRedis = { incr: vi.fn(() => new Promise<number>(() => {})), expire: vi.fn() };
    const r = await checkRateLimit('ip1', CONFIG, { redis, now: T0, timeoutMs: 10 });
    expect(r).toMatchObject({ allowed: true, degraded: true });
  });
});

describe('getClientIdentifier', () => {
  const idFor = (headers: Record<string, string>) => getClientIdentifier(new Request('http://localhost/x', { headers }));

  it('hashes the IP (no raw IP in the identifier) and is stable', async () => {
    const a = await idFor({ 'x-forwarded-for': '203.0.113.7' });
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).not.toContain('203');
    expect(await idFor({ 'x-forwarded-for': '203.0.113.7' })).toBe(a);
  });

  it('uses the first x-forwarded-for entry and prefers x-real-ip', async () => {
    const first = await idFor({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' });
    expect(first).toBe(await idFor({ 'x-forwarded-for': '203.0.113.7' }));
    expect(await idFor({ 'x-real-ip': '198.51.100.9', 'x-forwarded-for': '203.0.113.7' })).toBe(await idFor({ 'x-real-ip': '198.51.100.9' }));
    expect(await idFor({ 'x-forwarded-for': '198.51.100.9' })).not.toBe(first);
  });

  it('falls back to a constant bucket when no IP header exists', async () => {
    expect(await idFor({})).toBe(await idFor({}));
  });
});

describe('rateLimitedResponse', () => {
  it('is a 429 with Retry-After and no-store', async () => {
    const res = rateLimitedResponse({ allowed: false, limit: 3, remaining: 0, retryAfterSeconds: 42, degraded: false });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.json()).toMatchObject({ error: 'Too many requests', retryAfter: 42 });
  });
});
