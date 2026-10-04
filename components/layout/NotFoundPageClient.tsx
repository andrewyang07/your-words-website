'use client';

import { useState } from 'react';
import { SearchX } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import { useAppStore } from '@/stores/useAppStore';
import { useScriptPick } from '@/lib/useScriptPick';

const LINK_CLASS =
    'inline-flex min-h-[44px] items-center justify-center rounded-full border border-stone-900/10 bg-white/55 px-5 py-2 text-sm font-medium text-stone-800 transition hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-100 dark:hover:bg-white/[0.1] font-chinese';
const PRIMARY_LINK_CLASS =
    'inline-flex min-h-[44px] items-center justify-center rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white font-chinese';

/** Friendly 404 page in the site's layout; copy follows the UI script (简/繁). */
export default function NotFoundPageClient() {
    const pick = useScriptPick();
    const { theme, setTheme, language, setLanguage } = useAppStore();
    const [showSideMenu, setShowSideMenu] = useState(false);

    return (
        <div className="min-h-screen yw-page">
            <PageHeader onMenuClick={() => setShowSideMenu(true)} showHelp={false} />
            <SideMenu
                isOpen={showSideMenu}
                onClose={() => setShowSideMenu(false)}
                theme={theme}
                onThemeChange={setTheme}
                language={language}
                onLanguageChange={setLanguage}
            />
            <main className="yw-shell">
                <div className="yw-panel p-8 text-center md:p-12">
                    <div className="yw-icon-tile mx-auto mb-5 h-14 w-14">
                        <SearchX className="h-7 w-7 text-stone-700 dark:text-stone-200" aria-hidden="true" />
                    </div>
                    <p className="text-sm tracking-[0.3em] text-stone-500 dark:text-stone-400">404</p>
                    <h1 className="mt-2 text-2xl font-bold text-stone-950 dark:text-stone-50 font-chinese md:text-3xl">
                        {pick('找不到這個頁面', '找不到这个页面')}
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-stone-600 dark:text-stone-400 font-chinese leading-relaxed">
                        {pick('這個網址可能已經更改，或根本不存在。回到首頁，或試試下面的入口吧。', '这个网址可能已经更改，或根本不存在。回到首页，或试试下面的入口吧。')}
                    </p>
                    <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="快速入口">
                        <a href="/" className={PRIMARY_LINK_CLASS}>{pick('回到首頁', '回到首页')}</a>
                        <a href="/search" className={LINK_CLASS}>{pick('聖經搜索', '圣经搜索')}</a>
                        <a href="/memorize" className={LINK_CLASS}>{pick('深度背誦', '深度背诵')}</a>
                        <a href="/rankings" className={LINK_CLASS}>{pick('經文排行榜', '经文排行榜')}</a>
                    </nav>
                    <p className="mt-10 text-sm text-stone-500 dark:text-stone-400 font-chinese">
                        {pick('願神的話語常在你心中', '愿神的话语常在你心中')}
                    </p>
                </div>
            </main>
        </div>
    );
}
