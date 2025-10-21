import { NextResponse } from 'next/server';
import { safeRedisScan, safeRedisMget } from '@/lib/redisUtils';
import { decodeVerseRef } from '@/lib/bibleBookMapping';
import booksData from '@/public/data/books.json';
import bibleDataTraditional from '@/public/data/CUVT_bible.json';

export const dynamic = 'force-dynamic';

// 本地开发环境检测
const isDevelopment = process.env.NODE_ENV === 'development';
const isRedisConfigured = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

interface TopVerse {
    verseId: string;
    book: string;
    chapter: number;
    verse: number;
    favorites: number;
    text?: string; // 经文内容
}

/**
 * GET /api/stats/top-verses
 * 获取热门经文排行榜（Top 7）
 */
export async function GET() {
    // 本地开发且未配置 Redis，返回模拟数据
    if (isDevelopment && !isRedisConfigured) {
        return NextResponse.json({
            topVerses: [
                {
                    verseId: '43-3-16',
                    book: '約翰福音',
                    chapter: 3,
                    verse: 16,
                    favorites: 10,
                    text: '神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不至滅亡，反得永生。',
                },
                { verseId: '19-23-1', book: '詩篇', chapter: 23, verse: 1, favorites: 8, text: '耶和華是我的牧者，我必不至缺乏。' },
                { verseId: '50-4-13', book: '腓立比書', chapter: 4, verse: 13, favorites: 7, text: '我靠著那加給我力量的，凡事都能做。' },
                {
                    verseId: '45-8-28',
                    book: '羅馬書',
                    chapter: 8,
                    verse: 28,
                    favorites: 6,
                    text: '我們曉得萬事都互相效力，叫愛神的人得益處，就是按他旨意被召的人。',
                },
                { verseId: '20-3-5', book: '箴言', chapter: 3, verse: 5, favorites: 5, text: '你要專心仰賴耶和華，不可倚靠自己的聰明。' },
                { verseId: '58-11-1', book: '希伯來書', chapter: 11, verse: 1, favorites: 4, text: '信就是所望之事的實底，是未見之事的確據。' },
                {
                    verseId: '40-5-16',
                    book: '馬太福音',
                    chapter: 5,
                    verse: 16,
                    favorites: 3,
                    text: '你們的光也當這樣照在人前，叫他們看見你們的好行為，便將榮耀歸給你們在天上的父。',
                },
            ],
        });
    }

    try {
        // 扫描所有 verse: 开头的 key（新格式）
        const keys = await safeRedisScan('verse:*', 100);

        if (keys.length === 0) {
            return NextResponse.json({ topVerses: [] });
        }

        // 过滤掉旧格式的 key（verse:*:favorites 和 verse:*:clicks）
        const validKeys = keys.filter((key) => {
            const verseId = key.replace('verse:', '');
            return !verseId.includes(':') && /^\d+-\d+-\d+$/.test(verseId);
        });

        if (validKeys.length === 0) {
            return NextResponse.json({ topVerses: [] });
        }

        // 批量获取所有 key 的值
        const values = await safeRedisMget(validKeys);

        // 构建经文统计数据（使用 Map 去重）
        const versesMap = new Map<string, number>();
        validKeys.forEach((key, i) => {
            const favorites = parseInt(values[i] || '0');
            if (favorites > 0) {
                const verseId = key.replace('verse:', '');
                versesMap.set(verseId, Math.max(versesMap.get(verseId) || 0, favorites));
            }
        });

        // 转换为数组
        const versesWithCounts: Array<{ verseId: string; favorites: number }> = Array.from(versesMap.entries()).map(
            ([verseId, favorites]) => ({
                verseId,
                favorites,
            })
        );

        // 按收藏数排序，取 Top 7
        const sorted = versesWithCounts.sort((a, b) => b.favorites - a.favorites).slice(0, 7);

        // 将 verseId 转换为书卷名称并加载经文内容
        const topVerses: TopVerse[] = sorted.map((item) => {
            const decoded = decodeVerseRef(item.verseId);
            if (!decoded) {
                return {
                    verseId: item.verseId,
                    book: '未知',
                    chapter: 0,
                    verse: 0,
                    favorites: item.favorites,
                    text: '',
                };
            }

            // 查找书卷名称（使用繁体中文）
            const book = booksData.books.find((b) => b.key === decoded.bookKey);

            // 从 JSON 直接读取经文内容
            try {
                const bookData = (bibleDataTraditional as any)[decoded.bookKey];
                if (!bookData) {
                    console.error(`Book not found: ${decoded.bookKey}`);
                    return {
                        verseId: item.verseId,
                        book: book?.nameTraditional || '未知',
                        chapter: decoded.chapter,
                        verse: decoded.verse,
                        favorites: item.favorites,
                        text: '',
                    };
                }

                const chapterData = bookData[decoded.chapter];
                if (!chapterData) {
                    console.error(`Chapter not found: ${decoded.bookKey} ${decoded.chapter}`);
                    return {
                        verseId: item.verseId,
                        book: book?.nameTraditional || '未知',
                        chapter: decoded.chapter,
                        verse: decoded.verse,
                        favorites: item.favorites,
                        text: '',
                    };
                }

                const verseText = chapterData[decoded.verse];

                return {
                    verseId: item.verseId,
                    book: book?.nameTraditional || '未知',
                    chapter: decoded.chapter,
                    verse: decoded.verse,
                    favorites: item.favorites,
                    text: verseText || '',
                };
            } catch (error) {
                console.error(`Failed to load verse ${item.verseId}:`, error);
                return {
                    verseId: item.verseId,
                    book: book?.nameTraditional || '未知',
                    chapter: decoded.chapter,
                    verse: decoded.verse,
                    favorites: item.favorites,
                    text: '',
                };
            }
        });

        return NextResponse.json({ topVerses });
    } catch (error) {
        console.error('Failed to fetch top verses:', error);
        // 返回空数组，不影响页面渲染
        return NextResponse.json({ topVerses: [] });
    }
}
