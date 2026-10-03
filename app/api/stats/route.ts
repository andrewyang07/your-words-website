import { NextResponse } from 'next/server';
import { safeRedisGet } from '@/lib/redisUtils';
import { cacheControl, STATS_CACHE, EMPTY_RESULT_CACHE, NO_STORE } from '@/lib/cachePolicy';

export const runtime = 'edge';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * GET /api/stats
 * 获取全局统计数据（总用户、总收藏）
 *
 * 缓存策略：Cache-Control s-maxage=300, stale-while-revalidate=900。
 * 全局计数允许滞后几分钟；用户自己的收藏是本地状态，不经过此接口。
 * 两个计数都为 0（可能是 Redis 故障被降级为默认值）时只缓存 30 秒。
 */
export async function GET() {
    // 本地开发且未配置 Redis，返回模拟数据
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json(
            {
                totalUsers: 10,
                totalFavorites: 50,
            },
            { headers: { 'Cache-Control': NO_STORE } }
        );
    }

    try {
        const [totalUsers, totalFavorites] = await Promise.all([
            safeRedisGet('total_users', '0'),
            safeRedisGet('total_favorites', '0'),
        ]);

        const users = parseInt(totalUsers) || 0;
        const favorites = parseInt(totalFavorites) || 0;
        const looksEmpty = users === 0 && favorites === 0;

        return NextResponse.json(
            {
                totalUsers: users,
                totalFavorites: favorites,
            },
            { headers: { 'Cache-Control': cacheControl(looksEmpty ? EMPTY_RESULT_CACHE : STATS_CACHE) } }
        );
    } catch (error) {
        console.error('Stats API error:', error);
        // 返回默认值，不让 API 失败；但不要缓存
        return NextResponse.json(
            {
                totalUsers: 0,
                totalFavorites: 0,
            },
            { headers: { 'Cache-Control': NO_STORE } }
        );
    }
}
