import { NextResponse } from 'next/server';
import { safeRedisIncr } from '@/lib/redisUtils';

export const runtime = 'edge';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * POST /api/stats/track-user
 * 记录新用户访问（统一使用 total_users key）
 */
export async function POST() {
    // 本地开发且未配置 Redis，静默返回成功
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({ success: true, dev: true });
    }

    try {
        // 使用统一的 key 命名（不带 stats: 前缀）
        await safeRedisIncr('total_users');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to track user:', error);
        // 返回成功，避免影响用户体验
        return NextResponse.json({ success: true });
    }
}

