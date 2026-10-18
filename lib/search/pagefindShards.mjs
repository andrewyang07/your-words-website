// The search index is split by content (scripts/build-pagefind-index.mjs): the main bundle /pagefind/ holds text,
// refs, CJK bigrams and chapter tokens and answers every query. The pinyin / 多音字 / initials tokens live in their
// own bundles, /pagefind/pinyin-<k>/, loaded only for Latin queries that could be pinyin. One pinyin bundle peaked
// at 5.3 GB while building, so they are split PINYIN_SHARD_COUNT ways (verse n → bundle n % N), one process each.
// Shared by scripts/build-pagefind-index.mjs and lib/search/pagefindClient.ts.

export const PINYIN_SHARD_COUNT = 2;

/** Base paths of the pinyin parts; each is loaded as its own Pagefind instance (lib/search/pagefindClient.ts). */
export const PINYIN_BUNDLES = Array.from({ length: PINYIN_SHARD_COUNT }, (_, i) => `/pagefind/pinyin-${i}/`);
