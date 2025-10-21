import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

/**
 * 记录新用户访问
 */
export async function POST() {
    try {
        // 只在有 Upstash 环境变量时执行
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            return NextResponse.json({ success: true, dev: true });
        }

        const redis = Redis.fromEnv();

        await Promise.all([
            redis.incr('stats:total_users'),
            redis.incr('daily_command_count'),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to track user:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

