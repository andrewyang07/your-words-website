import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { pagefindUrl } from '../lib/search/pagefindClient';

type HeaderRule = { source: string; headers: { key: string; value: string }[] };
type Config = {
  env: { NEXT_PUBLIC_PAGEFIND_VERSION: string };
  headers: () => Promise<HeaderRule[]>;
  rewrites: () => Promise<{ beforeFiles: { source: string; destination: string }[] }>;
};
const config = createRequire(import.meta.url)('../next.config.js') as Config;
const version = config.env.NEXT_PUBLIC_PAGEFIND_VERSION;

describe('Pagefind caching', () => {
  it('loads Pagefind from the versioned path', () => {
    expect(pagefindUrl('abc123')).toBe('/pagefind/abc123/pagefind.js');
    expect(pagefindUrl('')).toBe('/pagefind/pagefind.js');
  });

  it('scopes every immutable /pagefind rule to the current version', async () => {
    const immutable = (await config.headers()).filter(
      (r) => r.source.startsWith('/pagefind') && r.headers.some((h) => h.value.includes('immutable')),
    );
    expect(immutable.length).toBeGreaterThan(0);
    for (const rule of immutable) expect(rule.source.startsWith(`/pagefind/${version}/`)).toBe(true);
  });

  it('rewrites only the current version onto the real files', async () => {
    const { beforeFiles } = await config.rewrites();
    expect(beforeFiles).toContainEqual({
      source: `/pagefind/${version}/:path*`,
      destination: '/pagefind/:path*',
    });
  });
});
