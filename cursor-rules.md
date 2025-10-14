# Cursor Rules for Your Words Bible App

## 项目概述
这是一个帮助用户背诵圣经经文的前端应用，使用 Next.js + React + Tailwind CSS + Framer Motion + Zustand 技术栈。重点关注代码可读性和维护性。

## 核心开发原则

### 1. 代码简洁性原则
- **优先使用简单直接的解决方案**，避免过度工程化
- **一个组件只负责一个职责**，功能单一明确
- **避免深层嵌套**，组件嵌套不超过3层
- **函数长度控制**，单个函数不超过30行代码
- **变量命名要清晰直观**，见名知意

### 2. 文件组织原则
- **每个文件只导出一个主要组件**
- **相关的类型定义放在同一文件中**
- **工具函数单独放在 utils 文件夹**
- **常量定义集中在 constants.ts 中**

### 3. 组件开发规范
- **所有组件必须使用 TypeScript**
- **组件必须有明确的 Props 接口定义**
- **优先使用函数组件和 React Hooks**
- **状态管理优先使用 Zustand**
- **避免使用复杂的 useMemo 和 useCallback**，除非确实需要优化性能

## 技术栈使用指南

### Next.js 使用规范
```typescript
// ✅ 好的做法 - 简单的页面组件
export default function HomePage() {
  return (
    <div>
      <MainContent />
    </div>
  );
}

// ❌ 避免 - 在页面组件中放太多逻辑
export default function HomePage() {
  // 大量的业务逻辑代码...
  return <ComplexComponent />;
}
```

### React 组件开发
```typescript
// ✅ 好的做法 - 简单的组件结构
interface VerseCardProps {
  verse: Verse;
  onClick: () => void;
  isSelected?: boolean;
}

export default function VerseCard({ verse, onClick, isSelected }: VerseCardProps) {
  const cardClasses = `
    p-4 rounded-lg border
    ${isSelected ? 'border-blue-500' : 'border-gray-200'}
    hover:shadow-md cursor-pointer
  `;

  return (
    <div className={cardClasses} onClick={onClick}>
      <p className="text-sm text-gray-600">{verse.book} {verse.chapter}:{verse.verse}</p>
      <p className="mt-2">{verse.text}</p>
    </div>
  );
}

// ❌ 避免 - 复杂的组件逻辑
export default function ComplexVerseCard(props) {
  // 大量的计算逻辑、多个useEffect、复杂的状态管理...
}
```

### Zustand 状态管理
```typescript
// ✅ 好的做法 - 简单的状态结构
interface AppState {
  currentMode: 'preset' | 'chapter';
  setCurrentMode: (mode: 'preset' | 'chapter') => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentMode: 'preset',
  setCurrentMode: (mode) => set({ currentMode: mode }),
}));

// ❌ 避免 - 复杂的状态逻辑
interface ComplexState {
  // 大量的状态字段和复杂的更新逻辑...
}
```

### Tailwind CSS 使用
```typescript
// ✅ 好的做法 - 清晰的类名组织
const cardStyles = {
  base: "p-4 rounded-lg border cursor-pointer transition-all",
  hover: "hover:shadow-md hover:-translate-y-1",
  size: {
    small: "w-48 h-32",
    medium: "w-56 h-40",
    large: "w-64 h-48"
  }
};

// ❌ 避免 - 过长的类名字符串
className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 w-48 h-32 bg-white dark:bg-gray-800..."
```

### Framer Motion 动画
```typescript
// ✅ 好的做法 - 简单的动画配置
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

<motion.div {...fadeInUp}>
  <VerseCard />
</motion.div>

// ❌ 避免 - 复杂的动画序列
const complexAnimation = {
  // 大量复杂的动画配置...
};
```

## 具体编码规范

### 1. 组件结构模板
```typescript
// 每个组件文件都遵循这个结构
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// 1. 类型定义
interface ComponentNameProps {
  // props 定义
}

// 2. 常量定义（如果需要）
const COMPONENT_CONSTANTS = {
  // 常量
};

// 3. 主要组件
export default function ComponentName({ ...props }: ComponentNameProps) {
  // 4. 状态和数据
  const stateFromStore = useStore();
  
  // 5. 事件处理函数
  const handleClick = () => {
    // 简单的事件处理
  };
  
  // 6. 渲染逻辑
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 2. 移动端适配规范
```typescript
// ✅ 移动端优先的响应式设计
<div className="
  // 移动端样式 (默认)
  p-4 text-sm
  // 平板端样式
  md:p-6 md:text-base
  // 桌面端样式
  lg:p-8 lg:text-lg
">
  Content
</div>

// ✅ 触摸友好的交互设计
<button className="
  // 移动端需要更大的点击区域
  min-h-[44px] min-w-[44px] p-3
  // 桌面端可以更小
  md:min-h-[36px] md:min-w-[36px] md:p-2
">
  Button
