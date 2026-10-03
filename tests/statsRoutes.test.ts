import { beforeEach, describe, expect, it, vi } from 'vitest';

const redis = vi.hoisted(() => ({
  safeRedisIncr: vi.fn(async () => true),
  safeRedisGetResult: vi.fn(async (_key: string, def?: string) => ({ value: def ?? '0', degraded: false })),
  safeRedisScanResult: vi.fn(async () => ({ value: [] as string[], degraded: false })),
  safeRedisMgetResult: vi.fn(async (_keys: string[]) => ({ value: [] as (string | null)[], degraded: false })),
  createRedisClient: vi.fn(),
}));
const limiter = vi.hoisted(() => ({ checkRateLimit: vi.fn() }));

vi.mock('../lib/redisUtils', () => redis);
// The real Bible JSON is several MB; a tiny stand-in keeps this suite cheap (CI runners are small).
vi.mock('@/public/data/CUVT_bible.json', () => ({
  default: { 约翰福音: { 3: { 16: '神愛世人' } }, 诗篇: { 23: { 1: '耶和華是我的牧者' } } },
}));
vi.mock('../lib/rateLimit', async () => {
  const actual = await vi.importActual<typeof import('../lib/rateLimit')>('../lib/rateLimit');
  return { ...actual, checkRateLimit: limiter.checkRateLimit };
});

const ALLOWED = { allowed: true, limit: 30, remaining: 29, retryAfterSeconds: 0, degraded: false };
const BLOCKED = { allowed: false, limit: 30, remaining: 0, retryAfterSeconds: 17, degraded: false };

function post(url: string, body?: string, contentType = 'application/json') {
  return new Request(`http://localhost${url}`, { method: 'POST', body, headers: body === undefined ? {} : { 'Content-Type': contentType } });
}
const json = (v: unknown) => JSON.stringify(v);

function expectNoRedisTouched() {
  expect(redis.safeRedisIncr).not.toHaveBeenCalled();
  expect(redis.safeRedisGetResult).not.toHaveBeenCalled();
  expect(redis.createRedisClient).not.toHaveBeenCalled();
  expect(limiter.checkRateLimit).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  limiter.checkRateLimit.mockResolvedValue(ALLOWED);
});

describe('POST /api/stats/increment', () => {
  it('writes both counters for a valid favorite', async () => {
    const { POST } = await import('../app/api/stats/increment/route');
    const res = await POST(post('/api/stats/increment', json({ action: 'favorite', verseId: '43-3-16' })));
    expect(res.status).toBe(200);
    expect(redis.safeRedisIncr).toHaveBeenCalledTimes(2);
    expect(redis.safeRedisIncr).toHaveBeenCalledWith('total_favorites');
    expect(redis.safeRedisIncr).toHaveBeenCalledWith('verse:43-3-16');
  });

  const badBodies: Array<[string, string | undefined]> = [
    ['empty verseId', json({ action: 'favorite', verseId: '' })],
    ['path traversal', json({ action: 'favorite', verseId: '../' })],
    ['long string', json({ action: 'favorite', verseId: '1'.repeat(300) })],
    ['very long string (huge body)', json({ action: 'favorite', verseId: 'a'.repeat(50_000) })],
    ['1-1', json({ action: 'favorite', verseId: '1-1' })],
    ['leading zeros 01-01-01', json({ action: 'favorite', verseId: '01-01-01' })],
    ['leading zeros 001-0001-0001', json({ action: 'favorite', verseId: '001-0001-0001' })],
    ['leading zero 1-01-1', json({ action: 'favorite', verseId: '1-01-1' })],
    ['leading zero 1-1-01', json({ action: 'favorite', verseId: '1-1-01' })],
    ['zero book 0-1-1', json({ action: 'favorite', verseId: '0-1-1' })],
    ['numeric verseId', json({ action: 'favorite', verseId: 43 })],
    ['array verseId', json({ action: 'favorite', verseId: ['43-3-16'] })],
    ['null verseId', json({ action: 'favorite', verseId: null })],
    ['missing verseId', json({ action: 'favorite' })],
    ['bad action', json({ action: 'click', verseId: '43-3-16' })],
    ['missing action', json({ verseId: '43-3-16' })],
    ['array body', json(['favorite', '43-3-16'])],
    ['null body', 'null'],
    ['invalid JSON', '{nope'],
    ['empty body', ''],
  ];

  it.each(badBodies)('returns 400 and touches no Redis for %s', async (_label, body) => {
    const { POST } = await import('../app/api/stats/increment/route');
    const res = await POST(post('/api/stats/increment', body));
    expect(res.status).toBe(400);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expectNoRedisTouched();
  });

  it.each(['1-1-1', '66-22-21', '43-3-16'])('still accepts canonical id %s', async (verseId) => {
    const { POST } = await import('../app/api/stats/increment/route');
    const res = await POST(post('/api/stats/increment', json({ action: 'favorite', verseId })));
    expect(res.status).toBe(200);
    expect(redis.safeRedisIncr).toHaveBeenCalledWith(`verse:${verseId}`);
  });

  it('returns 429 with Retry-After when rate limited, without writing', async () => {
    limiter.checkRateLimit.mockResolvedValue(BLOCKED);
    const { POST } = await import('../app/api/stats/increment/route');
    const res = await POST(post('/api/stats/increment', json({ action: 'favorite', verseId: '43-3-16' })));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('17');
    expect(redis.safeRedisIncr).not.toHaveBeenCalled();
  });

  it('still succeeds when the limiter degrades open', async () => {
    limiter.checkRateLimit.mockResolvedValue({ ...ALLOWED, degraded: true });
    const { POST } = await import('../app/api/stats/increment/route');
    const res = await POST(post('/api/stats/increment', json({ action: 'favorite', verseId: '1-1-1' })));
    expect(res.status).toBe(200);
    expect(redis.safeRedisIncr).toHaveBeenCalledTimes(2);
  });
});

