'use client';

import { Menu, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import { useAppStore } from '@/stores/useAppStore';
import { getMenuCopy } from '@/lib/uiScript';

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
    const language = useAppStore((s) => s.language);
    const copy = getMenuCopy(language);

    return (
        <header
            className="sticky top-0 z-50 border-b border-stone-900/10 bg-[#f8f5ee]/72 backdrop-blur-2xl dark:border-amber-200/10 dark:bg-[#15120e]/82"
            role="banner"
        >
            <div className="relative z-[1] mx-auto max-w-6xl px-3 py-3 sm:px-4 md:py-4">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                {/* Logo 和标题 - 窄屏不截断品牌名；简/繁随 UI script */}
                <div className="flex shrink-0 items-center gap-2 overflow-visible sm:gap-3">
                    <a href="/" className="group flex shrink-0 items-center gap-2 overflow-visible transition-opacity hover:opacity-90 sm:gap-3" title={copy.homeTitle}>
                        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-900/10 bg-white/55 p-1 dark:border-white/10 dark:bg-white/[0.04] sm:h-10 sm:w-10">
                            <Image
                                src="/logo-light.png"
                                alt={`${copy.brand} Logo`}
                                width={40}
                                height={40}
                                className="h-full w-full rounded-lg object-contain dark:brightness-90 dark:contrast-125"
                                priority
                            />
                        </span>
                        <span className="shrink-0 py-0.5">
                            <span className="block whitespace-nowrap text-[1.15rem] font-semibold leading-[1.22] tracking-[0.04em] text-stone-950 dark:text-stone-50 font-chinese sm:text-[1.55rem] sm:tracking-[0.08em] md:text-2xl">
                                {copy.brand}
                            </span>
                            {subtitle && (
                                <span className="mt-0.5 hidden text-[10px] leading-none tracking-[0.28em] text-stone-500 dark:text-stone-400 sm:flex">
                                    {subtitle}
                                </span>
                            )}
                        </span>
                    </a>
                </div>

                {/* 右侧按钮区域 */}
                <div className="liquid-glass flex min-w-0 shrink items-center gap-0.5 rounded-full p-1 sm:gap-1 md:gap-1.5">
                    {/* 自定义按钮内容 */}
                    {rightContent}

                    {/* 帮助按钮 (可选) */}
                    {showHelp && onHelpClick && (
                        <button
                            onClick={onHelpClick}
                            className="flex min-h-[44px] items-center gap-2 rounded-xl px-2.5 py-2 text-stone-600 transition hover:bg-white/55 dark:text-stone-300 dark:hover:bg-white/[0.06] sm:px-3 md:px-4 touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                            title={copy.help}
                            aria-label={copy.help}
                        >
                            <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-stone-600 dark:text-stone-300" />
                            <span className="hidden sm:inline font-chinese text-stone-600 dark:text-stone-300 text-sm">{copy.help}</span>
                        </button>
                    )}

                    {/* 汉堡菜单按钮 */}
                    <button
                        onClick={onMenuClick}
                        className="flex min-h-[44px] items-center gap-2 rounded-xl px-2.5 py-2 text-stone-600 transition hover:bg-white/55 dark:text-stone-300 dark:hover:bg-white/[0.06] sm:px-3 md:px-4 touch-manipulation"
                        style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                        title={copy.menuButton}
                        aria-label={copy.openMenu}
                    >
                        <Menu className="w-4 h-4 md:w-5 md:h-5 text-stone-600 dark:text-stone-300" />
                        <span className="hidden sm:inline font-chinese text-stone-600 dark:text-stone-300 text-sm">{copy.menuButton}</span>
                    </button>
                </div>
                </div>
            </div>
        </header>
    );
}
