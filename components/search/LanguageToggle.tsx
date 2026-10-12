'use client';

import { useSearchStore, type SearchLang } from '@/stores/useSearchStore';
import { useAppStore } from '@/stores/useAppStore';
import type { UiScript } from '@/lib/uiScript';

type Option = { key: string; label: string; lang: SearchLang; script?: UiScript };

// 简 / 繁 select Chinese corpus in that script (and set the product UI script, same as SideMenu);
// English selects the WEB corpus.
const options: Option[] = [
  { key: 'zh-Hans', label: '简', lang: 'zh', script: 'simplified' },
  { key: 'zh-Hant', label: '繁', lang: 'zh', script: 'traditional' },
  { key: 'en', label: 'English', lang: 'en' },
];

export default function LanguageToggle() {
  const { searchLang, setSearchLang } = useSearchStore();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <div
      role="group"
      aria-label={language === 'traditional' ? '搜索語言' : '搜索语言'}
      className="flex items-center gap-1 bg-bible-100 dark:bg-gray-800 rounded-lg p-1"
    >
      {options.map((opt) => {
        const active = opt.lang === searchLang && (!opt.script || opt.script === language);
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={active}
            lang={opt.key}
            onClick={() => {
              setSearchLang(opt.lang);
              if (opt.script) setLanguage(opt.script);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              active
                ? 'bg-white dark:bg-gray-700 text-bible-800 dark:text-bible-200 shadow-sm'
                : 'text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
