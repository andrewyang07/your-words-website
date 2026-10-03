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
 * 带降级标记的结果：`degraded: true` 表示 Redis 未配置 / 出错 / 结果不完整，
 * `value` 只是兜底值，调用方**不得**把它当作真实数据长时间缓存。
 */
export interface RedisResult<T> {
    value: T;
    degraded: boolean;
}

/**
 * Redis GET，显式返回是否降级（与"key 不存在 → 默认值"区分开）
 */
export async function safeRedisGetResult(key: string, defaultValue: string = '0'): Promise<RedisResult<string>> {
    try {
        const redis = createRedisClient();
        const value = await redis.get(key);
        return { value: value?.toString() || defaultValue, degraded: false };
    } catch (error) {
        console.error(`Redis GET failed for key ${key}:`, error);
        return { value: defaultValue, degraded: true };
    }
}

/**
 * 安全的 Redis GET 操作，带错误处理
 * @param key Redis key
 * @param defaultValue 默认值
 * @returns 值或默认值
 */
export async function safeRedisGet(key: string, defaultValue: string = '0'): Promise<string> {
    return (await safeRedisGetResult(key, defaultValue)).value;
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
 * Redis MGET，显式返回是否降级（失败时 values 全为 null，degraded = true）
 */
export async function safeRedisMgetResult(keys: string[]): Promise<RedisResult<(string | null)[]>> {
    if (keys.length === 0) return { value: [], degraded: false };

    try {
        const redis = createRedisClient();
        const values = await redis.mget(...keys);
        return { value: values.map((v) => v?.toString() || null), degraded: false };
    } catch (error) {
        console.error(`Redis MGET failed:`, error);
        return { value: keys.map(() => null), degraded: true };
    }
}

/**
 * 安全的 Redis MGET 操作，带错误处理
 * @param keys Redis keys 数组
 * @returns 值数组或 null 数组
 */
export async function safeRedisMget(keys: string[]): Promise<(string | null)[]> {
    return (await safeRedisMgetResult(keys)).value;
}

/**
 * Redis SCAN，显式返回是否降级：出错（含中途出错）或超过 maxScans 导致结果不完整时 degraded = true。
 */
export async function safeRedisScanResult(pattern: string, maxScans: number = 100): Promise<RedisResult<string[]>> {
    try {
        const redis = createRedisClient();
        let cursor = 0;
        const allKeys: string[] = [];
        let scanCount = 0;
        let degraded = false;

        do {
            if (scanCount++ > maxScans) {
                console.warn(`Redis SCAN exceeded max iterations (${maxScans})`);
                degraded = true; // 结果不完整
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

        return { value: allKeys, degraded };
    } catch (error) {
        console.error(`Redis SCAN failed for pattern ${pattern}:`, error);
        return { value: [], degraded: true };
    }
}

/**
 * 安全的 Redis SCAN 操作，带错误处理和限流
 * @param pattern 匹配模式
 * @param maxScans 最大扫描次数
 * @returns 匹配的 keys 数组
 */
export async function safeRedisScan(pattern: string, maxScans: number = 100): Promise<string[]> {
    return (await safeRedisScanResult(pattern, maxScans)).value;
}
