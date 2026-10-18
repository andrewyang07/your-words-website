import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinyin } from 'pinyin-pro';
import { PAGEFIND_SHARD_COUNT } from '../lib/search/pagefindShards.mjs';
import { cleanSyllable, pinyinIndexTokens } from '../lib/search/pinyinTokens.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '.pagefind-source');
const outputDir = path.join(root, 'public', 'pagefind');

const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));

// CJK bigrams encoded as ASCII words (以马 → "q<base36><base36>"). Pagefind's zh segmenter only indexes dictionary
// words and re-segments any CJK we add, so substrings like 出发 / 以马内利 were otherwise unfindable.
// Keep in sync with toCjkBigramQuery in lib/search/pagefindClient.ts.
const cjkBigrams = (value) => {
  const out = new Set();
  for (const run of String(value ?? '').match(/[\u3400-\u9fff]+/g) ?? []) {
    for (let i = 0; i < run.length - 1; i += 1) {
      out.add(`q${run.codePointAt(i).toString(36)}${run.codePointAt(i + 1).toString(36)}`);
    }
  }
  return [...out].join(' ');
};

// One ASCII token per chapter ("ch19x23" = 诗篇 23) so chapter-only references fetch exactly that chapter.
// Keep in sync with chapterToken in lib/search/pagefindClient.ts.
const chapterToken = (order, chapter) => `ch${order}x${chapter}`;

const slug = (value) => encodeURIComponent(value).replaceAll('%', '').slice(0, 80);

const stripTone = (value) =>
  value
    .replace(/ü/g, 'v')
    .normalize('NFD')
    .replace(/u\u0308/g, 'v')
    .replace(/[\u0300-\u036f]/g, '');

// Per character: in-context reading first, then the other readings of a 多音字 (行 → xing, hang, heng). T6.
const readingsOf = (value) =>
  pinyin(value || '', { type: 'all', toneType: 'none' })
    .filter((c) => c.pinyin)
    .map((c) => [c.pinyin, ...(c.polyphonic ?? []).map(stripTone)].map(cleanSyllable).filter(Boolean));

// Pinyin goes into its own prefixed token namespace (lib/search/pinyinTokens.mjs), apart from English words.
const toPinyinTokens = (...values) => values.flatMap((value) => pinyinIndexTokens(readingsOf(value))).join(' ');

/** Synthetic search tokens follow this word in each record; post-processing cuts them out of the stored text. */
const TOKEN_SENTINEL = 'zzpagefindtokenszz';

/** Stream one shard's verses into a Pagefind index (Node API, one record at a time). */
async function addBooks(index, books, { simplified, traditional, english }, shard = 0, shardCount = 1) {
  let count = 0;
  let ordinal = 0;
  for (const book of books) {
    const simplifiedBook = simplified[book.key] || {};
    const traditionalBook = traditional[book.key] || {};
    // books.json names that differ from WEB_bible.json keys (keep in sync with lib/search/webBookName.ts).
    const webName = { Psalms: 'Psalm', 'Song of Solomon': 'Song Of Solomon' }[book.nameEnglish] ?? book.nameEnglish;
    const englishBook = english[webName] || {};

    for (const chapter of Object.keys(simplifiedBook).sort((a, b) => Number(a) - Number(b))) {
      const verses = simplifiedBook[chapter] || {};
      for (const verse of Object.keys(verses).sort((a, b) => Number(a) - Number(b))) {
        ordinal += 1;
        if ((ordinal - 1) % shardCount !== shard) continue;
        count += 1;
        const id = `${book.key}-${chapter}-${verse}`;
        const title = `${book.nameTraditional} ${chapter}:${verse}`;
        const textSimplified = simplifiedBook?.[chapter]?.[verse] || '';
        const textTraditional = traditionalBook?.[chapter]?.[verse] || textSimplified;
        const textEnglish = englishBook?.[chapter]?.[verse] || '';
        const content = [
          title,
          `${book.nameSimplified}${chapter}:${verse} ${book.nameTraditional}${chapter}:${verse} ${book.nameEnglish} ${chapter}:${verse}`,
          `${book.nameSimplified} ${book.nameTraditional} ${book.nameEnglish}`,
          textSimplified,
          textTraditional,
          textEnglish,
          // Index-only tokens (stripped from the stored fragment text below): pinyin, CJK bigrams, chapter token.
          TOKEN_SENTINEL,
          toPinyinTokens(book.nameSimplified, textSimplified),
          cjkBigrams(textSimplified),
          chapterToken(book.order, chapter),
        ].join('\n');
        const { errors: addErrors } = await index.addCustomRecord({
          url: `/verse/${slug(id)}`,
          content,
          language: 'zh-hant',
          // Lets the client search one bundle at a time (lib/search/pagefindClient.ts shardedSearch).
          filters: { shard: [String(shard)] },
          meta: {
            title,
            id,
            bookKey: book.key,
            bookTraditional: book.nameTraditional,
            bookEnglish: book.nameEnglish,
            chapter,
            verse,
            textChinese: textTraditional,
            textSimplified,
            textEnglish,
          },
        });
        if (addErrors.length) throw new Error(`pagefind addCustomRecord ${id}: ${addErrors.join('; ')}`);
      }
    }
  }

  return count;
}

