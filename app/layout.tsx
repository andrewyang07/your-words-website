import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://www.yourwords.me'),
    title: '你的話語 - 聖經背誦助手 | 精選114節經文',
    description: '免費的聖經背誦工具，提供精選114節經文和66卷聖經逐節學習。支持Flash Card模式、收藏分享，讓神的話語常在心中。',
    keywords: ['聖經', '背誦', '經文', 'Bible', '記憶', '學習', '聖經app', '背經', '靈修', '基督教', '你的話語'],
    authors: [{ name: 'Your Words Team' }],
    creator: 'Your Words',
    publisher: 'Your Words',
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
        title: '你的話語 - 聖經背誦助手',
        description: '免費的聖經背誦工具，提供精選114節經文和66卷聖經逐節學習。支持Flash Card模式、收藏分享。',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '你的話語 Logo',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '你的話語 - 聖經背誦助手',
        description: '免費的聖經背誦工具，提供精選114節經文和66卷聖經逐節學習。',
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
                {children}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
