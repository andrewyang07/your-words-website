# Your Words - 圣经背诵应用

> 让神的话语常在心中

一个精美的圣经背诵应用，帮助用户系统地背诵和学习圣经经文。支持简体中文和繁体中文，提供精选经文和逐节背诵两种模式。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ 特性

-   🎨 **精美 UI 设计** - 圣经主题配色，优雅的卡片式布局
-   🎬 **流畅动画** - 瀑布流入场、悬停效果、翻转动画
-   📖 **双模式学习**
    -   精选经文模式：100 节最值得背诵的经文
    -   逐节背诵模式：全 66 卷书卷系统背诵
-   🌏 **多语言支持** - 简体中文、繁体中文（默认）
-   📱 **响应式设计** - 完美适配手机、平板、桌面
-   🔍 **智能筛选** - 按约别、书卷筛选，支持随机排序
-   💾 **纯前端** - 无需登录，轻量快速

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建部署

```bash
npm run build
```

## 📚 技术栈

-   **框架**: [Next.js 14](https://nextjs.org/) (App Router)
-   **语言**: [TypeScript](https://www.typescriptlang.org/)
-   **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
-   **样式**: [Tailwind CSS](https://tailwindcss.com/)
-   **动画**: [Framer Motion](https://www.framer.com/motion/)
-   **图标**: [Lucide React](https://lucide.dev/)

## 📁 项目结构

```
your-words/
├── app/                    # Next.js App Router 页面
├── components/             # React 组件
│   ├── ui/                # 基础UI组件
│   ├── verses/            # 经文相关组件
│   ├── filters/           # 筛选组件
│   ├── animations/        # 动画组件
│   └── study/             # 学习模式组件
├── lib/                   # 工具函数
├── stores/                # Zustand 状态管理
├── types/                 # TypeScript 类型定义
└── public/
    └── data/              # 圣经数据文件
```

## 🎯 路线图

### ✅ MVP 版本 (v1.0)

-   [x] 首页和模式选择
-   [x] 100 节精选经文
-   [x] 全 66 卷逐节背诵
-   [x] 简繁体切换
-   [x] 筛选和排序
-   [x] 精美动画效果

### 🔜 第二版 (v2.0)

-   [ ] 圣经翻开动画
-   [ ] 学习进度追踪
-   [ ] 背诵统计
-   [ ] 成就徽章系统

### 🌟 未来版本

-   [ ] 英文支持
-   [ ] 多语言对照
-   [ ] 自定义经文集
-   [ ] 个人笔记功能

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何参与。

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 开源协议。

## 🙏 致谢

-   圣经数据来源：公开圣经译本
-   精选经文参考：[Kendra Fletcher 的 100 节清单](https://www.kendrafletcher.com/kendra-fletcher/100-scripture-memorize)

---

用 ❤️ 和 ✝️ 构建
