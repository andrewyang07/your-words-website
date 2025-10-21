import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { decodeVerseRef } from '@/lib/bibleBookMapping';
import booksData from '@/public/data/books.json';

export const runtime = 'edge';

interface TopVerse {
    verseId: string;
    book: string;
    chapter: number;
    verse: number;
    favorites: number;
}

/**
 * 获取热门经文排行榜（Top 5）
 */
export async function GET() {
    try {
        // 只在有 Upstash 环境变量时返回真实数据
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            // 本地开发返回 Mock 数据
            return NextResponse.json({
                topVerses: [
                    { verseId: '43-3-16', book: '約翰福音', chapter: 3, verse: 16, favorites: 0 },
                    { verseId: '19-23-1', book: '詩篇', chapter: 23, verse: 1, favorites: 0 },
                    { verseId: '50-4-13', book: '腓立比書', chapter: 4, verse: 13, favorites: 0 },
                    { verseId: '45-8-28', book: '羅馬書', chapter: 8, verse: 28, favorites: 0 },
                    { verseId: '20-3-5', book: '箴言', chapter: 3, verse: 5, favorites: 0 },
                ],
            });
        }

        const redis = Redis.fromEnv();

        // 获取所有 verse:*:favorites 的 keys
        const keys = await redis.keys('verse:*:favorites');

        // 获取每个 key 的值
        const versesWithCounts = await Promise.all(
            keys.map(async (key) => {
                const count = (await redis.get<number>(key)) || 0;
                // 从 key 中提取 verseId: "verse:43-3-16:favorites" -> "43-3-16"
                const verseId = key.replace('verse:', '').replace(':favorites', '');
                return { verseId, favorites: count };
            })
        );

        // 按收藏数排序，取 Top 5
        const sorted = versesWithCounts.sort((a, b) => b.favorites - a.favorites).slice(0, 5);

        // 将 verseId 转换为书卷名称
        const topVerses: TopVerse[] = sorted.map((item) => {
            const decoded = decodeVerseRef(item.verseId);
            if (!decoded) {
                return {
                    verseId: item.verseId,
                    book: '未知',
                    chapter: 0,
                    verse: 0,
                    favorites: item.favorites,
                };
            }

            // 查找书卷名称
            const book = booksData.books.find((b) => b.key === decoded.bookKey);

            return {
                verseId: item.verseId,
                book: book?.name || '未知',
                chapter: decoded.chapter,
                verse: decoded.verse,
                favorites: item.favorites,
            };
        });

        return NextResponse.json({ topVerses });
    } catch (error) {
        console.error('Failed to fetch top verses:', error);
        return NextResponse.json({ topVerses: [] });
    }
}

