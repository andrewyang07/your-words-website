import type { Metadata } from 'next';
import { BookOpen, Eye, Star, Share2, FileText, Palette, Globe, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
    title: '幫助 - 你的話語',
    description: '「你的話語」聖經背誦助手詳細使用教程',
};

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* 简单的头部 */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-bible-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <a
                        href="/"
                        className="flex items-center gap-2 text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200 transition-colors group"
                    >
                        <span className="font-chinese text-sm">← 返回主頁</span>
                    </a>
                    <h1 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese">使用幫助</h1>
                </div>
            </header>

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
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">💡 提示模式說明</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-semibold text-sm mb-1">• 每句提示</p>
                                            <p className="text-xs mb-2">在每個句子開頭顯示提示字</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">這律██，總要████（每句都有提示）</code>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm mb-1">• 開頭提示</p>
                                            <p className="text-xs mb-2">只在全文開頭顯示提示字</p>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2 border border-gold-200 dark:border-gray-600">
                                                <code className="text-xs">這律██████████（只有開頭有提示）</code>
                                            </div>
                                        </div>
                                        <div className="bg-gold-100 dark:bg-gray-800 rounded p-3">
                                            <p className="text-xs">
                                                <strong>💡 建議：</strong>
                                                初學者推薦「每句提示」，更容易記憶； 熟練後可使用「開頭提示」增加挑戰。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2">🔢 字數設置</h4>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <strong>固定字數：</strong>
                                            每次顯示相同數量的提示字（如始終顯示 2 個字）
                                        </div>
                                        <div>
                                            <strong>隨機字數：</strong>
                                            設置顯示字數範圍（如 1-3 字），每次點擊卡片會隨機顯示不同數量的提示字， 增加記憶挑戰性
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2">🔄 恢復默認</h4>
                                    <p className="text-sm leading-relaxed">點擊「恢復默認」按鈕可以將所有遮罩設置恢復到初始狀態。</p>
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
                                    <h4 className="font-semibold mb-2">⭐ 收藏經文</h4>
                                    <p className="text-sm leading-relaxed mb-2">
                                        點擊卡片右上角的<strong>星標圖標</strong>可以收藏經文。 收藏的經文會保存在瀏覽器本地，下次訪問時依然保留。
                                    </p>
                                    <p className="text-sm leading-relaxed">在頂部點擊「星標」圖標可以查看所有收藏的經文。</p>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2">🔗 分享鏈接</h4>
                                    <p className="text-sm leading-relaxed mb-2">
                                        在收藏模式下，點擊<strong>分享按鈕</strong>可以生成包含你收藏經文的分享鏈接。
                                    </p>
                                    <p className="text-sm leading-relaxed">將鏈接分享給朋友，他們打開後可以直接看到你分享的經文，並一鍵收藏。</p>
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
                                    <p className="text-sm leading-relaxed mb-3">點擊右上角菜單 → 「筆記本」，可以記錄你的靈修筆記。</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span>✨</span>
                                            <div>
                                                <strong>自動補全：</strong>
                                                輸入經文引用（如「约3:16」）時會自動顯示補全建議
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span>📖</span>
                                            <div>
                                                <strong>一鍵展開：</strong>
                                                點擊「展開所有經文」自動將引用替換為完整經文內容
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span>🔍</span>
                                            <div>
                                                <strong>查看整章：</strong>
                                                底部浮動按鈕可以快速打開聖經查看器，方便插入經文
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span>✍️</span>
                                            <div>
                                                <strong>Markdown 編輯：</strong>
                                                支持 Markdown 格式，包括標題、列表、引用等
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span>💾</span>
                                            <div>
                                                <strong>自動保存：</strong>
                                                筆記內容自動保存到本地，可導出為 Markdown 文件
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-yellow-50 dark:bg-gray-800 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                        ⚠️ 注意：筆記本功能目前只支持保存一篇筆記，主要用作草稿和臨時記錄。
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
                                    <h4 className="font-semibold mb-2">🌓 深色模式</h4>
                                    <p className="text-sm leading-relaxed">
                                        點擊右上角的主題圖標可以切換：
                                        <strong>淺色模式</strong>、<strong>深色模式</strong>、<strong>跟隨系統</strong>。
                                        你的選擇會被保存，下次訪問時自動應用。
                                    </p>
                                </div>
                                <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 border border-bible-200 dark:border-gray-600">
                                    <h4 className="font-semibold mb-2">🌏 繁簡切換</h4>
                                    <p className="text-sm leading-relaxed">
                                        點擊右上角的語言圖標可以在<strong>繁體中文</strong>和<strong>簡體中文</strong>之間切換。
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
