import { NextResponse } from 'next/server';
import { safeRedisScanResult, safeRedisMgetResult } from '@/lib/redisUtils';
import { isValidVerseId } from '@/lib/validation';
import { decodeVerseRef } from '@/lib/bibleBookMapping';
import booksData from '@/public/data/books.json';
import bibleDataTraditional from '@/public/data/CUVT_bible.json';

import { cacheControl, RANKINGS_CACHE, EMPTY_RESULT_CACHE, NO_STORE } from '@/lib/cachePolicy';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * GET /api/rankings
 * 获取所有被收藏过的经文排行榜（包含经文内容）
 * 缓存策略：通过 Cache-Control 响应头由 CDN 缓存（s-maxage=600, stale-while-revalidate=1800）。
 * 不使用 force-dynamic / revalidate（二者组合会让缓存失效，每次请求都执行 SCAN+MGET）。
 * 空结果/Redis 故障时只缓存 30 秒，避免把故障缓存到 CDN。
 */
export async function GET() {
    // 本地开发且未配置 Redis，返回模拟数据
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({
            rankings: [
                { verseId: '43-3-16', favorites: 100, text: '神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不至滅亡，反得永生。' },
                { verseId: '19-23-1', favorites: 85, text: '耶和華是我的牧者，我必不至缺乏。' },
                { verseId: '50-4-13', favorites: 72, text: '我靠著那加給我力量的，凡事都能做。' },
                { verseId: '45-8-28', favorites: 68, text: '我們曉得萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。' },
                { verseId: '20-3-5', favorites: 55, text: '你要專心仰賴耶和華，不可倚靠自己的聰明。' },
            ],
            timestamp: Date.now(),
        }, { headers: { 'Cache-Control': NO_STORE } });
    }

    try {
        // 扫描所有 verse: 开头的 key
        const { value: keys, degraded: scanDegraded } = await safeRedisScanResult('verse:*', 100);

        if (keys.length === 0) {
            return NextResponse.json({ rankings: [], timestamp: Date.now() }, { headers: { 'Cache-Control': cacheControl(EMPTY_RESULT_CACHE) } });
        }

        // 过滤掉旧格式的 key（verse:*:favorites 和 verse:*:clicks）
        const validKeys = keys.filter((key) => {
            // 只保留规范的 verse:<book>-<chapter>-<verse>（无前导零、范围合法；历史上写入的 01-01-01 之类的重复 key 在此被忽略）
            const verseId = key.replace('verse:', '');
            return isValidVerseId(verseId);
        });

        if (validKeys.length === 0) {
            return NextResponse.json({ rankings: [], timestamp: Date.now() }, { headers: { 'Cache-Control': cacheControl(EMPTY_RESULT_CACHE) } });
        }

        // 批量获取所有 key 的值
        const { value: values, degraded: mgetDegraded } = await safeRedisMgetResult(validKeys);
        // 任何一步失败/不完整 → 结果只缓存短时间，不能把 Redis 故障固定在 CDN
        const degraded = scanDegraded || mgetDegraded;

        // 构建排行榜数据（使用 Map 去重）
        const rankingsMap = new Map<string, number>();
        validKeys.forEach((key, i) => {
            const favorites = parseInt(values[i] || '0');
            if (favorites > 0) {
                const verseId = key.replace('verse:', '');
                // 如果已存在，取最大值（防止重复）
                rankingsMap.set(verseId, Math.max(rankingsMap.get(verseId) || 0, favorites));
            }
        });

        // 转换为数组
        const rankings: Array<{ verseId: string; favorites: number }> = Array.from(rankingsMap.entries()).map(([verseId, favorites]) => ({
            verseId,
            favorites,
        }));

        // 按收藏数降序排序
        rankings.sort((a, b) => b.favorites - a.favorites);

        // 为每个经文加载内容（从 JSON 直接读取）
        const rankingsWithText = rankings.map((item) => {
            const decoded = decodeVerseRef(item.verseId);
            if (!decoded) {
                return { ...item, text: '' };
            }

            try {
                const bookData = (bibleDataTraditional as any)[decoded.bookKey];
                if (!bookData) {
                    console.error(`Book not found: ${decoded.bookKey}`);
                    return { ...item, text: '' };
                }

                const chapterData = bookData[decoded.chapter];
                if (!chapterData) {
                    console.error(`Chapter not found: ${decoded.bookKey} ${decoded.chapter}`);
                    return { ...item, text: '' };
                }

                const verseText = chapterData[decoded.verse];

                return {
                    ...item,
                    text: verseText || '',
                };
            } catch (error) {
                console.error(`Failed to load verse ${item.verseId}:`, error);
                return { ...item, text: '' };
            }
        });

        return NextResponse.json(
            {
                rankings: rankingsWithText,
                timestamp: Date.now(),
            },
            { headers: { 'Cache-Control': cacheControl(degraded || rankingsWithText.length === 0 ? EMPTY_RESULT_CACHE : RANKINGS_CACHE) } }
        );
    } catch (error) {
        console.error('Rankings API error:', error);
        // 返回空排行榜，不让页面崩溃
        return NextResponse.json(
            {
                rankings: [],
                error: 'Failed to load rankings',
            },
            { status: 500, headers: { 'Cache-Control': NO_STORE } }
        );
    }
}
