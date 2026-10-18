import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { vi } from 'vitest';
import { resetPagefindClientForTests, type PagefindModule } from '../../lib/search/pagefindClient';
import { PINYIN_BUNDLES } from '../../lib/search/pagefindShards.mjs';

type RealPagefind = PagefindModule & {
  options: (o: Record<string, unknown>) => Promise<void>;
  search: (t: string) => Promise<unknown>;
};

export const pagefindDir = path.join(process.cwd(), 'public', 'pagefind');

/**
 * Load the generated main + pinyin Pagefind bundles (public/pagefind, public/pagefind/pinyin-*) into the client the
 * way the browser does: fetch is served from disk, each bundle's pagefind.js is its own module instance, and the
 * site's <html lang> (zh-Hans) is present while the instances are created (Pagefind picks its CJK query segmenter
 * from it; without it CJK queries split per character: 不要忧虑明天 → 647 loose hits instead of 1).
 */
export async function loadRealPagefind(): Promise<void> {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const rel = url.replace(/^.*?\/pagefind\//, '').split('?')[0]!;
    try {
      return new Response(fs.readFileSync(path.join(pagefindDir, rel)), { status: 200 });
    } catch {
      return new Response('not found', { status: 404 });
    }
  });
  const load = async (basePath: string) =>
    (await import(
      /* @vite-ignore */ pathToFileURL(path.join(pagefindDir, basePath.replace(/^\/pagefind\//, ''), 'pagefind.js'))
        .href
    )) as RealPagefind;
  const main = await load('/pagefind/');
  const pinyin = await Promise.all(PINYIN_BUNDLES.map(load));
  const g = globalThis as { document?: unknown };
  g.document = { querySelector: () => ({ getAttribute: () => 'zh-Hans' }) };
  try {
    await main.options({ basePath: '/pagefind/', noWorker: true });
    await main.search('神');
    for (const [i, part] of pinyin.entries()) {
      await part.options({ basePath: PINYIN_BUNDLES[i], noWorker: true });
      await part.search('pyshen');
    }
  } finally {
    delete g.document;
  }
  resetPagefindClientForTests(main, pinyin);
}
