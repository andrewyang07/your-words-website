# 圣经壁纸生成功能设计文档

## 📋 项目概述

**功能名称**: 圣经壁纸生成器（毛玻璃风格）  
**目标用户**: 网站用户  
**核心价值**: 让用户快速生成带有圣经经文的精美手机壁纸  
**技术方案**: 纯前端实现（Canvas API + 预制模板）

---

## 🎯 功能目标

1. 用户可以选择喜欢的圣经经文
2. 选择预设的壁纸模板（毛玻璃效果）
3. 实时预览生成效果
4. 下载高清壁纸（1080x1920px）

---

## 🎨 设计规格

### 壁纸尺寸

-   **标准尺寸**: 1080 x 1920 像素（9:16 竖屏）
-   **输出格式**: PNG（高质量）
-   **文件大小**: 目标 < 2MB

### 模板设计要求

#### 技术规格

-   **文件格式**: PNG（带透明通道）
-   **分辨率**: 1080 x 1920 px
-   **图层结构**:
    -   底层：背景图片（轻微模糊 5-10px）
    -   顶层：毛玻璃卡片（半透明，用于放置文字）

#### 毛玻璃卡片规格

-   **位置**: 居中或下方 1/3 处
-   **尺寸**:
    -   宽度：约 950px（画布的 88%）
    -   高度：约 450px
    -   圆角：30-40px
-   **效果**:
    -   背景：白色/黑色/金色半透明（不透明度 20-30%）
    -   模糊：backdrop-blur 效果
    -   边框：1-2px 细边，白色，不透明度 40%
    -   高光：顶部可选添加高光效果

#### 文字区域留白

-   **中间区域**: 约 800 x 300px 留空
-   **用途**: 代码动态插入经文文字
-   **要求**: 确保任何背景下文字都清晰可读

---

## 📦 模板清单

### 初期模板（3-5 套）

| ID  | 模板名称  | 背景风格  | 卡片位置 | 卡片颜色 | 文件名                   |
| --- | --------- | --------- | -------- | -------- | ------------------------ |
| 1   | 自然-山景 | 山川风景  | 下方     | 白色玻璃 | template-01-mountain.png |
| 2   | 日落渐变  | 橙粉渐变  | 居中     | 白色玻璃 | template-02-sunset.png   |
| 3   | 星空夜幕  | 星空/夜景 | 下方     | 半透明黑 | template-03-starry.png   |
| 4   | 简约蓝紫  | 蓝紫渐变  | 居中     | 白色玻璃 | template-04-gradient.png |
| 5   | 抽象几何  | 几何图案  | 下方     | 金色玻璃 | template-05-minimal.png  |

### 存储位置

```
public/
  wallpapers/
    templates/
      template-01-mountain.png
      template-02-sunset.png
      template-03-starry.png
      template-04-gradient.png
      template-05-minimal.png
```

---

## 🛠️ 技术实现方案

### 架构设计

#### 1. 文件结构

```
app/
  wallpaper/
    page.tsx                    # 主页面（Server Component）
components/
  wallpaper/
    WallpaperGenerator.tsx      # 生成器主组件（Client Component）
    TemplateSelector.tsx        # 模板选择器
    VerseSelector.tsx           # 经文选择器
    PreviewCanvas.tsx           # 实时预览
    DownloadButton.tsx          # 下载按钮
lib/
  wallpaperGenerator.ts         # Canvas 绘制逻辑
  wallpaperTemplates.ts         # 模板配置
types/
  wallpaper.ts                  # 类型定义
public/
  wallpapers/
    templates/                  # 模板图片存储
```

#### 2. 核心代码逻辑

**Canvas 绘制流程**:

```typescript
// lib/wallpaperGenerator.ts

export interface WallpaperConfig {
    template: string; // 模板图片路径
    verse: {
        text: string; // 经文内容
        reference: string; // 经文出处（如 "约翰福音 3:16"）
    };
    textStyle: {
        color: string; // 文字颜色
        fontSize: number; // 字体大小
        fontFamily: string; // 字体
        lineHeight: number; // 行高
    };
}

export async function generateWallpaper(config: WallpaperConfig): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    // 1. 加载模板图片
    const template = await loadImage(config.template);
    ctx.drawImage(template, 0, 0, 1080, 1920);

    // 2. 设置文字样式
    ctx.fillStyle = config.textStyle.color;
    ctx.font = `bold ${config.textStyle.fontSize}px "${config.textStyle.fontFamily}"`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;

    // 3. 绘制经文文字（自动换行）
    const textX = 540; // 水平居中
    const textY = 1000; // 垂直位置（卡片中心）
    const maxWidth = 880; // 最大文字宽度
    const lineHeight = config.textStyle.lineHeight;

    drawMultilineText(ctx, config.verse.text, textX, textY, maxWidth, lineHeight);

    // 4. 绘制经文出处（小字）
    ctx.font = `${config.textStyle.fontSize * 0.6}px "${config.textStyle.fontFamily}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(config.verse.reference, textX, textY + 150);

    // 5. 转换为 Blob
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                resolve(blob!);
            },
            'image/png',
            1.0
        );
    });
}

// 辅助函数：加载图片
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// 辅助函数：自动换行绘制文字
function drawMultilineText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split('');
    let line = '';
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, x, currentY);
            line = words[i];
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}
```

#### 3. React 组件设计

**主组件**:

```typescript
// components/wallpaper/WallpaperGenerator.tsx

'use client';

import { useState } from 'react';
import { Verse } from '@/types/verse';
import TemplateSelector from './TemplateSelector';
import VerseSelector from './VerseSelector';
import PreviewCanvas from './PreviewCanvas';
import DownloadButton from './DownloadButton';

