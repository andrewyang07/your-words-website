import { Metadata } from 'next';
import BibleNoteClient from '@/components/bible-note/BibleNoteClient';

export const metadata: Metadata = {
    title: '筆記本 - 你的話語',
    description: '聖經筆記本，記錄你的靈修筆記，支持經文引用和自動補全',
    keywords: ['聖經', '筆記本', '靈修', '經文', '背誦', '你的話語'],
};

export default function NotePage() {
    return <BibleNoteClient />;
}

