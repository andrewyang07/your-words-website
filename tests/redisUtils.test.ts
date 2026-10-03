import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({ get: vi.fn(), mget: vi.fn(), scan: vi.fn() }));
vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor() {
      return client;
    }
  },
}));

import { safeRedisGet, safeRedisGetResult, safeRedisMgetResult, safeRedisScanResult, safeRedisScan } from '../lib/redisUtils';

beforeEach(() => {
  vi.stubEnv('KV_REST_API_URL', 'http://127.0.0.1:1');
  vi.stubEnv('KV_REST_API_TOKEN', 'x');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  client.get.mockReset();
  client.mget.mockReset();
  client.scan.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('degradation is signaled explicitly', () => {
  it('GET: a missing key is NOT degraded; an error or missing credentials IS', async () => {
    client.get.mockResolvedValueOnce(null);
    expect(await safeRedisGetResult('k', '0')).toEqual({ value: '0', degraded: false });
    client.get.mockResolvedValueOnce(7);
    expect(await safeRedisGetResult('k', '0')).toEqual({ value: '7', degraded: false });
    client.get.mockRejectedValueOnce(new Error('boom'));
    expect(await safeRedisGetResult('k', '0')).toEqual({ value: '0', degraded: true });
    vi.stubEnv('KV_REST_API_URL', '');
    expect(await safeRedisGetResult('k', '0')).toEqual({ value: '0', degraded: true });
  });

  it('MGET: failure -> all null + degraded; empty input is not degraded', async () => {
    expect(await safeRedisMgetResult([])).toEqual({ value: [], degraded: false });
    client.mget.mockResolvedValueOnce([1, null]);
    expect(await safeRedisMgetResult(['a', 'b'])).toEqual({ value: ['1', null], degraded: false });
    client.mget.mockRejectedValueOnce(new Error('boom'));
    expect(await safeRedisMgetResult(['a', 'b'])).toEqual({ value: [null, null], degraded: true });
  });

  it('SCAN: complete scan is healthy; error (even mid-scan) or truncation is degraded', async () => {
    client.scan.mockResolvedValueOnce(['5', ['verse:1-1-1']]).mockResolvedValueOnce(['0', ['verse:2-2-2']]);
    expect(await safeRedisScanResult('verse:*')).toEqual({ value: ['verse:1-1-1', 'verse:2-2-2'], degraded: false });

    client.scan.mockReset();
    client.scan.mockResolvedValueOnce(['5', ['verse:1-1-1']]).mockRejectedValueOnce(new Error('boom'));
    expect(await safeRedisScanResult('verse:*')).toEqual({ value: [], degraded: true });

    client.scan.mockReset();
    client.scan.mockResolvedValue(['5', ['verse:1-1-1']]); // never terminates
    const truncated = await safeRedisScanResult('verse:*', 2);
    expect(truncated.degraded).toBe(true);
    expect(truncated.value.length).toBeGreaterThan(0);
  });

  it('legacy helpers keep their old return shapes', async () => {
    client.get.mockRejectedValueOnce(new Error('boom'));
    expect(await safeRedisGet('k', '0')).toBe('0');
    client.scan.mockRejectedValueOnce(new Error('boom'));
    expect(await safeRedisScan('verse:*')).toEqual([]);
  });
});
