'use client';

import ReaderTextSizeControl from './ReaderTextSizeControl';

interface ReaderTextSizeSettingProps {
  language: 'simplified' | 'traditional';
  className?: string;
}

export default function ReaderTextSizeSetting({ language, className = '' }: ReaderTextSizeSettingProps) {
  return (
    <div className={`${className} border-t border-stone-900/10 pt-3 dark:border-white/10`}>
      <p className="mb-2 text-xs font-medium text-stone-600 dark:text-stone-300 font-chinese">
        {language === 'traditional' ? '經文字號' : '经文字号'}
      </p>
      <ReaderTextSizeControl language={language} />
    </div>
  );
}
