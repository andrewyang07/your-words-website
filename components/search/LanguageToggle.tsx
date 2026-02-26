'use client';

import { useSearchStore, type SearchLang } from '@/stores/useSearchStore';

const options: { value: SearchLang; label: string }[] = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];

export default function LanguageToggle() {
  const { searchLang, setSearchLang } = useSearchStore();

  return (
    <div className="flex items-center gap-1 bg-bible-100 dark:bg-gray-800 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setSearchLang(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            searchLang === opt.value
              ? 'bg-white dark:bg-gray-700 text-bible-800 dark:text-bible-200 shadow-sm'
              : 'text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
