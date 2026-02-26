'use client';

import { useAppStore } from '@/stores/useAppStore';

const instructions = {
  simplified: {
    title: '搜索使用说明',
    items: [
      {
        label: '经文引用',
        desc: '输入书卷名 + 章:节',
        examples: '约3:16、创1:1、John 3:16',
      },
      {
        label: '关键词搜索',
        desc: '输入中文或英文关键词',
        examples: '永生、love、信心、grace',
      },
      {
        label: '拼音搜索',
        desc: '支持空格和模糊音',
        examples: '"yue han" 或 "yuehan" → 约翰，"si" 也能匹配 "shi"',
      },
      {
        label: '快捷操作',
        desc: '↑↓ 选择结果，Enter 复制，Esc 清除',
        examples: '',
      },
    ],
  },
  traditional: {
    title: '搜索使用說明',
    items: [
      {
        label: '經文引用',
        desc: '輸入書卷名 + 章:節',
        examples: '約3:16、創1:1、John 3:16',
      },
      {
        label: '關鍵詞搜索',
        desc: '輸入中文或英文關鍵詞',
        examples: '永生、love、信心、grace',
      },
      {
        label: '拼音搜索',
        desc: '支持空格和模糊音',
        examples: '"yue han" 或 "yuehan" → 約翰，"si" 也能匹配 "shi"',
      },
      {
        label: '快捷操作',
        desc: '↑↓ 選擇結果，Enter 複製，Esc 清除',
        examples: '',
      },
    ],
  },
};

export default function SearchHelp() {
  const language = useAppStore((s) => s.language);
  const content = language === 'traditional' ? instructions.traditional : instructions.simplified;

  return (
    <div className="mt-8 p-5 bg-bible-50 dark:bg-gray-800/50 rounded-xl border border-bible-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-bible-700 dark:text-bible-300 font-chinese mb-4">
        {content.title}
      </h3>
      <div className="space-y-3">
        {content.items.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-bible-700 dark:text-bible-300 font-chinese shrink-0">
                {item.label}
              </span>
              <span className="text-xs text-bible-500 dark:text-bible-400 font-chinese">
                {item.desc}
              </span>
            </div>
            {item.examples && (
              <span className="text-xs text-bible-400 dark:text-bible-500 font-chinese ml-0.5">
                {item.examples}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
