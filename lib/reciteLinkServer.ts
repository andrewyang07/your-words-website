import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseVerseId } from './bibleBookMapping';
import { verseReference } from './memorize/reference';
import { encodeRecitePassages, parseReciteParams } from './reciteLink';

type BibleJson = Record<string, Record<string, Record<string, string>>>;

let cuvPromise: Promise<BibleJson> | null = null;

/** 服务端读取简体和合本（OG/metadata 默认简体）。 */
function loadCuv(): Promise<BibleJson> {
  cuvPromise ??= readFile(path.join(process.cwd(), 'public', 'data', 'CUV_bible.json'), 'utf8')
    .then((raw) => JSON.parse(raw) as BibleJson)
    .catch((error) => {
      cuvPromise = null;
      throw error;
    });
  return cuvPromise;
}

export interface RecitePreview {
  canonicalP: string;
  title: string | null;
  count: number;
  firstReference: string;
  firstText: string;
}

export function excerpt(text: string, max = 60): string {
  const chars = Array.from(text);
  return chars.length > max ? `${chars.slice(0, max).join('')}…` : text;
}

/** 由 query 生成预览数据；无有效经文时返回 null。不 throw。 */
export async function getRecitePreview(search: string): Promise<RecitePreview | null> {
  const parsed = parseReciteParams(search);
  if (!parsed.source || parsed.ids.length === 0) return null;
  try {
    const bible = await loadCuv();
    const existing = parsed.ids.filter((id) => {
      const ref = parseVerseId(id);
      return Boolean(ref && bible[ref.bookKey]?.[String(ref.chapter)]?.[String(ref.verse)]);
    });
    const first = existing[0] ? parseVerseId(existing[0]) : null;
    if (!first) return null;
    return {
      canonicalP: encodeRecitePassages(existing),
      title: parsed.title,
      count: existing.length,
      firstReference: verseReference(first, 'simplified'),
      firstText: bible[first.bookKey][String(first.chapter)][String(first.verse)],
    };
  } catch {
    return null;
  }
}

export function searchParamsToString(params: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) query.set(key, value[0]);
  });
  return query.toString();
}
