import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { pinyin } from 'pinyin-pro';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, '.pagefind-source');
const outputDir = path.join(root, 'public', 'pagefind');

const readJson = async (relativePath) => JSON.parse(
  await readFile(path.join(root, relativePath), 'utf8')
);

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const slug = (value) => encodeURIComponent(value).replaceAll('%', '').slice(0, 80);

const toPinyinAliases = (value) => {
  const spaced = pinyin(value || '', { toneType: 'none' }).toLowerCase();
  const joined = spaced.replaceAll(' ', '');
  return `${spaced} ${joined}`.trim();
};

async function main() {
  await rm(sourceDir, { recursive: true, force: true });
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(path.join(sourceDir, 'verses'), { recursive: true });

  const [{ books }, simplified, traditional, english] = await Promise.all([
    readJson('public/data/books.json'),
    readJson('public/data/CUV_bible.json'),
    readJson('public/data/CUVT_bible.json'),
    readJson('public/data/WEB_bible.json'),
  ]);

  let count = 0;
  for (const book of books) {
    const simplifiedBook = simplified[book.key] || {};
    const traditionalBook = traditional[book.key] || {};
    const englishBook = english[book.nameEnglish] || {};

    for (const chapter of Object.keys(simplifiedBook).sort((a, b) => Number(a) - Number(b))) {
      const verses = simplifiedBook[chapter] || {};
      for (const verse of Object.keys(verses).sort((a, b) => Number(a) - Number(b))) {
        count += 1;
        const id = `${book.key}-${chapter}-${verse}`;
        const title = `${book.nameTraditional} ${chapter}:${verse}`;
        const refSimplified = `${book.nameSimplified}${chapter}:${verse}`;
        const refTraditional = `${book.nameTraditional}${chapter}:${verse}`;
        const refEnglish = `${book.nameEnglish} ${chapter}:${verse}`;
        const textSimplified = simplifiedBook?.[chapter]?.[verse] || '';
        const textTraditional = traditionalBook?.[chapter]?.[verse] || textSimplified;
        const textEnglish = englishBook?.[chapter]?.[verse] || '';
        const pinyinAliases = [
          toPinyinAliases(book.nameSimplified),
          toPinyinAliases(book.nameTraditional),
          toPinyinAliases(textSimplified),
          toPinyinAliases(textTraditional),
        ].join(' ');
        const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <main data-pagefind-body>
    <article>
      <h1 data-pagefind-meta="title">${escapeHtml(title)}</h1>
      <p data-pagefind-meta="id">${escapeHtml(id)}</p>
      <p data-pagefind-meta="bookKey">${escapeHtml(book.key)}</p>
      <p data-pagefind-meta="bookTraditional">${escapeHtml(book.nameTraditional)}</p>
      <p data-pagefind-meta="bookEnglish">${escapeHtml(book.nameEnglish)}</p>
      <p data-pagefind-meta="chapter">${escapeHtml(chapter)}</p>
      <p data-pagefind-meta="verse">${escapeHtml(verse)}</p>
      <p data-pagefind-meta="textChinese">${escapeHtml(textTraditional)}</p>
      <p data-pagefind-meta="textEnglish">${escapeHtml(textEnglish)}</p>
      <p>${escapeHtml(refSimplified)} ${escapeHtml(refTraditional)} ${escapeHtml(refEnglish)}</p>
      <p>${escapeHtml(book.nameSimplified)} ${escapeHtml(book.nameTraditional)} ${escapeHtml(book.nameEnglish)}</p>
      <p>${escapeHtml(textSimplified)}</p>
      <p>${escapeHtml(textTraditional)}</p>
      <p>${escapeHtml(textEnglish)}</p>
      <p>${escapeHtml(pinyinAliases)}</p>
    </article>
  </main>
</body>
</html>`;
        const filename = `${String(count).padStart(5, '0')}-${slug(id)}.html`;
        await writeFile(path.join(sourceDir, 'verses', filename), html);
      }
    }
  }

  const { stdout, stderr } = await execFileAsync(
    path.join(root, 'node_modules', '.bin', 'pagefind'),
    ['--site', sourceDir, '--output-path', outputDir, '--glob', '**/*.html'],
    { cwd: root, maxBuffer: 1024 * 1024 * 20 }
  );

  if (stdout.trim()) console.log(stdout.trim());
  if (stderr.trim()) console.error(stderr.trim());
  console.log(`Generated Pagefind index for ${count} verses.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
