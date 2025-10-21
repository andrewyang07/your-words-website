import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

/**
 * 每日重置命令计数器
 * Vercel Cron Job 会在每天 UTC 00:00 调用此接口
 */
export async function GET(request: Request) {
    try {
        // 验证 Cron 密钥（防止未授权访问）
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 只在有 Upstash 环境变量时执行
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            return NextResponse.json({ success: true, dev: true });
        }

        const redis = Redis.fromEnv();

        // 重置每日命令计数器
        await redis.set('daily_command_count', 0);

        return NextResponse.json({ success: true, reset: true });
    } catch (error) {
        console.error('Failed to reset daily count:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
