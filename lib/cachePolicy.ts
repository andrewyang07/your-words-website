/**
 * Shared CDN cache policies for the read-only global-stats endpoints.
 *
 * These only affect *global* aggregate counts. A user's own favorites live in
 * local state (zustand/Dexie) and never go through these endpoints.
 *
 * Every cache miss/revalidation costs Redis commands, so TTLs are chosen to
 * cap Redis reads (see REDIS_COST_ANALYSIS.md), not to be as short as possible.
 */

export interface CachePolicy {
    /** Seconds the CDN may serve the response as fresh. */
    sMaxAge: number;
    /** Seconds the CDN may serve stale while revalidating in the background. */
    staleWhileRevalidate: number;
}

export function cacheControl(policy: CachePolicy): string {
    return `public, s-maxage=${policy.sMaxAge}, stale-while-revalidate=${policy.staleWhileRevalidate}`;
}

/** /api/stats: two GETs per refresh; cheap, so keep it fairly fresh. */
export const STATS_CACHE: CachePolicy = { sMaxAge: 300, staleWhileRevalidate: 900 };

/** /api/rankings and /api/stats/top-verses: SCAN + MGET per refresh; the expensive ones. */
export const RANKINGS_CACHE: CachePolicy = { sMaxAge: 600, staleWhileRevalidate: 1800 };

/**
 * Used when the computed payload is empty or came from a degraded Redis, so a
 * transient Redis failure (helpers swallow errors and return []/0) is not
 * pinned in the CDN for 10+ minutes.
 */
export const EMPTY_RESULT_CACHE: CachePolicy = { sMaxAge: 30, staleWhileRevalidate: 30 };

/** Errors and local-dev mock data must never be cached. */
export const NO_STORE = 'no-store';
