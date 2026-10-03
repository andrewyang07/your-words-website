import { NextResponse } from 'next/server';
import { safeRedisIncr } from '@/lib/redisUtils';
import { validateIncrementBody } from '@/lib/validation';
import { checkRateLimit, getClientIdentifier, rateLimitedResponse, INCREMENT_RATE_LIMIT } from '@/lib/rateLimit';

export const runtime = 'edge';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/** 请求体上限（字符数）。合法请求体 < 100 字符；超出直接 400，避免解析超大 JSON。 */
const MAX_BODY_CHARS = 1024;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

function badRequest(error: string) {
    return NextResponse.json({ error }, { status: 400, headers: NO_STORE_HEADERS });
}

/**
 * POST /api/stats/increment
 * 增加统计数据（收藏）
 *
 * 顺序（很重要）：
 *  1. 校验输入 —— 非法输入直接 400，不触碰 Redis（包括限流计数），也不会创建任何 key
 *  2. 本地开发且无 Redis → 静默成功
 *  3. 按 IP 限流（Redis INCR+EXPIRE，固定窗口，Redis 不可用时放行）→ 超限 429 + Retry-After
 *  4. 写入统计
 */
export async function POST(request: Request) {
    let body: unknown;
    try {
        const raw = await request.text();
        if (raw.length > MAX_BODY_CHARS) {
            return badRequest('Payload too large');
        }
        body = JSON.parse(raw);
    } catch {
        return badRequest('Invalid JSON body');
    }

    const parsed = validateIncrementBody(body);
    if (!parsed.ok) {
        return badRequest(parsed.error);
    }

    // 本地开发且未配置 Redis，静默返回成功
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({ success: true, dev: true }, { headers: NO_STORE_HEADERS });
    }

    try {
        const limit = await checkRateLimit(await getClientIdentifier(request), INCREMENT_RATE_LIMIT);
        if (!limit.allowed) {
            return rateLimitedResponse(limit);
        }

        // 只统计"收藏"动作，不统计"取消收藏"
        await Promise.all([safeRedisIncr('total_favorites'), safeRedisIncr(`verse:${parsed.verseId}`)]);

        return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
    } catch (error) {
        console.error('Increment API error:', error);
        // 服务端内部错误不应让客户端重试或打扰用户
        return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
    }
}