</button>
```

### 3. 文件命名规范
- **组件文件**: `VerseCard.tsx` (PascalCase)
- **页面文件**: `page.tsx` (Next.js 约定)
- **工具文件**: `dataLoader.ts` (camelCase)
- **类型文件**: `verse.ts` (camelCase)
- **常量文件**: `constants.ts` (camelCase)

### 4. 导入导出规范
```typescript
// ✅ 好的做法 - 清晰的导入顺序
// 1. React 相关
import { useState, useEffect } from 'react';

// 2. 第三方库
import { motion } from 'framer-motion';

// 3. 内部组件
import VerseCard from '@/components/VerseCard';

// 4. 工具和类型
import { Verse } from '@/types/verse';
import { formatVerse } from '@/lib/utils';

// ✅ 默认导出组件
export default function ComponentName() {}

// ✅ 命名导出工具函数
export const utilityFunction = () => {};
```

### 5. 错误处理规范
```typescript
// ✅ 简单的错误处理
export default function DataComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Verse[]>([]);

  useEffect(() => {
    loadData()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data.length) return <div>No data</div>;

  return <div>{/* 渲染数据 */}</div>;
}
```

## 性能优化指南

### 1. 简单的性能优化
```typescript
// ✅ 必要时才使用 memo
const VerseCard = memo(function VerseCard({ verse }: VerseCardProps) {
  return <div>{verse.text}</div>;
});

// ✅ 简单的懒加载
const LazyComponent = lazy(() => import('./HeavyComponent'));

// ❌ 避免过度优化
const OverOptimizedComponent = memo(
  useMemo(() => 
    useCallback(() => {
      // 过度复杂的优化
    }, [])
  )
);
```

### 2. 数据加载优化
```typescript
// ✅ 简单的数据加载
export const useVerses = (language: string) => {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/data/verses-${language}.json`)
      .then(res => res.json())
      .then(data => setVerses(data.verses))
      .finally(() => setLoading(false));
  }, [language]);

  return { verses, loading };
};
```

## 调试和测试友好

### 1. 调试辅助
```typescript
// ✅ 添加有用的日志
const handleVerseClick = (verse: Verse) => {
  console.log('Verse clicked:', { id: verse.id, book: verse.book });
  onVerseSelect(verse);
};

// ✅ 使用 data-testid 便于测试
<div data-testid="verse-card" onClick={handleClick}>
  {verse.text}
</div>
```

### 2. 类型安全
```typescript
// ✅ 严格的类型定义
interface Verse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  testament: 'old' | 'new';
  priority: 1 | 2 | 3 | 4 | 5;
}

// ✅ 类型守卫函数
export const isVerse = (obj: any): obj is Verse => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.text === 'string' &&
    typeof obj.chapter === 'number';
};
```

## 移动端特殊处理

### 1. 触摸交互
```typescript
// ✅ 移动端友好的手势
import { useTouchGesture } from '@/hooks/useTouchGesture';

export default function SwipeableCard({ verse }: Props) {
  const { onTouchStart, onTouchEnd } = useTouchGesture({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
  });

  return (
    <div 
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="touch-pan-y" // 允许垂直滚动
    >
      {verse.text}
    </div>
  );
}
```

### 2. 视口适配
```typescript
// ✅ 移动端视口处理
export default function MobileLayout({ children }: Props) {
  return (
    <div className="
      min-h-screen
      // 处理移动端安全区域
      pt-safe-area-inset-top
      pb-safe-area-inset-bottom
      // 防止横向滚动
      overflow-x-hidden
    ">
      {children}
    </div>
  );
}
```

## 代码审查检查清单

在提交代码前，检查以下项目：

### ✅ 代码质量
- [ ] 组件职责单一，逻辑清晰
- [ ] 没有超过30行的函数
- [ ] 变量和函数命名清晰
- [ ] 没有复杂的嵌套逻辑

### ✅ TypeScript
- [ ] 所有组件都有类型定义
- [ ] 没有使用 `any` 类型
- [ ] Props 接口定义完整

### ✅ 响应式设计
- [ ] 移动端优先的样式设计
- [ ] 触摸友好的交互元素
- [ ] 在不同设备上测试过

### ✅ 性能
- [ ] 没有不必要的重渲染
- [ ] 大列表使用了合适的优化
- [ ] 图片使用了 Next.js Image 组件

### ✅ 用户体验
- [ ] 加载状态有合适的提示
- [ ] 错误状态有友好的提示
- [ ] 动画流畅不卡顿

## 常见问题解决方案

### 1. 状态管理过于复杂
❌ 问题：一个 store 包含所有状态
✅ 解决：按功能拆分多个小的 store

### 2. 组件过于庞大
❌ 问题：一个组件处理多种功能
✅ 解决：拆分成多个小组件，每个组件职责单一

### 3. 样式难以维护
❌ 问题：内联样式或过长的 className
✅ 解决：使用样式对象或 CSS 变量

### 4. 动画性能问题
❌ 问题：复杂的动画导致卡顿
✅ 解决：优先使用 CSS transform 和 opacity

---

**记住：简单就是美！** 
代码应该像说话一样清晰，让6个月后的自己也能轻松理解。