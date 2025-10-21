import { NextResponse } from 'next/server';
import { safeRedisGet, safeRedisIncr } from '@/lib/redisUtils';

export const runtime = 'edge';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * POST /api/stats/increment
 * 增加统计数据（点击或收藏）
 * 包含服务端限流和错误处理
 */
export async function POST(request: Request) {
    // 本地开发且未配置 Redis，静默返回成功
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({ success: true, dev: true });
    }

    try {
        const { action, verseId } = await request.json();

        if (!action || !verseId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 服务端限流：检查 IP
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimitKey = `ratelimit:${ip}:${Math.floor(Date.now() / 10000)}`; // 10秒窗口

        const currentCount = await safeRedisGet(rateLimitKey, '0');
        if (parseInt(currentCount) > 50) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        // 增加限流计数
        await safeRedisIncr(rateLimitKey);

        // 更新统计
        if (action === 'click') {
            await safeRedisIncr('total_clicks');
        } else if (action === 'favorite') {
            // 只统计"收藏"动作，不统计"取消收藏"
            await Promise.all([safeRedisIncr('total_favorites'), safeRedisIncr(`verse:${verseId}`)]);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Increment API error:', error);
        // 返回成功，避免客户端重试
        return NextResponse.json({ success: true });
    }
}
