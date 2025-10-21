/**
 * 统计工具函数
 * 用于发送统计数据到 API
 */

import { Verse } from '@/types/verse';
import { encodeVerseRef } from './bibleBookMapping';

/**
 * 获取经文的数字 ID（用于统计）
 * @param verse 经文对象
 * @returns 数字 ID，格式：bookIndex-chapter-verse（如 "43-3-16"）
 */
export function getVerseNumericId(verse: Verse): string {
    // 从 verse.id 中提取 bookKey
    const parts = verse.id.split('-');
    const verseNum = parseInt(parts[parts.length - 1]);
    const chapterNum = parseInt(parts[parts.length - 2]);
    const bookKey = parts.slice(0, -2).join('-');

    return encodeVerseRef(bookKey, chapterNum, verseNum);
}

// 客户端防抖 - 避免频繁请求
const lastSendTime: Record<string, number> = {};
const THROTTLE_MS = 3000; // 3 秒内同一操作只发送一次

/**
 * 发送统计数据（带防抖保护）
 * @param type 统计类型：'click' | 'favorite' | 'unfavorite'
 * @param verseId 经文数字 ID
 */
export async function sendStats(type: 'click' | 'favorite' | 'unfavorite', verseId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    // 客户端防抖：同一操作 3 秒内只发送一次
    const key = `${type}-${verseId}`;
    const now = Date.now();
    if (lastSendTime[key] && now - lastSendTime[key] < THROTTLE_MS) {
        return; // 防抖：忽略重复请求
    }
    lastSendTime[key] = now;

    try {
        await fetch('/api/stats/increment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, verseId }),
        });
    } catch (error) {
        // 静默失败，不影响用户体验
        console.error('Stats error:', error);
    }
}

/**
 * 记录新用户访问
 */
export async function trackUser(): Promise<void> {
    // 检查是否已记录过
    if (typeof window === 'undefined') return;
    
    const hasTracked = localStorage.getItem('user-tracked');
    if (hasTracked) return;

    try {
        await fetch('/api/stats/track-user', {
            method: 'POST',
        });
        localStorage.setItem('user-tracked', 'true');
    } catch (error) {
        console.error('Track user error:', error);
    }
}

