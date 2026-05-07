import { Metadata } from 'next';
import BibleNoteClient from '@/components/bible-note/BibleNoteClient';

export const metadata: Metadata = {
    title: '聖經筆記本',
    description: '本地優先的線上聖經筆記本，支持經文引用、Markdown 編輯與匯出備份，適合記錄靈修心得。',
    alternates: {
        canonical: '/note',
    },
    keywords: [
        '圣经笔记本',
        '圣经笔记',
        '灵修笔记',
        '经文笔记',
        '圣经学习',
        '你的话语',
        '你的話語',
        '圣经工具',
        '免费圣经',
        '灵修',
        '背圣经',
        '圣经背诵'
    ],
    openGraph: {
        title: '聖經筆記本 - 你的話語',
        description: '本地優先的線上聖經筆記本，支持經文引用、Markdown 編輯與匯出備份。',
        url: '/note',
        siteName: '你的話語',
        locale: 'zh_TW',
        type: 'website',
        images: [
            {
                url: '/logo-light.png',
                width: 1024,
                height: 1024,
                alt: '聖經筆記本 - 你的話語',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: '聖經筆記本 - 你的話語',
        description: '本地優先的線上聖經筆記本，支持經文引用、Markdown 編輯與匯出備份。',
        images: ['/logo-light.png'],
    },
};

export default function NotePage() {
    return <BibleNoteClient />;
}
