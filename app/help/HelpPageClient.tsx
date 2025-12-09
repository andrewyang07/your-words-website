'use client';

import { useState } from 'react';
import { BookOpen, Eye, Star, Share2, FileText, Palette, Globe, ChevronRight, CheckCircle, AlertCircle, Github } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from '@/lib/i18n';

export default function HelpPageClient() {
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
                        <h2 className="text-2xl md:text-3xl font-bold text-bible-800 dark:text-bible-200 font-chinese mb-2">{t('help.title')}</h2>
                        <p className="text-bible-600 dark:text-bible-400 font-chinese">{t('help.subtitle')}</p>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 md:p-8 space-y-8">
                        {/* 1. 经文选择 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">{t('help.verseSelection')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        📖 {t('help.preset114')}
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        {t('help.preset114Desc')}
                                    </p>
                                    <div className="bg-white dark:bg-gray-800 rounded p-3 border border-bible-200 dark:border-gray-600">
                                        <p className="text-xs text-bible-600 dark:text-bible-400 mb-2">
                                            <strong>💡 使用建議：</strong>
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc list-inside ml-2">
                                            <li>初學者建議從精選經文開始</li>
                                            <li>每天背誦 3-5 節，循序漸進</li>
                                            <li>重複背誦已學過的經文，加深記憶</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {t('help.selectBook')}
                                        <ChevronRight className="w-4 h-4 text-bible-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">{t('help.selectBookDesc')}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                1
                                            </span>
                                            <span>{t('help.step1')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                2
                                            </span>
                                            <span>{t('help.step2')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                3
                                            </span>
                                            <span>{t('help.step3')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                4
                                            </span>
                                            <span>{t('help.step4')}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-blue-800 dark:text-blue-300">
                                            <strong>{t('help.smallTip')}</strong>
                                            {t('help.navigationTip')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. 背诵模式 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">{t('help.recitationMode')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {t('help.readVsRecite')}
                                        <AlertCircle className="w-4 h-4 text-orange-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        {t('help.modeToggle')}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">👁️</span>
                                                <strong className="text-sm text-green-800 dark:text-green-300">{t('help.readMode')}</strong>
                                            </div>
                                            <p className="text-xs text-green-700 dark:text-green-400">{t('help.readModeDesc')}</p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">🔒</span>
                                                <strong className="text-sm text-orange-800 dark:text-orange-300">{t('help.reciteMode')}</strong>
                                            </div>
                                            <p className="text-xs text-orange-700 dark:text-orange-400">{t('help.reciteModeDesc')}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-blue-800 dark:text-blue-300">
                                            <strong>{t('help.suggestion')}</strong>
                                            {t('help.modeSuggestion')}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {t('help.cardOperations')}
                                        <BookOpen className="w-4 h-4 text-bible-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">{t('help.cardClick')}</p>
                                    <ul className="text-sm space-y-2 list-disc list-inside ml-2">
                                        <li>{t('help.cardStep1')}</li>
                                        <li>{t('help.cardStep2')}</li>
                                        <li>{t('help.cardStep3')}</li>
                                    </ul>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {t('help.shuffle')}
                                        <Share2 className="w-4 h-4 text-purple-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">{t('help.shuffleDesc')}</p>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-3 border border-purple-200 dark:border-purple-800">
                                        <p className="text-xs text-purple-800 dark:text-purple-300 mb-2">
                                            <strong>{t('help.whyShuffle')}</strong>
                                        </p>
                                        <ul className="text-xs space-y-1 text-purple-700 dark:text-purple-400">
                                            <li>{t('help.shuffleReason1')}</li>
                                            <li>{t('help.shuffleReason2')}</li>
                                            <li>{t('help.shuffleReason3')}</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. 遮罩设置 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Palette className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">{t('help.maskSettings')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {t('help.hintMode')}
                                        <Star className="w-4 h-4 text-gold-500" />
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div className="bg-white dark:bg-gray-800 rounded p-3 border border-bible-200 dark:border-gray-600">
                                            <strong className="block text-sm mb-1">{t('help.perSentence')}</strong>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                {t('help.perSentenceExample')}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded p-3 border border-bible-200 dark:border-gray-600">
                                            <strong className="block text-sm mb-1">{t('help.prefix')}</strong>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                {t('help.prefixExample')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <h4 className="font-semibold mb-2 flex items-center gap-2 mt-4">
                                        {t('help.charCount')}
                                        <FileText className="w-4 h-4 text-bible-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed">
                                        {t('help.charCountDesc')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 4. 推荐流程 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Star className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">{t('help.recommendedFlow')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <p className="text-sm mb-4 font-semibold">{t('help.flowIntro')}</p>
                                    
                                    <div className="space-y-4 relative">
                                        {/* 连接线 */}
                                        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-bible-200 dark:bg-gray-600"></div>

                                        {/* 阶段 1 */}
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">1</div>
                                            <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-1">{t('help.stage1')}：{t('help.stage1Title')}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('help.stage1Setting')}</p>
                                            <p className="text-xs text-green-600 dark:text-green-400">{t('help.stage1Tip')}</p>
                                        </div>

                                        {/* 阶段 2 */}
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">2</div>
                                            <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-1">{t('help.stage2')}：{t('help.stage2Title')}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('help.stage2Setting')}</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">{t('help.stage2Tip')}</p>
                                        </div>

                                        {/* 阶段 3 */}
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">3</div>
                                            <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-1">{t('help.stage3')}：{t('help.stage3Title')}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('help.stage3Setting')}</p>
                                            <p className="text-xs text-orange-600 dark:text-orange-400">{t('help.stage3Tip')}</p>
                                        </div>

                                        {/* 阶段 4 */}
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">4</div>
                                            <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-1">{t('help.stage4')}：{t('help.stage4Title')}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('help.stage4Setting')}</p>
                                            <p className="text-xs text-red-600 dark:text-red-400">{t('help.stage4Tip')}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-bible-200 dark:border-gray-600">
                                        <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-2 flex items-center gap-2">
                                            {t('help.switchPractice')}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {t('help.switchDesc')}
                                        </p>
                                        <p className="text-xs text-bible-600 dark:text-bible-400 bg-bible-50 dark:bg-gray-800 p-2 rounded">
                                            💡 {t('help.switchBenefit')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 5. 其他功能 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Share2 className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">{t('help.favoriteShare')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-gold-500 mt-0.5">⭐</span>
                                            <span>{t('help.favoriteDesc')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5">🔗</span>
                                            <span>{t('help.shareDesc')}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 6. 笔记本 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                    {t('help.notebook')}
                                    <span className="ml-2 text-xs bg-gold-500 text-white px-2 py-0.5 rounded-full">{t('help.notebookBeta')}</span>
                                </h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <p className="text-sm mb-2">{t('help.notebookDesc')}</p>
                                    <p className="text-xs text-bible-600 dark:text-bible-400 mb-3">
                                        {t('help.notebookFeatures')}
                                    </p>
                                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded p-2 border border-amber-200 dark:border-amber-800">
                                        <p className="text-xs text-amber-800 dark:text-amber-300">
                                            {t('help.notebookWarning')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 7. 主题与语言 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">{t('help.themeLanguage')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <p className="text-sm">
                                        {t('help.themeDesc')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 8. 常见问题 */}
                        <section className="space-y-4 pt-4 border-t border-bible-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese mb-4">{t('help.faq')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-bible-200 dark:border-gray-700">
                                    <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-2 font-chinese">{t('help.faqQ1')}</h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese leading-relaxed">
                                        {t('help.faqA1')}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-bible-200 dark:border-gray-700">
                                    <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-2 font-chinese">{t('help.faqQ2')}</h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese leading-relaxed">
                                        {t('help.faqA2')}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-bible-200 dark:border-gray-700 md:col-span-2">
                                    <h4 className="font-bold text-bible-800 dark:text-bible-200 mb-2 font-chinese">{t('help.faqQ3')}</h4>
                                    <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese leading-relaxed">
                                        {t('help.faqA3')} <a href="mailto:yangyang@yourwords.com" className="text-bible-600 dark:text-bible-400 hover:underline">yangyang@yourwords.com</a>
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 开源信息 */}
                        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <Github className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 font-chinese">{t('help.opensource')}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-chinese max-w-lg">
                                    {t('help.opensourceDesc')}
                                </p>
                                <div className="flex flex-wrap justify-center gap-3 mt-2">
                                    <a
                                        href="https://github.com/jerrywcy/your-words"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                                    >
                                        <Github className="w-4 h-4" />
                                        {t('help.githubRepo')}
                                    </a>
                                    <a
                                        href="https://github.com/jerrywcy/your-words/issues"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {t('help.reportBug')}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* 底部按钮 */}
                        <div className="pt-6 border-t border-bible-200 dark:border-gray-700 text-center">
                            <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese mb-4">{t('help.finalMessage')}</p>
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-bible-500 hover:bg-bible-600 text-white rounded-lg transition-colors font-chinese shadow-md"
                            >
                                {t('help.startReciting')}
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
