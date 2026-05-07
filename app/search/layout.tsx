import type { Metadata } from 'next';

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
            <section className="sr-only" aria-label="聖經搜索簡介">
                <h1>聖經搜索</h1>
                <p>支持經文引用、中文關鍵詞、英文與拼音搜索，快速查找聖經經文，適合查經、背誦和靈修使用。</p>
            </section>
            {children}
        </>
    );
}
