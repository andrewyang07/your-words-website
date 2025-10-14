import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Your Words - 圣经背诵应用',
  description: '让神的话语常在心中 - 精美的圣经背诵助手',
  keywords: ['圣经', '背诵', '经文', 'Bible', '记忆', '学习'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

