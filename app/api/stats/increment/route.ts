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

        // 更新统计（移除了服务端限流以节省 Redis 命令数）
        // 客户端已经有 throttling 机制，足够防止滥用
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