async function main() {
  await rm(sourceDir, { recursive: true, force: true }); // left over from the old HTML-file build
  await rm(outputDir, { recursive: true, force: true });

  const [{ books }, simplified, traditional, english] = await Promise.all([
    readJson('public/data/books.json'),
    readJson('public/data/CUV_bible.json'),
    readJson('public/data/CUVT_bible.json'),
    readJson('public/data/WEB_bible.json'),
  ]);

  // Interleave verses across shards (verse n goes to shard n % count) so every shard has nearly the same
  // term statistics; Pagefind scores each bundle on its own, and contiguous book ranges skewed merged ranking.
  const shards = Array.from({ length: PAGEFIND_SHARD_COUNT }, (_, i) => i);

  const { createIndex, close } = await import('pagefind');
  let count = 0;
  let stripped = 0;
  for (let shard = 0; shard < shards.length; shard += 1) {
    // One Pagefind service per shard, closed before the next one starts, so peak memory is one shard's worth.
    const { index, errors } = await createIndex({ forceLanguage: 'zh-hant' });
    if (!index) throw new Error(`pagefind createIndex failed: ${errors.join('; ')}`);
    count += await addBooks(index, books, { simplified, traditional, english }, shard, shards.length);
    const out = shard === 0 ? outputDir : path.join(outputDir, `shard-${shard}`);
    const { errors: writeErrors } = await index.writeFiles({ outputPath: out });
    if (writeErrors.length) throw new Error(`pagefind writeFiles failed: ${writeErrors.join('; ')}`);
    await close();
    stripped += await stripTokensFromFragments(path.join(out, 'fragment'));
  }
  console.log(
    `Generated Pagefind index for ${count} verses in ${shards.length} bundles (tokens cut from ${stripped} fragments).`,
  );
}

/**
 * Fragments store the record text for excerpts; the app never shows it (results use meta), so the index-only tokens
 * after TOKEN_SENTINEL are cut from it. Word locations may then point past the end of the text, which only affects
 * Pagefind excerpts (not used). File names stay as written (the index refers to them by name).
 */
async function stripTokensFromFragments(dir) {
  const { readdir } = await import('node:fs/promises');
  const { gunzipSync, gzipSync } = await import('node:zlib');
  const header = 'pagefind_dcd';
  let n = 0;
  for (const name of await readdir(dir)) {
    const file = path.join(dir, name);
    const raw = gunzipSync(await readFile(file)).toString('utf8');
    if (!raw.startsWith(header)) continue;
    const data = JSON.parse(raw.slice(header.length));
    const cut = data.content.indexOf(TOKEN_SENTINEL);
    if (cut === -1) continue;
    data.content = data.content.slice(0, cut).trimEnd();
    await writeFile(file, gzipSync(header + JSON.stringify(data), { level: 9 }));
    n += 1;
  }
  return n;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
