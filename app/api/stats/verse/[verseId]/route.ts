import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

/**
 * 获取单个经文的统计数据
 * @param verseId 经文数字 ID（如 "43-3-16"）
 */
export async function GET(request: Request, { params }: { params: { verseId: string } }) {
    try {
        const { verseId } = params;

        // 只在有 Upstash 环境变量时返回真实数据
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            // 本地开发返回 0
            return NextResponse.json({ favorites: 0, clicks: 0 });
        }

        const redis = Redis.fromEnv();

        const [favorites, clicks] = await Promise.all([
            redis.get<number>(`verse:${verseId}:favorites`),
            redis.get<number>(`verse:${verseId}:clicks`),
        ]);

        return NextResponse.json({
            favorites: favorites || 0,
            clicks: clicks || 0,
        });
    } catch (error) {
        console.error('Failed to fetch verse stats:', error);
        return NextResponse.json({ favorites: 0, clicks: 0 });
    }
}

