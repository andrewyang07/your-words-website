# Your Words - 圣经背诵应用设计文档 (Next.js 版)

## 1. 系统架构设计

### 1.1 整体架构 (MVP 版本)

```
Your Words Application (Next.js)
├── 前端应用层 (Next.js 14 + React 18)
├── 状态管理层 (Zustand - 简化版)
├── 数据层 (Static JSON Files)
├── 存储层 (localStorage - 仅存用户偏好)
└── 样式层 (Tailwind CSS + Framer Motion)
```

**MVP 简化说明**：

-   不包含圣经翻开动画（第二版）
-   不包含学习进度追踪（第二版）
-   专注于核心功能：预设经文展示和逐节背诵

### 1.2 技术栈选择

#### 推荐技术栈

-   **框架**: Next.js 14 (App Router)
-   **UI 库**: React 18 + TypeScript
-   **状态管理**: Zustand
-   **样式方案**: Tailwind CSS
-   **动画库**: Framer Motion
-   **部署方案**: Vercel (原生支持)

#### 技术选择优势

-   **Next.js**: 服务端渲染(SSR)，SEO 友好，静态生成，与 Cursor AI 配合度高
-   **Zustand**: 轻量级状态管理，比 Redux 简单，TypeScript 支持好
-   **Tailwind CSS**: 原子化 CSS，快速开发，响应式设计
-   **Framer Motion**: 强大的 React 动画库，适合复杂动画序列

## 2. 项目结构设计

### 2.1 Next.js App Router 目录结构

```
your-words/
├── public/
│   ├── data/
│   │   ├── books.json                      // 66卷书卷信息
│   │   ├── preset-verses-simplified.json   // 100节简体预设经文
│   │   ├── preset-verses-traditional.json  // 100节繁体预设经文
│   │   ├── CUV_bible.json                 // 完整简体圣经（已有）
│   │   ├── CUVT_bible.json                // 完整繁体圣经（已有）
│   │   └── WEB_bible.json                 // 完整英文圣经（未来用）
│   ├── images/
│   │   └── icons/                         // 应用图标
│   └── favicon.ico
├── src/
│   ├── app/                           // Next.js App Router
│   │   ├── globals.css               // 全局样式
│   │   ├── layout.tsx                // 根布局
│   │   ├── page.tsx                  // 首页
│   │   ├── study/
│   │   │   ├── page.tsx              // 背诵学习页面
│   │   │   └── [mode]/
│   │   │       └── page.tsx          // 动态路由：预设/逐节模式
│   │   └── api/                      // API路由（如需要）
│   │       └── verses/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                       // 基础UI组件
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Switch.tsx
│   │   ├── layout/                   // 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├── animations/               // 动画组件
│   │   │   ├── PageTransition.tsx
│   │   │   ├── CardAnimation.tsx
│   │   │   ├── FadeIn.tsx
│   │   │   └── SlideIn.tsx
│   │   ├── verses/                   // 经文相关组件
│   │   │   ├── VerseCard.tsx
│   │   │   ├── VerseGrid.tsx
│   │   │   ├── MasonryLayout.tsx
│   │   │   └── VerseDetail.tsx
│   │   ├── filters/                  // 筛选组件
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── TestamentFilter.tsx
│   │   │   ├── BookFilter.tsx
│   │   │   └── SortControls.tsx
│   │   └── study/                    // 学习模式组件
│   │       ├── preset/
│   │       │   ├── PresetMode.tsx
│   │       │   └── PresetGrid.tsx
│   │       ├── chapter/
│   │       │   ├── ChapterMode.tsx
│   │       │   ├── BookSelector.tsx
│   │       │   ├── ChapterSelector.tsx
│   │       │   └── VerseList.tsx
│   │       └── memorize/
│   │           ├── MemorizeView.tsx
│   │           ├── VerseDisplay.tsx
│   │           └── RevealControls.tsx
│   ├── stores/                       // Zustand状态管理
│   │   ├── useAppStore.ts           // 全局应用状态
│   │   ├── useVerseStore.ts         // 经文数据状态
│   │   └── useFilterStore.ts        // 筛选状态
│   │   // 注：useStudyStore.ts 留待第二版
│   ├── hooks/                        // 自定义hooks
│   │   ├── useVerses.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useAnimation.ts
│   │   └── useKeyboard.ts
│   ├── lib/                          // 工具库
│   │   ├── data.ts                   // 数据加载
│   │   ├── storage.ts                // 本地存储
│   │   ├── utils.ts                  // 通用工具
│   │   └── constants.ts              // 常量定义
│   ├── types/                        // TypeScript类型
│   │   ├── verse.ts
│   │   ├── store.ts
│   │   └── common.ts
│   └── styles/
│       ├── animations.css            // 自定义动画
│       └── components.css            // 组件样式
├── tailwind.config.js
├── next.config.js
├── tsconfig.json
└── package.json
```

