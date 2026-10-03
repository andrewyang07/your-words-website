/**
 * 统计工具函数
 * 用于发送统计数据到 API
 */

import { Verse } from '@/types/verse';
import { encodeVerseRef } from './bibleBookMapping';
import { isValidVerseId } from './validation';

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
const lastStatsTimestamp = new Map<string, number>();
const STATS_THROTTLE_MS = 3000; // 3 秒内同一操作只发送一次

// 服务端限流（HTTP 429）后的延迟队列：全局计数只是聚合统计，
// 本地收藏状态永远不依赖这些请求，也不会因 429 回滚。
const MAX_DEFERRED = 50; // 队列上限，防止无限增长
const DEFAULT_RETRY_AFTER_SECONDS = 30;
const MAX_RETRY_AFTER_SECONDS = 120;
const deferredFavorites: string[] = [];
let blockedUntil = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export type SendStatsResult = 'sent' | 'throttled' | 'deferred' | 'dropped' | 'failed' | 'skipped';

function parseRetryAfterMs(response: Response): number {
    const header = Number(response.headers?.get?.('Retry-After'));
    const seconds = Number.isFinite(header) && header > 0 ? header : DEFAULT_RETRY_AFTER_SECONDS;
    return Math.min(seconds, MAX_RETRY_AFTER_SECONDS) * 1000;
}

function deferFavorite(verseId: string): SendStatsResult {
    if (deferredFavorites.includes(verseId)) return 'deferred';
    if (deferredFavorites.length >= MAX_DEFERRED) {
        // 队列满：放弃这次全局计数（不影响本地收藏）
        return 'dropped';
    }
    deferredFavorites.push(verseId);
    return 'deferred';
}

function scheduleFlush() {
    if (flushTimer !== null || deferredFavorites.length === 0) return;
    const delay = Math.max(1000, blockedUntil - Date.now());
    flushTimer = setTimeout(() => {
        flushTimer = null;
        void flushDeferredFavorites();
    }, delay);
}

async function flushDeferredFavorites(): Promise<void> {
    while (deferredFavorites.length > 0 && Date.now() >= blockedUntil) {
        const verseId = deferredFavorites[0];
        const result = await postFavorite(verseId);
        if (result === 'deferred') {
            // 仍被限流：保留队列，等待下一个窗口
            break;
        }
        deferredFavorites.shift();
    }
    scheduleFlush();
}

/** 实际发送一次 favorite；429 时进入退避，不抛错。 */
async function postFavorite(verseId: string): Promise<SendStatsResult> {
    try {
        const response = await fetch('/api/stats/increment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'favorite', verseId }),
        });

        if (response.ok) return 'sent';

        if (response.status === 429) {
            blockedUntil = Date.now() + parseRetryAfterMs(response);
            console.info('[stats] Global favorite count update is rate-limited; your favorite is saved locally and the count will be retried shortly.');
            return 'deferred';
        }
        // 其他失败（400/5xx）：静默放弃，本地状态不受影响
        return 'failed';
    } catch (error) {
        console.error('Stats tracking failed:', error);
        return 'failed';
    }
}

/** 仅供测试：重置模块内状态。 */
export function __resetStatsStateForTests() {
    lastStatsTimestamp.clear();
    deferredFavorites.length = 0;
    blockedUntil = 0;
    if (flushTimer !== null) clearTimeout(flushTimer);
    flushTimer = null;
}

/**
 * 发送统计数据（带防抖保护和错误处理）。
 *
 * 契约：永不抛错、永不影响本地收藏状态。调用方不应 await 它来更新 UI ——
 * 星标的本地状态在调用前已经同步更新。
 * 遇到 429 时：不回滚、不报错，把该次全局计数放入有上限的延迟队列，按 Retry-After 退避后重试。
 *
 * @param action 统计类型：'click' | 'favorite'（服务端只接受 'favorite'）
 * @param verseId 经文数字 ID
 */
export async function sendStats(action: 'click' | 'favorite', verseId: string): Promise<SendStatsResult> {
    if (typeof window === 'undefined') return 'skipped';

    // 服务端只统计收藏，且会拒绝非法 verseId（400）；客户端提前跳过，省一次请求
    if (action !== 'favorite' || !isValidVerseId(verseId)) return 'skipped';

    // 客户端防抖：同一操作 3 秒内只发送一次
    const now = Date.now();
    const key = `stats_${action}_${verseId}`;
    const lastSent = lastStatsTimestamp.get(key) || 0;

    if (now - lastSent < STATS_THROTTLE_MS) {
        return 'throttled'; // 静默跳过，不抛错
    }

    // 正在退避：直接排队，不再打服务端
    if (now < blockedUntil) {
        lastStatsTimestamp.set(key, now);
        const queued = deferFavorite(verseId);
        scheduleFlush();
        return queued;
    }

    const result = await postFavorite(verseId);
    if (result === 'sent') {
        lastStatsTimestamp.set(key, now);
    } else if (result === 'deferred') {
        lastStatsTimestamp.set(key, now);
        const queued = deferFavorite(verseId);
        scheduleFlush();
        return queued;
    }
    return result;
}

/**
 * 记录新用户访问（带错误处理）
 */
export async function trackUser(): Promise<void> {
    // 检查是否已记录过
    if (typeof window === 'undefined') return;

    const hasTracked = localStorage.getItem('user-tracked');
    if (hasTracked) return;

    try {
        const response = await fetch('/api/stats/track-user', {
            method: 'POST',
        });
        if (response.ok) {
            localStorage.setItem('user-tracked', 'true');
        } else if (response.status === 429) {
            // 被限流：不标记已追踪，下次访问再试；对用户无任何可见影响
            console.info('[stats] User tracking is rate-limited; will retry on a later visit.');
        }
    } catch (error) {
        console.error('Track user error:', error);
        // 静默失败，不影响用户体验
    }
}
