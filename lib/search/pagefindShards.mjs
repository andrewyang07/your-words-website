// The Pagefind index is built as several bundles so each build step stays well under the Vercel build machine's
// memory (one 31k-verse bundle peaked at ~6.7 GB). Verses are dealt round-robin, so every bundle has the same term
// statistics. The first bundle is /pagefind/ itself; the others live under /pagefind/shard-N/, are merged into it
// at load time (pagefind.mergeIndex) and searched per bundle via the record filter `shard` (shardedSearch in
// pagefindClient.ts).
// Shared by scripts/build-pagefind-index.mjs and lib/search/pagefindClient.ts.

export const PAGEFIND_SHARD_COUNT = 4;

/** Base paths of the bundles merged into the primary /pagefind/ bundle. */
export const PAGEFIND_EXTRA_SHARDS = Array.from(
  { length: PAGEFIND_SHARD_COUNT - 1 },
  (_, i) => `/pagefind/shard-${i + 1}/`,
);
