import { Metadata } from 'next';
import BibleNoteClient from '@/components/bible-note/BibleNoteClient';

export const metadata: Metadata = {
    title: '聖經筆記本 - 你的話語',
    description: '在線聖經筆記編輯器，支持經文引用自動識別和補全',
    keywords: ['聖經筆記', '經文引用', 'Markdown', '聖經學習'],
};

export default function BibleNotePage() {
    return <BibleNoteClient />;
}

