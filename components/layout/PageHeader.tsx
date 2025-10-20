'use client';

import { Menu, HelpCircle } from 'lucide-react';
import Image from 'next/image';

interface PageHeaderProps {
    onMenuClick: () => void;
    onHelpClick?: () => void;
    showHelp?: boolean;
    rightContent?: React.ReactNode; // For custom buttons
    subtitle?: React.ReactNode; // For "筆記本 BETA" or other subtitle
}

export default function PageHeader({ 
    onMenuClick, 
    onHelpClick,
    showHelp = true,
    rightContent, 
    subtitle 
}: PageHeaderProps) {
    return (
        <header className="relative px-4 py-4 md:py-6" role="banner">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                {/* Logo 和标题 - 完全从主页复制 */}
                <div className="flex items-center gap-3">
                    <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" title="返回首頁">
                        <Image
                            src="/logo-light.png"
                            alt="你的話語 Logo"
                            width={48}
                            height={48}
                            className="w-10 h-10 md:w-12 md:h-12 dark:brightness-90 dark:contrast-125"
                            priority
                        />
                        <div className="flex items-center gap-2">
                            <h1
                                className="text-2xl md:text-4xl font-extrabold font-chinese tracking-wide text-bible-800 dark:text-bible-200"
                                style={{
                                    textShadow: '0 0 20px rgba(190, 158, 93, 0.3), 0 0 40px rgba(190, 158, 93, 0.15)',
                                }}
                            >
                                你的話語
                            </h1>
                            {subtitle && (
                                <div className="text-sm md:text-base font-chinese">
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </a>
                </div>

                {/* 右侧按钮区域 */}
                <div className="flex items-center gap-2">
                    {/* 自定义按钮内容 */}
                    {rightContent}
                    
                    {/* 帮助按钮 (可选) */}
                    {showHelp && onHelpClick && (
                        <button
                            onClick={onHelpClick}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            title="显示使用帮助"
                            aria-label="显示使用帮助"
                        >
                            <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                            <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">帮助</span>
                        </button>
                    )}
                    
                    {/* 汉堡菜单按钮 */}
                    <button
                        onClick={onMenuClick}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-bible-100 dark:bg-gray-700 hover:bg-bible-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                        title="菜单"
                        aria-label="打开菜单"
                    >
                        <Menu className="w-4 h-4 md:w-5 md:h-5 text-bible-700 dark:text-bible-300" />
                        <span className="hidden sm:inline font-chinese text-bible-700 dark:text-bible-300 text-sm">菜單</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