## 3. Zustand 状态管理设计

### 3.1 应用主状态 (useAppStore)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AppState {
    // UI状态
    currentMode: 'preset' | 'chapter';
    loading: boolean;
    error: string | null;

    // 用户偏好
    language: 'simplified' | 'traditional'; // MVP: 简繁体切换，默认繁体
    theme: 'light' | 'dark';

    // Actions
    setCurrentMode: (mode: 'preset' | 'chapter') => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setLanguage: (language: 'simplified' | 'traditional') => void;
    toggleTheme: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // 初始状态
            currentMode: 'preset',
            loading: false,
            error: null,
            language: 'traditional', // 默认繁体中文
            theme: 'light',

            // Actions
            setCurrentMode: (mode) => set({ currentMode: mode }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            setLanguage: (language) => set({ language }),
            toggleTheme: () =>
                set((state) => ({
                    theme: state.theme === 'light' ? 'dark' : 'light',
                })),
        }),
        {
            name: 'your-words-app',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                language: state.language,
                theme: state.theme,
            }),
        }
    )
);
```

### 3.2 经文数据状态 (useVerseStore)

```typescript
import { create } from 'zustand';
import { Verse, Book } from '@/types/verse';

interface VerseState {
    // 数据
    verses: Verse[];
    books: Book[];
    filteredVerses: Verse[];

    // 加载状态
    versesLoaded: boolean;
    booksLoaded: boolean;

    // Actions
    setVerses: (verses: Verse[]) => void;
    setBooks: (books: Book[]) => void;
    setFilteredVerses: (verses: Verse[]) => void;
    loadVerses: (language: string) => Promise<void>;
    loadBooks: () => Promise<void>;
}

export const useVerseStore = create<VerseState>((set, get) => ({
    // 初始状态
    verses: [],
    books: [],
    filteredVerses: [],
    versesLoaded: false,
    booksLoaded: false,

    // Actions
    setVerses: (verses) => set({ verses, versesLoaded: true }),
    setBooks: (books) => set({ books, booksLoaded: true }),
    setFilteredVerses: (filteredVerses) => set({ filteredVerses }),

    loadVerses: async (language) => {
        try {
            const response = await fetch(`/data/verses-${language}.json`);
            const data = await response.json();
            get().setVerses(data.verses);
        } catch (error) {
            console.error('Failed to load verses:', error);
        }
    },

    loadBooks: async () => {
        try {
            const response = await fetch('/data/books.json');
            const data = await response.json();
            get().setBooks(data.books);
        } catch (error) {
            console.error('Failed to load books:', error);
        }
    },
}));
```

### 3.3 筛选状态 (useFilterStore)

```typescript
import { create } from 'zustand';

interface FilterState {
    // 筛选条件
    testament: 'all' | 'old' | 'new';
    selectedBooks: string[];
    sortBy: 'order' | 'random' | 'priority';

    // 逐节模式特定状态
    selectedBook: string | null;
    selectedChapter: number | null;

    // Actions
    setTestament: (testament: 'all' | 'old' | 'new') => void;
    toggleBook: (book: string) => void;
    clearBooks: () => void;
    setSortBy: (sortBy: 'order' | 'random' | 'priority') => void;
    setSelectedBook: (book: string | null) => void;
    setSelectedChapter: (chapter: number | null) => void;
    resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
    // 初始状态
    testament: 'all',
    selectedBooks: [],
    sortBy: 'order',
    selectedBook: null,
    selectedChapter: null,

    // Actions
    setTestament: (testament) => set({ testament }),
    toggleBook: (book) =>
        set((state) => ({
            selectedBooks: state.selectedBooks.includes(book) ? state.selectedBooks.filter((b) => b !== book) : [...state.selectedBooks, book],
        })),
    clearBooks: () => set({ selectedBooks: [] }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSelectedBook: (selectedBook) => set({ selectedBook }),
    setSelectedChapter: (selectedChapter) => set({ selectedChapter }),
    resetFilters: () =>
        set({
            testament: 'all',
            selectedBooks: [],
            sortBy: 'order',
            selectedBook: null,
            selectedChapter: null,
        }),
}));
```

### 3.4 学习进度状态 (useStudyStore)

**注意：MVP 版本暂不实现此功能，留待第二版添加**

第二版将包含：

-   已背诵经文标记
-   学习历史记录
-   连续学习天数统计
-   简单的成就徽章

当前 MVP 版本专注于经文展示和基础背诵交互。

## 4. Next.js 特定配置

### 4.1 Next.js 配置 (next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    images: {
        domains: [],
        formats: ['image/webp', 'image/avif'],
    },
    // 静态导出配置（如需要）
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
```

