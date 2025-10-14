/**
 * 统一的错误处理和日志工具
 */

/**
 * 记录错误信息
 * @param context 错误发生的上下文
 * @param error 错误对象
 */
export function logError(context: string, error: unknown): void {
    if (process.env.NODE_ENV === 'development') {
        console.error(`[${context}]`, error);
    }
    // 生产环境可以集成错误追踪服务（如 Sentry）
}

/**
 * 记录警告信息
 * @param context 警告发生的上下文
 * @param message 警告消息
 */
export function logWarning(context: string, message: string): void {
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[${context}]`, message);
    }
}

/**
 * 格式化错误消息，用于用户显示
 * @param error 错误对象
 * @returns 用户友好的错误消息
 */
export function formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return '發生未知錯誤，請稍後重試';
}

