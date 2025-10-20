// 字体工具函数
import { Language } from '@/types/verse';

/**
 * 根据语言返回合适的字体类名
 */
export function getFontClass(language: Language): string {
    return language === 'english' ? 'font-english' : 'font-chinese';
}

/**
 * 根据语言返回内联字体样式（用于不方便使用className的地方）
 */
export function getFontStyle(language: Language): React.CSSProperties {
    if (language === 'english') {
        return {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        };
    }
    return {};
}

