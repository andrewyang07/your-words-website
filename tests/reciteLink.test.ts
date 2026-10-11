import { describe, expect, it } from 'vitest';
import {
  buildReciteUrl,
  encodeRecitePassages,
  MAX_RECITE_VERSES,
  parseRecitePassages,
  parseReciteParams,
} from '../lib/reciteLink';

const parse = (query: string) => parseReciteParams(query);

describe('parseReciteParams', () => {
  it('parses a single verse', () => {
    expect(parse('?p=43-3-16').ids).toEqual(['约翰福音-3-16']);
    expect(parse('?p=43-3-16').source).toBe('p');
  });

  it('expands a same-chapter range in order', () => {
    expect(parse('?p=43-3-16~18').ids).toEqual(['约翰福音-3-16', '约翰福音-3-17', '约翰福音-3-18']);
  });

  it('keeps link order instead of canonical order', () => {
    expect(parse('?p=45-8-28,43-3-16').ids).toEqual(['罗马书-8-28', '约翰福音-3-16']);
  });

  it('dedupes while keeping the first position', () => {
    expect(parse('?p=43-3-16,43-3-16~17').ids).toEqual(['约翰福音-3-16', '约翰福音-3-17']);
  });

  it.each(['99-1-1', 'abc', '43-3-18~16', '43-0-1', '43-3-1.5', '43-99-1', '043-3-16', '43-3-16 '])('counts %j as invalid without throwing', (segment) => {
    const result = parse(`?p=43-3-16,${encodeURIComponent(segment)}`);
    expect(result.ids).toEqual(['约翰福音-3-16']);
    expect(result.invalidCount).toBe(1);
  });

  it('counts empty segments as invalid', () => {
    expect(parse('?p=43-3-16,,43-3-17').invalidCount).toBe(1);
    expect(parse('?p=,,').invalidCount).toBe(3);
  });

  it('matches the spec example with two unrecognized references', () => {
    const result = parse('?p=43-3-16,99-1-1,abc&sv=1');
    expect(result.ids).toEqual(['约翰福音-3-16']);
    expect(result.invalidCount).toBe(2);
  });

  it('caps expanded verses at 50 and flags truncation', () => {
    const result = parse('?p=19-119-1~60');
    expect(result.ids).toHaveLength(MAX_RECITE_VERSES);
    expect(result.truncated).toBe(true);
    const many = Array.from({ length: 60 }, (_, index) => `19-119-${index + 1}`).join(',');
    expect(parse(`?p=${many}`).ids).toHaveLength(50);
  });

  it('handles a 5000-character p quickly', () => {
    const raw = Array.from({ length: 600 }, () => '43-3-16').join(',').slice(0, 5000);
    const started = performance.now();
    const result = parse(`?p=${raw}`);
    expect(performance.now() - started).toBeLessThan(100);
    expect(result.truncated).toBe(true);
    expect(result.ids).toEqual(['约翰福音-3-16']);
  });

  it('truncates p to the last complete segment within 2000 chars', () => {
    const raw = `${'43-3-16,'.repeat(260)}43-3-17`;
    const result = parseRecitePassages(raw);
    expect(result.truncated).toBe(true);
    expect(result.ids).toEqual(['约翰福音-3-16']);
  });

  it('normalizes titles', () => {
    expect(parse(`?p=43-3-16&t=${encodeURIComponent('一'.repeat(45))}`).title).toBe('一'.repeat(40));
    expect(parse(`?p=43-3-16&t=${encodeURIComponent('<script>alert(1)</script>')}`).title).toBe('<script>alert(1)</script>');
    expect(parse(`?p=43-3-16&t=${encodeURIComponent('   \t ')}`).title).toBeNull();
    expect(parse(`?p=43-3-16&t=${encodeURIComponent(' 诗篇\n\n 23 \u0007')}`).title).toBe('诗篇 23');
    expect(parse(`?p=43-3-16&t=${encodeURIComponent('😀'.repeat(41))}`).title).toBe('😀'.repeat(40));
  });

  it('falls back to legacy s when p is absent', () => {
    const result = parse('?s=1-3-16,50-4-6');
    expect(result.source).toBe('s');
    expect(result.ids).toEqual(['创世记-3-16', '腓立比书-4-6']);
  });

  it('prefers p over s', () => {
    const result = parse('?p=43-3-16&s=1-3-16');
    expect(result.source).toBe('p');
    expect(result.ids).toEqual(['约翰福音-3-16']);
  });

  it('returns no source for v-only or empty queries', () => {
    expect(parse('?v=43-3-16').source).toBeNull();
    expect(parse('').source).toBeNull();
  });

  it('flags a newer schema but still parses', () => {
    const result = parse('?p=43-3-16&sv=2');
    expect(result.newerSchema).toBe(true);
    expect(result.ids).toEqual(['约翰福音-3-16']);
    expect(parse('?p=43-3-16&sv=1').newerSchema).toBe(false);
    expect(parse('?p=43-3-16').newerSchema).toBe(false);
  });
});

describe('encodeRecitePassages / buildReciteUrl', () => {
  it('merges adjacent same-chapter verses and keeps order', () => {
    expect(encodeRecitePassages(['约翰福音-3-16', '约翰福音-3-17', '约翰福音-3-18', '罗马书-8-28'])).toBe('43-3-16~18,45-8-28');
    expect(encodeRecitePassages(['罗马书-8-28', '约翰福音-3-16'])).toBe('45-8-28,43-3-16');
    expect(encodeRecitePassages(['约翰福音-3-18', '约翰福音-3-17'])).toBe('43-3-18,43-3-17');
  });

  it('round-trips through the parser', () => {
    const ids = ['罗马书-8-28', '约翰福音-3-16', '约翰福音-3-17', '约翰福音-3-18', '诗篇-23-1'];
    expect(parse(`?p=${encodeRecitePassages(ids)}`).ids).toEqual(ids);
  });

  it('builds a URL ending in sv=1 with an encoded title', () => {
    const url = buildReciteUrl({ origin: 'https://www.yourwords.me', ids: ['诗篇-23-1', '诗篇-23-2'], title: '诗篇23 & 我' });
    expect(url).toBe(`https://www.yourwords.me/memorize?p=19-23-1~2&t=${encodeURIComponent('诗篇23 & 我')}&sv=1`);
    expect(url.endsWith('&sv=1')).toBe(true);
    expect(parse(new URL(url).search).title).toBe('诗篇23 & 我');
    expect(buildReciteUrl({ origin: 'https://x.test', ids: ['诗篇-23-1'] })).toBe('https://x.test/memorize?p=19-23-1&sv=1');
  });
});
