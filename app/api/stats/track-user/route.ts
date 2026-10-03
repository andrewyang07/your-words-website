import { NextResponse } from 'next/server';
import { safeRedisIncr } from '@/lib/redisUtils';
import { validateTrackUserBody } from '@/lib/validation';
import { checkRateLimit, getClientIdentifier, rateLimitedResponse, TRACK_USER_RATE_LIMIT } from '@/lib/rateLimit';

export const runtime = 'edge';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const MAX_BODY_CHARS = 1024;
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

/**
 * POST /api/stats/track-user
 * 记录新用户访问（统一使用 total_users key）
 *
 * 此接口不接收任何请求体字段（客户端不发送 body）：空 body 或 `{}` 通过，其余（非 JSON、数组、多余字段如 verseId）一律 400。
 * 按 IP 限流：每小时 10 次（超限 429 + Retry-After，客户端不会标记 user-tracked，下次访问再试）。
 */
export async function POST(request: Request) {
    // 先校验：非法请求体直接 400，不触碰 Redis（含限流计数）
    let raw = '';
    try {
        raw = await request.text();
    } catch {
        raw = '';
    }
    const parsed = raw.length > MAX_BODY_CHARS ? ({ ok: false, error: 'Payload too large' } as const) : validateTrackUserBody(raw);
    if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400, headers: NO_STORE_HEADERS });
    }

    // 本地开发且未配置 Redis，静默返回成功
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({ success: true, dev: true }, { headers: NO_STORE_HEADERS });
    }

    try {
        const limit = await checkRateLimit(await getClientIdentifier(request), TRACK_USER_RATE_LIMIT);
        if (!limit.allowed) {
            return rateLimitedResponse(limit);
        }

        // 使用统一的 key 命名（不带 stats: 前缀）
        await safeRedisIncr('total_users');

        return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('Failed to track user:', error);
        // 返回成功，避免影响用户体验
        return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
    }
}
