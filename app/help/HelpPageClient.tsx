'use client';

import { useState } from 'react';
import { BookOpen, Eye, Star, Share2, FileText, Palette, Globe, ChevronRight, CheckCircle, AlertCircle, Github } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SideMenu from '@/components/navigation/SideMenu';
import { useAppStore } from '@/stores/useAppStore';
import { useScriptPick } from '@/lib/useScriptPick';

export default function HelpPageClient() {
    const pick = useScriptPick();
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
                        <p className="text-stone-600 dark:text-stone-400 font-chinese">{pick('詳細了解如何使用「你的話語」來背誦聖經', '详细了解如何使用「你的话语」来背诵圣经')}</p>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 md:p-8 space-y-8">
                        {/* 1. 经文选择 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="yw-icon-tile">
                                    <BookOpen className="w-5 h-5 text-stone-700 dark:text-stone-200" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">{pick('經文選擇', '经文选择')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {pick('📖 精選 114 節經文', '📖 精选 114 节经文')}
                                        <CheckCircle className="w-4 h-4 text-stone-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        {pick('默認展示最值得背誦的 114 節經文，涵蓋信仰核心真理。 這些經文經過精心挑選，適合初學者和進階學習者。', '默认展示最值得背诵的 114 节经文，涵盖信仰核心真理。 这些经文经过精心挑选，适合初学者和进阶学习者。')}
                                    </p>
                                    <div className="yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                                            <strong>{pick('💡 使用建議：', '💡 使用建议：')}</strong>
                                        </p>
                                        <ul className="text-xs space-y-1 list-disc list-inside ml-2">
                                            <li>{pick('初學者建議從精選經文開始', '初学者建议从精选经文开始')}</li>
                                            <li>{pick('每天背誦 3-5 節，循序漸進', '每天背诵 3-5 节，循序渐进')}</li>
                                            <li>{pick('重複背誦已學過的經文，加深記憶', '重复背诵已学过的经文，加深记忆')}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {pick('📚 選擇書卷章節', '📚 选择书卷章节')}
                                        <ChevronRight className="w-4 h-4 text-bible-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">{pick('點擊頂部的「選擇書卷」按鈕，可以瀏覽聖經 66 卷的任意章節：', '点击顶部的「选择书卷」按钮，可以浏览圣经 66 卷的任意章节：')}</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                1
                                            </span>
                                            <span>{pick('點擊「選擇書卷」下拉菜單', '点击「选择书卷」下拉菜单')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                2
                                            </span>
                                            <span>{pick('選擇舊約或新約書卷（如：創世記、馬太福音）', '选择旧约或新约书卷（如：创世记、马太福音）')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                3
                                            </span>
                                            <span>{pick('選擇章節編號（如：第 1 章）', '选择章节编号（如：第 1 章）')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                4
                                            </span>
                                            <span>{pick('該章所有經文會以卡片形式展示', '该章所有经文会以卡片形式展示')}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-700 dark:text-stone-300">
                                            <strong>{pick('💡 小貼士：', '💡 小贴士：')}</strong>
                                            {pick('選擇章節後，你可以使用「上一章」和「下一章」按鈕快速導航， 或者點擊「查看整章」按鈕查看該章的所有經文。', '选择章节后，你可以使用「上一章」和「下一章」按钮快速导航， 或者点击「查看整章」按钮查看该章的所有经文。')}
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
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">{pick('背誦模式', '背诵模式')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {pick('👁️ 閱讀模式 vs 背誦模式', '👁️ 阅读模式 vs 背诵模式')}
                                        <AlertCircle className="w-4 h-4 text-stone-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        {pick('點擊右上角的', '点击右上角的')}<strong>{pick('眼睛圖標', '眼睛图标')}</strong>{pick('可以切換模式：', '可以切换模式：')}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="yw-soft-card p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">👁️</span>
                                                <strong className="text-sm text-stone-700 dark:text-stone-300">{pick('閱讀模式', '阅读模式')}</strong>
                                            </div>
                                            <p className="text-xs text-stone-600 dark:text-stone-400">{pick('完整顯示經文內容，方便閱讀和記憶', '完整显示经文内容，方便阅读和记忆')}</p>
                                        </div>
                                        <div className="yw-soft-card p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">🔒</span>
                                                <strong className="text-sm text-stone-700 dark:text-stone-300">{pick('背誦模式', '背诵模式')}</strong>
                                            </div>
                                            <p className="text-xs text-stone-600 dark:text-stone-400">{pick('經文被遮罩，只顯示部分提示字，用於測試記憶', '经文被遮罩，只显示部分提示字，用于测试记忆')}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-700 dark:text-stone-300">
                                            <strong>{pick('💡 建議：', '💡 建议：')}</strong>
                                            {pick('初學者建議先使用閱讀模式熟悉經文，熟練後再切換到背誦模式進行測試。', '初学者建议先使用阅读模式熟悉经文，熟练后再切换到背诵模式进行测试。')}
                                        </p>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {pick('🎴 卡片操作詳解', '🎴 卡片操作详解')}
                                        <ChevronRight className="w-4 h-4 text-bible-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        <strong>{pick('點擊卡片', '点击卡片')}</strong>{pick('可以展開/收起經文內容：', '可以展开/收起经文内容：')}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                1
                                            </span>
                                            <span>{pick('點擊卡片 → 展開顯示完整經文', '点击卡片 → 展开显示完整经文')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                2
                                            </span>
                                            <span>{pick('再次點擊 → 收起經文，回到卡片狀態', '再次点击 → 收起经文，回到卡片状态')}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-bible-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                3
                                            </span>
                                            <span>{pick('在背誦模式下，展開後會顯示完整經文，方便核對答案', '在背诵模式下，展开后会显示完整经文，方便核对答案')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        {pick('🔀 隨機排序功能', '🔀 随机排序功能')}
                                        <CheckCircle className="w-4 h-4 text-stone-600" />
                                    </h4>
                                    <p className="text-sm leading-relaxed mb-3">
                                        {pick('點擊', '点击')}<strong>{pick('洗牌按鈕', '洗牌按钮')}</strong>{pick('（🔄）可以隨機打亂卡片順序：', '（🔄）可以随机打乱卡片顺序：')}
                                    </p>
                                    <div className="yw-soft-card p-3 rounded-xl">
                                        <p className="text-xs text-stone-700 dark:text-stone-300">
                                            <strong>{pick('🎯 為什麼要隨機排序？', '🎯 为什么要随机排序？')}</strong>
                                            <br />
                                            {pick('• 避免按順序記憶，提高背誦效果', '• 避免按顺序记忆，提高背诵效果')}
                                            <br />
                                            {pick('• 測試你是否真正記住了經文內容', '• 测试你是否真正记住了经文内容')}
                                            <br />{pick('• 增加背誦的挑戰性和趣味性', '• 增加背诵的挑战性和趣味性')}
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
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">{pick('遮罩提示設置', '遮罩提示设置')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2">{pick('📍 在哪裡調整提示設置？', '📍 在哪里调整提示设置？')}</h4>
                                    <div className="space-y-1.5 text-sm">
                                        <p>
                                            <strong>桌面版：</strong>
                                            {pick('點擊頂部工具列的', '点击顶部工具列的')}<strong>{pick('「提示設置」', '「提示设置」')}</strong>{pick('，會展開折疊面板。', '，会展开折叠面板。')}
                                        </p>
                                        <p>
                                            <strong>{pick('手機版：', '手机版：')}</strong>
                                            {pick('點擊頂部的', '点击顶部的')}<strong>{pick('滑桿圖示', '滑杆图示')}</strong>{pick('（提示設置），會在', '（提示设置），会在')}<strong>{pick('搜索欄下方', '搜索栏下方')}</strong>{pick('展開設置卡片。', '展开设置卡片。')}
                                        </p>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">💡 提示模式</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <p className="font-semibold text-sm mb-1">每句提示</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">{pick('這律〇，總要晝夜思〇', '这律〇，总要昼夜思〇')}</code>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm mb-1">{pick('開頭提示', '开头提示')}</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">{pick('這律〇〇〇〇〇〇〇〇〇〇', '这律〇〇〇〇〇〇〇〇〇〇')}</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="yw-section-card">
                                    <h4 className="font-semibold mb-2">{pick('🔢 字數設置', '🔢 字数设置')}</h4>
                                    <p className="text-sm">
                                        {pick('可選擇', '可选择')}<strong>{pick('固定提示字數', '固定提示字数')}</strong>（如最多提示 2 字）或<strong>{pick('隨機提示字數', '随机提示字数')}</strong>{pick('（如 1-3 字範圍）；短句也會保留至少一個空心圓遮字。', '（如 1-3 字范围）；短句也会保留至少一个空心圆遮字。')}
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
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">{pick('推薦背誦流程', '推荐背诵流程')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card p-5">
                                    <p className="text-sm font-semibold mb-4 text-stone-700 dark:text-stone-300">
                                        {pick('⭐ 使用「每句提示」+「固定提示字數」，從多到少，循序漸進背誦：', '⭐ 使用「每句提示」+「固定提示字数」，从多到少，循序渐进背诵：')}
                                    </p>

                                    <div className="space-y-3">
                                        {/* 阶段 1 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">{pick('階段 1', '阶段 1')}</span>
                                                <span className="text-sm font-semibold">{pick('熟悉經文（5 字）', '熟悉经文（5 字）')}</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                {pick('設置：每句提示 + 最多提示', '设置：每句提示 + 最多提示')}{' '}<strong className="text-stone-600">5 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">{pick('這律法書不可離開你的〇，總要晝夜思〇，好使你謹守遵〇', '这律法书不可离开你的〇，总要昼夜思〇，好使你谨守遵〇')}</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{pick('💡 大部分內容可見，但每個短句仍保留遮字', '💡 大部分内容可见，但每个短句仍保留遮字')}</p>
                                        </div>

                                        {/* 阶段 2 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">{pick('階段 2', '阶段 2')}</span>
                                                <span className="text-sm font-semibold">{pick('開始挑戰（4 → 3 字）', '开始挑战（4 → 3 字）')}</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                {pick('設置：每句提示 + 最多提示', '设置：每句提示 + 最多提示')}{' '}<strong className="text-stone-700">4 字</strong> →{' '}
                                                <strong className="text-stone-700">3 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">{pick('這律法書〇〇，總要晝〇〇，好使你謹〇〇', '这律法书〇〇，总要昼〇〇，好使你谨〇〇')}</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{pick('💡 需要回憶部分內容，加深記憶', '💡 需要回忆部分内容，加深记忆')}</p>
                                        </div>

                                        {/* 阶段 3 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">{pick('階段 3', '阶段 3')}</span>
                                                <span className="text-sm font-semibold">{pick('鞏固記憶（2 字）', '巩固记忆（2 字）')}</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                {pick('設置：每句提示 + 最多提示', '设置：每句提示 + 最多提示')}{' '}<strong className="text-stone-600">2 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">{pick('這律〇〇〇〇，總要〇〇〇〇，好使〇〇〇〇', '这律〇〇〇〇，总要〇〇〇〇，好使〇〇〇〇')}</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{pick('💡 主要靠記憶，只看關鍵提示', '💡 主要靠记忆，只看关键提示')}</p>
                                        </div>

                                        {/* 阶段 4 */}
                                        <div className="yw-section-card">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-1 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">{pick('階段 4', '阶段 4')}</span>
                                                <span className="text-sm font-semibold">{pick('完全背誦（開頭提示）', '完全背诵（开头提示）')}</span>
                                            </div>
                                            <p className="text-xs mb-2">
                                                {pick('設置：開頭提示 + 最多提示', '设置：开头提示 + 最多提示')}{' '}<strong className="text-stone-600">2 字</strong>
                                            </p>
                                            <div className="rounded-xl border border-stone-900/10 bg-white/65 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                                                <code className="text-xs">{pick('這律〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇', '这律〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇')}</code>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{pick('💡 最高難度，挑戰完全背誦', '💡 最高难度，挑战完全背诵')}</p>
                                        </div>
                                    </div>

                                    {/* 核心建议 */}
                                    <div className="mt-4 yw-soft-card">
                                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span className="text-lg">🔄</span>
                                            <span>{pick('來回切換，反覆練習', '来回切换，反复练习')}</span>
                                        </p>
                                        <p className="text-xs leading-relaxed">
                                            {pick('在各階段之間來回切換練習，例如：最多提示 5字 → 3字 → 5字 → 2字 → 開頭提示 → 3字...', '在各阶段之间来回切换练习，例如：最多提示 5字 → 3字 → 5字 → 2字 → 开头提示 → 3字...')}
                                            <br />
                                            {pick('這種', '这种')}<strong className="text-stone-700 dark:text-stone-300">{pick('「變化式」背誦法', '「变化式」背诵法')}</strong>
                                            {pick('能讓大腦保持活躍，記憶更牢固。', '能让大脑保持活跃，记忆更牢固。')}
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
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">{pick('收藏與分享', '收藏与分享')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <p className="text-sm mb-3">
                                        {pick('點擊卡片', '点击卡片')}<strong>{pick('星標圖標 ⭐', '星标图标 ⭐')}</strong> {pick('收藏經文，點擊頂部', '收藏经文，点击顶部')}<strong>{pick('星標按鈕', '星标按钮')}</strong>查看收藏列表。
                                    </p>
                                    <p className="text-sm">
                                        {pick('收藏模式下，點擊', '收藏模式下，点击')}<strong>{pick('分享按鈕 🔗', '分享按钮 🔗')}</strong> {pick('可生成分享鏈接，發送給朋友即可查看。', '可生成分享链接，发送给朋友即可查看。')}
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
                                    {pick('筆記本功能', '笔记本功能')}
                                    <span className="rounded-full border border-stone-900/10 bg-white/70 px-2 py-0.5 text-xs font-medium text-stone-600 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-300">BETA</span>
                                </h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <p className="text-sm mb-3">{pick('點擊菜單 → 「筆記本」記錄靈修筆記。', '点击菜单 → 「笔记本」记录灵修笔记。')}</p>
                                    <p className="text-xs">
                                        {pick('✨ 自動補全經文引用 • 📖 一鍵展開完整經文 • 🔍 浮動聖經查看器 • ✍️ Markdown 格式 • 💾 自動保存與導出', '✨ 自动补全经文引用 • 📖 一键展开完整经文 • 🔍 浮动圣经查看器 • ✍️ Markdown 格式 • 💾 自动保存与导出')}
                                    </p>
                                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-3">
                                        {pick('⚠️ 目前只支持一篇筆記，主要用作草稿和臨時記錄。', '⚠️ 目前只支持一篇笔记，主要用作草稿和临时记录。')}
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
                                <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">{pick('主題與語言設置', '主题与语言设置')}</h3>
                            </div>
                            <div className="pl-13 space-y-3 text-stone-700 dark:text-stone-300 font-chinese">
                                <div className="yw-section-card">
                                    <p className="text-sm">
                                        {pick('點擊右上角切換', '点击右上角切换')}{' '}<strong>{pick('🌓 深色/淺色模式', '🌓 深色/浅色模式')}</strong> 和 <strong>{pick('🌏 繁體/簡體中文', '🌏 繁体/简体中文')}</strong>{pick('，設置會自動保存。', '，设置会自动保存。')}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 常见问题 */}
                        <section className="space-y-4 pt-6 border-t border-bible-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-stone-950 dark:text-stone-50 font-chinese">{pick('❓ 常見問題', '❓ 常见问题')}</h3>
                            <div className="space-y-3">
                                <details className="yw-section-card">
                                    <summary className="font-semibold cursor-pointer text-stone-950 dark:text-stone-50 font-chinese">
                                        {pick('收藏的經文會丟失嗎？', '收藏的经文会丢失吗？')}
                                    </summary>
                                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 font-chinese">
                                        {pick('收藏的經文保存在瀏覽器本地存儲中，只要不清除瀏覽器數據就不會丟失。 建議定期使用分享功能生成鏈接備份。', '收藏的经文保存在浏览器本地存储中，只要不清除浏览器数据就不会丢失。 建议定期使用分享功能生成链接备份。')}
                                    </p>
                                </details>
                                <details className="yw-section-card">
                                    <summary className="font-semibold cursor-pointer text-stone-950 dark:text-stone-50 font-chinese">
                                        {pick('如何在手機上使用？', '如何在手机上使用？')}
                                    </summary>
                                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 font-chinese">
                                        {pick('網站採用響應式設計，在手機瀏覽器中可以正常使用所有功能。 iPhone 用戶推薦使用「心版」App 獲得更好的移動體驗。', '网站采用响应式设计，在手机浏览器中可以正常使用所有功能。 iPhone 用户推荐使用「心版」App 获得更好的移动体验。')}
                                    </p>
                                </details>
                                <details className="yw-section-card">
                                    <summary className="font-semibold cursor-pointer text-stone-950 dark:text-stone-50 font-chinese">
                                        {pick('遇到問題如何反饋？', '遇到问题如何反馈？')}
                                    </summary>
                                    <p className="mt-2 text-sm text-stone-700 dark:text-stone-300 font-chinese">
                                        {pick('如果遇到任何問題或有功能建議，歡迎發送郵件到：', '如果遇到任何问题或有功能建议，欢迎发送邮件到：')}
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
                                {pick('開源項目', '开源项目')}
                            </h3>
                            <div className="space-y-4">
                                <p className="text-stone-700 dark:text-stone-300 font-chinese text-sm">
                                    {pick('「你的話語」是一個開源項目，歡迎查看源代碼、報告問題或貢獻改進！', '「你的话语」是一个开源项目，欢迎查看源代码、报告问题或贡献改进！')}
                                </p>

                                {/* GitHub 仓库卡片 */}
                                <div className="yw-section-card">
                                    <div className="flex items-start gap-3">
                                        <Github className="w-8 h-8 text-gray-700 dark:text-gray-300 flex-shrink-0 mt-1" />
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 font-chinese mb-2">{pick('GitHub 倉庫', 'GitHub 仓库')}</h4>
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
                                                    <span>{pick('報告 Bug', '报告 Bug')}</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website/issues"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-stone-700 dark:hover:text-blue-400"
                                                >
                                                    <span>💡</span>
                                                    <span>{pick('功能建議', '功能建议')}</span>
                                                </a>
                                                <a
                                                    href="https://github.com/andrewyang07/your-words-website"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-stone-700 dark:hover:text-blue-400"
                                                >
                                                    <span>⭐</span>
                                                    <span>{pick('給個 Star', '给个 Star')}</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 底部 */}
                        <div className="pt-6 border-t border-bible-200 dark:border-gray-700 text-center">
                            <p className="text-sm text-stone-600 dark:text-stone-400 font-chinese mb-4">{pick('希望這些功能能幫助你更好地背誦神的話語！', '希望这些功能能帮助你更好地背诵神的话语！')}</p>
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-bible-500 hover:bg-bible-600 text-white rounded-lg transition-colors font-chinese shadow-md"
                            >
                                {pick('開始背誦', '开始背诵')}
                                <span>→</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
