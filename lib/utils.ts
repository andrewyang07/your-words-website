// 通用工具函数

import { Verse } from '@/types/verse';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind CSS 类名合并工具
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 格式化经文引用
export function formatVerseReference(verse: Verse): string {
    return `${verse.book} ${verse.chapter}:${verse.verse}`;
}

// 随机打乱数组
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 根据经文长度确定卡片大小
export function getCardSize(verse: Verse): 'small' | 'medium' | 'large' {
    if (verse.priority && verse.priority >= 5) return 'large';
    if (verse.priority && verse.priority >= 3) return 'medium';

    const length = verse.text.length;
    if (length > 100) return 'large';
    if (length > 50) return 'medium';
    return 'small';
}

const MASK_CHAR = '〇';
const PUNCTUATION_REGEX = /[，。！？；：,.!?;:]/;

function isMaskableChar(char: string): boolean {
    return char.trim() !== '' && !PUNCTUATION_REGEX.test(char);
}

function maskTextSegment(segment: string, visibleChars: number): string {
    const chars = segment.split('');
    const maskableCount = chars.filter(isMaskableChar).length;

    if (maskableCount <= 1) return segment;

    // “固定 N 字”代表最多提示 N 个字；未展开时每个有效片段至少保留 1 个遮字。
    const charsToShow = Math.min(Math.max(visibleChars, 0), maskableCount - 1);
    let shown = 0;

    return chars
        .map((char) => {
            if (!isMaskableChar(char)) return char;

            if (shown < charsToShow) {
                shown += 1;
                return char;
            }

            return MASK_CHAR;
        })
        .join('');
}

// 遮罩经文文本
export function maskVerseText(text: string, mode: 'punctuation' | 'prefix', visibleChars: number): string {
    if (mode === 'prefix') {
        // 开头提示：最多显示前 X 个字，其余遮罩；短文本也至少遮 1 个字。
        return maskTextSegment(text, visibleChars);
    }

    // 每句提示：每个标点分段最多显示前 X 个字，其余遮罩；短句也至少遮 1 个字。
    return text
        .split(/([，。！？；：,.!?;:])/)
        .map((segment) => (PUNCTUATION_REGEX.test(segment) ? segment : maskTextSegment(segment, visibleChars)))
        .join('');
}
