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

## 🚀 快速開始

```bash
# 克隆並運行
git clone https://github.com/andrewyang07/your-words-website.git
cd your-words-website
npm install
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用。

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

## 🏗️ 架構特點

-   **純前端** - 無需後端，所有數據靜態存儲，極速加載
-   **類型安全** - 完整的 TypeScript 類型定義
-   **組件化** - 模塊化設計，代碼簡潔易維護
-   **性能優化** - 按需加載、GPU 加速動畫、骨架屏
-   **SEO 友好** - Server Components + 靜態生成

> 詳細的技術架構和設計原則請查看 [.cursorrules](/.cursorrules)

## 📁 項目結構

```
your-words-website/
├── app/              # Next.js 頁面
│   ├── page.tsx     # 主頁（卡片背誦）
│   ├── note/        # 筆記本
│   ├── about/       # 關於
│   └── help/        # 幫助
├── components/       # React 組件
│   ├── verses/      # 經文卡片
│   ├── bible-note/  # 筆記本組件
│   ├── navigation/  # 導航菜單
│   ├── settings/    # 設置面板
│   └── ui/          # 通用組件
├── lib/             # 核心邏輯
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
