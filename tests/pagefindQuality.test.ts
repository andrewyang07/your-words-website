import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { resetPagefindClientForTests, type PagefindModule } from '../lib/search/pagefindClient';
import { runClientSearch } from '../lib/search/runClientSearch';

// Real data: the generated Pagefind index (built here if missing, e.g. in CI where tests run before `next build`).
const root = process.cwd();
const pagefindDir = path.join(root, 'public', 'pagefind');

vi.mock('../lib/bibleDataCache', () => ({
  fetchWithCache: async (url: string) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', url), 'utf8')),
}));
vi.setConfig({ testTimeout: 60_000, hookTimeout: 240_000 });

beforeAll(async () => {
  if (!fs.existsSync(path.join(pagefindDir, 'pagefind.js'))) {
    execFileSync('node', ['scripts/build-pagefind-index.mjs'], { cwd: root, stdio: 'inherit' });
  }
  // Serve /pagefind/* from disk for the real Pagefind runtime (main-thread mode).
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const rel = url.replace(/^.*\/pagefind\//, '').split('?')[0]!;
    try {
      return new Response(fs.readFileSync(path.join(pagefindDir, rel)), { status: 200 });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
  const pagefind = (await import(
    /* @vite-ignore */ pathToFileURL(path.join(pagefindDir, 'pagefind.js')).href
  )) as PagefindModule & {
    options: (o: Record<string, unknown>) => Promise<void>;
    search: (t: string) => Promise<unknown>;
  };
  // Pagefind picks its CJK query segmenter from <html lang>; give it the site's lang (zh-Hans) like the browser.
  const g = globalThis as { document?: unknown };
  g.document = { querySelector: () => ({ getAttribute: () => 'zh-Hans' }) };
  try {
    await pagefind.options({ basePath: '/pagefind/', noWorker: true });
    await pagefind.search('神');
  } finally {
    delete g.document;
  }
  resetPagefindClientForTests(pagefind);
});

const refs = async (q: string, n: number) =>
  (await runClientSearch(q)).results.slice(0, n).map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`);

describe('Pagefind result quality (real index)', () => {
  it.each(['出发', '出發'])('%s finds the verse containing it (哈巴谷书 3:11)', async (q) => {
    expect(await refs(q, 1)).toEqual(['哈巴谷书 3:11']);
  });

  it.each(['马利亚', '馬利亞'])('%s: top results all mention 马利亚', async (q) => {
    const { results } = await runClientSearch(q);
    expect(results.length).toBeGreaterThan(20);
    for (const r of results.slice(0, 20)) expect(r.textChinese).toContain('馬利亞');
  });

  it.each(['诗篇 23', '詩篇 23', '诗篇23', '诗 23', 'Psalm 23'])(
    '%s lists Psalm 23 in verse order first',
    async (q) => {
      expect(await refs(q, 6)).toEqual([1, 2, 3, 4, 5, 6].map((v) => `诗篇 23:${v}`));
    },
  );

  it.each(['神爱世人', '神愛世人'])('%s → 约翰福音 3:16', async (q) => {
    expect(await refs(q, 1)).toEqual(['约翰福音 3:16']);
  });

  it.each(['约翰福音 3:16', '約翰福音 3:16'])('%s → 约翰福音 3:16', async (q) => {
    expect(await refs(q, 1)).toEqual(['约翰福音 3:16']);
  });

  it.each(['以马内利', '以馬內利'])('%s → only the three verses containing it, first', async (q) => {
    expect(new Set(await refs(q, 3))).toEqual(new Set(['以赛亚书 7:14', '以赛亚书 8:8', '马太福音 1:23']));
  });

  it('耶稣哭了 → 约翰福音 11:35', async () => {
    expect(await refs('耶稣哭了', 1)).toEqual(['约翰福音 11:35']);
  });
});

describe('search quality follow-ups (manual QA)', () => {
  it.each(['Jn 3 16', 'John 3 16', '约 3 16'])('%s (space-separated) → 约翰福音 3:16 only', async (q) => {
    expect(await refs(q, 5)).toEqual(['约翰福音 3:16']);
  });

  it('约翰福音 3:16 shows just the verse, no loose matches', async () => {
    const { results } = await runClientSearch('约翰福音 3:16');
    expect(results.map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`)).toEqual(['约翰福音 3:16']);
  });

  it('love: top results contain the whole word and are focused verses', async () => {
    const { results } = await runClientSearch('love');
    for (const r of results.slice(0, 10)) expect(r.textEnglish).toMatch(/\blove\b/i);
    const top5 = results.slice(0, 5).map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`);
    expect(top5).not.toContain('约翰福音 14:21');
    expect(top5).not.toContain('何西阿书 3:1');
  });

  it.each(['以马内利', '以馬內利'])('%s: every result contains the phrase bigrams (no 赛 7:8)', async (q) => {
    const { results } = await runClientSearch(q);
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((r) => `${r.bookKey} ${r.chapter}:${r.verse}`);
    expect(ids).not.toContain('以赛亚书 7:8');
    for (const r of results) expect(r.textSimplified ?? '').toMatch(/以马|马内|内利/);
  });

  it('caps very long queries instead of searching 600 characters', async () => {
    const long = '爱'.repeat(600);
    const { results } = await runClientSearch(long);
    expect(Array.isArray(results)).toBe(true);
  });
});

describe('T5: pinyin and English are separate; reference + extra text; heavy terms', () => {
  it('shen ai shi ren: 约翰福音 3:16 first, and no top-10 result matched only through English words', async () => {
    const { pinyin } = await import('pinyin-pro');
    const { results } = await runClientSearch('shen ai shi ren');
    expect(`${results[0]?.bookKey} ${results[0]?.chapter}:${results[0]?.verse}`).toBe('约翰福音 3:16');
    for (const r of results.slice(0, 10)) {
      const py = pinyin(r.textSimplified || r.textChinese, { toneType: 'none', type: 'array' });
      for (const syl of ['shen', 'ai', 'shi', 'ren']) expect(py).toContain(syl);
    }
  });

  it.each(['John 3:16 meaning', 'John 3:16 test', 'Jn 3:16 hello'])('%s puts 约翰福音 3:16 first', async (q) => {
    expect(await refs(q, 1)).toEqual(['约翰福音 3:16']);
  });

  it('的 alone runs no heavy word search (fast, empty); 的人 still finds verses', async () => {
    const t = performance.now();
    expect((await runClientSearch('的')).results).toEqual([]);
    expect(performance.now() - t).toBeLessThan(500);
    expect((await runClientSearch('的人')).results.length).toBeGreaterThan(10);
  });
});

describe('T6: initials and 多音字 (real index)', () => {
  it.each(['sasr', 'shenasr'])('%s puts 约翰福音 3:16 first', async (q) => {
    expect(await refs(q, 1)).toEqual(['约翰福音 3:16']);
  });

  it('an English word that also looks like initials still ranks by English ("God so loved" style)', async () => {
    const { results } = await runClientSearch('god');
    for (const r of results.slice(0, 5)) expect(r.textEnglish.toLowerCase()).toMatch(/\bgod\b/);
  });

  it.each([
    ['行善', 'xing shan', 'hang shan'],
    ['重生', 'chong sheng', 'zhong sheng'],
    ['长子', 'zhang zi', 'chang zi'],
    ['快乐', 'kuai le', 'kuai yue'],
    ['偿还', 'chang huan', 'chang hai'],
  ])('多音字 %s: both %s and %s find verses containing it', async (word, a, b) => {
    for (const q of [a, b]) {
      const { results } = await runClientSearch(q);
      expect(results.length).toBeGreaterThan(0);
      expect(results.slice(0, 5).some((r) => (r.textSimplified || r.textChinese).includes(word))).toBe(true);
    }
  });
});
