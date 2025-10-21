import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

/**
 * 获取全局统计数据
 */
export async function GET() {
    try {
        // 只在有 Upstash 环境变量时返回真实数据
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            // 本地开发返回 Mock 数据
            return NextResponse.json({
                totalUsers: 0,
                totalFavorites: 0,
                totalClicks: 0,
            });
        }

        const redis = Redis.fromEnv();

        const [totalUsers, totalFavorites, totalClicks] = await Promise.all([
            redis.get<number>('stats:total_users'),
            redis.get<number>('stats:total_favorites'),
            redis.get<number>('stats:total_clicks'),
        ]);

        return NextResponse.json({
            totalUsers: totalUsers || 0,
            totalFavorites: totalFavorites || 0,
            totalClicks: totalClicks || 0,
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
        // 失败时返回 0
        return NextResponse.json({
            totalUsers: 0,
            totalFavorites: 0,
            totalClicks: 0,
        });
    }
}