describe('POST /api/stats/track-user', () => {
  it('counts a new user for an empty body', async () => {
    const { POST } = await import('../app/api/stats/track-user/route');
    const res = await POST(post('/api/stats/track-user'));
    expect(res.status).toBe(200);
    expect(redis.safeRedisIncr).toHaveBeenCalledWith('total_users');
  });

  it.each([
    ['empty verseId', json({ verseId: '' })],
    ['path traversal', json({ verseId: '../' })],
    ['long string', json({ verseId: '1'.repeat(5000) })],
    ['1-1', json({ verseId: '1-1' })],
    ['even a valid-looking verseId', json({ verseId: '43-3-16' })],
    ['array body', '[]'],
    ['invalid JSON', 'x'],
  ])('returns 400 and touches no Redis for %s', async (_label, body) => {
    const { POST } = await import('../app/api/stats/track-user/route');
    const res = await POST(post('/api/stats/track-user', body));
    expect(res.status).toBe(400);
    expectNoRedisTouched();
  });

  it('returns 429 with Retry-After when rate limited, without writing', async () => {
    limiter.checkRateLimit.mockResolvedValue(BLOCKED);
    const { POST } = await import('../app/api/stats/track-user/route');
    const res = await POST(post('/api/stats/track-user'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('17');
    expect(redis.safeRedisIncr).not.toHaveBeenCalled();
  });
});

const SHORT = 'public, s-maxage=30, stale-while-revalidate=30';
const LONG_LIST = 'public, s-maxage=600, stale-while-revalidate=1800';
const LONG_STATS = 'public, s-maxage=300, stale-while-revalidate=900';
const ok = <T,>(value: T) => ({ value, degraded: false });

describe('GET cache policies', () => {
  beforeEach(() => {
    redis.safeRedisGetResult.mockImplementation(async (_k: string, def?: string) => ok(def ?? '0'));
    redis.safeRedisScanResult.mockResolvedValue(ok([] as string[]));
    redis.safeRedisMgetResult.mockResolvedValue(ok([] as (string | null)[]));
  });

  it('/api/stats: healthy data -> 300/900; both zero -> short; ONE of two GETs failing -> short', async () => {
    const { GET } = await import('../app/api/stats/route');
    redis.safeRedisGetResult.mockImplementation(async (key: string) => ok(key === 'total_users' ? '12' : '99'));
    const healthy = await GET();
    expect(healthy.headers.get('Cache-Control')).toBe(LONG_STATS);
    expect(await healthy.json()).toEqual({ totalUsers: 12, totalFavorites: 99 });

    redis.safeRedisGetResult.mockImplementation(async (_k: string, def?: string) => ok(def ?? '0'));
    expect((await GET()).headers.get('Cache-Control')).toBe(SHORT);

    // total_users fails (default 0), total_favorites is fine (non-zero): must NOT be cached long
    redis.safeRedisGetResult.mockImplementation(async (key: string) => (key === 'total_users' ? { value: '0', degraded: true } : ok('99')));
    expect((await GET()).headers.get('Cache-Control')).toBe(SHORT);

    // and the other way around
    redis.safeRedisGetResult.mockImplementation(async (key: string) => (key === 'total_favorites' ? { value: '0', degraded: true } : ok('12')));
    expect((await GET()).headers.get('Cache-Control')).toBe(SHORT);
  });

  it('/api/rankings: healthy -> 600/1800; empty -> short; SCAN ok + MGET fails -> short; SCAN fails/partial -> short; no force-dynamic/revalidate', async () => {
    const mod = await import('../app/api/rankings/route');
    expect((mod as Record<string, unknown>).dynamic).toBeUndefined();
    expect((mod as Record<string, unknown>).revalidate).toBeUndefined();

    redis.safeRedisScanResult.mockResolvedValue(ok(['verse:43-3-16', 'verse:19-23-1']));
    redis.safeRedisMgetResult.mockResolvedValue(ok(['5', '9']));
    const healthy = await mod.GET();
    expect(healthy.headers.get('Cache-Control')).toBe(LONG_LIST);
    expect((await healthy.json()).rankings.map((r: { verseId: string }) => r.verseId)).toEqual(['19-23-1', '43-3-16']);

    redis.safeRedisScanResult.mockResolvedValue(ok([]));
    expect((await mod.GET()).headers.get('Cache-Control')).toBe(SHORT);

    // SCAN found keys, MGET failed -> empty list must not be pinned for 10 minutes
    redis.safeRedisScanResult.mockResolvedValue(ok(['verse:43-3-16', 'verse:19-23-1']));
    redis.safeRedisMgetResult.mockResolvedValue({ value: [null, null], degraded: true });
    const mgetFail = await mod.GET();
    expect(mgetFail.headers.get('Cache-Control')).toBe(SHORT);
    expect((await mgetFail.json()).rankings).toEqual([]);

    // SCAN error / truncated scan, even if MGET returns data -> short
    redis.safeRedisScanResult.mockResolvedValue({ value: ['verse:43-3-16'], degraded: true });
    redis.safeRedisMgetResult.mockResolvedValue(ok(['5']));
    expect((await mod.GET()).headers.get('Cache-Control')).toBe(SHORT);
  });

  it('/api/rankings and top-verses ignore non-canonical (leading-zero) keys already in Redis', async () => {
    redis.safeRedisScanResult.mockResolvedValue(ok(['verse:01-01-01', 'verse:001-0001-0001', 'verse:43-3-16']));
    redis.safeRedisMgetResult.mockImplementation(async (keys: string[]) => ok(keys.map(() => '3')));
    const { GET } = await import('../app/api/rankings/route');
    const body = await (await GET()).json();
    expect(body.rankings.map((r: { verseId: string }) => r.verseId)).toEqual(['43-3-16']);
    expect(redis.safeRedisMgetResult).toHaveBeenCalledWith(['verse:43-3-16']);
  });

  it('/api/stats/top-verses: healthy -> 600/1800; empty -> short; SCAN ok + MGET fails -> short; SCAN degraded -> short', async () => {
    const mod = await import('../app/api/stats/top-verses/route');
    expect((mod as Record<string, unknown>).dynamic).toBeUndefined();

    redis.safeRedisScanResult.mockResolvedValue(ok(['verse:43-3-16']));
    redis.safeRedisMgetResult.mockResolvedValue(ok(['5']));
    const healthy = await mod.GET();
    expect(healthy.headers.get('Cache-Control')).toBe(LONG_LIST);
    expect((await healthy.json()).topVerses).toHaveLength(1);

    redis.safeRedisScanResult.mockResolvedValue(ok([]));
    expect((await mod.GET()).headers.get('Cache-Control')).toBe(SHORT);

    redis.safeRedisScanResult.mockResolvedValue(ok(['verse:43-3-16']));
    redis.safeRedisMgetResult.mockResolvedValue({ value: [null], degraded: true });
    const mgetFail = await mod.GET();
    expect(mgetFail.headers.get('Cache-Control')).toBe(SHORT);
    expect((await mgetFail.json()).topVerses).toEqual([]);

    redis.safeRedisScanResult.mockResolvedValue({ value: ['verse:43-3-16'], degraded: true });
    redis.safeRedisMgetResult.mockResolvedValue(ok(['5']));
    expect((await mod.GET()).headers.get('Cache-Control')).toBe(SHORT);
  });
});
