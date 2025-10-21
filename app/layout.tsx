import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://www.yourwords.me'),
    title: '你的話語 - 背聖經，記筆記 | 你的话语 - 背圣经，记笔记',
    description: '免費聖經背誦工具，支持Flash Card背誦模式和聖經筆記本功能。免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能。繁體中文、簡體中文雙語支持，讓神的話語常在心中。',
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
        languages: {
            'zh-TW': 'https://www.yourwords.me',
            'zh-CN': 'https://www.yourwords.me',
            zh: 'https://www.yourwords.me',
        },
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
        title: '你的話語 - 背聖經，記筆記 | 你的话语 - 背圣经，记笔记',
        description: '免費聖經背誦工具，支持Flash Card背誦模式和聖經筆記本功能。免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能。',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '你的話語 - 背聖經',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '你的話語 - 背聖經，記筆記 | 你的话语 - 背圣经，记笔记',
        description: '免費聖經背誦工具，支持Flash Card背誦模式和聖經筆記本功能。免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能。',
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
        '@type': 'WebApplication',
        name: '你的话语',
        alternateName: 'Your Words',
        description: '免費聖經背誦工具，支持Flash Card背誦模式和聖經筆記本功能。免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能',
        url: 'https://www.yourwords.me',
        applicationCategory: 'EducationApplication',
        operatingSystem: 'Web Browser',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        inLanguage: ['zh-TW', 'zh-CN'],
        featureList: ['圣经背诵', 'Flash Card模式', '圣经笔记本', '经文收藏', '经文分享'],
    };

    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <head>
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
            <body className="antialiased" suppressHydrationWarning>
                <ErrorBoundary>{children}</ErrorBoundary>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
