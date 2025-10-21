# 性能优化计划

## 📊 当前性能状态

### PageSpeed Insights 分数（移动端）

-   **Performance**: 60 ⚠️
-   **Accessibility**: 89 ✅
-   **Best Practices**: 100 ✅
-   **SEO**: 100 ✅

### 核心问题

-   **LCP**: 8.3 秒 ❌（目标 < 2.5 秒）
-   **FCP**: 0.8 秒 ✅
-   **TBT**: 560 ms ⚠️
-   **CLS**: 0 ✅
-   **Speed Index**: 3.8 秒 ⚠️

---

## 🎯 优化目标

将 Performance 分数从 **60** 提升到 **85+**
将 LCP 从 **8.3 秒** 降低到 **2.5 秒以下**

---

## 🚀 优化方案

### 1. 图片优化（最高优先级）

#### 当前图片资源

```
public/
  logo-light.png (1024x1024)
  logo.png
  xinban-logo.png
  sketch-1.jpeg
  sketch-2.jpeg
```

#### 优化措施

-   ✅ 使用 Next.js Image 组件（已经在用）
-   🔧 转换为 WebP 格式
-   🔧 压缩图片大小
-   🔧 添加图片懒加载
-   🔧 设置适当的图片尺寸

#### 实施步骤

1. 使用工具转换图片为 WebP
2. 为 Logo 提供多种尺寸
3. 确保所有图片都使用 next/image

---

### 2. 字体优化

#### 问题

Noto Sans TC/SC 字体可能加载较慢

#### 优化措施

-   添加 `font-display: swap`
-   预加载关键字体
-   使用 next/font 优化

#### 实施步骤

```typescript
// 在 layout.tsx 中添加字体优化
import { Noto_Sans_TC } from 'next/font/google';

const notoSansTC = Noto_Sans_TC({
    subsets: ['latin'],
    display: 'swap',
    weight: ['400', '500', '700'],
});
```

---

### 3. JavaScript 优化

#### 问题

-   未使用的 JavaScript: 50 KiB
-   Main-thread work: 3.1 秒

#### 优化措施

-   动态导入非关键组件
-   代码分割
-   移除未使用的依赖

#### 实施步骤

```typescript
// 动态导入非关键组件
const SideMenu = dynamic(() => import('@/components/navigation/SideMenu'), {
    loading: () => <div>Loading...</div>,
});
```

---

### 4. 减少渲染阻塞

#### 问题

-   Render blocking requests: 节省 130 ms

#### 优化措施

-   关键 CSS 内联
-   延迟加载非关键 CSS
-   预加载关键资源

---

### 5. 其他优化

#### CSS 优化

-   移除未使用的 Tailwind CSS

#### HTML 优化

-   添加资源提示（preload, prefetch）

---

## ⏱️ 实施时间表

### Phase 1: 图片优化（30 分钟）

-   [ ] 转换 PNG 为 WebP
-   [ ] 压缩图片
-   [ ] 优化图片加载

### Phase 2: 字体优化（15 分钟）

-   [ ] 添加 font-display
-   [ ] 使用 next/font

### Phase 3: JavaScript 优化（30 分钟）

-   [ ] 动态导入组件
-   [ ] 代码分割

### Phase 4: 测试验证（15 分钟）

-   [ ] PageSpeed Insights 重新测试
-   [ ] 确认 Performance > 85

---

## 📈 预期效果

| 指标        | 当前  | 目标   | 改善   |
| ----------- | ----- | ------ | ------ |
| Performance | 60    | 85+    | +25    |
| LCP         | 8.3s  | <2.5s  | -5.8s  |
| TBT         | 560ms | <300ms | -260ms |

---

**文档版本**: v1.0  
**创建时间**: 2025-01-21  
**状态**: 准备实施
