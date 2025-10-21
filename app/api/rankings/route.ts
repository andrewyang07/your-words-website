import { NextResponse } from 'next/server';
import { safeRedisScan, safeRedisMget } from '@/lib/redisUtils';

export const dynamic = 'force-dynamic'; // 强制动态渲染
export const revalidate = 3600; // 缓存1小时

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * GET /api/rankings
 * 获取所有被收藏过的经文排行榜
 * 使用 ISR 缓存策略，每小时自动重新生成
 */
export async function GET() {
    // 本地开发且未配置 Redis，返回模拟数据
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({
            rankings: [
                { verseId: '43-3-16', favorites: 100 },
                { verseId: '19-23-1', favorites: 85 },
                { verseId: '50-4-13', favorites: 72 },
                { verseId: '45-8-28', favorites: 68 },
                { verseId: '20-3-5', favorites: 55 },
            ],
            timestamp: Date.now(),
        });
    }

    try {
        // 扫描所有 verse: 开头的 key
        const keys = await safeRedisScan('verse:*', 100);

        if (keys.length === 0) {
            return NextResponse.json({ rankings: [], timestamp: Date.now() });
        }

        // 批量获取所有 key 的值
        const values = await safeRedisMget(keys);

        // 构建排行榜数据
        const rankings: Array<{ verseId: string; favorites: number }> = [];
        keys.forEach((key, i) => {
            const favorites = parseInt(values[i] || '0');
            if (favorites > 0) {
                rankings.push({
                    verseId: key.replace('verse:', ''),
                    favorites,
                });
            }
        });

        // 按收藏数降序排序
        rankings.sort((a, b) => b.favorites - a.favorites);

        return NextResponse.json({
            rankings,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Rankings API error:', error);
        // 返回空排行榜，不让页面崩溃
        return NextResponse.json(
            {
                rankings: [],
                error: 'Failed to load rankings',
            },
            { status: 500 }
        );
    }
}
