'use client';

import { Component, ReactNode } from 'react';
import { logError } from '@/lib/errorHandler';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary 组件
 * 捕获子组件渲染错误，防止整个应用崩溃
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // 更新 state，下次渲染时显示错误 UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // 记录错误信息
        logError('ErrorBoundary', { error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // 自定义错误 UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-bible-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                        <div className="mb-4">
                            <span className="text-6xl">😔</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 font-chinese">
                            出現錯誤
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 font-chinese">
                            很抱歉，應用遇到了一個問題。請刷新頁面重試。
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-bible-600 hover:bg-bible-700 text-white rounded-lg transition-colors font-chinese"
                        >
                            刷新頁面
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

