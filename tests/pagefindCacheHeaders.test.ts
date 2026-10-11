import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

type HeaderRule = { source: string; headers: { key: string; value: string }[] };
const config = createRequire(import.meta.url)('../next.config.js') as { headers: () => Promise<HeaderRule[]> };

describe('/pagefind cache headers', () => {
  it('never marks /pagefind responses immutable (404s for missing hashes would be pinned)', async () => {
    const rules = (await config.headers()).filter((r) => r.source.startsWith('/pagefind'));
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      for (const h of rule.headers) expect(h.value).not.toMatch(/immutable|max-age=31536000/);
    }
  });
});
