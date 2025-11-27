'use client';

import { useState } from 'react';
import { Mail, Github, Heart } from 'lucide-react';
import Image from 'next/image';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/lib/i18n';

export default function AboutPageClient() {
    const { theme, toggleTheme, language, setLanguage } = useAppStore();
    const { t } = useTranslation();
    const [showSideMenu, setShowSideMenu] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* 使用共用的 PageHeader */}
            <PageHeader onMenuClick={() => setShowSideMenu(true)} showHelp={false} />

            {/* 侧边栏菜单 */}
            <SideMenu 
                isOpen={showSideMenu} 
                onClose={() => setShowSideMenu(false)} 
                theme={theme} 
                onThemeChange={toggleTheme}
                language={language}
                onLanguageChange={setLanguage}
            />

            {/* 主要内容 */}
            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-bible-200 dark:border-gray-700 overflow-hidden">
                    {/* 标题部分 */}
                    <div className="bg-gradient-to-r from-bible-50 to-gold-50 dark:from-gray-800 dark:to-gray-700 p-6 md:p-8 border-b border-bible-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-bible-500 to-gold-500 dark:from-bible-600 dark:to-gold-600 rounded-full flex items-center justify-center shadow-md">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-bible-800 dark:text-bible-200 font-chinese">{t('about.title')}</h2>
                                <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">{t('about.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 md:p-8 space-y-8">
                        {/* 项目介绍 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">📖</span>
                                {t('about.intro.title')}
                            </h3>
                            <div className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed space-y-3">
                                <p>{t('about.intro.p1')}</p>
                                <p>{t('about.intro.p2')}</p>
                            </div>
                        </section>

                        {/* 开发故事 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">📱</span>{t('about.journey.title')}
                            </h3>
                            <div className="space-y-3 text-bible-700 dark:text-bible-300 font-chinese leading-relaxed">
                                <p>{t('about.journey.p1')}</p>
                                <p>{t('about.journey.p2')}</p>
                                <p>
                                    {t('about.journey.p3')}
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        {t('about.journey.reminder')}
                                    </span>
                                    {t('about.journey.p3end')}
                                </p>
                            </div>
                        </section>

                        {/* 草图展示 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">✏️</span>
                                {t('about.sketch.title')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md border border-bible-200 dark:border-gray-600">
                                    <Image
                                        src="/sketch-1.jpg"
                                        alt={t('about.sketch.caption1')}
                                        width={600}
                                        height={450}
                                        loading="lazy"
                                        quality={85}
                                        className="w-full h-auto object-cover"
                                    />
                                    <p className="p-2 text-xs text-center text-bible-500 dark:text-bible-400">{t('about.sketch.caption1')}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md border border-bible-200 dark:border-gray-600">
                                    <Image
                                        src="/sketch-2.jpg"
                                        alt={t('about.sketch.caption2')}
                                        width={600}
                                        height={450}
                                        loading="lazy"
                                        quality={85}
                                        className="w-full h-auto object-cover"
                                    />
                                    <p className="p-2 text-xs text-center text-bible-500 dark:text-bible-400">{t('about.sketch.caption2')}</p>
                                </div>
                            </div>
                        </section>

                        {/* 开发背景 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">✨</span>
                                {t('about.purpose.title')}
                            </h3>
                            <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 md:p-6 border border-bible-200 dark:border-gray-600">
                                <p className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed mb-3">
                                    {t('about.purpose.intro')}
                                </p>
                                <blockquote className="border-l-4 border-bible-500 dark:border-bible-400 pl-4 italic text-bible-600 dark:text-bible-400 font-chinese">
                                    {t('about.purpose.verse')}
                                    <br />
                                    <span className="text-xs">{t('about.purpose.verseRef')}</span>
                                </blockquote>
                                <p className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed mt-4">
                                    {t('about.purpose.mission')}
                                </p>
                            </div>
                        </section>

                        {/* iPhone App 推广 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">📱</span>
                                {t('about.app.title')}
                            </h3>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 md:p-6 border border-blue-200 dark:border-gray-600">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <Image
                                            src="/xinban-logo.jpg"
                                            alt={t('about.app.title')}
                                            width={80}
                                            height={80}
                                            loading="lazy"
                                            quality={85}
                                            className="rounded-xl shadow-md"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese mb-2">{t('about.app.recommend')}</h4>
                                        <p className="text-sm text-bible-700 dark:text-bible-300 font-chinese leading-relaxed mb-3">
                                            {t('about.app.desc')}
                                        </p>
                                        <p className="text-xs text-bible-600 dark:text-bible-400 font-chinese mb-3">
                                            {t('about.app.note')}
                                        </p>
                                        <a
                                            href="https://apps.apple.com/app/6744570052"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-chinese text-sm shadow-md"
                                        >
                                            {t('about.app.download')}
                                            <span>→</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 开源项目 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <Github className="w-6 h-6" />
                                {t('about.opensource.title')}
                            </h3>
                            <div className="space-y-4">
                                <div className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed">
                                    <p className="mb-3">
                                        {t('about.opensource.intro')}
                                    </p>
                                </div>

                                {/* GitHub 仓库信息 */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-start gap-3">
                                        <Github className="w-8 h-8 text-gray-700 dark:text-gray-300 flex-shrink-0 mt-1" />
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 font-chinese mb-2">{t('about.opensource.repo')}</h4>
                                            <a
                                                href="https://github.com/andrewyang07/your-words-website"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-3 block break-all"
                                            >
                                                github.com/andrewyang07/your-words-website
                                            </a>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                                    MIT License
                                                </span>
                                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                                                    TypeScript
                                                </span>
                                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                                    Next.js
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website/issues"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    <span>🐛</span>
                                                    <span>{t('about.opensource.reportBug')}</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website/issues"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    <span>💡</span>
                                                    <span>{t('about.opensource.suggest')}</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    <span>⭐</span>
                                                    <span>{t('about.opensource.star')}</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 联系方式 */}
                                <div className="flex items-center gap-2 text-bible-600 dark:text-bible-400">
                                    <Mail className="w-5 h-5" />
                                    <span className="text-sm">{t('about.contact')}</span>
                                    <a href="mailto:yy9577@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                                        yy9577@gmail.com
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* 版权信息 */}
                        <section className="pt-6 border-t border-bible-200 dark:border-gray-700">
                            <p className="text-center text-sm text-bible-500 dark:text-bible-400 font-chinese">
                                {t('about.copyright')}
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
