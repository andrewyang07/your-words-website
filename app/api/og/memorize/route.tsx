import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { excerpt, getRecitePreview } from '@/lib/reciteLinkServer';

export const runtime = 'nodejs';

const FONT_NAME = 'Noto Serif SC';
let fontPromise: Promise<Buffer> | null = null;

function loadFont() {
  // 仓库内的常用字子集（覆盖和合本简体全部用字），不依赖 Google Fonts。
  fontPromise ??= readFile(path.join(process.cwd(), 'public', 'fonts', 'NotoSerifSC-og-subset.otf')).catch((error) => {
    fontPromise = null;
    throw error;
  });
  return fontPromise;
}

const CACHE_CONTROL = 'public, max-age=86400, s-maxage=604800, immutable';

export async function GET(request: Request) {
  const search = new URL(request.url).search;
  const [preview, font] = await Promise.all([getRecitePreview(search), loadFont().catch(() => null)]);
  const fonts = font ? [{ name: FONT_NAME, data: font, weight: 400 as const, style: 'normal' as const }] : undefined;

  const body = preview ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '64px 80px',
        background: '#f7f3ea',
        color: '#1c1917',
        fontFamily: FONT_NAME,
      }}
    >
      <div style={{ display: 'flex', fontSize: 30, color: '#92400e' }}>你的話語 · 背诵链接</div>
      <div style={{ display: 'flex', marginTop: 28, fontSize: 60, lineHeight: 1.2 }}>
        {preview.title ?? preview.firstReference}
      </div>
      {preview.title && (
        <div style={{ display: 'flex', marginTop: 16, fontSize: 34, color: '#57534e' }}>{preview.firstReference}</div>
      )}
      <div style={{ display: 'flex', marginTop: 32, fontSize: 38, lineHeight: 1.6, color: '#292524' }}>
        {excerpt(preview.firstText)}
      </div>
      <div
        style={{ display: 'flex', marginTop: 'auto', fontSize: 30, color: '#78716c' }}
      >{`共 ${preview.count} 节 · yourwords.me`}</div>
    </div>
  ) : (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#f7f3ea',
        color: '#1c1917',
        fontFamily: FONT_NAME,
      }}
    >
      <div style={{ display: 'flex', fontSize: 72 }}>你的話語</div>
      <div style={{ display: 'flex', marginTop: 20, fontSize: 36, color: '#78716c' }}>深度背诵 · yourwords.me</div>
    </div>
  );

  const image = new ImageResponse(body, { width: 1200, height: 630, fonts });
  image.headers.set('Cache-Control', CACHE_CONTROL);
  return image;
}
