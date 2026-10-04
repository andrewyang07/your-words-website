import type { Metadata } from 'next';
import ScriptText from '@/components/ui/ScriptText';
import DocumentTitle from '@/components/layout/DocumentTitle';

export const metadata: Metadata = {
    title: '聖經搜索 - 中文、英文、拼音快速查經',
    description: '支持經文引用、中文關鍵詞、英文與拼音搜索，快速查找聖經經文，適合查經、背誦和靈修使用。',
    alternates: {
        canonical: '/search',
    },
    openGraph: {
        title: '聖經搜索 - 你的話語',
        description: '支持經文引用、關鍵詞與拼音的聖經搜索工具。',
        url: '/search',
        siteName: '你的話語',
        locale: 'zh_TW',
        type: 'website',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '聖經搜索 - 你的話語',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '聖經搜索 - 你的話語',
        description: '支持經文引用、關鍵詞與拼音的聖經搜索工具。',
        images: ['/logo-light.png'],
    },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DocumentTitle traditional="聖經搜索 - 中文、英文、拼音快速查經" simplified="圣经搜索 - 中文、英文、拼音快速查经" />
            <section className="sr-only" aria-label="聖經搜索簡介">
                <h1><ScriptText traditional="聖經搜索" simplified="圣经搜索" /></h1>
                <p><ScriptText traditional="支持經文引用、中文關鍵詞、英文與拼音搜索，快速查找聖經經文，適合查經、背誦和靈修使用。" simplified="支持经文引用、中文关键词、英文与拼音搜索，快速查找圣经经文，适合查经、背诵和灵修使用。" /></p>
            </section>
            {children}
            <section className="mx-auto max-w-2xl px-4 pb-12 font-chinese text-sm leading-7 text-stone-600 dark:text-stone-400">
                <div className="yw-panel p-5">
                    <h2 className="mb-2 text-base font-semibold text-stone-950 dark:text-stone-50"><ScriptText traditional="如何快速找到經文" simplified="如何快速找到经文" /></h2>
                    <p>
                        <ScriptText traditional="你可以輸入「約3:16」「John 3:16」這類經文引用，也可以輸入關鍵詞如「愛」「信心」「平安」。中文、英文與拼音搜索適合查經、靈修準備和背誦複習，幫助你在需要時快速回到神的話語。" simplified="你可以输入「约3:16」「John 3:16」这类经文引用，也可以输入关键词如「爱」「信心」「平安」。中文、英文与拼音搜索适合查经、灵修准备和背诵复习，帮助你在需要时快速回到神的话语。" />
                    </p>
                </div>
            </section>
        </>
    );
}