export default function WallpaperGenerator() {
    const [selectedTemplate, setSelectedTemplate] = useState('template-01-mountain');
    const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">制作壁纸 ✨</h1>

            {/* 步骤 1: 选择经文 */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1️⃣ 选择经文</h2>
                <VerseSelector onSelect={setSelectedVerse} />
            </section>

            {/* 步骤 2: 选择模板 */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2️⃣ 选择背景风格</h2>
                <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />
            </section>

            {/* 步骤 3: 预览 */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3️⃣ 预览效果</h2>
                {selectedVerse ? (
                    <PreviewCanvas template={selectedTemplate} verse={selectedVerse} />
                ) : (
                    <div className="text-center py-20 text-gray-500">请先选择一节经文</div>
                )}
            </section>

            {/* 步骤 4: 下载 */}
            {selectedVerse && (
                <section>
                    <DownloadButton template={selectedTemplate} verse={selectedVerse} />
                </section>
            )}
        </div>
    );
}
```

---

## 🎨 用户界面设计

### 页面布局

```
┌─────────────────────────────────────┐
│  ← 返回    制作壁纸 ✨               │
├─────────────────────────────────────┤
│                                     │
│  1️⃣ 选择经文                         │
│  ┌─────────────────────────────┐   │
│  │ 从收藏选择 | 搜索经文         │   │
│  │ [约翰福音 3:16 ▼]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  2️⃣ 选择背景风格                     │
│  ┌────┬────┬────┬────┬────┐        │
│  │ 🏔️ │ 🌅 │ 🌌 │ 🎨 │ ✨ │        │
│  │ 山  │日落│星空│渐变│几何│        │
│  └────┴────┴────┴────┴────┘        │
│                                     │
│  3️⃣ 预览效果                         │
│  ┌───────────────┐                 │
│  │               │                 │
│  │  [ 壁纸预览 ]  │                 │
│  │               │                 │
│  └───────────────┘                 │
│                                     │
│  [📥 下载高清壁纸 (1080x1920)]      │
└─────────────────────────────────────┘
```

### 风格指南

-   **配色**: 沿用网站主题色（bible-\* 色系）
-   **字体**: Noto Sans TC（保持一致）
-   **动画**: 使用 Framer Motion（平滑过渡）
-   **响应式**: 移动端优先设计

---

## 📱 功能入口

### 位置

在侧边栏菜单中添加：

```
┌────────────────┐
│ ☰ 菜单          │
├────────────────┤
│ 🏠 首頁         │
│ 📖 背經文       │
│ 📝 筆記本       │
│ 🖼️ 制作壁紙    │  ← 新增
│ ℹ️ 關於         │
│ ❓ 幫助         │
└────────────────┘
```

路由: `/wallpaper`

---

## ⏱️ 开发时间估算

### Phase 1: 基础功能（核心 MVP）

-   **Canvas 绘制逻辑**: 2 小时
-   **组件开发**: 3 小时
-   **UI 设计实现**: 2 小时
-   **总计**: 7 小时

### Phase 2: 优化与测试

-   **实时预览优化**: 1 小时
-   **移动端适配**: 1 小时
-   **测试与 Bug 修复**: 1 小时
-   **总计**: 3 小时

### 总开发时间: 10 小时

---

## 🎯 成功指标

1. **功能可用性**: 用户可以成功生成并下载壁纸
2. **生成速度**: < 3 秒
3. **图片质量**: 清晰度满足手机壁纸标准
4. **用户体验**: 操作流程简单直观（≤ 4 步）

---

## 🚀 发布计划

### Beta 测试

1. 先发布到测试环境
2. 邀请 5-10 名用户测试
3. 收集反馈，修复问题

### 正式发布

1. 合并到 main 分支
2. 部署到生产环境
3. 在网站首页添加"新功能"标签
4. 社交媒体推广

---

## 📋 待办事项 (TODO)

### 设计阶段

-   [ ] 使用 Canva 制作 3-5 个壁纸模板
-   [ ] 导出为 PNG 格式（1080x1920）
-   [ ] 优化文件大小（< 500KB/张）
-   [ ] 确认文字区域留白是否合适

### 开发阶段

-   [ ] 创建 `/wallpaper` 路由和页面
-   [ ] 实现 Canvas 绘制核心逻辑
-   [ ] 开发 UI 组件（选择器、预览、下载）
-   [ ] 集成现有经文数据
-   [ ] 实现实时预览
-   [ ] 添加下载功能
-   [ ] 移动端适配

### 测试阶段

-   [ ] 功能测试（各种经文长度）
-   [ ] 跨浏览器测试
-   [ ] 移动端测试
-   [ ] 性能测试（生成速度）
-   [ ] 图片质量验证

### 部署阶段

-   [ ] 提交代码到 GitHub
-   [ ] Vercel 自动部署
-   [ ] 生产环境测试
-   [ ] 用户反馈收集

---

## 💡 未来扩展

### V2 功能（可选）

1. **自定义文字样式**

    - 字体大小调整
    - 颜色选择
    - 位置调整

2. **更多模板**

    - 季节主题（春夏秋冬）
    - 节日主题（圣诞、复活节）
    - 情绪主题（喜乐、平安）

3. **社交分享**

    - 一键分享到社交媒体
    - 生成分享链接

4. **历史记录**
    - 保存用户生成过的壁纸
    - 快速重新下载

---

## 📞 联系人

-   **项目负责人**: Yang Yang
-   **设计师**: Yang Yang 老婆
-   **工具**: Canva（设计）+ Next.js（开发）

---

**文档版本**: v1.0  
**最后更新**: 2025-01-21  
**状态**: 计划中 (Planning)
