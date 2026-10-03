import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetStatsStateForTests, sendStats, trackUser } from '../lib/statsUtils';

const ok = () => new Response(JSON.stringify({ success: true }), { status: 200 });
const tooMany = (retryAfter = '10') => new Response('{}', { status: 429, headers: { 'Retry-After': retryAfter } });

let fetchMock: ReturnType<typeof vi.fn>;
let storage: Map<string, string>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  __resetStatsStateForTests();
  fetchMock = vi.fn();
  storage = new Map();
  vi.stubGlobal('window', {});
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
  });
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  __resetStatsStateForTests();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('sendStats', () => {
  it('posts a valid favorite', async () => {
    fetchMock.mockResolvedValue(ok());
    expect(await sendStats('favorite', '43-3-16')).toBe('sent');
    expect(fetchMock).toHaveBeenCalledWith('/api/stats/increment', expect.objectContaining({ method: 'POST', body: JSON.stringify({ action: 'favorite', verseId: '43-3-16' }) }));
  });

  it('skips ids the server would reject (no request)', async () => {
    for (const id of ['', '../', '1-1', '01-01-01', '001-0001-0001', '1-01-1', '1-1-01', '0-1-1', 'x'.repeat(100)]) expect(await sendStats('favorite', id)).toBe('skipped');
    expect(await sendStats('click', '43-3-16')).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never throws on network failure', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(sendStats('favorite', '43-3-16')).resolves.toBe('failed');
  });

  it('does not throw or retry on 400/500', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
    await expect(sendStats('favorite', '43-3-16')).resolves.toBe('failed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('on 429 defers (resolves, no throw), stops hitting the server during backoff, then retries after Retry-After', async () => {
    fetchMock.mockResolvedValueOnce(tooMany('10'));
    expect(await sendStats('favorite', '43-3-16')).toBe('deferred');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // More favorites during the backoff are queued without new requests.
    expect(await sendStats('favorite', '19-23-1')).toBe('deferred');
    expect(await sendStats('favorite', '50-4-13')).toBe('deferred');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // After Retry-After the queue is flushed in order.
    fetchMock.mockResolvedValue(ok());
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    const sent = fetchMock.mock.calls.slice(1).map((c) => JSON.parse(c[1].body).verseId);
    expect(sent).toEqual(['43-3-16', '19-23-1', '50-4-13']);
  });

  it('keeps the deferred queue when the retry is still rate limited', async () => {
    fetchMock.mockResolvedValue(tooMany('5'));
    await sendStats('favorite', '43-3-16');
    await vi.advanceTimersByTimeAsync(5_000); // first retry -> 429 again
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockResolvedValue(ok());
    await vi.advanceTimersByTimeAsync(5_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).verseId).toBe('43-3-16');
  });

  it('bounds the deferred queue', async () => {
    fetchMock.mockResolvedValue(tooMany('60'));
    await sendStats('favorite', '1-1-1');
    const results = [];
    for (let v = 2; v <= 70; v++) results.push(await sendStats('favorite', `1-1-${v}`));
    expect(results.filter((r) => r === 'dropped').length).toBeGreaterThan(0);
    expect(results.filter((r) => r === 'deferred').length).toBeLessThanOrEqual(49);
  });
});

describe('trackUser', () => {
  it('marks the user as tracked on success', async () => {
    fetchMock.mockResolvedValue(ok());
    await trackUser();
    expect(storage.get('user-tracked')).toBe('true');
  });

  it('on 429 neither throws nor marks tracked (retry next visit)', async () => {
    fetchMock.mockResolvedValue(tooMany());
    await expect(trackUser()).resolves.toBeUndefined();
    expect(storage.has('user-tracked')).toBe(false);
  });
});
