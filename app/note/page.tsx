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
    return (
        <>
            <section className="sr-only" aria-label="聖經筆記本簡介">
                <h1>聖經筆記本</h1>
                <p>本地優先的線上聖經筆記本，支持經文引用、Markdown 編輯與匯出備份，適合記錄靈修心得。</p>
            </section>
            <BibleNoteClient />
            <section className="mx-auto max-w-4xl px-4 pb-12 font-chinese text-sm leading-7 text-stone-600 dark:text-stone-400">
                <div className="yw-panel p-5">
                    <h2 className="mb-2 text-base font-semibold text-stone-950 dark:text-stone-50">聖經筆記本適合怎麼用</h2>
                    <p>
                        用聖經筆記本記錄靈修心得、講道筆記和查經重點。輸入約3:16、John 3:16 這類經文引用時，筆記本可以辨識並插入經文內容。筆記保存在本機瀏覽器中，支持 Markdown 編輯與匯出備份，適合長期整理自己的讀經記錄。
                    </p>
                </div>
            </section>
        </>
    );
}
