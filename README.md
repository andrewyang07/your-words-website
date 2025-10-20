# 你的話語 Your Words

> 讓神的話語常在心中 ✝️

一個精美的聖經背誦 Web 應用，幫助用戶系統地背誦和學習聖經經文。支持繁體中文和簡體中文，提供精選經文和逐章背誦功能。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)

## 🌐 在線體驗

**[https://www.yourwords.me](https://www.yourwords.me)**

## ✨ 功能特性

### 📖 核心功能

-   **精選經文模式** - 精心挑選 114 節最值得背誦的經文
-   **逐章背誦模式** - 全 66 卷聖經，逐書卷、逐章節系統學習
-   **Flash Card 互動** - 點擊顯示完整經文，漸進式記憶
-   **收藏與分享** - 收藏喜愛的經文，通過 URL 分享給朋友
-   **閱讀/背誦切換** - 一鍵切換顯示模式，靈活學習
-   **🆕 聖經筆記本 (BETA)** - 記錄靈修筆記，支持經文引用自動補全、Markdown 編輯、導出備份

### 🎨 用戶體驗

-   **精美 UI 設計** - 聖經主題金色配色，優雅的卡片式佈局
-   **流暢動畫效果** - 瀑布流入場、懸停效果、平滑過渡
-   **智能篩選排序** - 按書卷、章節篩選，支持隨機洗牌
-   **章節快速選擇** - 可視化章節網格，快速定位

### 🌏 多語言與設備

-   **繁簡體切換** - 繁體中文（默認）、簡體中文無縫切換
-   **深色模式** - 自動跟隨系統，也可手動切換
-   **完全響應式** - 完美適配手機、平板、桌面設備
-   **PWA 支持** - 可添加到主屏幕，類原生應用體驗

### ⚡ 技術亮點

-   **純前端實現** - 無需登錄，無需後端，極速加載
-   **本地存儲** - 收藏和偏好設置本地保存，隱私安全
-   **SEO 優化** - 完善的元數據和站點地圖
-   **性能優化** - 按需加載，流暢 60fps 動畫

## 🚀 快速開始

### 前置要求

-   Node.js 18.0 或更高版本
-   npm 或 yarn

### 本地開發

```bash
# 克隆倉庫
git clone https://github.com/andrewyang07/your-words-website.git
cd your-words-website

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用。

### 構建部署

```bash
# 生產構建
npm run build

# 本地預覽構建結果
npm start
```

## 📚 技術棧

-   **框架**: [Next.js 14](https://nextjs.org/) (App Router)
-   **語言**: [TypeScript 5](https://www.typescriptlang.org/)
-   **狀態管理**: [Zustand](https://github.com/pmndrs/zustand)
-   **樣式**: [Tailwind CSS](https://tailwindcss.com/)
-   **動畫**: [Framer Motion](https://www.framer.com/motion/)
-   **UI 組件**: [Headless UI](https://headlessui.com/)
-   **圖標**: [Lucide React](https://lucide.dev/)
-   **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
-   **部署**: [Vercel](https://vercel.com/)

## 🏗️ 技術架構

### 設計原則

本項目遵循以下核心開發原則（詳見 [.cursorrules](/.cursorrules)）：

1. **代碼簡潔性** - 優先使用簡單直接的解決方案，避免過度工程化
2. **單一職責** - 每個組件只負責一個明確的功能
3. **可讀性優先** - 變量命名清晰直觀，函數長度不超過 30 行
4. **類型安全** - 所有組件都有明確的 TypeScript 類型定義
5. **移動端優先** - 響應式設計，觸摸友好的交互元素

### 核心技術決策

#### 1. 純前端架構
- **無後端依賴** - 所有數據以靜態 JSON 存儲在 `/public/data/`
- **本地優先** - 使用 localStorage 保存用戶偏好和收藏
- **零延遲加載** - 經文數據預加載，即時響應

#### 2. Next.js App Router
- **服務端組件（RSC）** - About 和 Help 頁面使用 RSC，優化 SEO
- **客戶端組件** - 交互邏輯分離到 `*Client.tsx` 組件
- **靜態生成（SSG）** - 所有頁面在構建時生成，極速加載
- **動態路由** - 分享鏈接通過 URL 參數實現

#### 3. 狀態管理策略
- **全局狀態（Zustand）** - 主題、語言、收藏等跨組件狀態
- **本地狀態（useState）** - 組件內部 UI 狀態
- **URL 狀態** - 分享鏈接參數

#### 4. 性能優化
- **按需加載** - 使用 `dynamic()` 動態導入重組件（如筆記本編輯器）
- **圖片優化** - Next.js `<Image>` 組件自動優化
- **動畫性能** - Framer Motion GPU 加速動畫
- **骨架屏** - 加載狀態使用 Skeleton 組件提升感知速度

#### 5. 數據結構設計

```typescript
// 經文數據結構
interface Verse {
  id: string;           // 唯一標識：book-chapter-verse
  book: string;         // 書卷名（中文）
  bookKey: string;      // 書卷鍵（英文縮寫）
  chapter: number;      // 章節編號
  verse: number;        // 節號
  text: string;         // 經文內容
}

// 書卷元數據
interface BookMetadata {
  key: string;          // 書卷鍵
  name: string;         // 書卷名
  testament: 'OT' | 'NT'; // 舊約/新約
  chapters: number;     // 章節總數
}
```

#### 6. 遮罩算法實現

支持兩種提示模式：

- **每句提示**：在每個句子（以標點符號分隔）開頭顯示提示字
- **開頭提示**：只在全文開頭顯示提示字

支持固定字數或隨機範圍字數，演算法核心在 `lib/maskUtils.ts`。

## 📁 項目結構

```
your-words-website/
├── app/                          # Next.js 14 App Router
│   ├── page.tsx                 # 主頁面（卡片背誦功能）
│   ├── note/                    # 聖經筆記本頁面
│   │   ├── page.tsx            # 筆記本主頁面
│   │   └── loading.tsx         # 加載狀態
│   ├── about/                   # 關於頁面
│   │   ├── page.tsx            # 服務端組件（SEO 優化）
│   │   └── AboutPageClient.tsx # 客戶端組件（交互邏輯）
│   ├── help/                    # 幫助頁面
│   │   ├── page.tsx            # 服務端組件（SEO 優化）
│   │   └── HelpPageClient.tsx  # 客戶端組件（交互邏輯）
│   ├── layout.tsx              # 根佈局和全局元數據
│   ├── globals.css             # 全局樣式和 Tailwind
│   └── sitemap.ts              # 動態站點地圖生成
│
├── components/                   # React 組件庫
│   ├── verses/                  # 經文卡片和佈局
│   │   ├── VerseCard.tsx       # 單個經文卡片
│   │   ├── VerseGrid.tsx       # 卡片網格佈局
│   │   ├── VerseCardSkeleton.tsx # 加載骨架屏
│   │   └── MaskedVerseCard.tsx # 遮罩模式卡片
│   ├── bible-note/             # 筆記本相關組件
│   │   ├── BibleNoteClient.tsx # 筆記本主容器
│   │   ├── MarkdownEditor.tsx  # Markdown 編輯器
│   │   ├── ChapterViewer.tsx   # 聖經章節查看器
│   │   ├── VerseReferenceList.tsx # 引用經文列表
│   │   ├── VerseCard.tsx       # 筆記本經文卡片
│   │   └── UsageGuide.tsx      # 使用指南
│   ├── navigation/             # 導航和菜單
│   │   ├── SideMenu.tsx        # 側邊欄菜單
│   │   └── ChapterNavigation.tsx # 章節導航
│   ├── settings/               # 設置相關組件
│   │   ├── BookSelector.tsx    # 書卷選擇器
│   │   ├── ChapterSelector.tsx # 章節選擇器
│   │   └── MaskSettings.tsx    # 遮罩設置面板
│   ├── layout/                 # 佈局組件
│   │   ├── PageHeader.tsx      # 共用頁面頭部
│   │   └── AppBanner.tsx       # 應用推廣橫幅
│   └── ui/                     # 通用 UI 組件
│       ├── Select.tsx          # 下拉選擇器
│       ├── Slider.tsx          # 滑動條
│       └── Toggle.tsx          # 切換開關
│
├── lib/                         # 核心邏輯庫
│   ├── verseLoader.ts          # 經文數據加載和緩存
│   ├── verseParser.ts          # 經文引用解析器
│   ├── bibleAutocomplete.ts    # 經文自動補全邏輯
│   ├── maskUtils.ts            # 遮罩算法實現
│   └── utils.ts                # 通用工具函數
│
├── stores/                      # Zustand 全局狀態管理
│   └── useAppStore.ts          # 應用狀態（主題、語言、收藏等）
│
├── types/                       # TypeScript 類型定義
│   ├── verse.ts                # 經文相關類型
│   ├── bible.ts                # 聖經數據類型
│   └── note.ts                 # 筆記本類型
│
├── hooks/                       # 自定義 React Hooks
│   ├── useLocalStorage.ts      # 本地存儲 Hook
│   ├── useTheme.ts            # 主題切換 Hook
│   └── useDebounce.ts         # 防抖 Hook
│
└── public/                      # 靜態資源
    ├── data/                   # 聖經 JSON 數據
    │   ├── bible_traditional.json  # 繁體聖經全文
    │   ├── bible_simplified.json   # 簡體聖經全文
    │   ├── books.json          # 書卷元數據
    │   ├── preset_verses.json  # 精選 114 節經文
    │   └── metadata.json       # 書卷章節統計
    ├── logo-light.png          # 應用 Logo
    ├── xinban-logo.png         # 心版 App Logo
    ├── sketch-1.jpeg           # 構思草圖
    ├── sketch-2.jpeg           # 構思草圖
    ├── manifest.json           # PWA 配置
    └── sitemap.xml             # 靜態站點地圖
```

## 🎯 路線圖

### ✅ v1.0 - MVP（已完成）

-   [x] 114 節精選經文
-   [x] 全 66 卷逐章背誦
-   [x] 繁簡體切換
-   [x] 深色模式
-   [x] 收藏功能
-   [x] URL 分享收藏
-   [x] 書卷章節篩選
-   [x] 閱讀/背誦模式切換
-   [x] 遮罩背誦模式（短語提示/開頭提示）
-   [x] 隨機洗牌
-   [x] 精美動畫和響應式設計
-   [x] SEO 優化

### ✅ v1.1 - 筆記本功能（BETA）

-   [x] 聖經筆記本編輯器
-   [x] 經文引用自動補全
-   [x] Markdown 格式支持
-   [x] 實時預覽
-   [x] 經文引用列表
-   [x] 一鍵展開經文內容
-   [x] 浮動聖經章節查看器
-   [x] 多選插入經文
-   [x] 導出為 Markdown 文件
-   [x] 本地存儲自動保存

### ✅ v1.2 - UI/UX 優化（已完成）

-   [x] 關於（About）和幫助（Help）獨立頁面
-   [x] 服務端組件（RSC）優化 SEO
-   [x] 共用 PageHeader 組件，統一 UI
-   [x] 側邊欄菜單導航優化
-   [x] 筆記本 Split View 模式（50/50 分屏）
-   [x] 移動端界面緊湊化優化
-   [x] iOS 輸入框縮放問題修復
-   [x] 遮罩設置滑動條優化
-   [x] 遮罩模式幫助提示優化

### 🔜 v2.0 - 增強功能

-   [ ] 英文版本支持
-   [ ] 學習進度追踪
-   [ ] 背誦統計和可視化
-   [ ] 更多聖經譯本
-   [ ] 自定義經文集
-   [ ] 筆記本多篇管理

### 🌟 未來版本

-   [ ] 多語言對照閱讀
-   [ ] 雲端同步功能
-   [ ] 成就徽章系統
-   [ ] 每日提醒功能
-   [ ] 社區分享功能

## 🛠️ 開發指南

### 代碼風格

本項目遵循嚴格的代碼規範（參見 `.cursorrules`）：

- **組件結構**：導入 → 類型定義 → 常量 → 主組件 → 導出
- **命名規範**：
  - 組件文件：`PascalCase.tsx`
  - 工具文件：`camelCase.ts`
  - 類型文件：`camelCase.ts`
- **函數長度**：單個函數不超過 30 行
- **類型安全**：避免使用 `any`，所有 props 必須有接口定義

### 添加新功能

#### 1. 創建新頁面

```bash
# 1. 創建頁面目錄
mkdir -p app/your-feature

# 2. 創建服務端頁面（SEO 優化）
touch app/your-feature/page.tsx

# 3. 創建客戶端組件（交互邏輯）
touch app/your-feature/YourFeatureClient.tsx
```

#### 2. 添加新組件

```bash
# 在適當的目錄下創建組件
touch components/your-category/YourComponent.tsx
```

#### 3. 添加新工具函數

```bash
touch lib/yourUtil.ts
```

### 調試技巧

```bash
# 開發模式（帶 TypeScript 檢查）
npm run dev

# 類型檢查
npm run type-check

# 構建檢查
npm run build

# 本地預覽生產版本
npm run build && npm start
```

### 常見問題排查

1. **Next.js 緩存問題**：刪除 `.next` 目錄重新構建
2. **類型錯誤**：確保所有 props 都有明確的類型定義
3. **Server Component 錯誤**：檢查是否在服務端組件中使用了客戶端特性（hooks、事件處理器）

## 🤝 貢獻

歡迎任何形式的貢獻！無論是報告 Bug、提出新功能建議，還是提交代碼改進。

### 貢獻方式

1. Fork 本倉庫
2. 創建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'feat: 添加某個很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 創建一個 Pull Request

### Commit 規範

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

- `feat:` 新功能
- `fix:` Bug 修復
- `docs:` 文檔更新
- `style:` 代碼格式調整
- `refactor:` 代碼重構
- `perf:` 性能優化
- `test:` 測試相關
- `chore:` 構建/工具相關

## 📄 許可證

本項目採用 [MIT License](./LICENSE) 開源協議。你可以自由使用、修改和分發本項目。

## 🙏 致謝

-   **聖經數據**: 使用公開的中文聖經譯本數據
-   **精選經文**: 參考 [Kendra Fletcher's 100 Scripture Memorization List](https://www.kendrafletcher.com/kendra-fletcher/100-scripture-memorize)
-   **設計靈感**: 聖經應用和現代 Web 設計的結合
-   **開源社區**: 感謝所有使用到的開源項目和工具

## 📧 聯繫方式

如有問題、建議或希望參與開發，請通過以下方式聯繫：

-   📧 Email: [yy9577@gmail.com](mailto:yy9577@gmail.com)
-   🐛 報告 Bug: [GitHub Issue](https://github.com/andrewyang07/your-words-website/issues)
-   🌐 訪問網站: [www.yourwords.me](https://www.yourwords.me)
-   💡 功能建議: 歡迎創建 Issue 或直接聯繫

**開源協作歡迎！** 如果你對聖經應用開發感興趣，或有改進建議，非常歡迎與我聯繫。

---

<div align="center">

**用 ❤️ 和 ✝️ 構建**

願神的話語成為你腳前的燈，路上的光 🕯️

_詩篇 119:105_

</div>
