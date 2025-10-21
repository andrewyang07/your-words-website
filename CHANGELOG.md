# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2025-01-21

### ✨ 新增功能

#### 全局统计系统
- **Header 全局统计显示** - 实时显示全球用户数和收藏数
  - 桌面端（lg+）：完整文案 "👥 已有 123 位弟兄姊妹 · ⭐ 共收藏 456 节经文"
  - 平板端（md-lg）：简化版本 "👥 123 人 · ⭐ 456 节"（可点击展开）
  - 移动端（< md）：紧凑版本 "👥 123 · ⭐ 456"（可点击展开）
- **Top 7 最多收藏经文** - 侧边栏显示最受欢迎的经文，带"查看章节"快捷跳转
- **总排行榜页面** - 新增 `/rankings` 页面，查看所有被收藏的经文排行
- **快速收藏功能** - 排行榜中可直接收藏经文

#### 筛选功能增强
- **收藏界面筛选** - 收藏模式支持按书卷/旧约/新约筛选
- **排行榜筛选** - 排行榜页面支持按书卷/旧约/新约筛选
- **智能数量统计** - 每个筛选选项显示对应的经文数量

### 🔧 技术改进

#### Upstash Redis 集成
- 集成 Upstash Redis 用于全局统计
- 实现用户追踪（首次访问）
- 实现收藏统计（全局 + 单经文）
- ISR 缓存优化（1小时更新）

#### 成本优化
- 移除服务端限流（节省 ~300K Redis 命令/月）
- 移除点击追踪（节省 ~150K Redis 命令/月）
- 删除未使用的 API 端点（2个）
- **最终成本**：~361K/月（28% 安全余量）

#### 本地开发友好
- 无需配置环境变量即可运行
- 所有 API 自动降级到模拟数据
- 完善的错误处理和 fallback 机制
- 新增 `.env.example` 环境变量模板

#### 性能优化
- 排行榜使用 CSS `content-visibility` 优化渲染
- 主页大小减少：52 kB → 16.4 kB（减少 69%）
- 优化 loading 骨架动画
- 智能懒加载和响应式卡片数量

### 🐛 Bug 修复

- 修复侧边栏 Top 7 初始闪烁问题
- 修复排行榜经文内容不显示
- 修复"查看章节"按钮跳转失败
- 修复深色模式文字颜色不正确
- 修复经文文字溢出问题
- 修复 Vercel 部署失败（模块导入、TypeScript 错误）

### 📝 文档

#### 新增文档
- `.env.example` - 环境变量配置模板
- `REDIS_COST_ANALYSIS.md` - Redis 成本详细分析
- `API_AUDIT_REPORT.md` - API 审核报告
- `PR_CHECKLIST.md` - Pull Request 检查清单

#### 更新文档
- `README.md` - 新增 v1.3 功能说明、环境变量配置指南
- 技术栈更新（新增 Upstash Redis）
- 项目结构更新（rankings/, api/ 等）

### 📦 新增文件

#### API 路由（7个）
- `app/api/stats/route.ts` - 全局统计
- `app/api/stats/increment/route.ts` - 统计递增
- `app/api/stats/track-user/route.ts` - 用户追踪
- `app/api/stats/top-verses/route.ts` - Top 7 最多收藏
- `app/api/stats/reset-daily/route.ts` - 每日重置（Cron）
- `app/api/rankings/route.ts` - 全圣经排行榜

#### 页面和组件
- `app/rankings/page.tsx` - 排行榜页面
- `app/rankings/layout.tsx` - 排行榜布局和元数据
- `components/rankings/RankingsList.tsx` - 排行榜列表组件

#### 工具库
- `lib/redisUtils.ts` - Redis 工具函数（带错误处理和本地降级）
- `lib/statsUtils.ts` - 统计工具函数（客户端 throttling）

#### 配置文件
- `vercel.json` - Cron Jobs 配置（每日重置）

### 🗑️ 删除文件

- `app/api/stats/verse/[verseId]/route.ts` - 未使用的单个经文统计 API
- `app/api/stats/verses/route.ts` - 未使用的批量经文统计 API
- `stores/useStatsDisplayStore.ts` - 已简化，不再需要

### ⚡ 性能数据

- **主页大小**：52 kB → 16.4 kB（⬇️ 69%）
- **Redis 成本**：~751K → ~361K（⬇️ 52%）
- **构建时间**：无明显变化
- **PageSpeed Score**：72 → 89（⬆️ 24%）

### 🔄 Breaking Changes

无 - 完全向后兼容

### 📋 依赖变化

新增依赖：
- `@upstash/redis`: ^1.35.6

---

## [1.2.0] - 2024-10-20

### ✨ 新增功能
- 关于（About）和帮助（Help）独立页面
- 服务端组件（RSC）优化 SEO
- 笔记本 Split View 模式（50/50 分屏）

### 🐛 Bug 修复
- iOS 输入框缩放问题修复
- 移动端界面紧凑化优化
- 遮罩设置滑动条优化

---

## [1.1.0] - 2024-10-15

### ✨ 新增功能
- 圣经笔记本编辑器（BETA）
- 经文引用自动补全
- Markdown 格式支持
- 实时预览
- 导出为 Markdown 文件

---

## [1.0.0] - 2024-10-10

### ✨ 初始版本
- 114 节精选经文
- 全 66 卷逐章背诵
- 繁简体切换
- 深色模式
- 收藏功能
- URL 分享收藏
- 书卷章节筛选
- 阅读/背诵模式切换
- 遮罩背诵模式
- 随机洗牌
- PWA 支持

---

**格式遵循**: [Keep a Changelog](https://keepachangelog.com/)  
**版本规范**: [Semantic Versioning](https://semver.org/)
