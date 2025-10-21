# SEO 优化计划

## 🎯 优化目标

1. **标题优化**: "你的话语 - 背圣经，记笔记"
2. **双语言支持**: 确保简体和繁体都能搜索到
3. **移除 114 节经文**的提及
4. **突出核心功能**: 背圣经 + 记笔记

---

## 📊 当前状态分析

### ✅ 好的方面
- Google 已收录网站
- 标题和描述基本正确
- 有基本的 meta 标签
- 有 sitemap.xml

### ❌ 需要改进
- 标题可以更简洁有力
- 描述需要突出"记笔记"功能
- 缺少结构化数据
- sitemap 不完整
- 缺少页面特定的 meta 标签

---

## 🚀 优化方案

### 1. Meta 标签优化

#### 主标题
```
当前: "你的話語- 聖經背誦助手| 精選114節經文"
优化: "你的话语 - 背圣经，记笔记"
```

#### 描述优化
```
当前: "歡迎使用「你的話語」聖經背誦助手✨ ... 當前頁面展示精心挑選的114 節最值得背誦的經文..."
优化: "免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能。繁体中文、简体中文双语支持，让神的话语常在心中。"
```

#### 关键词策略
**繁体关键词（主要）**:
- 背圣经, 圣经背诵, 圣经笔记, 圣经app, 免费圣经, 圣经学习, 灵修, 背经文, 圣经工具

**简体关键词**:
- 背圣经, 圣经背诵, 圣经笔记, 圣经app, 免费圣经, 圣经学习, 灵修, 背经文, 圣经工具

**品牌关键词**:
- 你的话语, 你的話語, your words, yourwords

**功能关键词**:
- Flash Card, 圣经卡片, 经文收藏, 圣经分享, 圣经笔记本, 灵修笔记

### 2. 双语言 SEO 策略

#### 语言标记
```html
<html lang="zh-CN" suppressHydrationWarning>
```

#### 多语言支持
```typescript
alternates: {
    languages: {
        'zh-TW': 'https://www.yourwords.me',
        'zh-CN': 'https://www.yourwords.me',
        'zh': 'https://www.yourwords.me',
    },
},
```

#### 内容策略
- 页面内容同时包含繁体和简体关键词
- 使用语义化标签帮助搜索引擎理解
- 确保两种语言版本都能被正确索引

### 3. 结构化数据 (JSON-LD)

#### 网站信息
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "你的话语",
  "alternateName": "Your Words",
  "description": "免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能",
  "url": "https://www.yourwords.me",
  "applicationCategory": "EducationApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "inLanguage": ["zh-TW", "zh-CN"],
  "featureList": [
    "圣经背诵",
    "Flash Card模式",
    "圣经笔记本",
    "经文收藏",
    "经文分享"
  ]
}
```

#### 组织信息
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Words",
  "url": "https://www.yourwords.me",
  "description": "专注于圣经学习和灵修的在线工具"
}
```

### 4. 页面特定优化

#### 首页 (/)
- 标题: "你的话语 - 背圣经，记笔记"
- 描述: "免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能"
- 关键词: 背圣经, 圣经背诵, 圣经笔记, 免费圣经

#### 笔记本页面 (/note)
- 标题: "圣经笔记本 - 你的话语"
- 描述: "在线圣经笔记本，支持经文引用、Markdown编辑、导出备份"
- 关键词: 圣经笔记本, 灵修笔记, 经文笔记, 圣经学习

#### 关于页面 (/about)
- 标题: "关于你的话语 - 免费圣经背诵工具"
- 描述: "了解你的话语圣经背诵工具的功能特色和使用方法"
- 关键词: 关于你的话语, 圣经工具介绍, 免费圣经app

#### 帮助页面 (/help)
- 标题: "使用帮助 - 你的话语圣经背诵工具"
- 描述: "详细的使用教程和功能介绍，帮助你更好地使用圣经背诵工具"
- 关键词: 使用帮助, 教程, 功能介绍, 圣经工具使用

### 5. 技术 SEO 优化

#### Sitemap 完善
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.yourwords.me';
    const currentDate = new Date();

    return [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/note`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/help`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];
}
```

#### 页面性能优化
- 图片优化 (WebP 格式)
- 代码分割
- 预加载关键资源
- 压缩 CSS/JS

#### 移动端优化
- 响应式设计
- 触摸友好的界面
- 快速加载

### 6. 内容优化

#### 语义化 HTML
```html
<main>
  <section>
    <h1>你的话语 - 背圣经，记笔记</h1>
    <p>免费圣经背诵工具，支持Flash Card背诵模式和圣经笔记本功能</p>
  </section>
  
  <section>
    <h2>核心功能</h2>
    <ul>
      <li>圣经背诵 - Flash Card模式</li>
      <li>圣经笔记本 - 记录灵修心得</li>
      <li>经文收藏 - 保存喜爱的经文</li>
      <li>经文分享 - 与朋友分享</li>
    </ul>
  </section>
</main>
```

#### 关键词密度
- 在标题、描述、内容中自然使用关键词
- 避免关键词堆砌
- 保持内容自然流畅

---

## 📈 预期效果

### 搜索排名目标
- "背圣经" - 前 10 名
- "圣经背诵" - 前 10 名  
- "圣经笔记" - 前 5 名
- "你的话语" - 第 1 名
- "免费圣经app" - 前 10 名

### 流量增长预期
- 3个月内: +50% 有机流量
- 6个月内: +100% 有机流量
- 1年内: +200% 有机流量

---

## ⏱️ 实施时间表

### Week 1: 基础优化
- [ ] 更新 meta 标签
- [ ] 添加结构化数据
- [ ] 完善 sitemap

### Week 2: 内容优化
- [ ] 优化页面内容
- [ ] 添加语义化标签
- [ ] 关键词优化

### Week 3: 技术优化
- [ ] 性能优化
- [ ] 移动端优化
- [ ] 测试验证

### Week 4: 监控分析
- [ ] 设置 Google Search Console
- [ ] 监控搜索表现
- [ ] 持续优化

---

## 🔧 实施步骤

1. **立即开始**: 更新 meta 标签和标题
2. **添加结构化数据**: 提升搜索结果显示
3. **完善 sitemap**: 帮助搜索引擎发现所有页面
4. **内容优化**: 确保关键词自然分布
5. **性能优化**: 提升用户体验和搜索排名
6. **监控分析**: 持续跟踪和优化

---

**文档版本**: v1.0  
**创建时间**: 2025-01-21  
**状态**: 准备实施
