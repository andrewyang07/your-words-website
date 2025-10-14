import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
    title: '你的話語 - 聖經背誦',
    description: '讓神的話語常在心中 - 精美的聖經背誦助手',
    keywords: ['聖經', '背誦', '經文', 'Bible', '記憶', '學習'],
    icons: {
        icon: '/logo.png',
        apple: '/logo.png',
    },
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
