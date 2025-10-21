import { Redis } from '@upstash/redis';

/**
 * 创建 Redis 客户端
 * @throws {Error} 如果未配置 Redis 凭证
 */
export function createRedisClient() {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        throw new Error('Redis credentials not configured');
    }

    return new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });
}

/**
 * 安全的 Redis GET 操作，带错误处理
 * @param key Redis key
 * @param defaultValue 默认值
 * @returns 值或默认值
 */
export async function safeRedisGet(key: string, defaultValue: string = '0'): Promise<string> {
    try {
        const redis = createRedisClient();
        const value = await redis.get(key);
        return value?.toString() || defaultValue;
    } catch (error) {
        console.error(`Redis GET failed for key ${key}:`, error);
        return defaultValue;
    }
}

/**
 * 安全的 Redis INCR 操作，带错误处理
 * @param key Redis key
 * @returns 是否成功
 */
export async function safeRedisIncr(key: string): Promise<boolean> {
    try {
        const redis = createRedisClient();
        await redis.incr(key);
        return true;
    } catch (error) {
        console.error(`Redis INCR failed for key ${key}:`, error);
        return false;
    }
}

/**
 * 安全的 Redis MGET 操作，带错误处理
 * @param keys Redis keys 数组
 * @returns 值数组或 null 数组
 */
export async function safeRedisMget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];

    try {
        const redis = createRedisClient();
        const values = await redis.mget(...keys);
        return values.map((v) => v?.toString() || null);
    } catch (error) {
        console.error(`Redis MGET failed:`, error);
        return keys.map(() => null);
    }
}

/**
 * 安全的 Redis SCAN 操作，带错误处理和限流
 * @param pattern 匹配模式
 * @param maxScans 最大扫描次数
 * @returns 匹配的 keys 数组
 */
export async function safeRedisScan(pattern: string, maxScans: number = 100): Promise<string[]> {
    try {
        const redis = createRedisClient();
        let cursor = 0;
        const allKeys: string[] = [];
        let scanCount = 0;

        do {
            if (scanCount++ > maxScans) {
                console.warn(`Redis SCAN exceeded max iterations (${maxScans})`);
                break;
            }

            const [newCursor, keys] = await redis.scan(cursor, {
                match: pattern,
                count: 100,
            });
            cursor = parseInt(newCursor);

            if (keys && keys.length > 0) {
                allKeys.push(...keys);
            }
        } while (cursor !== 0);

        return allKeys;
    } catch (error) {
        console.error(`Redis SCAN failed for pattern ${pattern}:`, error);
        return [];
    }
}
