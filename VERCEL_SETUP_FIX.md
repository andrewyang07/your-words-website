# 🔧 Vercel 404 错误修复指南

## 问题描述
整个网站显示 `404: NOT_FOUND`，即使代码和构建都正常。

## 🎯 解决方案（请按顺序执行）

### 步骤 1: 检查 Vercel 项目设置 ⚙️

1. **访问 Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **进入你的项目**
   - 点击 `your-words-website` 项目

3. **检查 Settings → General**
   
   **必须确认以下设置：**
   
   ✅ **Root Directory**
   ```
   留空（或填 ./）
   ❌ 不要填 app/ 或其他目录
   ```
   
   ✅ **Framework Preset**
   ```
   选择: Next.js
   ❌ 不要选 Other 或留空
   ```
   
   ✅ **Build Command**
   ```
   留空（Vercel 会自动检测）
   或填写: npm run build
   ```
   
   ✅ **Output Directory**
   ```
   留空（Next.js 默认是 .next）
   ❌ 不要填其他值
   ```
   
   ✅ **Install Command**
   ```
   留空（Vercel 会自动使用 npm install）
   ```

4. **Node.js Version**
   ```
   Settings → General → Node.js Version
   选择: 18.x 或 20.x
   ```

### 步骤 2: 重新部署 🚀

**方法 A: 从 Vercel Dashboard**
1. 进入 Deployments 标签
2. 找到最新部署
3. 点击右侧的 "..." 菜单
4. 选择 "Redeploy"
5. 勾选 "Use existing build cache" ❌ 取消勾选
6. 点击 "Redeploy"

**方法 B: 从命令行触发**
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

### 步骤 3: 检查部署日志 📝

1. **访问最新部署**
   - Deployments → 点击最新部署

2. **查看 Building 日志**
   - 应该看到:
   ```
   ✓ Compiled successfully
   ✓ Generating static pages (4/4)
   
   Route (app)                              Size     First Load JS
   ┌ ○ /                                    52 kB           139 kB
   └ ○ /_not-found                          873 B          88.1 kB
   ```

3. **确认没有错误**
   - ❌ 不应该有红色的 Error 信息
   - ❌ 不应该有 "Build failed" 信息

### 步骤 4: 测试访问 🌐

部署完成后（通常 1-2 分钟），访问：

```
https://your-words-website.vercel.app/
```

**应该看到**:
- ✅ 网站主页
- ✅ "你的話語" 标题
- ✅ 100 节精选经文卡片

---

## 🆘 如果还是 404

### 检查项目是否被删除/重命名

1. 在 Vercel Dashboard 确认项目名称是 `your-words-website`
2. 如果不是，访问正确的 URL

### 检查 Git 分支

1. Settings → Git
2. 确认 Production Branch 是 `main`
3. 如果不是，改为 `main` 并保存

### 删除并重新导入项目

如果以上都不行：

1. **备份环境变量**（如果有的话）
2. **删除 Vercel 项目**
   - Settings → General → 滚动到底部
   - 点击 "Delete Project"
   
3. **重新导入**
   - Vercel Dashboard → Add New → Project
   - 选择 GitHub
   - 选择 `your-words-website` 仓库
   - 点击 Import
   - **重要**: 不要修改任何设置，直接 Deploy

---

## 📊 常见错误原因

| 错误设置 | 正确设置 |
|---------|---------|
| Root Directory: `app/` | Root Directory: (留空) |
| Framework: Other | Framework: Next.js |
| Output: `dist/` | Output: (留空) |
| Node: 16.x | Node: 18.x 或 20.x |

---

## ✅ 修复后验证

访问以下 URL 确认一切正常：

```
✅ https://your-words-website.vercel.app/
✅ https://your-words-website.vercel.app/data/books.json
✅ https://your-words-website.vercel.app/logo.png
```

全部应该可以访问（不是 404）。

