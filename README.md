<div align="center">

# 你的話語 Your Words

> 讓神的話語常在心中 ✝️

**一個精美的聖經背誦 Web 應用，幫助用戶系統地背誦和學習聖經經文**

支持繁體中文和簡體中文，提供精選經文和逐章背誦功能

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./README.md#-貢獻指南)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](./README.md#-貢獻指南)

### 🌐 在線體驗

## **[👉 立即訪問 www.yourwords.me 🙏](https://www.yourwords.me)**

[![Your Words Screenshot](https://img.shields.io/badge/🌐_訪問網站-www.yourwords.me-BE9E5D?style=for-the-badge)](https://www.yourwords.me)

---

</div>

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

### 🔍 聖經搜索（v1.4）

-   **經文引用搜索** - 輸入書卷名 + 章:節，如「約3:16」「John 3:16」
-   **關鍵詞搜索** - 支持中英文關鍵詞全文搜索
-   **拼音搜索** - 輸入拼音搜索中文經文，如「yuehan」搜索「約翰」
-   **獨立搜索頁** - `/search` 提供專注搜索體驗（首頁搜索布局 + 結果卡片布局）
-   **搜索結果收藏** - 搜索到的經文可一鍵加入收藏
-   **中英文切換** - 搜索結果支持中文/English 顯示切換
-   **上下文查看** - 查看搜索結果前後經文，理解上下文
-   **一致化 UI** - 搜索頁按鈕與配色對齊全站設計風格
-   **更快可用** - 頁面打開即可輸入，搜索引擎後台初始化後自動執行搜索

### 📊 統計功能（v1.3）

-   **全局統計** - 查看全球有多少用戶在背誦
-   **Top 7 最多收藏經文** - 側邊欄顯示最受歡迎的經文
-   **總排行榜** - `/rankings` 頁面查看所有被收藏的經文
-   **快速收藏** - 排行榜中直接收藏經文
-   **隱私友好** - 統計功能可選，不影響核心體驗

## 🚀 快速開始

```bash
# 克隆並運行
git clone https://github.com/andrewyang07/your-words-website.git
cd your-words-website
npm install
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用。

## 🔧 環境變量配置（可選）

本項目可以在**不配置任何環境變量**的情況下運行（本地開發）。

如果你想啟用統計功能，需要配置 Upstash Redis：

### 統計功能環境變量

```bash
# Upstash Redis（用於全局統計和排行榜）
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
NEXT_PUBLIC_BASE_URL=https://yourwebsite.com
```

### 獲取 Upstash Redis

1. 訪問 [Upstash Console](https://console.upstash.com/)
2. 創建新的 Redis 數據庫（免費版 10K 命令/天）
3. 複製 REST API URL 和 Token
4. 複製 `.env.example` 為 `.env.local` 並填入
5. 重啟開發服務器

### 不配置環境變量會怎樣？

-   ✅ 所有核心功能正常（背誦、收藏、筆記本）
-   ✅ 本地開發完全正常
-   ⚠️ 全局統計顯示模擬數據（10 用戶、50 收藏等）
-   ⚠️ 用戶行為不被追蹤（不影響使用）

> **開源友好**: 我們確保項目可以在無需任何配置的情況下直接運行，方便開發者快速上手。

## 📚 技術棧

-   **框架**: [Next.js 14](https://nextjs.org/) (App Router)
-   **語言**: [TypeScript 5](https://www.typescriptlang.org/)
-   **狀態管理**: [Zustand](https://github.com/pmndrs/zustand)
-   **樣式**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI 組件**: [Headless UI](https://headlessui.com/)
-   **圖標**: [Lucide React](https://lucide.dev/)
-   **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
-   **數據庫**: [Upstash Redis](https://upstash.com/) (可選，用於統計)
-   **部署**: [Vercel](https://vercel.com/)

## 🏗️ 架構特點

-   **純前端為主** - 核心功能無需後端，數據本地存儲，極速加載
-   **類型安全** - 完整的 TypeScript 類型定義
-   **組件化** - 模塊化設計，代碼簡潔易維護
-   **性能優化** - 按需加載、CSS 動畫、骨架屏
-   **SEO 友好** - Server Components + 靜態生成
-   **成本優化** - Redis 使用優化，500K 命令/月內運行

> 詳細的技術架構和設計原則請查看 [.cursorrules](/.cursorrules)

## 📁 項目結構

```
your-words-website/
├── app/              # Next.js 頁面
│   ├── page.tsx     # 主頁（卡片背誦）
│   ├── rankings/    # 排行榜
│   ├── note/        # 筆記本
│   ├── about/       # 關於
│   ├── help/        # 幫助
│   └── api/         # API 路由（統計功能）
├── components/       # React 組件
│   ├── verses/      # 經文卡片
│   ├── search/      # 搜索組件
│   ├── rankings/    # 排行榜組件
│   ├── bible-note/  # 筆記本組件
│   ├── navigation/  # 導航菜單
│   ├── settings/    # 設置面板
│   └── ui/          # 通用組件
├── lib/             # 核心邏輯
│   ├── search/         # 搜索引擎（倒排索引 + 拼音）
│   ├── redisUtils.ts   # Redis 工具函數
│   └── statsUtils.ts   # 統計工具函數
├── stores/          # 狀態管理（Zustand）
├── types/           # TypeScript 類型
└── public/data/     # 聖經數據（JSON）
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

### ✅ v1.3 - 統計功能（已完成）

-   [x] 全局統計（總用戶、總收藏、總點擊）
-   [x] Top 7 最多收藏經文（側邊欄）
-   [x] 總排行榜頁面（所有經文）
-   [x] 排行榜快速收藏功能
-   [x] Upstash Redis 集成
-   [x] 本地開發降級機制
-   [x] Redis 成本優化（500K 命令/月內）
-   [x] 環境變量可選配置

### ✅ v1.4 - 聖經搜索（已完成）

-   [x] 經文引用搜索（書卷名 + 章:節）
-   [x] 中英文關鍵詞全文搜索
-   [x] 拼音搜索（yuehan → 約翰）
-   [x] 獨立搜索頁（Google 風格布局節奏）
-   [x] 搜索結果收藏功能
-   [x] 中文/English 顯示切換
-   [x] 上下文查看（前後 ±3 節）
-   [x] 搜索使用說明（簡繁體）
-   [x] 搜索頁樣式與全站 UI 一致化
-   [x] 首屏可輸入，搜索引擎後台初始化
-   [x] 主頁搜索入口按鈕

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

## 🤝 貢獻指南

我們歡迎任何形式的貢獻！

### 開始貢獻

1. Fork 本倉庫
2. 創建分支：`git checkout -b feature/your-feature`
3. 提交代碼：`git commit -m 'feat: your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 創建 Pull Request

### 代碼規範

-   遵循 TypeScript 嚴格模式
-   組件職責單一，函數不超過 30 行
-   使用 Tailwind CSS，移動端優先
-   提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)

> 詳細規範請查看 [.cursorrules](/.cursorrules)

### 報告問題

-   🐛 [報告 Bug](https://github.com/andrewyang07/your-words-website/issues/new?template=bug_report.md)
-   💡 [功能建議](https://github.com/andrewyang07/your-words-website/issues/new?template=feature_request.md)

### 開發資源

-   [Next.js 文檔](https://nextjs.org/docs)
-   [Tailwind CSS 文檔](https://tailwindcss.com/docs)
-   [Framer Motion 文檔](https://www.framer.com/motion/)

## 📄 許可證

本項目採用 [MIT License](./LICENSE) 開源協議。你可以自由使用、修改和分發本項目。

## 🙏 致謝

-   **聖經數據**: 使用公開的中文聖經譯本數據
-   **精選經文**: 參考 [Kendra Fletcher's 100 Scripture Memorization List](https://www.kendrafletcher.com/kendra-fletcher/100-scripture-memorize)
-   **設計靈感**: 聖經應用和現代 Web 設計的結合
-   **開源社區**: 感謝所有使用到的開源項目和工具

---

<div align="center">

## 🚀 開始使用

準備好開始背誦聖經了嗎？

### **[👉 立即訪問 www.yourwords.me](https://www.yourwords.me)**

[![立即開始](https://img.shields.io/badge/🙏_立即開始背誦-www.yourwords.me-BE9E5D?style=for-the-badge&labelColor=2C3E50)](https://www.yourwords.me)

---

### 💬 聯繫與支持

-   📧 Email: [yy9577@gmail.com](mailto:yy9577@gmail.com)
-   🐛 報告 Bug: [創建 Issue](https://github.com/andrewyang07/your-words-website/issues/new?template=bug_report.md)
-   💡 功能建議: [創建 Issue](https://github.com/andrewyang07/your-words-website/issues/new?template=feature_request.md)
-   ⭐ 如果這個項目對你有幫助，請給我們一個 Star！

---

**用 ❤️ 和 ✝️ 構建**

願神的話語成為你腳前的燈，路上的光 🕯️

_詩篇 119:105_

**© 2025 你的話語 · 開源項目 · MIT License**

</div>
