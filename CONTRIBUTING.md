# 貢獻指南

感謝你有興趣為「你的話語」項目做出貢獻！

## 🛠️ 開發環境設置

### 1. Fork 本倉庫
訪問 [andrewyang07/your-words-website](https://github.com/andrewyang07/your-words-website) 並點擊右上角的 Fork 按鈕

### 2. 克隆你的 Fork

```bash
git clone https://github.com/YOUR_USERNAME/your-words-website.git
cd your-words-website
```

### 3. 安裝依賴

```bash
npm install
```

### 4. 啟動開發服務器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用。

## 📝 代碼規範

本項目遵循 `cursor-rules.md` 中定義的編碼規範，核心原則如下：

### ✨ 核心原則
- **簡潔性優先** - 避免過度工程化，代碼應清晰易讀
- **組件職責單一** - 每個組件只負責一個功能
- **函數長度控制** - 單個函數不超過 30 行代碼
- **命名清晰直觀** - 變量和函數命名要見名知意

### TypeScript
- ✅ 所有組件必須使用 TypeScript
- ✅ 組件必須有明確的 Props 接口定義
- ❌ 避免使用 `any` 類型

### React
- ✅ 優先使用函數組件和 Hooks
- ✅ 狀態管理使用 Zustand
- ⚠️ 避免不必要的 `useMemo` 和 `useCallback`（除非確實需要性能優化）

### 樣式
- ✅ 使用 Tailwind CSS 原子化樣式
- ✅ 移動端優先的響應式設計（`mobile-first`）
- ✅ 遵循項目的聖經主題色彩系統（金色 + 深色/淺色模式）

### 動畫
- ✅ 使用 Framer Motion 實現流暢動畫
- ✅ 確保動畫在 60fps 下流暢運行
- ⚠️ 避免過度動畫影響性能

## 🎯 提交規範

使用語義化提交信息（參考 [Conventional Commits](https://www.conventionalcommits.org/)）：

```
feat: 添加新功能
fix: 修復 bug
docs: 文檔更新
style: 代碼格式調整（不影響功能）
refactor: 代碼重構
perf: 性能優化
test: 測試相關
chore: 構建/工具相關
```

### 提交示例

```bash
git commit -m "feat: 添加書卷篩選功能"
git commit -m "fix: 修復卡片懸停動畫閃爍問題"
git commit -m "docs: 更新 README 安裝說明"
git commit -m "perf: 優化章節數據加載性能"
```

## 🔀 Pull Request 流程

### 1. 創建功能分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 進行修改並提交

```bash
git add .
git commit -m "feat: 你的功能描述"
```

### 3. 推送到你的 Fork

```bash
git push origin feature/your-feature-name
```

### 4. 創建 Pull Request
- 在 GitHub 上打開你的 Fork
- 點擊「New Pull Request」
- 填寫 PR 標題和描述
- 等待代碼審查

### PR 描述建議包含
- 🎯 **功能說明**: 這個 PR 做了什麼
- 🔧 **實現方式**: 簡要說明實現思路
- 📸 **截圖**: 如果有 UI 變更，附上截圖或 GIF
- ✅ **測試**: 說明已測試的場景（手機/桌面，淺色/深色模式）

## 🐛 報告 Bug

發現 Bug？請創建 [Issue](https://github.com/andrewyang07/your-words-website/issues/new) 並包含：

- **清晰的標題和描述**
- **重現步驟**（如何觸發這個 bug）
- **預期行為** vs **實際行為**
- **截圖或錄屏**（如果適用）
- **環境信息**：
  - 瀏覽器和版本（如 Chrome 120, Safari 17）
  - 設備類型（桌面/手機/平板）
  - 操作系統（如 macOS 14, Windows 11, iOS 17）

## 💡 功能建議

有新功能想法？請創建 [Issue](https://github.com/andrewyang07/your-words-website/issues/new) 並說明：

- **功能描述**: 你希望添加什麼功能
- **使用場景**: 為什麼需要這個功能，解決什麼問題
- **預期效果**: 期望的用戶體驗
- **實現方案**（可選）: 如果有技術想法可以分享

## ✅ 代碼審查檢查清單

提交 PR 前請自查：

### 代碼質量
- [ ] 代碼符合項目編碼規範
- [ ] 組件職責單一，邏輯清晰
- [ ] 沒有 TypeScript 錯誤或警告
- [ ] 函數長度合理（不超過 30 行）
- [ ] 變量和函數命名清晰

### 功能測試
- [ ] 功能在桌面端正常工作
- [ ] 功能在手機端正常工作
- [ ] 功能在平板端正常工作
- [ ] 淺色模式下顯示正常
- [ ] 深色模式下顯示正常
- [ ] 繁體中文顯示正常
- [ ] 簡體中文顯示正常

### 性能和體驗
- [ ] 動畫流暢（60fps）
- [ ] 沒有不必要的重渲染
- [ ] 手機端觸摸響應靈敏
- [ ] 加載狀態有合適的提示

### 代碼整潔
- [ ] 移除了 console.log 調試代碼
- [ ] 移除了註釋掉的代碼
- [ ] 遵循項目文件結構
- [ ] 沒有引入不必要的依賴

## 🎨 設計指南

### 配色系統
- **主題色**: 金色（Bible gold）`#BE9E5D`
- **淺色模式**: 溫暖的米白背景 `#FEF9F0`
- **深色模式**: 深灰背景 `#1F2937`

### 間距系統
- 使用 Tailwind 的標準間距（4px 基數）
- 卡片內邊距：`p-4` 或 `p-6`
- 組件間距：`gap-2` ~ `gap-6`

### 響應式斷點
- 手機：`< 640px`（默認）
- 平板：`md: 768px`
- 桌面：`lg: 1024px`

## 📚 資源

- [Next.js 文檔](https://nextjs.org/docs)
- [Tailwind CSS 文檔](https://tailwindcss.com/docs)
- [Framer Motion 文檔](https://www.framer.com/motion/)
- [Zustand 文檔](https://github.com/pmndrs/zustand)
- [Headless UI 文檔](https://headlessui.com/)

## ❓ 需要幫助？

如果你有任何問題，可以：

- 📖 查看現有的 [Issues](https://github.com/andrewyang07/your-words-website/issues)
- 💬 創建新的 [Discussion](https://github.com/andrewyang07/your-words-website/discussions)
- 📧 聯繫項目維護者

---

再次感謝你的貢獻！願神祝福你的工作 🙏✝️