### 4.2 Tailwind 配置 (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                // 圣经主题色彩
                bible: {
                    50: '#fefdfb',
                    100: '#fef7ed',
                    200: '#fef3c7',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                },
                gold: {
                    300: '#fcd34d',
                    500: '#f59e0b',
                    700: '#d97706',
                },
            },
            fontFamily: {
                chinese: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
            },
            animation: {
                'bible-open': 'bibleOpen 2s ease-in-out',
                'card-fly': 'cardFly 0.8s ease-out',
                'masonry-fade': 'masonryFade 0.6s ease-out',
            },
            keyframes: {
                bibleOpen: {
                    '0%': { transform: 'rotateY(-30deg)', opacity: '0.8' },
                    '50%': { transform: 'rotateY(-15deg)', opacity: '0.9' },
                    '100%': { transform: 'rotateY(0deg)', opacity: '1' },
                },
                cardFly: {
                    '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
                    '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0.8' },
                    '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
                },
                masonryFade: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0px)', opacity: '1' },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
    darkMode: 'class',
};
```

## 5. 核心组件设计

### 5.1 主页面组件 (src/app/page.tsx) - MVP 版本

```typescript
'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { Book, Layers } from 'lucide-react'; // 使用图标库

export default function HomePage() {
    const router = useRouter();
    const { language, setLanguage, setCurrentMode } = useAppStore();

    const handlePresetMode = () => {
        setCurrentMode('preset');
        router.push('/study/preset');
    };

    const handleChapterMode = () => {
        setCurrentMode('chapter');
        router.push('/study/chapter');
    };

    const toggleLanguage = () => {
        setLanguage(language === 'simplified' ? 'traditional' : 'simplified');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-bible-50 via-bible-100 to-gold-300 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-2xl"
            >
                {/* Logo和标题 */}
                <motion.h1
                    className="text-6xl font-bold text-bible-900 mb-4 font-chinese"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Your Words
                </motion.h1>

                <motion.p
                    className="text-xl text-bible-700 mb-12 font-chinese"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    让神的话语常在心中
                </motion.p>

                {/* 模式选择按钮 */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <motion.button
                        onClick={handlePresetMode}
                        className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Layers className="w-12 h-12 mx-auto mb-4 text-bible-600" />
                        <h3 className="text-2xl font-bold text-bible-900 mb-2 font-chinese">精选经文</h3>
                        <p className="text-bible-600 font-chinese">100节最值得背诵的经文</p>
                    </motion.button>

                    <motion.button
                        onClick={handleChapterMode}
                        className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300"
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Book className="w-12 h-12 mx-auto mb-4 text-bible-600" />
                        <h3 className="text-2xl font-bold text-bible-900 mb-2 font-chinese">逐节背诵</h3>
                        <p className="text-bible-600 font-chinese">按书卷章节系统背诵</p>
                    </motion.button>
                </div>

                {/* 语言切换 */}
                <motion.button
                    onClick={toggleLanguage}
                    className="px-6 py-3 bg-bible-100 hover:bg-bible-200 rounded-full text-bible-800 font-chinese transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {language === 'simplified' ? '简体' : '繁體'} | 切换语言
                </motion.button>
            </motion.div>
        </div>
    );
}
```

### 5.2 经文卡片组件 (VerseCard.tsx) - MVP 核心组件 (Flash Card 模式)

**Flash Card 特性**：
- 默认只显示经文前3-7个字（每张卡片随机）
- 点击翻转显示完整内容
- 有"查看原文"按钮跳转到圣经阅读界面

```typescript
'use client';

import { motion } from 'framer-motion';
import { Verse } from '@/types/verse';
import { useState, useMemo } from 'react';

interface VerseCardProps {
    verse: Verse;
    size?: 'small' | 'medium' | 'large';
    onViewInBible?: () => void; // 查看原文回调
}

export default function VerseCard({ verse, size = 'medium', onClick }: VerseCardProps) {
    const sizeClasses = {
        small: 'p-4 min-h-[120px]',
        medium: 'p-6 min-h-[160px]',
        large: 'p-8 min-h-[200px]',
    };

    const textSizes = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg',
    };

    return (
        <motion.div
            className={`
        ${sizeClasses[size]}
        bg-white rounded-xl shadow-md
        hover:shadow-xl hover:-translate-y-1
        cursor-pointer transition-all duration-300
        border border-bible-200
        flex flex-col justify-between
      `}
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* 经文引用 */}
            <div className="flex items-start justify-between mb-3">
                <span className="text-bible-600 font-medium font-chinese">
                    {verse.book} {verse.chapter}:{verse.verse}
                </span>
                {verse.priority && <span className="px-2 py-1 bg-gold-300 text-bible-900 rounded-full text-xs">★</span>}
            </div>

            {/* 经文内容 */}
            <p
                className={`
        ${textSizes[size]}
        text-bible-800 leading-relaxed font-chinese
        line-clamp-4
      `}
            >
                {verse.text}
            </p>

            {/* 约别标签 */}
            <div className="mt-3 pt-2 border-t border-bible-100">
                <span className="text-xs text-bible-500 font-chinese">{verse.testament === 'old' ? '旧约' : '新约'}</span>
            </div>
        </motion.div>
    );
}
```

### 5.3 砖块布局组件

```typescript
'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Verse } from '@/types/verse';
import VerseCard from './VerseCard';

