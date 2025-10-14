# 部署前检查清单

## ✅ SEO优化

### Meta标签
- [x] 优化title（包含关键词）
- [x] 完善description（清晰描述功能）
- [x] 添加keywords（聖經、背誦、經文等）
- [x] Open Graph标签（社交媒体分享）
- [x] Twitter Card标签
- [x] 设置作者和发布者信息

### 搜索引擎
- [x] robots.txt（允许所有搜索引擎）
- [x] sitemap.xml（自动生成）
- [x] 设置robots meta（允许索引）

### PWA支持
- [x] manifest.json（支持添加到主屏幕）
- [x] 图标配置（logo.png）

## ✅ 性能优化

### Next.js配置
- [x] React Strict Mode（开发时检测问题）
- [x] 图片优化（AVIF/WebP格式）
- [x] 启用压缩
- [x] 移除X-Powered-By header

### 资源优化
- [x] 使用Next.js Image组件（自动优化）
- [x] 懒加载章节数据（按需加载）
- [x] 使用useMemo优化计算
- [x] Framer Motion优化（只在必要时动画）

### 监控工具
- [x] Vercel Analytics（用户行为分析）
- [x] Vercel Speed Insights（性能监控）

## ✅ 安全性

### HTTP Headers
- [x] X-Frame-Options: SAMEORIGIN（防止点击劫持）
- [x] X-Content-Type-Options: nosniff（防止MIME类型嗅探）
- [x] X-DNS-Prefetch-Control: on（DNS预取）
- [x] Referrer-Policy: origin-when-cross-origin

### 数据安全
- [x] 所有数据存储在localStorage（客户端）
- [x] 无敏感信息传输
- [x] 无用户登录/后端依赖

## ✅ 功能测试

### 核心功能
- [ ] 精选114节经文正常显示
- [ ] 书卷和章节选择正常工作
- [ ] Flash Card模式（点击展开/收起）
- [ ] 收藏功能（添加/取消/查看）
- [ ] 分享链接（生成/复制/打开）
- [ ] 一键全部收藏（从分享链接）

### UI/UX
- [ ] 阅读/背诵模式切换
- [ ] 简繁体切换
- [ ] 深色模式切换（light/dark/system）
- [ ] 随机排列按钮
- [ ] 返回/重选章节按钮
- [ ] 帮助引导卡片

### 响应式设计
- [ ] 桌面端显示正常（1920px, 1440px, 1280px）
- [ ] 平板端显示正常（768px, 1024px）
- [ ] 手机端显示正常（375px, 414px）
- [ ] 下拉菜单在移动端可用
- [ ] 触摸交互正常（无延迟、无误触）

### 浏览器兼容性
- [ ] Chrome/Edge（推荐）
- [ ] Safari（桌面和移动）
- [ ] Firefox
- [ ] 微信内置浏览器

## ⚠️ 部署前必做

### 1. 更新URL
✅ **已完成** - 所有URL已更新为正式域名：`https://www.yourwords.me`

已更新的文件：
- `app/layout.tsx` - openGraph.url
- `public/robots.txt` - Sitemap URL
- `app/sitemap.ts` - baseUrl

### 2. 环境变量检查
- [ ] Vercel项目设置正确（Framework Preset: Next.js）
- [ ] Root Directory: `/`
- [ ] Node.js Version: 18.x 或更高

### 3. 构建测试
```bash
npm run build
npm run start
```
- [ ] 构建无错误
- [ ] 本地production模式运行正常

### 4. Git仓库
- [ ] 所有更改已提交
- [ ] 推送到GitHub
- [ ] README.md已更新（如需要）

## 📝 部署后验证

### 基础验证
- [ ] 网站可正常访问
- [ ] 首页正确加载
- [ ] 无404错误
- [ ] 无JavaScript错误（打开控制台检查）

### SEO验证
- [ ] 访问 `/sitemap.xml` 正常
- [ ] 访问 `/robots.txt` 正常
- [ ] 访问 `/manifest.json` 正常
- [ ] Google Search Console提交sitemap

### 性能验证
- [ ] Lighthouse测试 Performance > 90
- [ ] Lighthouse测试 Accessibility > 90
- [ ] Lighthouse测试 Best Practices > 90
- [ ] Lighthouse测试 SEO > 90
- [ ] 首屏加载 < 3秒

### 分享验证
- [ ] 在微信/Telegram分享链接时显示正确的标题和图片
- [ ] Open Graph预览正常（使用 https://www.opengraph.xyz/ 测试）

## 🚀 可选优化（未来版本）

- [ ] 添加Google Analytics（如需要）
- [ ] 添加更多语言（英文版已在feature/english-support分支）
- [ ] 设置自定义域名
- [ ] 添加Service Worker（离线支持）
- [ ] 优化大型Bible JSON（考虑按需分块加载）
- [ ] 添加搜索功能
- [ ] 添加学习进度追踪

## 📌 注意事项

### Vercel部署
- ✅ 使用默认的SSR模式（不是static export）
- ✅ 自动部署已配置（推送到main分支自动部署）
- ✅ 环境变量无需配置（纯前端项目）

### 域名配置
如果使用自定义域名：
1. 在Vercel项目设置中添加域名
2. 在域名提供商添加DNS记录
3. 等待DNS传播（通常5-60分钟）
4. 更新上述URL配置

### License
- ✅ MIT License已配置
- ✅ 开源项目，可自由使用

## 🎯 部署命令

```bash
# 本地测试
npm run build
npm run start

# 推送到GitHub（自动触发Vercel部署）
git push origin main

# 或在Vercel手动触发部署
```

