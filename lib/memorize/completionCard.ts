/**
 * 完成卡片：客户端 canvas 绘制 1080×1350 PNG（不依赖服务端、可离线）。
 */

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
const CARD_HEIGHT_DEFAULT = CARD_HEIGHT;
export const CARD_MAX_LINES = 12;
export const CARD_FONT_FAMILY = '"PingFang SC","Noto Serif SC","Songti SC",serif';
const ELLIPSIS = '…';

export interface CompletionCardData {
  reference: string;
  text: string;
  /** 本地日期 YYYY-MM-DD */
  date: string;
  title?: string | null;
  brand: string;
  doneLabel: string;
}

/**
 * 按字符（code point）换行，适用于中文；遇到 `\n` 强制换行。
 * 超过 maxLines 时最后一行以“…”结尾，且保证不超过 maxWidth。
 */
export function wrapLines(
  text: string,
  measure: (value: string) => number,
  maxWidth: number,
  maxLines: number,
): string[] {
  if (maxLines <= 0 || text === '') return [];
  const lines: string[] = [];
  let overflow = false;

  outer: for (const paragraph of text.split('\n')) {
    let line = '';
    for (const char of Array.from(paragraph)) {
      if (line && measure(line + char) > maxWidth) {
        lines.push(line);
        if (lines.length >= maxLines) {
          overflow = true;
          break outer;
        }
        line = char.trim() ? char : '';
      } else {
        line += char;
      }
    }
    if (line || paragraph === '') {
      if (lines.length >= maxLines) {
        overflow = true;
        break;
      }
      lines.push(line);
    }
  }

  if (overflow) {
    let last = lines[lines.length - 1];
    while (last && measure(last + ELLIPSIS) > maxWidth) last = Array.from(last).slice(0, -1).join('');
    lines[lines.length - 1] = last + ELLIPSIS;
  }
  return lines;
}

export function localDateString(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type CardContext = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
  | 'fillRect'
  | 'fillText'
  | 'measureText'
  | 'strokeStyle'
  | 'lineWidth'
  | 'strokeRect'
>;

export const QR_SIZE = 220;

export function renderCompletionCard(
  ctx: CardContext,
  data: CompletionCardData,
  options: { height?: number; qr?: CanvasImageSource | null; qrCaption?: string } = {},
): void {
  const CARD_HEIGHT = options.height ?? CARD_HEIGHT_DEFAULT;
  const padding = 96;
  const contentWidth = CARD_WIDTH - padding * 2;

  ctx.fillStyle = '#f7f3ea';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, CARD_WIDTH - 96, CARD_HEIGHT - 96);

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#92400e';
  ctx.font = `500 34px ${CARD_FONT_FAMILY}`;
  ctx.fillText(data.brand, padding, 112);

  // Vertically centre the title/reference/text block in the space between the brand and the footer, so short
  // verses don't leave a large empty band at the bottom of the fixed-size card.
  ctx.font = `400 48px ${CARD_FONT_FAMILY}`;
  const measuredLines = wrapLines(data.text, (value) => ctx.measureText(value).width, contentWidth, CARD_MAX_LINES);
  const blockHeight = (data.title ? 72 : 0) + 112 + Math.max(measuredLines.length, 1) * 74;
  const top = 200;
  const bottom = CARD_HEIGHT - 380;
  let y = Math.max(top, Math.round(top + (bottom - top - blockHeight) / 2));
  if (data.title) {
    ctx.fillStyle = '#57534e';
    ctx.font = `500 40px ${CARD_FONT_FAMILY}`;
    ctx.fillText(data.title, padding, y, contentWidth);
    y += 72;
  }

  ctx.fillStyle = '#1c1917';
  ctx.font = `600 56px ${CARD_FONT_FAMILY}`;
  ctx.fillText(data.reference, padding, y, contentWidth);
  y += 112;

  ctx.font = `400 48px ${CARD_FONT_FAMILY}`;
  ctx.fillStyle = '#292524';
  const lineHeight = 74;
  const lines = wrapLines(data.text, (value) => ctx.measureText(value).width, contentWidth, CARD_MAX_LINES);
  lines.forEach((line, index) => ctx.fillText(line, padding, y + index * lineHeight));

  ctx.fillStyle = '#963a30';
  ctx.font = `600 44px ${CARD_FONT_FAMILY}`;
  ctx.fillText(data.doneLabel, padding, CARD_HEIGHT - 220);
  ctx.fillStyle = '#78716c';
  ctx.font = `400 34px ${CARD_FONT_FAMILY}`;
  ctx.fillText(data.date, padding, CARD_HEIGHT - 150);

  if (options.qr && 'drawImage' in ctx) {
    const x = CARD_WIDTH - padding - QR_SIZE;
    const qrY = CARD_HEIGHT - 120 - QR_SIZE;
    (ctx as unknown as CanvasRenderingContext2D).drawImage(options.qr, x, qrY, QR_SIZE, QR_SIZE);
    if (options.qrCaption) {
      ctx.fillStyle = '#78716c';
      ctx.font = `400 26px ${CARD_FONT_FAMILY}`;
      ctx.fillText(options.qrCaption, x, qrY + QR_SIZE + 12, QR_SIZE);
    }
  }
}

/** 生成 PNG 并分享（支持文件分享时）或下载。用户取消分享时静默返回。 */
export async function shareCompletionCard(
  data: CompletionCardData,
  fileName: string,
  options: { qrUrl?: string; qrCaption?: string } = {},
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if ('fonts' in document) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  let qr: HTMLCanvasElement | null = null;
  if (options.qrUrl) {
    try {
      const QRCode = await import('qrcode');
      qr = document.createElement('canvas');
      await QRCode.toCanvas(qr, options.qrUrl, {
        width: QR_SIZE,
        margin: 1,
        color: { dark: '#292524', light: '#f7f3ea' },
      });
    } catch {
      qr = null; // The card is still useful without the code.
    }
  }
  renderCompletionCard(ctx, data, { qr, qrCaption: options.qrCaption });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('canvas export failed');

  const file = new File([blob], fileName, { type: 'image/png' });
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: data.reference });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
