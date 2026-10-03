/**
 * Input validation for the public stats write endpoints.
 *
 * `verseId` is concatenated into Redis keys (`verse:<id>`), so anything that is
 * not a plain `book-chapter-verse` numeric triple must be rejected *before* any
 * Redis command is issued.
 */

/** Longest legal id is "66-150-176" (10 chars); leave a little headroom. */
export const VERSE_ID_MAX_LENGTH = 16;

const VERSE_ID_PATTERN = /^\d+-\d+-\d+$/;

const MAX_BOOK = 66;
const MAX_CHAPTER = 150; // Psalms
const MAX_VERSE = 176; // Psalm 119

/**
 * Strict type guard for an encoded verse id such as "43-3-16".
 * Rejects non-strings, empty/overlong strings, anything not `\d+-\d+-\d+`
 * (e.g. "../", "1-1", "1-2-3-4", " 1-2-3", "1-2-3\n"), and numbers outside the
 * canonical Bible range (book 1-66, chapter 1-150, verse 1-176).
 */
export function isValidVerseId(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    if (value.length === 0 || value.length > VERSE_ID_MAX_LENGTH) return false;
    if (!VERSE_ID_PATTERN.test(value)) return false;

    const [book, chapter, verse] = value.split('-').map((part) => Number(part));
    return book >= 1 && book <= MAX_BOOK && chapter >= 1 && chapter <= MAX_CHAPTER && verse >= 1 && verse <= MAX_VERSE;
}

/** Only "favorite" is tracked server-side ("unfavorite" and "click" are not). */
export const ALLOWED_STATS_ACTIONS = ['favorite'] as const;
export type StatsAction = (typeof ALLOWED_STATS_ACTIONS)[number];

export function isValidStatsAction(value: unknown): value is StatsAction {
    return typeof value === 'string' && (ALLOWED_STATS_ACTIONS as readonly string[]).includes(value);
}

export type IncrementBodyResult = { ok: true; action: StatsAction; verseId: string } | { ok: false; error: string };

/** Validate the parsed JSON body of POST /api/stats/increment. */
export function validateIncrementBody(body: unknown): IncrementBodyResult {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, error: 'Body must be a JSON object' };
    }
    const { action, verseId } = body as Record<string, unknown>;
    if (!isValidStatsAction(action)) {
        return { ok: false, error: 'Invalid action' };
    }
    if (!isValidVerseId(verseId)) {
        return { ok: false, error: 'Invalid verseId' };
    }
    return { ok: true, action, verseId };
}

export type TrackUserBodyResult = { ok: true } | { ok: false; error: string };

/**
 * POST /api/stats/track-user takes no input. An empty body or `{}` is fine
 * (the real client sends none); anything else (non-JSON, arrays, extra fields
 * such as a smuggled `verseId`) is rejected so the endpoint can never be driven
 * by caller-controlled data.
 */
export function validateTrackUserBody(raw: string): TrackUserBodyResult {
    if (raw.trim() === '') return { ok: true };
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { ok: false, error: 'Invalid JSON body' };
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ok: false, error: 'Body must be a JSON object' };
    }
    if (Object.keys(parsed as object).length > 0) {
        return { ok: false, error: 'Unexpected fields' };
    }
    return { ok: true };
}
