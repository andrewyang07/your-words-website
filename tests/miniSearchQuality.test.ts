import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getSearchEngine } from '../lib/search/searchEngine';

// Real corpus from public/data (the MiniSearch fallback indexes the full Simplified CUV).
vi.mock('../lib/bibleDataCache', () => ({
  fetchWithCache: async (url: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', url), 'utf8')),
}));

vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });

beforeAll(async () => {
  await getSearchEngine().initialize();
});

const top = async (q: string, n: number) =>
  (await getSearchEngine().searchWithMeta(q)).results.slice(0, n).map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`);

describe('MiniSearch fallback ranking', () => {
  // Exactly three verses contain 以马内利 (以赛亚书 7:14, 8:8, 马太福音 1:23); they must be the top tier.
  it.each(['以马内利', '以馬內利'])('%s ranks the verses containing the phrase first', async (q) => {
    const first3 = await top(q, 3);
    expect(first3).toContain('以赛亚书 7:14');
    expect(first3).toContain('马太福音 1:23');
    expect(new Set(first3)).toEqual(new Set(['以赛亚书 7:14', '以赛亚书 8:8', '马太福音 1:23']));
    expect((await top(q, 1))[0]).not.toMatch(/^利未记/);
  });

  it.each(['耶稣哭了', '耶穌哭了'])('%s ranks 约翰福音 11:35 first', async (q) => {
    expect((await top(q, 1))[0]).toBe('约翰福音 11:35');
  });

  it.each(['神爱世人', '神愛世人'])('%s ranks 约翰福音 3:16 first', async (q) => {
    expect((await top(q, 1))[0]).toBe('约翰福音 3:16');
  });

  it.each([
    ['约翰福音 3:16', '约翰福音 3:16'],
    ['約翰福音 3:16', '约翰福音 3:16'],
    ['创世记', '创世记 1:1'],
    ['詩篇 23', '诗篇 23:1'],
    ['罗马书', '罗马书 1:1'],
  ])('reference %s still resolves', async (q, first) => {
    expect((await top(q, 1))[0]).toBe(first);
  });
});
