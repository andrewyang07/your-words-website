import { Metadata } from 'next';
import BibleNoteClient from '@/components/bible-note/BibleNoteClient';

export const metadata: Metadata = {
    title: '圣经笔记本 - 你的话语',
    description: '在线圣经笔记本，支持经文引用、Markdown编辑、导出备份。记录你的灵修心得，让神的话语更深地扎根在心中。',
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
        title: '圣经笔记本 - 你的话语',
        description: '在线圣经笔记本，支持经文引用、Markdown编辑、导出备份',
        type: 'website',
    },
};

export default function NotePage() {
    return <BibleNoteClient />;
}

