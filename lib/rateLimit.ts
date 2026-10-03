/**
 * Minimal fixed-window rate limiter on top of the existing `@upstash/redis`
 * client (no extra dependency).
 *
 * Why Redis and not an in-memory Map: the write endpoints run on the Vercel
 * edge/serverless, where every isolate has its own memory and is recycled
 * often, so in-memory counters would be per-instance and effectively useless.
 *
 * Cost: 1 `INCR` per checked request, plus 1 `EXPIRE` only on the first hit of
 * a window (so ~1 + 1/hits-per-window commands). The window index is part of
 * the key, so even if the `EXPIRE` is lost the key can never block anybody for
 * longer than its own window.
 *
 * Failure policy: FAIL OPEN. No Redis credentials (local dev), a Redis error,
 * or a Redis timeout all result in `allowed: true`. Rate limiting is abuse
 * mitigation, never a reason to break the product.
 */

import { createRedisClient } from './redisUtils';

/** The subset of the Redis client the limiter needs (easy to mock). */
export interface RateLimitRedis {
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<unknown>;
}

export interface RateLimitConfig {
    /** Short scope name, part of the Redis key (e.g. "increment"). */
    name: string;
    /** Max allowed requests per window per identifier. */
    limit: number;
    /** Window length in seconds. */
    windowSeconds: number;
}

export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    /** Seconds until the current window ends (use for `Retry-After`). */
    retryAfterSeconds: number;
    /** True when Redis was unavailable and the request was allowed anyway. */
    degraded: boolean;
}

/** Per-IP limits. Sized so that a person starring 20 verses in a row never trips them. */
export const INCREMENT_RATE_LIMIT: RateLimitConfig = { name: 'increment', limit: 30, windowSeconds: 60 };
export const TRACK_USER_RATE_LIMIT: RateLimitConfig = { name: 'track-user', limit: 10, windowSeconds: 3600 };

/** Upper bound on how long we wait for Redis before giving up and allowing. */
export const RATE_LIMIT_TIMEOUT_MS = 800;

export interface CheckRateLimitDeps {
    /** Pass `null` to simulate "Redis not configured". Defaults to the env-configured client. */
    redis?: RateLimitRedis | null;
    /** Epoch ms; injectable for deterministic tests. */
    now?: number;
    timeoutMs?: number;
}

function defaultRedis(): RateLimitRedis | null {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
    try {
        return createRedisClient() as unknown as RateLimitRedis;
    } catch {
        return null;
    }
}

function failOpen(config: RateLimitConfig): RateLimitResult {
    return { allowed: true, limit: config.limit, remaining: config.limit, retryAfterSeconds: 0, degraded: true };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('rate limit redis timeout')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Count one request for `identifier` (already hashed / non-sensitive) in the
 * given scope and report whether it is within the limit.
 */
export async function checkRateLimit(identifier: string, config: RateLimitConfig, deps: CheckRateLimitDeps = {}): Promise<RateLimitResult> {
    const redis = deps.redis === undefined ? defaultRedis() : deps.redis;
    if (!redis) return failOpen(config);

    const nowMs = deps.now ?? Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowIndex = Math.floor(nowMs / windowMs);
    const key = `rl:${config.name}:${identifier}:${windowIndex}`;
    const retryAfterSeconds = Math.max(1, Math.ceil(((windowIndex + 1) * windowMs - nowMs) / 1000));

    try {
        const count = await withTimeout(
            (async () => {
                const c = await redis.incr(key);
                if (c === 1) {
                    // Only the first hit of a window sets the TTL (cleanup only, see header).
                    await redis.expire(key, config.windowSeconds + 5);
                }
                return c;
            })(),
            deps.timeoutMs ?? RATE_LIMIT_TIMEOUT_MS
        );

        return {
            allowed: count <= config.limit,
            limit: config.limit,
            remaining: Math.max(0, config.limit - count),
            retryAfterSeconds,
            degraded: false,
        };
    } catch (error) {
        console.error('Rate limit check failed, allowing request:', error);
        return failOpen(config);
    }
}

/**
 * Derive a stable, non-reversible identifier for the caller. On Vercel the
 * platform sets `x-real-ip` / overwrites `x-forwarded-for`, so they can't be
 * spoofed by clients. The IP is hashed so raw IPs are never stored in Redis.
 */
export async function getClientIdentifier(request: Request): Promise<string> {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ip = request.headers.get('x-real-ip')?.trim() || forwarded || 'unknown';
    const data = new TextEncoder().encode(ip.slice(0, 64));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest).slice(0, 8))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

/** Standard 429 response for a blocked request. */
export function rateLimitedResponse(result: RateLimitResult): Response {
    return new Response(JSON.stringify({ error: 'Too many requests', retryAfter: result.retryAfterSeconds }), {
        status: 429,
        headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfterSeconds),
            'Cache-Control': 'no-store',
        },
    });
}
