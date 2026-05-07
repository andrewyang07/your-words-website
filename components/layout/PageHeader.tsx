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
            className="sticky top-0 z-50 border-b border-stone-900/10 bg-[#f8f5ee]/72 backdrop-blur-2xl dark:border-amber-200/10 dark:bg-[#15120e]/82"
            role="banner"
        >
            <div className="relative z-[1] mx-auto max-w-6xl px-4 py-3 md:py-4">
                <div className="flex items-center justify-between gap-3">
                {/* Logo 和标题 - 与主页标题行保持同一尺寸 */}
                <div className="flex min-w-0 flex-1 items-center gap-3 overflow-visible">
                    <a href="/" className="group flex min-w-0 items-center gap-2.5 overflow-visible transition-opacity hover:opacity-90 sm:gap-3" title="返回首頁">
                        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-900/10 bg-white/55 p-1 dark:border-white/10 dark:bg-white/[0.04] sm:h-10 sm:w-10">
                            <Image
                                src="/logo-light.png"
                                alt="你的話語 Logo"
                                width={40}
                                height={40}
                                className="h-full w-full rounded-lg object-contain dark:brightness-90 dark:contrast-125"
                                priority
                            />
                        </span>
                        <span className="min-w-0 overflow-visible py-0.5">
                            <h1 className="truncate text-[1.32rem] font-semibold leading-[1.22] tracking-[0.05em] text-stone-950 dark:text-stone-50 font-chinese sm:text-[1.55rem] sm:tracking-[0.08em] md:text-2xl">
                                你的話語
                            </h1>
                            {subtitle && (
                                <span className="mt-0.5 hidden text-[10px] leading-none tracking-[0.28em] text-stone-500 dark:text-stone-400 sm:flex">
                                    {subtitle}
                                </span>
                            )}
                        </span>
                    </a>
                </div>

                {/* 右侧按钮区域 */}
                <div className="liquid-glass flex shrink-0 items-center gap-1 rounded-full p-1 md:gap-1.5">
                    {/* 自定义按钮内容 */}
                    {rightContent}

                    {/* 帮助按钮 (可选) */}
                    {showHelp && onHelpClick && (
                        <button
                            onClick={onHelpClick}
                            className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-stone-600 transition hover:bg-white/55 dark:text-stone-300 dark:hover:bg-white/[0.06] md:px-4 touch-manipulation"
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
                        className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-stone-600 transition hover:bg-white/55 dark:text-stone-300 dark:hover:bg-white/[0.06] md:px-4 touch-manipulation"
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
