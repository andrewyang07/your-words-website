import type { Metadata } from 'next';
import { Mail, Github, Heart, Info } from 'lucide-react';
import Image from 'next/image';
import PageHeader from '@/components/layout/PageHeader';

export const metadata: Metadata = {
    title: '關於 - 你的話語',
    description: '了解「你的話語」聖經背誦助手的開發背景和使命',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 to-white dark:from-gray-900 dark:to-gray-800">
            {/* 使用共用的 PageHeader */}
            <PageHeader 
                onMenuClick={() => {}} // 关于页面不需要菜单
                showHelp={false}
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
                                <h2 className="text-2xl md:text-3xl font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                    你的話語
                                </h2>
                                <p className="text-sm text-bible-600 dark:text-bible-400 font-chinese">聖經背誦助手</p>
                            </div>
                        </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="p-6 md:p-8 space-y-8">
                        {/* 项目介绍 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">📖</span>
                                項目簡介
                            </h3>
                            <div className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed space-y-3">
                                <p>
                                    「你的話語」是一個專為幫助基督徒背誦聖經經文而設計的網頁應用。
                                    通過卡片式學習、智能遮罩提示、收藏分享等功能，
                                    讓背誦聖經變得更加輕鬆有效。
                                </p>
                                <p>
                                    我們精選了 114 節核心經文，涵蓋信仰的基本真理。
                                    你也可以自由選擇聖經 66 卷中的任意章節進行學習。
                                </p>
                            </div>
                        </section>

                        {/* 开发故事 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-base">📱</span>
                                從 App 到 Web 的旅程
                            </h3>
                            <div className="space-y-3 text-bible-700 dark:text-bible-300 font-chinese leading-relaxed">
                                <p>
                                    最初，我投入大量心血開發了一款名為「你的話語」的 iOS App，並成功在全球 App Store 上架。
                                    雖然這款 App 採用卡片形式幫助弟兄姊妹背誦經文，但效果並不如預期。
                                </p>
                                <p>
                                    然而，隨著時間推移，我逐漸意識到 App 的局限性：許多基督徒並不經常使用手機，
                                    而網站的使用門檻更低，無需下載安裝，任何設備都能輕鬆訪問。
                                </p>
                                <p>
                                    在一次主日講道中，我突然有了新的想法（
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        友情提醒：請不要效法我，還是要好好聽講道 😊
                                    </span>
                                    ），決定將這個概念轉化為網站。這兩張潦草的草圖，見證了從想法到現實的第一步。
                                </p>
                            </div>
                        </section>

                        {/* 草图展示 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-base">✏️</span>
                                構思草圖
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md border border-bible-200 dark:border-gray-600">
                                    <Image
                                        src="/sketch-1.jpeg"
                                        alt="網站構思草圖 1"
                                        width={600}
                                        height={450}
                                        className="w-full h-auto object-cover"
                                    />
                                    <p className="p-2 text-xs text-center text-bible-500 dark:text-bible-400">構思草圖（一）</p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-md border border-bible-200 dark:border-gray-600">
                                    <Image
                                        src="/sketch-2.jpeg"
                                        alt="網站構思草圖 2"
                                        width={600}
                                        height={450}
                                        className="w-full h-auto object-cover"
                                    />
                                    <p className="p-2 text-xs text-center text-bible-500 dark:text-bible-400">構思草圖（二）</p>
                                </div>
                            </div>
                        </section>

                        {/* 开发背景 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">✨</span>
                                開發初衷
                            </h3>
                            <div className="bg-bible-50 dark:bg-gray-700 rounded-lg p-4 md:p-6 border border-bible-200 dark:border-gray-600">
                                <p className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed mb-3">
                                    這個項目的誕生源於對神話語的渴慕。作為開發者，我深信：
                                </p>
                                <blockquote className="border-l-4 border-bible-500 dark:border-bible-400 pl-4 italic text-bible-600 dark:text-bible-400 font-chinese">
                                    「你的話是我腳前的燈，是我路上的光。」
                                    <br />
                                    <span className="text-xs">— 詩篇 119:105</span>
                                </blockquote>
                                <p className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed mt-4">
                                    我投入了大量心血開發這個工具，希望能幫助更多弟兄姐妹將神的話語藏在心裡。
                                    這不僅是一個技術項目，更是一份屬靈的服事。
                                </p>
                            </div>
                        </section>

                        {/* iPhone App 推广 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <span className="text-2xl">📱</span>
                                心版 iOS App
                            </h3>
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 md:p-6 border border-blue-200 dark:border-gray-600">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        <Image
                                            src="/xinban-logo.png"
                                            alt="心版 App"
                                            width={80}
                                            height={80}
                                            className="rounded-xl shadow-md"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-bible-800 dark:text-bible-200 font-chinese mb-2">
                                            iPhone 用戶推薦
                                        </h4>
                                        <p className="text-sm text-bible-700 dark:text-bible-300 font-chinese leading-relaxed mb-3">
                                            使用 iPhone？試試「心版」iOS App！
                                            將經文以小組件形式展示在主屏幕上，
                                            每次解鎖手機，第一眼就看到神的話語。
                                        </p>
                                        <p className="text-xs text-bible-600 dark:text-bible-400 font-chinese mb-3">
                                            我也為這個 App 付出了大量心血，並讓它全球上架。
                                            雖然功能很豐富，但對於不太常用手機的基督徒來說可能略顯複雜。
                                            因此，我開發了這個更簡潔易用的網頁版本。
                                        </p>
                                        <a
                                            href="https://apps.apple.com/app/6744570052"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-chinese text-sm shadow-md"
                                        >
                                            前往 App Store 下載
                                            <span>→</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 开源计划 */}
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-bible-800 dark:text-bible-200 font-chinese flex items-center gap-2">
                                <Github className="w-6 h-6" />
                                開源計劃
                            </h3>
                            <div className="text-bible-700 dark:text-bible-300 font-chinese leading-relaxed space-y-3">
                                <p>
                                    這個項目計劃在未來開源，歡迎志同道合的開發者一起參與。
                                    無論是代碼貢獻、功能建議，還是發現問題，都歡迎聯繫我。
                                </p>
                                <div className="flex items-center gap-2 text-bible-600 dark:text-bible-400">
                                    <Mail className="w-5 h-5" />
                                    <span className="text-sm">聯繫郵箱：</span>
                                    <a
                                        href="mailto:yy9577@gmail.com"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        yy9577@gmail.com
                                    </a>
                                </div>
                            </div>
                        </section>

                        {/* 版权信息 */}
                        <section className="pt-6 border-t border-bible-200 dark:border-gray-700">
                            <p className="text-center text-sm text-bible-500 dark:text-bible-400 font-chinese">
                                © 2025 你的話語 · 願神的話語照亮你的人生道路
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

