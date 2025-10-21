import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

const DAILY_LIMIT = 9000; // 保守限制（免费 10K，留 1K 余量）

/**
 * 增加统计数据
 * @param type 'click' | 'favorite' | 'unfavorite'
 * @param verseId 经文数字 ID（如 "43-3-16"）
 */
export async function POST(request: Request) {
    try {
        // 只在有 Upstash 环境变量时执行
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            return NextResponse.json({ success: true, dev: true });
        }

        const redis = Redis.fromEnv();
        const { type, verseId } = await request.json();

        if (!type || !verseId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 限额保护：检查今日命令数
        const dailyCount = await redis.get<number>('daily_command_count');
        if (dailyCount && dailyCount > DAILY_LIMIT) {
            // 接近免费限额，停止统计（静默失败）
            return NextResponse.json({ success: false, reason: 'limit_exceeded' });
        }

        // 根据类型增加不同的统计
        if (type === 'click') {
            await Promise.all([
                redis.incr('stats:total_clicks'),
                redis.incr(`verse:${verseId}:clicks`),
                redis.incr('daily_command_count'), // 记录命令数
            ]);
        } else if (type === 'favorite') {
            await Promise.all([
                redis.incr('stats:total_favorites'),
                redis.incr(`verse:${verseId}:favorites`),
                redis.incr('daily_command_count'),
            ]);
        } else if (type === 'unfavorite') {
            await Promise.all([
                redis.decr('stats:total_favorites'),
                redis.decr(`verse:${verseId}:favorites`),
                redis.incr('daily_command_count'),
            ]);
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to increment stats:', error);
        // 限额或其他错误，静默失败
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

