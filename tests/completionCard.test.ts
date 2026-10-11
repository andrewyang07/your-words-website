import { describe, expect, it } from 'vitest';
import { localDateString, renderCompletionCard, wrapLines } from '../lib/memorize/completionCard';

const measure = (value: string) => Array.from(value).length * 10;

describe('wrapLines', () => {
  it('wraps Chinese text character by character', () => {
    expect(wrapLines('神爱世人甚至将他的独生子赐给他们', measure, 50, 12)).toEqual([
      '神爱世人甚',
      '至将他的独',
      '生子赐给他',
      '们',
    ]);
  });

  it('returns no lines for empty text', () => {
    expect(wrapLines('', measure, 50, 12)).toEqual([]);
  });

  it('keeps a line that exactly fills the width', () => {
    expect(wrapLines('一二三四五', measure, 50, 12)).toEqual(['一二三四五']);
  });

  it('truncates to maxLines with an ellipsis that still fits', () => {
    const lines = wrapLines('一'.repeat(200), measure, 50, 12);
    expect(lines).toHaveLength(12);
    expect(lines[11]).toBe('一一一一…');
    lines.forEach((line) => expect(measure(line)).toBeLessThanOrEqual(50));
  });

  it('honors explicit newlines', () => {
    expect(wrapLines('一二\n三', measure, 50, 12)).toEqual(['一二', '三']);
  });
});

describe('renderCompletionCard', () => {
  it('draws the brand, title, reference, text, done label and date', () => {
    const drawn: string[] = [];
    const ctx = {
      fillStyle: '',
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: () => undefined,
      strokeRect: () => undefined,
      fillText: (text: string) => {
        drawn.push(text);
      },
      measureText: (text: string) => ({ width: Array.from(text).length * 48 }),
    } as unknown as CanvasRenderingContext2D;
    renderCompletionCard(ctx, {
      brand: '你的話語 yourwords.me',
      title: '诗篇23',
      reference: '约翰福音 3:16',
      text: '神爱世人',
      date: '2026-10-10',
      doneLabel: '我背下来了 ✓',
    });
    expect(drawn).toEqual([
      '你的話語 yourwords.me',
      '诗篇23',
      '约翰福音 3:16',
      '神爱世人',
      '我背下来了 ✓',
      '2026-10-10',
    ]);
  });

  it('formats local dates as YYYY-MM-DD', () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
