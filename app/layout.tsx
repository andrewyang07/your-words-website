import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://www.yourwords.me'),
    title: '你的話語 - 背聖經',
    description: '你的話語 - 免費聖經背誦工具，114節精選經文，Flash Card背誦模式。你的话语 - 免费圣经背诵工具，让神的话语常在心中。',
    keywords: [
        // 繁体关键词
        '聖經', '背誦', '經文', '背聖經', '聖經背誦', '背經文', '聖經app', '靈修', '背經', '經文背誦',
        // 简体关键词
        '圣经', '背诵', '经文', '背圣经', '圣经背诵', '背经文', '圣经app', '灵修', '背经', '经文背诵',
        // 品牌关键词
        '你的話語', '你的话语', 'your words', 'yourwords', '你的話語app', '你的话语app',
        // 通用词
        'Bible', '記憶經文', '记忆经文', '基督教', '基督教app', '聖經學習', '圣经学习',
    ],
    authors: [{ name: 'Your Words Team' }],
    creator: 'Your Words',
    publisher: 'Your Words',
    alternates: {
        languages: {
            'zh-TW': 'https://www.yourwords.me',
            'zh-CN': 'https://www.yourwords.me',
            'zh': 'https://www.yourwords.me',
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
        title: '你的話語 - 背聖經',
        description: '免費聖經背誦工具，114節精選經文，Flash Card背誦模式，支持收藏分享。',
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
        title: '你的話語 - 背聖經',
        description: '免費聖經背誦工具，114節精選經文，Flash Card背誦模式。',
        images: ['/logo-light.png'],
    },
    icons: {
        icon: '/logo-light.png',
        apple: '/logo-light.png',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="zh-CN" suppressHydrationWarning>
            <head>
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
