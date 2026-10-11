import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import AppStoreStorageSync from '@/components/AppStoreStorageSync';
import ScriptText from '@/components/ui/ScriptText';
import type { Metadata } from 'next';
import './globals.css';

// No webfont: `font-chinese` (tailwind.config) uses system CJK fonts (PingFang/YaHei/Noto CJK…). The old
// Google-font Noto Sans SC shipped ~1.1 MB of CJK woff2 slices on every page.

export const metadata: Metadata = {
  metadataBase: new URL('https://www.yourwords.me'),
  title: {
    default: '你的话语 - 免費聖經背誦與搜索工具',
    template: '%s | 你的话语',
  },
  description:
    '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
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
    locale: 'zh_CN',
    alternateLocale: ['zh_TW'],
    url: 'https://www.yourwords.me',
    siteName: '你的话语',
    title: '你的话语 - 免費聖經背誦與搜索工具',
    description:
      '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: '你的话语 - 免费圣经背诵与搜索',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '你的话语 - 免費聖經背誦與搜索工具',
    description:
      '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
    images: ['/og-default.png'],
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
        name: '你的话语',
        alternateName: ['你的话语', 'Your Words'],
        description:
          '免費聖經背誦與搜索工具，支持中文、英文、拼音快速查找經文，提供 Flash Card 背誦、經文收藏、分享與聖經筆記本功能。',
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
        featureList: [
          '聖經背誦',
          '聖經搜索',
          '中文、英文、拼音搜索',
          'Flash Card 背誦模式',
          '聖經筆記本',
          '經文收藏',
          '經文分享',
          '本地優先使用',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.yourwords.me/#website',
        name: '你的话语',
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
    <html lang="zh-Hans" suppressHydrationWarning>
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
      <body className="antialiased" suppressHydrationWarning>
        <AppStoreStorageSync />
        <nav className="sr-only" aria-label="主要頁面">
          <a href="/memorize">
            <ScriptText traditional="深度背誦" simplified="深度背诵" />
          </a>
          <a href="/search">
            <ScriptText traditional="聖經搜索" simplified="圣经搜索" />
          </a>
          <a href="/note">
            <ScriptText traditional="聖經筆記本" simplified="圣经笔记本" />
          </a>
          <a href="/rankings">
            <ScriptText traditional="聖經經文排行榜" simplified="圣经经文排行榜" />
          </a>
          <a href="/about">
            <ScriptText traditional="關於你的話語" simplified="关于你的话语" />
          </a>
          <a href="/help">
            <ScriptText traditional="使用幫助" simplified="使用帮助" />
          </a>
        </nav>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Analytics />
        <SpeedInsights />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
