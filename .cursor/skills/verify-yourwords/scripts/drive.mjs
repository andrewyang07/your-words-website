// Headless user-path flows for yourwords.me. Run via drive.sh (sets NODE_PATH, VERIFY_BASE, VERIFY_EVIDENCE).
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const require = createRequire(path.join(process.env.NODE_PATH ?? '', 'noop.js'));
const { chromium } = require('playwright-core');
const BASE = process.env.VERIFY_BASE ?? 'http://localhost:3460';
const OUT = path.join(process.env.VERIFY_EVIDENCE ?? '.verify/evidence/latest', 'browser');
const REPO = process.env.REPO_ROOT ?? process.cwd();
const HAS_SHARE_LINK = existsSync(path.join(REPO, 'lib/reciteLink.ts'));
mkdirSync(OUT, { recursive: true });

const results = [];
let shot = 0;
let lastPage = null; // screenshot target when a flow fails
async function snap(page, name) {
  const file = path.join(OUT, `${String(++shot).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}
function pngSize(buf) {
  return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ? `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`
    : 'not-png';
}

/** Fresh context = fresh localStorage. Simplified Chinese + guide dismissed, like a returning user. */
async function newPage(browser, { simplified = true } = {}) {
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    acceptDownloads: true,
    locale: 'zh-CN',
  });
  if (simplified) {
    await context.addInitScript(() => {
      if (!localStorage.getItem('your-words-app')) {
        localStorage.setItem('your-words-app', JSON.stringify({ state: { language: 'simplified' }, version: 0 }));
      }
    });
  }
  const page = await context.newPage();
  lastPage = page;
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return { context, page, errors };
}
async function dismissGuide(page) {
  // The first-visit guide (MemorizeGuide) opens asynchronously after mount; wait briefly for it.
  const skip = page.getByRole('button', { name: /跳过引导|跳過引導/ });
  try {
    await skip.waitFor({ state: 'visible', timeout: 3000 });
    await skip.click();
  } catch {
    /* no guide this time */
  }
}
async function skipWholeRound(page) {
  await page.getByRole('heading', { name: '先读一遍，不急着记' }).waitFor();
  await dismissGuide(page);
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: '跳过', exact: true }).first().click();
    await dismissGuide(page);
  }
  await page.getByRole('button', { name: '跳过本轮' }).click();
  await page.getByRole('heading', { name: '本轮结束' }).waitFor();
}

const flows = {
  async home(browser) {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${BASE}/`);
    await page.locator('main').first().waitFor();
    await snap(page, 'home');
    await context.close();
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    return 'home renders without page errors';
  },

  async favorites(browser) {
    const { context, page } = await newPage(browser);
    await page.goto(`${BASE}/search?q=${encodeURIComponent('神爱世人')}`);
    const add = page.getByRole('button', { name: '加入我的收藏' }).first();
    await add.waitFor({ timeout: 20000 });
    await add.click();
    await page.getByRole('button', { name: '取消我的收藏' }).first().waitFor();
    await snap(page, 'search-favorited');
    const stored = JSON.parse((await page.evaluate(() => localStorage.getItem('favorites-storage'))) ?? '{}');
    const [id] = stored?.state?.favorites ?? [];
    if (!id) throw new Error('favorites-storage empty after click');
    const [book, chapter, verse] = [id.split('-').slice(0, -2).join('-'), ...id.split('-').slice(-2)];
    await page.goto(`${BASE}/memorize`);
    await dismissGuide(page);
    await page.getByText(`${book} ${chapter}:${verse}`).first().waitFor();
    await snap(page, 'memorize-favorites');
    await context.close();
    return 'favorited via search UI; persisted in favorites-storage; listed on /memorize';
  },

  async memorizeDirect(browser) {
    const { context, page } = await newPage(browser);
    await page.goto(`${BASE}/memorize?v=43-3-16`);
    await skipWholeRound(page);
    await snap(page, 'v-completed');
    await context.close();
    return '?v=43-3-16 starts stage 0 directly and reaches 本轮结束';
  },

  async reciteLink(browser) {
    if (!HAS_SHARE_LINK) return 'SKIP';
    const { context, page, errors } = await newPage(browser);
    const before = await (async () => {
      await page.goto(`${BASE}/`);
      return page.evaluate(() => Object.keys(localStorage).sort());
    })();
    await page.goto(`${BASE}/memorize?p=19-23-1~3&t=${encodeURIComponent('诗篇23')}&sv=1`);
    await dismissGuide(page);
    await page.getByRole('heading', { name: '诗篇23' }).waitFor();
    await page.getByText('共 3 节').waitFor();
    await dismissGuide(page);
    const items = await page.getByRole('listitem').allTextContents();
    if (!items[0]?.includes('诗篇 23:1') || !items[2]?.includes('诗篇 23:3')) throw new Error(`bad order: ${items}`);
    await snap(page, 'p-list');
    await page.getByRole('listitem').nth(1).getByRole('button').click();
    await skipWholeRound(page);
    if (!(await page.getByRole('button', { name: '下一节' }).isVisible())) throw new Error('下一节 missing');
    await snap(page, 'p-completed');

    // Completion card: real click → download (headless has no file share).
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '生成卡片' }).click(),
    ]);
    const cardPath = path.join(OUT, download.suggestedFilename());
    await download.saveAs(cardPath);
    const size = pngSize(readFileSync(cardPath));
    if (size !== '1080x1350') throw new Error(`card size ${size}`);

    await page.getByRole('button', { name: '返回列表' }).click();
    await page.getByRole('heading', { name: '诗篇23' }).waitFor();
    if (!(await page.getByRole('listitem').nth(1).getByText('已背完').isVisible())) throw new Error('✓ not shown');
    await snap(page, 'p-list-done');
    await page.reload();
    await page.getByRole('heading', { name: '诗篇23' }).waitFor();
    if (await page.getByText('已背完').count()) throw new Error('✓ survived reload (should not persist)');
    const after = await page.evaluate(() => Object.keys(localStorage).sort());
    // Pre-existing app keys that may appear later in a session are allowed; anything else is new storage.
    const knownKeys = ['user-tracked', 'favorites-storage', 'your-words-app'];
    const added = after.filter(
      (key) => !before.includes(key) && !knownKeys.includes(key) && !key.startsWith('your-words:memorize-'),
    );
    if (added.length) throw new Error(`new storage keys: ${added}`);
    await context.close();
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    return `?p list ordered, next/return work, ✓ in memory only, card ${cardPath.split('/').pop()} ${size}`;
  },

  async reciteLinkEdgeCases(browser) {
    if (!HAS_SHARE_LINK) return 'SKIP';
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${BASE}/memorize?p=43-3-16,99-1-1,abc&sv=1`);
    await dismissGuide(page);
    await page.getByText('有 2 处引用无法识别，已略过').waitFor();
    await snap(page, 'p-invalid');
    await page.goto(`${BASE}/memorize?p=abc&sv=2`);
    await page.getByText('链接中没有可背诵的经文').waitFor();
    await page.getByText('此链接来自较新版本，部分内容可能无法显示').waitFor();
    await snap(page, 'p-empty');
    await page.goto(`${BASE}/memorize?s=19-23-1,43-3-16`);
    await page.getByText('共 2 节').waitFor();
    await snap(page, 's-legacy');
    await context.close();
    if (errors.length) throw new Error(`page errors: ${errors.join(' | ')}`);
    return 'invalid notice, empty state + newer-schema notice, legacy ?s= list';
  },

  async createLink(browser) {
    if (!HAS_SHARE_LINK) return 'SKIP';
    const { context, page } = await newPage(browser);
    await page.addInitScript(() => {
      // Seed favorites the way the store persists them (the favorites flow proves the UI path separately).
      if (!localStorage.getItem('favorites-storage')) {
        localStorage.setItem(
          'favorites-storage',
          JSON.stringify({ state: { favorites: ['诗篇-23-1', '诗篇-23-2', '约翰福音-3-16'] }, version: 0 }),
        );
      }
    });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
    await page.goto(`${BASE}/memorize?create=1`);
    const boxes = page.getByRole('checkbox');
    await boxes.first().waitFor();
    await dismissGuide(page);
    const count = await boxes.count();
    await page.getByRole('textbox', { name: '链接标题' }).fill('小组');
    await page.getByRole('button', { name: '生成', exact: true }).click();
    // Headless UI's role=dialog root is a zero-size wrapper (children are position:fixed), so wait on content instead.
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: '背诵链接网址' }).waitFor();
    const url = await dialog.getByRole('textbox', { name: '背诵链接网址' }).inputValue();
    const qr = dialog.getByRole('img', { name: '背诵链接二维码' });
    await qr.waitFor();
    await snap(page, 'share-dialog');
    await dialog.getByRole('button', { name: '复制链接' }).click();
    // Headless clipboard is unreliable: accept success or the manual-copy fallback, and record which.
    const copyStatus = dialog.getByText(/链接已复制|请手动复制/);
    const copyResult = await copyStatus.waitFor({ timeout: 5000 }).then(
      () => copyStatus.textContent(),
      () => 'no status (clipboard promise pending)',
    );
    const [qrDownload] = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('link', { name: '保存二维码' }).click(),
    ]);
    const qrPath = path.join(OUT, qrDownload.suggestedFilename());
    await qrDownload.saveAs(qrPath);
    const qrSize = pngSize(readFileSync(qrPath));
    if (qrSize === 'not-png') throw new Error('QR download is not a PNG');
    if (!/\/memorize\?p=[0-9~,-]+&t=%E5%B0%8F%E7%BB%84&sv=1$/.test(url)) throw new Error(`unexpected url ${url}`);
    // Open the generated link like a recipient.
    const recipient = await newPage(browser);
    await recipient.page.goto(url);
    await recipient.page.getByRole('heading', { name: '小组' }).waitFor();
    await snap(recipient.page, 'generated-link-opened');
    await recipient.context.close();
    await context.close();
    return `${count} favorites checked by default; url ${url.replace(BASE, '')}; copy → ${copyResult}; QR ${qrSize}; recipient opens it`;
  },

  async homeEntries(browser) {
    if (!HAS_SHARE_LINK) return 'SKIP';
    const { context, page } = await newPage(browser);
    await page.goto(`${BASE}/?s=19-23-1,43-3-16`);
    const link = page.getByRole('alert').getByRole('link', { name: '深度背诵' });
    await link.waitFor({ timeout: 20000 });
    const href = await link.getAttribute('href');
    await snap(page, 'home-shared-banner');
    await context.close();
    if (href !== '/memorize?s=19-23-1,43-3-16') throw new Error(`banner href ${href}`);
    return `shared banner 深度背诵 -> ${href}`;
  },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(flows);
const browser = await chromium.launch({ headless: true });
for (const name of wanted) {
  if (!flows[name]) {
    results.push({ name, status: 'FAIL', detail: 'unknown flow' });
    continue;
  }
  try {
    const detail = await flows[name](browser);
    results.push(
      detail === 'SKIP'
        ? { name, status: 'SKIP', detail: 'share-link feature not in this checkout' }
        : { name, status: 'PASS', detail },
    );
  } catch (error) {
    const failShot = lastPage && !lastPage.isClosed() ? await snap(lastPage, `FAIL-${name}`).catch(() => null) : null;
    const at = String(error?.stack ?? '')
      .split('\n')
      .find((line) => line.includes('drive.mjs'))
      ?.match(/drive\.mjs:(\d+)/)?.[1];
    results.push({
      name,
      status: 'FAIL',
      detail: `${String(error?.message ?? error).split('\n')[0]}${at ? ` [drive.mjs:${at}]` : ''}${failShot ? ` (see ${path.basename(failShot)})` : ''}`,
    });
  }
}
await browser.close();
for (const r of results) console.log(`${r.status} ${r.name} — ${r.detail}`);
writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log(
  `BROWSER SUMMARY pass=${results.filter((r) => r.status === 'PASS').length} fail=${fails} skip=${results.filter((r) => r.status === 'SKIP').length}  (screenshots: ${OUT})`,
);
process.exit(fails ? 1 : 0);
