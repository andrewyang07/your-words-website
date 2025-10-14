# Vercel NOT_FOUND 错误排查指南

## 问题现象

部署到 Vercel 后出现 404 NOT_FOUND 错误

## 可能的原因和解决方案

### 1. **Vercel 部署未完成或缓存问题**

**症状**: 本地构建成功，但 Vercel 显示 404
**解决方案**:

-   等待 2-3 分钟让 Vercel 完成部署
-   清除浏览器缓存 (Cmd+Shift+R / Ctrl+Shift+F5)
-   在 Vercel Dashboard 检查部署状态
-   查看 Vercel 部署日志是否有错误

### 2. **图片资源未正确部署**

**症状**: Logo 或其他图片显示 404
**解决方案**:

-   确认 `public/logo.png` 已被 git 追踪
-   检查 `.gitignore` 没有排除 public 文件夹
-   验证图片在 repo 中存在

### 3. **数据文件路径问题**

**症状**: 页面加载但经文数据为空
**解决方案**:

-   确认所有 JSON 文件在 `public/data/` 目录
-   检查 fetch 路径使用 `/data/...` (相对于 public 目录)
-   验证文件大小没有超过 Vercel 限制 (每个文件 < 5MB)

### 4. **Next.js 配置问题**

**症状**: 整个网站 404
**解决方案**:

-   检查 `next.config.js` 配置是否正确
-   确认没有使用 `output: 'export'` (Vercel 不需要静态导出)
-   验证没有配置错误的 basePath 或 assetPrefix

### 5. **客户端数据加载时序问题**

**症状**: 页面白屏或部分数据 missing
**解决方案**:

-   添加 loading 状态
-   添加错误处理
-   检查 useEffect 依赖项

## 快速排查步骤

```bash
# 1. 检查文件是否在 git repo 中
git ls-files public/logo.png
git ls-files public/data/

# 2. 本地测试生产构建
npm run build
npm start

# 3. 检查 Vercel 环境
# 访问 Vercel Dashboard → 你的项目 → Deployments
# 查看最新部署的日志

# 4. 强制重新部署
git commit --allow-empty -m "trigger rebuild"
git push origin main
```

## 当前项目状态

✅ 本地构建成功
✅ Logo 文件存在并已提交
✅ 数据文件结构正确
✅ Next.js 配置正确

## 最可能的原因

基于以上检查，最可能的原因是：

1. **Vercel 部署缓存** - 需要等待或强制重新部署
2. **浏览器缓存** - 需要硬刷新 (Cmd+Shift+R)

## 验证方法

访问以下 URL 手动测试资源：

-   `https://your-site.vercel.app/logo.png` - 应该显示 logo
-   `https://your-site.vercel.app/data/books.json` - 应该显示 JSON
-   `https://your-site.vercel.app` - 应该显示网站首页
