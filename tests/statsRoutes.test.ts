import { beforeEach, describe, expect, it, vi } from 'vitest';

const redis = vi.hoisted(() => ({
  safeRedisIncr: vi.fn(async () => true),
  safeRedisGet: vi.fn(async (_key: string, def?: string) => def ?? '0'),
  safeRedisScan: vi.fn(async () => [] as string[]),
  safeRedisMget: vi.fn(async () => [] as (string | null)[]),
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
  expect(redis.safeRedisGet).not.toHaveBeenCalled();
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

describe('GET cache policies', () => {
  it('/api/stats: 5 min fresh + 15 min SWR with data, short TTL when everything is zero', async () => {
    const { GET } = await import('../app/api/stats/route');
    redis.safeRedisGet.mockImplementation(async (key: string) => (key === 'total_users' ? '12' : '99'));
    const ok = await GET();
    expect(ok.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=900');
    expect(await ok.json()).toEqual({ totalUsers: 12, totalFavorites: 99 });

    redis.safeRedisGet.mockImplementation(async (_k: string, def?: string) => def ?? '0');
    const empty = await GET();
    expect(empty.headers.get('Cache-Control')).toBe('public, s-maxage=30, stale-while-revalidate=30');
  });

  it('/api/rankings: 10 min fresh + 30 min SWR with data, short TTL when empty, no force-dynamic/revalidate exports', async () => {
    const mod = await import('../app/api/rankings/route');
    expect((mod as Record<string, unknown>).dynamic).toBeUndefined();
    expect((mod as Record<string, unknown>).revalidate).toBeUndefined();

    redis.safeRedisScan.mockResolvedValue(['verse:43-3-16', 'verse:19-23-1']);
    redis.safeRedisMget.mockResolvedValue(['5', '9']);
    const ok = await mod.GET();
    expect(ok.headers.get('Cache-Control')).toBe('public, s-maxage=600, stale-while-revalidate=1800');
    const body = await ok.json();
    expect(body.rankings.map((r: { verseId: string }) => r.verseId)).toEqual(['19-23-1', '43-3-16']);

    redis.safeRedisScan.mockResolvedValue([]);
    const empty = await mod.GET();
    expect(empty.headers.get('Cache-Control')).toBe('public, s-maxage=30, stale-while-revalidate=30');
  });

  it('/api/stats/top-verses: 10 min fresh + 30 min SWR with data, short TTL when empty', async () => {
    const mod = await import('../app/api/stats/top-verses/route');
    expect((mod as Record<string, unknown>).dynamic).toBeUndefined();

    redis.safeRedisScan.mockResolvedValue(['verse:43-3-16']);
    redis.safeRedisMget.mockResolvedValue(['5']);
    const ok = await mod.GET();
    expect(ok.headers.get('Cache-Control')).toBe('public, s-maxage=600, stale-while-revalidate=1800');
    expect((await ok.json()).topVerses).toHaveLength(1);

    redis.safeRedisScan.mockResolvedValue([]);
    const empty = await mod.GET();
    expect(empty.headers.get('Cache-Control')).toBe('public, s-maxage=30, stale-while-revalidate=30');
  });
});