interface MasonryLayoutProps {
    verses: Verse[];
    onCardClick: (verse: Verse) => void;
}

export default function MasonryLayout({ verses, onCardClick }: MasonryLayoutProps) {
    // 计算砖块布局
    const masonryColumns = useMemo(() => {
        const columns = [[], [], [], []] as Verse[][];
        const columnHeights = [0, 0, 0, 0];

        verses.forEach((verse) => {
            // 找到最短的列
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

            // 根据优先级确定卡片高度
            const cardHeight = getCardHeight(verse);

            columns[shortestColumnIndex].push(verse);
            columnHeights[shortestColumnIndex] += cardHeight;
        });

        return columns;
    }, [verses]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {masonryColumns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex flex-col gap-4">
                    {column.map((verse, index) => (
                        <motion.div
                            key={verse.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: (columnIndex * column.length + index) * 0.1,
                            }}
                        >
                            <VerseCard verse={verse} size={getCardSize(verse)} onClick={() => onCardClick(verse)} />
                        </motion.div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function getCardSize(verse: Verse): 'small' | 'medium' | 'large' {
    if (verse.priority >= 5) return 'large';
    if (verse.priority >= 3) return 'medium';
    return 'small';
}

function getCardHeight(verse: Verse): number {
    const sizes = { small: 120, medium: 150, large: 180 };
    return sizes[getCardSize(verse)];
}
```

## 6. 部署和构建

### 6.1 Vercel 部署配置

```json
{
    "buildCommand": "npm run build",
    "outputDirectory": "out",
    "installCommand": "npm install",
    "framework": "nextjs",
    "functions": {},
    "rewrites": []
}
```

### 6.2 package.json 脚本

```json
{
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "export": "next export",
        "start": "next start",
        "lint": "next lint",
        "type-check": "tsc --noEmit"
    },
    "dependencies": {
        "next": "^14.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "zustand": "^4.4.0",
        "framer-motion": "^10.16.0",
        "tailwindcss": "^3.3.0",
        "@tailwindcss/typography": "^0.5.0",
        "@tailwindcss/forms": "^0.5.0"
    },
    "devDependencies": {
        "@types/react": "^18.2.0",
        "@types/react-dom": "^18.2.0",
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0",
        "autoprefixer": "^10.4.0",
        "postcss": "^8.4.0"
    }
}
```

## 7. 性能优化

### 7.1 Next.js Image 优化

```typescript
import Image from 'next/image';

// 自动优化图片格式和大小
<Image
    src="/images/bible-animation/bible-cover.png"
    alt="Bible Cover"
    width={400}
    height={300}
    priority // 关键图片预加载
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
/>;
```

### 7.2 动态导入优化

```typescript
import dynamic from 'next/dynamic';

// 延迟加载非关键组件
const StudyMode = dynamic(() => import('@/components/study/StudyMode'), {
    ssr: false,
    loading: () => <LoadingSkeleton />,
});

const BibleOpenAnimation = dynamic(() => import('@/components/animations/BibleOpenAnimation'), { ssr: false });
```

## 8. MVP 范围说明

### 第一版包含：

-   ✅ 简洁首页（模式选择）
-   ✅ 100 节精选经文预设模式
-   ✅ 全 66 卷逐节背诵模式
-   ✅ 简繁体切换
-   ✅ 筛选排序功能
-   ✅ 精美卡片动画
-   ✅ 背诵交互界面
-   ✅ 响应式设计

### 第二版计划：

-   ⏳ 圣经翻开动画
-   ⏳ 学习进度追踪
-   ⏳ 背诵统计
-   ⏳ 成就系统

---

**文档版本**: 3.0 (MVP)  
**最后更新**: 2025 年 10 月 14 日  
**技术栈**: Next.js 14 + Zustand + Tailwind CSS + Framer Motion  
**当前状态**: MVP 开发中  
**开源协议**: MIT License
