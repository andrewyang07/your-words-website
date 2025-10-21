import { NextResponse } from 'next/server';
import { safeRedisScan, safeRedisMget } from '@/lib/redisUtils';
import { decodeVerseRef } from '@/lib/bibleBookMapping';
import booksData from '@/public/data/books.json';

export const dynamic = 'force-dynamic'; // 强制动态渲染
export const revalidate = 3600; // 缓存1小时

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

/**
 * GET /api/rankings
 * 获取所有被收藏过的经文排行榜（包含经文内容）
 * 使用 ISR 缓存策略，每小时自动重新生成
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
        });
    }

    try {
        // 扫描所有 verse: 开头的 key
        const keys = await safeRedisScan('verse:*', 100);

        if (keys.length === 0) {
            return NextResponse.json({ rankings: [], timestamp: Date.now() });
        }

        // 过滤掉旧格式的 key（verse:*:favorites 和 verse:*:clicks）
        const validKeys = keys.filter((key) => {
            // 只保留格式为 verse:数字-数字-数字 的 key
            const verseId = key.replace('verse:', '');
            return !verseId.includes(':') && /^\d+-\d+-\d+$/.test(verseId);
        });

        if (validKeys.length === 0) {
            return NextResponse.json({ rankings: [], timestamp: Date.now() });
        }

        // 批量获取所有 key 的值
        const values = await safeRedisMget(validKeys);

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

        // 动态导入 dataLoader 并加载经文内容
        const { loadChapterVerses } = await import('@/lib/dataLoader');

        // 为每个经文加载内容
        const rankingsWithText = await Promise.all(
            rankings.map(async (item) => {
                const decoded = decodeVerseRef(item.verseId);
                if (!decoded) {
                    return { ...item, text: '' };
                }

                try {
                    const chapterVerses = await loadChapterVerses(decoded.bookKey, decoded.chapter, 'traditional');
                    const verseData = chapterVerses.find((v) => v.verse === decoded.verse);
                    return {
                        ...item,
                        text: verseData?.text || '',
                    };
                } catch (error) {
                    console.error(`Failed to load verse ${item.verseId}:`, error);
                    return { ...item, text: '' };
                }
            })
        );

        return NextResponse.json({
            rankings: rankingsWithText,
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
