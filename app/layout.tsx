import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Noto_Sans_SC } from 'next/font/google';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import AppStoreStorageSync from '@/components/AppStoreStorageSync';
import './globals.css';

const notoSans = Noto_Sans_SC({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
    preload: true,
});

export const metadata: Metadata = {
    metadataBase: new URL('https://www.yourwords.me'),
    title: {
        default: '你的話語 - 免費聖經背誦與搜索工具',
        template: '%s | 你的話語',
    },
    description:
        '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
    keywords: [
        // 繁体关键词（主要）
        '背聖經',
        '聖經背誦',
        '聖經筆記',
        '聖經app',
        '免費聖經',
        '聖經學習',
        '靈修',
        '背經文',
        '聖經工具',
        '聖經筆記本',
        '靈修筆記',
        // 简体关键词
        '背圣经',
        '圣经背诵',
        '圣经笔记',
        '圣经app',
        '免费圣经',
        '圣经学习',
        '灵修',
        '背经文',
        '圣经工具',
        '圣经笔记本',
        '灵修笔记',
        // 品牌关键词
        '你的話語',
        '你的话语',
        'your words',
        'yourwords',
        '你的話語app',
        '你的话语app',
        // 功能关键词
        'Flash Card',
        '聖經卡片',
        '圣经卡片',
        '經文收藏',
        '经文收藏',
        '聖經分享',
        '圣经分享',
        // 搜索关键词
        '聖經搜索',
        '經文搜索',
        '搜索聖經',
        '圣经搜索',
        '经文搜索',
        '搜索圣经',
        'Bible search',
        '拼音搜索',
        // 通用词
        'Bible',
        '基督教',
        '基督教app',
        '聖經助手',
        '圣经助手',
        '記憶經文',
        '记忆经文',
    ],
    authors: [{ name: 'Your Words Team' }],
    creator: 'Your Words',
    publisher: 'Your Words',
    alternates: {
        canonical: '/',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'zh_TW',
        alternateLocale: ['zh_CN'],
        url: 'https://www.yourwords.me',
        siteName: '你的話語',
        title: '你的話語 - 免費聖經背誦與搜索工具',
        description: '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '你的話語 - 聖經背誦與搜索',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '你的話語 - 免費聖經背誦與搜索工具',
        description: '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
        images: ['/logo-light.png'],
    },
    icons: {
        icon: '/logo-light.png',
        apple: '/logo-light.png',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebApplication',
                '@id': 'https://www.yourwords.me/#app',
                name: '你的話語',
                alternateName: ['你的话语', 'Your Words'],
                description: '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
                url: 'https://www.yourwords.me',
                applicationCategory: 'EducationApplication',
                operatingSystem: 'Web Browser',
                isAccessibleForFree: true,
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                },
                inLanguage: ['zh-TW', 'zh-CN', 'en'],
                featureList: ['聖經背誦', '聖經搜索', '中文、英文、拼音搜索', 'Flash Card 背誦模式', '聖經筆記本', '經文收藏', '經文分享', '本地優先使用'],
            },
            {
                '@type': 'WebSite',
                '@id': 'https://www.yourwords.me/#website',
                name: '你的話語',
                alternateName: ['你的话语', 'Your Words'],
                url: 'https://www.yourwords.me',
                inLanguage: ['zh-TW', 'zh-CN', 'en'],
                potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://www.yourwords.me/search?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                },
            },
        ],
    };

    return (
        <html lang="zh-Hant" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structuredData),
                    }}
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('your-words-app');
                  let theme = 'system';
                  if (stored) {
                    try {
                      const data = JSON.parse(stored);
                      theme = data.state?.theme || 'system';
                    } catch (e) {}
                  }
                  
                  const isDark = theme === 'dark' || 
                    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
                    }}
                />
            </head>
            <body className={`${notoSans.className} antialiased`} suppressHydrationWarning>
                <AppStoreStorageSync />
                <nav className="sr-only" aria-label="主要頁面">
                    <a href="/memorize">深度背誦</a>
                    <a href="/search">聖經搜索</a>
                    <a href="/note">聖經筆記本</a>
                    <a href="/rankings">聖經經文排行榜</a>
                    <a href="/about">關於你的話語</a>
                    <a href="/help">使用幫助</a>
                </nav>
                <ErrorBoundary>{children}</ErrorBoundary>
                <Analytics />
                <SpeedInsights />
                <ServiceWorkerRegistration />
            </body>
        </html>
    );
}
