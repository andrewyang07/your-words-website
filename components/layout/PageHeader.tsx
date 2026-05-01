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
        <header
            className="sticky top-0 z-10 border-b border-stone-900/10 bg-[#f8f5ee]/72 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0e1116]/72"
            role="banner"
        >
            <div className="mx-auto max-w-6xl px-4 py-3 md:py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Logo 和标题 - 完全从主页复制 */}
                <div className="flex items-center gap-3">
                    <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" title="返回首頁">
                        <Image
                            src="/logo-light.png"
                            alt="你的話語 Logo"
                            width={48}
                            height={48}
                            className="h-10 w-10 rounded-xl border border-stone-900/10 bg-white/55 p-1 object-contain dark:border-white/10 dark:bg-white/[0.04] dark:brightness-90 dark:contrast-125"
                            priority
                        />
                        <div className="flex items-center gap-2">
                            <h1 className="text-[1.55rem] font-semibold leading-none tracking-[0.08em] text-stone-950 dark:text-stone-50 font-chinese md:text-2xl">
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
                            className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            title="显示使用帮助"
                            aria-label="显示使用帮助"
                        >
                            <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-stone-600 dark:text-stone-300" />
                            <span className="hidden sm:inline font-chinese text-stone-600 dark:text-stone-300 text-sm">帮助</span>
                        </button>
                    )}

                    {/* 汉堡菜单按钮 */}
                    <button
                        onClick={onMenuClick}
                        className="liquid-button flex min-h-[44px] items-center gap-2 rounded-full px-3 py-2 text-stone-600 transition-colors hover:bg-white/65 dark:text-stone-300 dark:hover:bg-white/[0.08] md:px-4 touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                        title="菜单"
                        aria-label="打开菜单"
                    >
                        <Menu className="w-4 h-4 md:w-5 md:h-5 text-stone-600 dark:text-stone-300" />
                        <span className="hidden sm:inline font-chinese text-stone-600 dark:text-stone-300 text-sm">菜單</span>
                    </button>
                </div>
                </div>
            </div>
        </header>
    );
}
