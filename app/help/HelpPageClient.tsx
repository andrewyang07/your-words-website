'use client';

import { useState } from 'react';
import { BookOpen, Eye, Star, Share2, FileText, Palette, Globe, ChevronRight, CheckCircle, AlertCircle, Github } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import { useAppStore } from '@/stores/useAppStore';

export default function HelpPageClient() {
    const { theme, toggleTheme } = useAppStore();
    const [showSideMenu, setShowSideMenu] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* 使用共用的 PageHeader */}
            <PageHeader onMenuClick={() => setShowSideMenu(true)} showHelp={false} />

            {/* 侧边栏菜单 */}
            <SideMenu isOpen={showSideMenu} onClose={() => setShowSideMenu(false)} theme={theme} onThemeChange={toggleTheme} />

            {/* 主要内容 */}
            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-bible-200 dark:border-gray-700 overflow-hidden">
                    {/* 标题部分 */}
                    <div className="bg-gradient-to-r from-bible-50 to-gold-50 dark:from-gray-800 dark:to-gray-700 p-6 md:p-8 border-b border-bible-200 dark:border-gray-700">
                        <h2 className="text-2xl md:text-3xl font-bold text-bible-800 dark:text-bible-200 font-chinese mb-2">使用教程</h2>
                        <p className="text-bible-600 dark:text-bible-400 font-chinese">詳細了解如何使用「你的話語」來背誦聖經</p>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 md:p-8 space-y-8">
                        {/* 1. 经文选择 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">經文選擇</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        📖 精選 114 節經文
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        默認展示最值得背誦的 114 節經文，涵蓋信仰核心真理。 這些經文經過精心挑選，適合初學者和進階學習者。
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
                                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-blue-800 dark:text-blue-300">
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
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">背誦模式</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        👁️ 閱讀模式 vs 背誦模式
                                        <AlertCircle className="w-4 h-4 text-orange-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        點擊右上角的<strong>眼睛圖標</strong>可以切換模式：
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">👁️</span>
                                                <strong className="text-sm text-green-800 dark:text-green-300">閱讀模式</strong>
                                            </div>
                                            <p className="text-xs text-green-700 dark:text-green-400">完整顯示經文內容，方便閱讀和記憶</p>
                                        </div>
                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">🔒</span>
                                                <strong className="text-sm text-orange-800 dark:text-orange-300">背誦模式</strong>
                                            </div>
                                            <p className="text-xs text-orange-700 dark:text-orange-400">經文被遮罩，只顯示部分提示字，用於測試記憶</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs text-blue-800 dark:text-blue-300">
                                            <strong>💡 建議：</strong>
                                            初學者建議先使用閱讀模式熟悉經文，熟練後再切換到背誦模式進行測試。
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
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
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        🔀 隨機排序功能
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        點擊<strong>洗牌按鈕</strong>（🔄）可以隨機打亂卡片順序：
                                    </p>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-3 border border-yellow-200 dark:border-yellow-800">
                                        <p className="text-xs text-yellow-800 dark:text-yellow-300">
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
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Palette className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">遮罩提示設置</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-gold-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-gold-300 dark:border-gold-600">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">💡 提示模式</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <p className="font-semibold text-sm mb-1">每句提示</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">這律██，總要████</code>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm mb-1">開頭提示</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">這律██████████</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2">🔢 字數設置</h4>
                                    <p className="text-sm">
                                        可選擇<strong>固定字數</strong>（如始終 2 字）或<strong>隨機字數</strong>（如 1-3 字範圍）。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 3.5. 推荐背诵流程 - 新增 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-bible-500 to-gold-500 dark:from-bible-600 dark:to-gold-600 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white text-lg font-bold">🎯</span>
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">推薦背誦流程</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-gradient-to-br from-gold-50 to-orange-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border-2 border-gold-300 dark:border-gold-600 shadow-sm">
                                    <p className="text-sm font-semibold mb-4 text-gold-800 dark:text-gold-300">
                                        ⭐ 使用「每句提示」+「固定字數」，從多到少，循序漸進背誦：
                                    </p>

                                    <div className="space-y-3">
                                        {/* 阶段 1 */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gold-200 dark:border-gray-600">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">階段 1</span>
                                                <span className="text-sm font-semibold">熟悉經文（5 字）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：每句提示 + 固定 <strong className="text-green-600">5 字</strong>
                                            </p>
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 border border-green-200 dark:border-green-800">
                                                <code className="text-xs">這律法書不可離開你的口，總要晝夜思想，好使你謹守遵行</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 經文幾乎完全顯示，輕鬆熟悉內容</p>
                                        </div>

                                        {/* 阶段 2 */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gold-200 dark:border-gray-600">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">階段 2</span>
                                                <span className="text-sm font-semibold">開始挑戰（4 → 3 字）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：每句提示 + 固定 <strong className="text-blue-600">4 字</strong> →{' '}
                                                <strong className="text-blue-600">3 字</strong>
                                            </p>
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 border border-blue-200 dark:border-blue-800">
                                                <code className="text-xs">這律法書不██，總要晝夜██，好使你謹██</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 需要回憶部分內容，加深記憶</p>
                                        </div>

                                        {/* 阶段 3 */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gold-200 dark:border-gray-600">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded">階段 3</span>
                                                <span className="text-sm font-semibold">鞏固記憶（2 字）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：每句提示 + 固定 <strong className="text-orange-600">2 字</strong>
                                            </p>
                                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2 border border-orange-200 dark:border-orange-800">
                                                <code className="text-xs">這律████，總要████，好使████</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 主要靠記憶，只看關鍵提示</p>
                                        </div>

                                        {/* 阶段 4 */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gold-200 dark:border-gray-600">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">階段 4</span>
                                                <span className="text-sm font-semibold">完全背誦（開頭提示）</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                設置：開頭提示 + 固定 <strong className="text-red-600">2 字</strong>
                                            </p>
                                            <div className="bg-red-50 dark:bg-red-900/20 rounded p-2 border border-red-200 dark:border-red-800">
                                                <code className="text-xs">這律██████████████████████████</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">💡 最高難度，挑戰完全背誦</p>
                                        </div>
                                    </div>

                                    {/* 核心建议 */}
                                    <div className="mt-4 bg-gradient-to-r from-gold-100 to-orange-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border-2 border-gold-400 dark:border-gold-500">
                                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span className="text-lg">🔄</span>
                                            <span>來回切換，反覆練習</span>
                                        </p>
                                        <p className="text-xs leading-relaxed">
                                            在各階段之間來回切換練習，例如：5字 → 3字 → 5字 → 2字 → 開頭提示 → 3字...
                                            <br />
                                            這種<strong className="text-gold-700 dark:text-gold-400">「變化式」背誦法</strong>
                                            能讓大腦保持活躍，記憶更牢固。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. 收藏和分享 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Star className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">收藏與分享</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
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
                                <div className="w-10 h-10 bg-gold-500 dark:bg-gold-600 rounded-full flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                    筆記本功能
                                    <span className="px-2 py-0.5 text-xs bg-gold-500 text-white rounded-full">BETA</span>
                                </h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-gold-50 dark:bg-gray-700 rounded-lg p-4 border border-gold-200 dark:border-gray-600">
                                    <p className="text-sm mb-3">點擊菜單 → 「筆記本」記錄靈修筆記。</p>
                                    <p className="text-xs">
                                        ✨ 自動補全經文引用 • 📖 一鍵展開完整經文 • 🔍 浮動聖經查看器 • ✍️ Markdown 格式 • 💾 自動保存與導出
                                    </p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-3">
                                        ⚠️ 目前只支持一篇筆記，主要用作草稿和臨時記錄。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 6. 主题和语言 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-bible-500 dark:bg-bible-600 rounded-full flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">主題與語言設置</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-bible-700 dark:text-bible-300 font-chinese">
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <p className="text-sm">
                                        點擊右上角切換 <strong>🌓 深色/淺色模式</strong> 和 <strong>🌏 繁體/簡體中文</strong>，設置會自動保存。
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 常见问题 */}
                        <section className="space-y-4 pt-6 border-t border-bible-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">❓ 常見問題</h3>
                            <div className="space-y-3">
                                <details className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <summary className="font-semibold cursor-pointer text-bible-800 dark:text-bible-200 font-chinese">
                                        收藏的經文會丟失嗎？
                                    </summary>
                                    <p className="mt-2 text-sm text-bible-700 dark:text-bible-300 font-chinese">
                                        收藏的經文保存在瀏覽器本地存儲中，只要不清除瀏覽器數據就不會丟失。 建議定期使用分享功能生成鏈接備份。
                                    </p>
                                </details>
                                <details className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <summary className="font-semibold cursor-pointer text-bible-800 dark:text-bible-200 font-chinese">
                                        如何在手機上使用？
                                    </summary>
                                    <p className="mt-2 text-sm text-bible-700 dark:text-bible-300 font-chinese">
                                        網站採用響應式設計，在手機瀏覽器中可以正常使用所有功能。 iPhone 用戶推薦使用「心版」App 獲得更好的移動體驗。
                                    </p>
                                </details>
                                <details className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <summary className="font-semibold cursor-pointer text-bible-800 dark:text-bible-200 font-chinese">
                                        遇到問題如何反饋？
                                    </summary>
                                    <p className="mt-2 text-sm text-bible-700 dark:text-bible-300 font-chinese">
                                        如果遇到任何問題或有功能建議，歡迎發送郵件到：
                                        <a href="mailto:yy9577@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                                            yy9577@gmail.com
                                        </a>
                                    </p>
                                </details>
                            </div>
                        </section>

                        {/* GitHub 开源项目 */}
                        <section className="space-y-4 pt-6 border-t border-bible-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <Github className="w-6 h-6" />
                                開源項目
                            </h3>
                            <div className="space-y-4">
                                <p className="text-bible-700 dark:text-bible-300 font-chinese text-sm">
                                    「你的話語」是一個開源項目，歡迎查看源代碼、報告問題或貢獻改進！
                                </p>

                                {/* GitHub 仓库卡片 */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-start gap-3">
                                        <Github className="w-8 h-8 text-gray-700 dark:text-gray-300 flex-shrink-0 mt-1" />
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 font-chinese mb-2">GitHub 倉庫</h4>
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
                                                    <span>報告 Bug</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website/issues"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    <span>💡</span>
                                                    <span>功能建議</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
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
                            <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese mb-4">希望這些功能能幫助你更好地背誦神的話語！</p>
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
