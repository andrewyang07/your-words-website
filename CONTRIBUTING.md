# 贡献指南

感谢你有兴趣为 Your Words 项目做出贡献！

## 开发环境设置

1. Fork 本仓库
2. 克隆你的 Fork

```bash
git clone https://github.com/YOUR_USERNAME/your-words.git
cd your-words
```

3. 安装依赖

```bash
npm install
```

4. 启动开发服务器

```bash
npm run dev
```

## 代码规范

本项目遵循以下编码规范（详见 `cursor-rules.md`）：

### 核心原则

-   ✅ **简洁性优先** - 避免过度工程化
-   ✅ **组件职责单一** - 每个组件只负责一个功能
-   ✅ **函数长度控制** - 单个函数不超过 30 行
-   ✅ **命名清晰直观** - 见名知意

### TypeScript

-   所有组件必须使用 TypeScript
-   组件必须有明确的 Props 接口定义
-   避免使用 `any` 类型

### React

-   优先使用函数组件和 Hooks
-   状态管理使用 Zustand
-   避免复杂的 useMemo 和 useCallback（除非确实需要）

### 样式

-   使用 Tailwind CSS
-   移动端优先的响应式设计
-   遵循圣经主题色彩系统

## 提交规范

使用语义化提交信息：

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

示例：

```bash
git commit -m "feat: 添加书卷筛选功能"
git commit -m "fix: 修复卡片悬停动画闪烁问题"
```

## Pull Request 流程

1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

2. 进行修改并提交
3. 推送到你的 Fork

```bash
git push origin feature/your-feature-name
```

4. 在 GitHub 上创建 Pull Request
5. 等待代码审查

## 报告 Bug

发现 Bug？请创建 Issue 并包含：

-   清晰的标题和描述
-   重现步骤
-   预期行为和实际行为
-   截图（如果适用）
-   浏览器和版本信息

## 功能建议

有新功能想法？请创建 Issue 并说明：

-   功能描述
-   使用场景
-   预期效果
-   可能的实现方案（可选）

## 代码审查要点

提交前请自查：

-   [ ] 代码符合编码规范
-   [ ] 组件职责单一
-   [ ] 没有 TypeScript 错误
-   [ ] 移动端和桌面端都测试过
-   [ ] 动画流畅（60fps）
-   [ ] 遵循项目文件结构

## 需要帮助？

如果你有任何问题，可以：

-   创建 Issue 讨论
-   查看现有 Issues
-   阅读项目文档

再次感谢你的贡献！🙏
