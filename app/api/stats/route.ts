import { NextResponse } from 'next/server';
import { safeRedisGet } from '@/lib/redisUtils';

export const runtime = 'edge';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * GET /api/stats
 * 获取全局统计数据（总用户、总收藏、总点击）
 */
export async function GET() {
    // 本地开发且未配置 Redis，返回模拟数据
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({
            totalUsers: 10,
            totalFavorites: 50,
            totalClicks: 200,
        });
    }

    try {
        const [totalUsers, totalFavorites, totalClicks] = await Promise.all([
            safeRedisGet('total_users', '0'),
            safeRedisGet('total_favorites', '0'),
            safeRedisGet('total_clicks', '0'),
        ]);

        return NextResponse.json({
            totalUsers: parseInt(totalUsers),
            totalFavorites: parseInt(totalFavorites),
            totalClicks: parseInt(totalClicks),
        });
    } catch (error) {
        console.error('Stats API error:', error);
        // 返回默认值，不让 API 失败
        return NextResponse.json({
            totalUsers: 0,
            totalFavorites: 0,
            totalClicks: 0,
        });
    }
}
