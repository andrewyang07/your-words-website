/**
 * Fuzzy pinyin search with 模糊音 normalization
 *
 * Instead of generating exponential fuzzy variants, we normalize BOTH
 * the index and the query to a canonical form that merges commonly
 * confused sounds. This guarantees consistent matching in O(1).
 *
 * Covered 模糊音 pairs:
 *   Initials:  zh↔z, ch↔c, sh↔s, r↔l, n↔l
 *   Finals:    ang↔an, eng↔en, ing↔in (also covers iang↔ian, uang↔uan)
 */

import { pinyin } from 'pinyin-pro';

/**
 * Normalize pinyin to a canonical fuzzy form.
 * Applied identically to both the stored index and the search query,
 * so even though the output isn't "real" pinyin, matching is consistent.
 */
function normalizeFuzzy(s: string): string {
  return s
    // 2-char retroflex initials → alveolar (safe globally: zh/ch/sh are unambiguously initials)
    .replace(/zh/g, 'z')
    .replace(/ch/g, 'c')
    .replace(/sh/g, 's')
    // Nasal finals: back nasal → front nasal (longer patterns first)
    .replace(/ang/g, 'an')
    .replace(/eng/g, 'en')
    .replace(/ing/g, 'in')
    // Single-char initials (r→l, n→l)
    .replace(/r/g, 'l')
    .replace(/n/g, 'l');
}

/**
 * Strip whitespace and lowercase.
 */
function normalizePinyinInput(input: string): string {
  return input.replace(/\s+/g, '').toLowerCase();
}

export interface PinyinIndex {
  /** verseId → concatenated toneless pinyin (e.g. "pingan") */
  exact: Map<string, string>;
  /** verseId → fuzzy-normalized pinyin (e.g. "pilal") */
  fuzzy: Map<string, string>;
}

/**
 * Build dual pinyin indices (exact + fuzzy) for all verses.
 */
export function buildPinyinIndex(
  chinese: Record<string, Record<string, Record<string, string>>>
): PinyinIndex {
  const exact = new Map<string, string>();
  const fuzzy = new Map<string, string>();

  for (const [book, chapters] of Object.entries(chinese)) {
    for (const [chapter, verses] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verses)) {
        const verseId = `${book}-${chapter}-${verse}`;
        const py = pinyin(text, { toneType: 'none', type: 'array' })
          .join('')
          .toLowerCase();
        exact.set(verseId, py);
        fuzzy.set(verseId, normalizeFuzzy(py));
      }
    }
  }

  return { exact, fuzzy };
}

/**
 * Build pinyin index asynchronously in chunks to avoid blocking the main thread.
 * Uses requestIdleCallback (with setTimeout fallback) to yield between chunks.
 */
export function buildPinyinIndexAsync(
  chinese: Record<string, Record<string, Record<string, string>>>,
  onComplete: (index: PinyinIndex) => void,
  chunkSize = 500
): void {
  const exact = new Map<string, string>();
  const fuzzy = new Map<string, string>();

  // Flatten all verse entries into an array for chunked processing
  const entries: Array<[string, string]> = [];
  for (const [book, chapters] of Object.entries(chinese)) {
    for (const [chapter, verses] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verses)) {
        entries.push([`${book}-${chapter}-${verse}`, text]);
      }
    }
  }

  let offset = 0;

  const scheduleNext =
    typeof requestIdleCallback !== 'undefined'
      ? (fn: () => void) => requestIdleCallback(() => fn())
      : (fn: () => void) => setTimeout(fn, 0);

  function processChunk() {
    const end = Math.min(offset + chunkSize, entries.length);
    for (let i = offset; i < end; i++) {
      const [verseId, text] = entries[i];
      const py = pinyin(text, { toneType: 'none', type: 'array' })
        .join('')
        .toLowerCase();
      exact.set(verseId, py);
      fuzzy.set(verseId, normalizeFuzzy(py));
    }
    offset = end;

    if (offset < entries.length) {
      scheduleNext(processChunk);
    } else {
      onComplete({ exact, fuzzy });
    }
  }

  scheduleNext(processChunk);
}

/**
 * Search pinyin index with exact + fuzzy matching.
 * Returns Map<verseId, score>.
 */
export function searchPinyin(
  query: string,
  index: PinyinIndex
): Map<string, number> {
  const scores = new Map<string, number>();
  const stripped = normalizePinyinInput(query);
  if (!stripped) return scores;

  const fuzzyQuery = normalizeFuzzy(stripped);

  // Exact pinyin substring match (higher score)
  for (const [verseId, py] of index.exact) {
    const idx = py.indexOf(stripped);
    if (idx !== -1) {
      let score = stripped.length * 3;
      if (idx === 0) score += 3;
      scores.set(verseId, score);
    }
  }

  // Fuzzy pinyin substring match (skip verses already matched exactly)
  for (const [verseId, py] of index.fuzzy) {
    if (scores.has(verseId)) continue;
    const idx = py.indexOf(fuzzyQuery);
    if (idx !== -1) {
      let score = fuzzyQuery.length * 2;
      if (idx === 0) score += 2;
      scores.set(verseId, score);
    }
  }

  return scores;
}
