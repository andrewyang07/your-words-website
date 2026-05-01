'use client';

import { useState } from 'react';
import { BookOpen, Eye, Star, Share2, FileText, Palette, Globe, ChevronRight, CheckCircle, AlertCircle, Github } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import { useAppStore } from '@/stores/useAppStore';

export default function HelpPageClient() {
    const { theme, setTheme, language, setLanguage } = useAppStore();
    const [showSideMenu, setShowSideMenu] = useState(false);

    return (
        <div className="min-h-screen yw-page">
            {/* 使用共用的 PageHeader */}
            <PageHeader onMenuClick={() => setShowSideMenu(true)} showHelp={false} />

            {/* 侧边栏菜单 */}
            <SideMenu 
                isOpen={showSideMenu} 
                onClose={() => setShowSideMenu(false)} 
                theme={theme} 
                onThemeChange={setTheme}
                language={language}
                onLanguageChange={setLanguage}
            />

            {/* 主要内容 */}
            <main className="yw-shell">
                <div className="yw-panel overflow-hidden">
                    {/* 标题部分 */}
                    <div className="border-b border-stone-900/10 bg-white/42 p-6 md:p-8 dark:border-white/10 dark:bg-white/[0.035]">
                        <h2 className="text-2xl md:text-3xl font-bold text-stone-950 dark:text-stone-50 font-chinese mb-2">使用教程</h2>
                        <p className="text-stone-600 dark:text-stone-400 font-chinese">詳細了解如何使用「你的話語」來背誦聖經</p>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 md:p-8 space-y-8">
                        {/* 1. 经文选择 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <BookOpen className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">經文選擇</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        📖 精選 114 節經文
                                        <CheckCircle className="w-4 h-4 text-stone-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        默認展示最值得背誦的 114 節經文，涵蓋信仰核心真理。 這些經文經過精心挑選，適合初學者和進階學習者。
                                    </p>
                                    <div className="yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                                            <strong>💡 使用建議：</strong>
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc list-inside ml-2">
                                            <li>初學者建議從精選經文開始</li>
                                            <li>每天背誦 3-5 節，循序漸進</li>
                                            <li>重複背誦已學過的經文，加深記憶</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        📚 選擇書卷章節
                                        <ChevronRight className="w-4 h-4 text-bible-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">點擊頂部的「選擇書卷」按鈕，可以瀏覽聖經 66 卷的任意章節：</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                1
                                            </span>
                                            <span>點擊「選擇書卷」下拉菜單</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                2
                                            </span>
                                            <span>選擇舊約或新約書卷（如：創世記、馬太福音）</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                3
                                            </span>
                                            <span>選擇章節編號（如：第 1 章）</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                4
                                            </span>
                                            <span>該章所有經文會以卡片形式展示</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-700 dark:text-stone-300">
                                            <strong>💡 小貼士：</strong>
                                            選擇章節後，你可以使用「上一章」和「下一章」按鈕快速導航， 或者點擊「查看整章」按鈕查看該章的所有經文。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. 背诵模式 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <Eye className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">背誦模式</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        👁️ 閱讀模式 vs 背誦模式
                                        <AlertCircle className="w-4 h-4 text-stone-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        點擊右上角的<strong>眼睛圖標</strong>可以切換模式：
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="yw-soft-card p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">👁️</span>
                                                <strong className="text-sm text-stone-700 dark:text-stone-300">閱讀模式</strong>
                                            </div>
                                            <p className="text-xs text-stone-600 dark:text-stone-400">完整顯示經文內容，方便閱讀和記憶</p>
                                        </div>
                                        <div className="yw-soft-card p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">🔒</span>
                                                <strong className="text-sm text-stone-700 dark:text-stone-300">背誦模式</strong>
                                            </div>
                                            <p className="text-xs text-stone-600 dark:text-stone-400">經文被遮罩，只顯示部分提示字，用於測試記憶</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-700 dark:text-stone-300">
                                            <strong>💡 建議：</strong>
                                            初學者建議先使用閱讀模式熟悉經文，熟練後再切換到背誦模式進行測試。
                                        </p>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        🎴 卡片操作詳解
                                        <ChevronRight className="w-4 h-4 text-bible-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        <strong>點擊卡片</strong>可以展開/收起經文內容：
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                1
                                            </span>
                                            <span>點擊卡片 → 展開顯示完整經文</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                2
                                            </span>
                                            <span>再次點擊 → 收起經文，回到卡片狀態</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                3
                                            </span>
                                            <span>在背誦模式下，展開後會顯示完整經文，方便核對答案</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        🔀 隨機排序功能
                                        <CheckCircle className="w-4 h-4 text-stone-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        點擊<strong>洗牌按鈕</strong>（🔄）可以隨機打亂卡片順序：
                                    </p>
                                    <div className="yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-700 dark:text-stone-300">
                                            <strong>🎯 為什麼要隨機排序？</strong>
                                            <br />
                                            • 避免按順序記憶，提高背誦效果
                                            <br />
                                            • 測試你是否真正記住了經文內容
                                            <br />• 增加背誦的挑戰性和趣味性
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. 遮罩设置 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <Palette className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">遮罩提示設置</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2">📍 在哪裡調整提示設置？</h4>
                                    <div className="space-y-1.5 text-sm">
                                        <p>
                                            <strong>桌面版：</strong>
                                            點擊頂部工具列的<strong>「提示設置」</strong>，會展開折疊面板。
                                        </p>
                                        <p>
                                            <strong>手機版：</strong>
                                            點擊頂部的<strong>滑桿圖示</strong>（提示設置），會在<strong>搜索欄下方</strong>展開設置卡片。
                                        </p>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">💡 提示模式</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <p className="font-semibold text-sm mb-1">每句提示</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">這律〇，總要晝夜思〇</code>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm mb-1">開頭提示</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">這律〇〇〇〇〇〇〇〇〇〇</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2">🔢 字數設置</h4>
                                    <p className="text-sm">
                                        可選擇<strong>固定提示字數</strong>（如最多提示 2 字）或<strong>隨機提示字數</strong>（如 1-3 字範圍）；短句也會保留至少一個空心圓遮字。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 3.5. 推荐背诵流程 - 新增 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <span className="text-white text-lg font-bold">🎯</span>
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">推薦背誦流程</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card p-5">
                                    <p className="text-sm font-semibold mb-4 text-stone-700 dark:text-stone-300">
                                        ⭐ 使用「每句提示」+「固定提示字數」，從多到少，循序漸進背誦：
                                    </p>

                                    <div className="space-y-3">
                                        {/* 阶段 1 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">階段 1</span>
                                                <span className="text-sm font-semibold">熟悉經文（5 字）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：每句提示 + 最多提示 <strong className="text-stone-600">5 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">這律法書不可離開你的〇，總要晝夜思〇，好使你謹守遵〇</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 大部分內容可見，但每個短句仍保留遮字</p>
                                        </div>

                                        {/* 阶段 2 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">階段 2</span>
                                                <span className="text-sm font-semibold">開始挑戰（4 → 3 字）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：每句提示 + 最多提示 <strong className="text-stone-700">4 字</strong> →{' '}
                                                <strong className="text-stone-700">3 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">這律法書〇〇，總要晝〇〇，好使你謹〇〇</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 需要回憶部分內容，加深記憶</p>
                                        </div>

                                        {/* 阶段 3 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">階段 3</span>
                                                <span className="text-sm font-semibold">鞏固記憶（2 字）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：每句提示 + 最多提示 <strong className="text-stone-600">2 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">這律〇〇〇〇，總要〇〇〇〇，好使〇〇〇〇</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 主要靠記憶，只看關鍵提示</p>
                                        </div>

                                        {/* 阶段 4 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">階段 4</span>
                                                <span className="text-sm font-semibold">完全背誦（開頭提示）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：開頭提示 + 最多提示 <strong className="text-stone-600">2 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">這律〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 最高難度，挑戰完全背誦</p>
                                        </div>
                                    </div>

                                    {/* 核心建议 */}
                                    <div className="mt-4 yw-soft-card">
                                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span className="text-lg">🔄</span>
                                            <span>來回切換，反覆練習</span>
                                        </p>
                                        <p className="text-xs leading-relaxed">
                                            在各階段之間來回切換練習，例如：最多提示 5字 → 3字 → 5字 → 2字 → 開頭提示 → 3字...
                                            <br />
                                            這種<strong className="text-stone-700 dark:text-stone-300">「變化式」背誦法</strong>
                                            能讓大腦保持活躍，記憶更牢固。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. 收藏和分享 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <Star className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">收藏與分享</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <p className="text-sm mb-3">
                                        點擊卡片<strong>星標圖標 ⭐</strong> 收藏經文，點擊頂部<strong>星標按鈕</strong>查看收藏列表。
                                    </p>
                                    <p className="text-sm">
                                        收藏模式下，點擊<strong>分享按鈕 🔗</strong> 可生成分享鏈接，發送給朋友即可查看。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 5. 笔记本功能 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <FileText className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese flex items-center gap-2">
                                    筆記本功能
                                    <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-0.5 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">BETA</span>
                                </h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <p className="text-sm mb-3">點擊菜單 → 「筆記本」記錄靈修筆記。</p>
                                    <p className="text-xs">
                                        ✨ 自動補全經文引用 • 📖 一鍵展開完整經文 • 🔍 浮動聖經查看器 • ✍️ Markdown 格式 • 💾 自動保存與導出
                                    </p>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-3">
                                        ⚠️ 目前只支持一篇筆記，主要用作草稿和臨時記錄。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 6. 主题和语言 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <Globe className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">主題與語言設置</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <p className="text-sm">
                                        點擊右上角切換 <strong>🌓 深色/淺色模式</strong> 和 <strong>🌏 繁體/簡體中文</strong>，設置會自動保存。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 常见问题 */}
                        <section className="space-y-4 pt-6 border-t border-bible-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">❓ 常見問題</h3>
                            <div className="space-y-3">
                                <details className="yw-section-card">
                                    <summary className="font-semibold cursor-pointer text-stone-950 dark:text-stone-50 font-chinese">
                                        收藏的經文會丟失嗎？
                                    </summary>
                                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 font-chinese">
                                        收藏的經文保存在瀏覽器本地存儲中，只要不清除瀏覽器數據就不會丟失。 建議定期使用分享功能生成鏈接備份。
                                    </p>
                                </details>
                                <details className="yw-section-card">
                                    <summary className="font-semibold cursor-pointer text-stone-950 dark:text-stone-50 font-chinese">
                                        如何在手機上使用？
                                    </summary>
                                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 font-chinese">
                                        網站採用響應式設計，在手機瀏覽器中可以正常使用所有功能。 iPhone 用戶推薦使用「心版」App 獲得更好的移動體驗。
                                    </p>
                                </details>
                                <details className="yw-section-card">
                                    <summary className="font-semibold cursor-pointer text-stone-950 dark:text-stone-50 font-chinese">
                                        遇到問題如何反饋？
                                    </summary>
                                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 font-chinese">
                                        如果遇到任何問題或有功能建議，歡迎發送郵件到：
                                        <a href="mailto:yy9577@gmail.com" className="text-stone-700 dark:text-blue-400 hover:underline ml-1">
                                            yy9577@gmail.com
                                        </a>
                                    </p>
                                </details>
                            </div>
                        </section>

                        {/* GitHub 开源项目 */}
                        <section className="space-y-4 pt-6 border-t border-bible-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese flex items-center gap-2">
                                <Github className="w-6 h-6" />
                                開源項目
                            </h3>
                            <div className="space-y-4">
                                <p className="text-stone-700 dark:text-stone-300 font-chinese text-sm">
                                    「你的話語」是一個開源項目，歡迎查看源代碼、報告問題或貢獻改進！
                                </p>

                                {/* GitHub 仓库卡片 */}
                                <div className="yw-section-card">
                                    <div className="flex items-start gap-3">
                                        <Github className="w-8 h-8 text-gray-700 dark:text-gray-300 flex-shrink-0 mt-1" />
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 font-chinese mb-2">GitHub 倉庫</h4>
                                            <a
                                                href="https://github.com/andrewyang07/your-words-website"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-stone-700 dark:text-blue-400 hover:underline text-sm mb-3 block break-all"
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
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-stone-700 dark:hover:text-blue-400"
                                                >
                                                    <span>🐛</span>
                                                    <span>報告 Bug</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website/issues"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-stone-700 dark:hover:text-blue-400"
                                                >
                                                    <span>💡</span>
                                                    <span>功能建議</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-stone-700 dark:hover:text-blue-400"
                                                >
                                                    <span>⭐</span>
                                                    <span>給個 Star</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 底部 */}
                        <div className="pt-6 border-t border-bible-200 dark:border-gray-700 text-center">
                            <p className="text-sm text-stone-600 dark:text-stone-400 font-chinese mb-4">希望這些功能能幫助你更好地背誦神的話語！</p>
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-bible-500 hover:bg-bible-600 text-white rounded-lg transition-colors font-chinese shadow-md"
                            >
                                開始背誦
                                <span>→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
