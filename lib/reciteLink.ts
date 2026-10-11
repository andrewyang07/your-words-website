/**
 * 背诵链接（/memorize?p=…&t=…&sv=1）的解析与生成。
 * 全部为纯函数，绝不 throw（解析路径不调用会 throw 的 encodeVerseRef）。
 */
import booksData from '../public/data/books.json';
import { bookIdToKey, bookKeyToId, parseVerseId } from './bibleBookMapping';

export const MAX_RECITE_VERSES = 50;
export const MAX_TITLE_LEN = 40;
export const RECITE_SCHEMA_VERSION = 1;
export const MAX_RECITE_PARAM_LENGTH = 2000;

export interface ParsedReciteParams {
  ids: string[];
  title: string | null;
  invalidCount: number;
  truncated: boolean;
  newerSchema: boolean;
  source: 'p' | 's' | null;
}

export interface VerseRef {
  bookKey: string;
  chapter: number;
  verse: number;
}

const chapterCounts: Record<string, number> = {};
booksData.books.forEach((book) => { chapterCounts[book.key] = book.chapters; });

// 不允许前导零，数字最多 3 位（最长的诗篇 119 篇 176 节）。
const SEGMENT_PATTERN = /^([1-9]\d{0,2})-([1-9]\d{0,2})-([1-9]\d{0,2})(?:~([1-9]\d{0,2}))?$/;

function normalizeTitle(raw: string | null): string | null {
  if (raw === null) return null;
  const cleaned = raw.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  // 按 code point 截断，不切开代理对
  return Array.from(cleaned).slice(0, MAX_TITLE_LEN).join('').trim() || null;
}

/** 解析 refs 字符串（`p` 或旧的 `s`）。 */
export function parseRecitePassages(raw: string): { ids: string[]; invalidCount: number; truncated: boolean } {
  let input = raw;
  let truncated = false;
  if (input.length > MAX_RECITE_PARAM_LENGTH) {
    truncated = true;
    input = input.slice(0, MAX_RECITE_PARAM_LENGTH);
    const lastComma = input.lastIndexOf(',');
    input = lastComma >= 0 ? input.slice(0, lastComma) : '';
  }
  if (!input) return { ids: [], invalidCount: 0, truncated };

  const ids: string[] = [];
  const seen = new Set<string>();
  let invalidCount = 0;

  for (const segment of input.split(',')) {
    if (ids.length >= MAX_RECITE_VERSES) {
      truncated = true;
      break;
    }
    const match = SEGMENT_PATTERN.exec(segment);
    const bookKey = match ? bookIdToKey[Number(match[1])] : undefined;
    if (!match || !bookKey) {
      invalidCount += 1;
      continue;
    }
    const chapter = Number(match[2]);
    const from = Number(match[3]);
    const to = match[4] ? Number(match[4]) : from;
    if (chapter > (chapterCounts[bookKey] ?? 0) || from > to) {
      invalidCount += 1;
      continue;
    }
    for (let verse = from; verse <= to; verse += 1) {
      if (ids.length >= MAX_RECITE_VERSES) {
        truncated = true;
        break;
      }
      const id = `${bookKey}-${chapter}-${verse}`;
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }

  return { ids, invalidCount, truncated };
}

/** 解析 `/memorize` 的 query。优先级：p > s；只有 v 或什么都没有时 source 为 null。 */
export function parseReciteParams(search: string): ParsedReciteParams {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    params = new URLSearchParams();
  }
  const sv = params.get('sv');
  const newerSchema = sv !== null && sv.trim() !== String(RECITE_SCHEMA_VERSION);
  const title = normalizeTitle(params.get('t'));
  const source = params.has('p') ? 'p' : params.has('s') ? 's' : null;
  if (!source) return { ids: [], title, invalidCount: 0, truncated: false, newerSchema, source: null };
  const { ids, invalidCount, truncated } = parseRecitePassages(params.get(source) ?? '');
  return { ids, title, invalidCount, truncated, newerSchema, source };
}

/** 保持顺序；相邻且同章连续的节合并为区间。接受 verse id（`约翰福音-3-16`）或 VerseRef。 */
export function encodeRecitePassages(refs: Array<string | VerseRef>): string {
  const segments: Array<{ bookId: number; chapter: number; from: number; to: number }> = [];
  const seen = new Set<string>();
  for (const value of refs) {
    const ref = typeof value === 'string' ? parseVerseId(value) : value;
    if (!ref) continue;
    const bookId = bookKeyToId[ref.bookKey];
    if (!bookId || !Number.isInteger(ref.chapter) || !Number.isInteger(ref.verse) || ref.chapter < 1 || ref.verse < 1) continue;
    const key = `${bookId}-${ref.chapter}-${ref.verse}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const last = segments[segments.length - 1];
    if (last && last.bookId === bookId && last.chapter === ref.chapter && last.to + 1 === ref.verse) {
      last.to = ref.verse;
    } else {
      segments.push({ bookId, chapter: ref.chapter, from: ref.verse, to: ref.verse });
    }
  }
  return segments
    .map(({ bookId, chapter, from, to }) => `${bookId}-${chapter}-${from}${to > from ? `~${to}` : ''}`)
    .join(',');
}

export function buildReciteQuery({ ids, title }: { ids: Array<string | VerseRef>; title?: string | null }): string {
  const normalizedTitle = normalizeTitle(title ?? null);
  return `p=${encodeRecitePassages(ids)}${normalizedTitle ? `&t=${encodeURIComponent(normalizedTitle)}` : ''}&sv=${RECITE_SCHEMA_VERSION}`;
}

export function buildReciteUrl({ origin, ids, title }: { origin: string; ids: Array<string | VerseRef>; title?: string | null }): string {
  return `${origin.replace(/\/+$/, '')}/memorize?${buildReciteQuery({ ids, title })}`;
}
