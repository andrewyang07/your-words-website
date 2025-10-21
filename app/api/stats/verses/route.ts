import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

/**
 * 批量获取多个经文的统计数据
 * POST body: { verseIds: ["43-3-16", "19-23-1", ...] }
 */
export async function POST(request: Request) {
    try {
        const { verseIds } = await request.json();

        if (!verseIds || !Array.isArray(verseIds)) {
            return NextResponse.json({ error: 'Invalid verseIds' }, { status: 400 });
        }

        // 只在有 Upstash 环境变量时返回真实数据
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
            // 本地开发返回空对象
            return NextResponse.json({ stats: {} });
        }

        const redis = Redis.fromEnv();

        // 批量获取所有经文的收藏数（使用 pipeline 减少请求）
        const pipeline = redis.pipeline();
        verseIds.forEach((verseId) => {
            pipeline.get(`verse:${verseId}:favorites`);
        });

        const results = await pipeline.exec();

        // 构建返回对象 { "43-3-16": 123, "19-23-1": 456, ... }
        const stats: Record<string, number> = {};
        verseIds.forEach((verseId, index) => {
            stats[verseId] = (results[index] as number) || 0;
        });

        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Failed to fetch verses stats:', error);
        return NextResponse.json({ stats: {} });
    }
}

