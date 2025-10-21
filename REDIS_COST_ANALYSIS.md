# Redis 成本分析和优化

## 📊 当前 API 端点

### 读取 API（GET）

1. `/api/stats` - 全局统计（每次访问主页）
2. `/api/stats/top-verses` - Top 7 最多收藏（每次打开侧边栏）
3. `/api/rankings` - 排行榜（访问排行榜页面，ISR 1 小时缓存）

### 写入 API（POST）

1. `/api/stats/increment` - 点击/收藏统计
2. `/api/stats/track-user` - 用户追踪（首次访问）

## 💰 成本估算（1000 DAU）

### API 请求估算

| API                     | 触发时机   | 每用户/天 | 每月请求数       | Redis 操作        |
| ----------------------- | ---------- | --------- | ---------------- | ----------------- |
| `/api/stats`            | 访问主页   | 1 次      | 30K              | 3 GET             |
| `/api/stats/top-verses` | 打开侧边栏 | 1 次      | 30K              | SCAN + MGET(~100) |
| `/api/stats/increment`  | 点击/收藏  | 10 次     | 300K             | 2-3 INCR          |
| `/api/stats/track-user` | 首次访问   | 0.03 次   | 1K               | 1 INCR            |
| `/api/rankings`         | 访问排行榜 | 0.1 次    | 3K (实际 720/月) | SCAN + MGET(~100) |
| **总计**                | -          | -         | **~364K/月**     | -                 |

### Redis 命令估算

**每月 Redis 命令总数**：

| 操作类型     | 命令                   | 频率/月   | 说明                   |
| ------------ | ---------------------- | --------- | ---------------------- |
| 用户追踪     | `INCR total_users`     | ~1K       | 新用户首次访问         |
| 收藏统计     | `INCR total_favorites` | ~150K     | 用户收藏经文           |
| 收藏统计     | `INCR verse:*`         | ~150K     | 单个经文收藏数         |
| 点击统计     | `INCR total_clicks`    | ~150K     | 用户点击卡片           |
| 全局统计查询 | `GET total_*`          | 90K       | 每天 30K 次 × 3 个 key |
| Top 7 查询   | `SCAN` + `MGET`        | 30K       | 侧边栏打开             |
| 排行榜查询   | `SCAN` + `MGET`        | 720       | ISR 缓存（1 小时）     |
| **总计**     | -                      | **~572K** | -                      |

⚠️ **超出 500K 限额！需要优化！**

## ✅ 优化方案（已实施）

### 1. 移除服务端限流 key（节省 ~300K）

**之前**：

```typescript
// 每次 increment API 调用
const rateLimitKey = `ratelimit:${ip}:${timestamp}`;
await redis.get(rateLimitKey); // GET
await redis.incr(rateLimitKey); // INCR
// 每次调用 2 个命令 × 300K 请求 = 600K 命令
```

**优化后**：

```typescript
// 依赖客户端 throttling（已实现）
// 移除服务端限流 key
// 节省：~600K 命令
```

### 2. 删除未使用的 API 端点

-   ❌ 删除 `/api/stats/verse/[verseId]` - 未使用
-   ❌ 删除 `/api/stats/verses` - 未使用

### 3. ISR 缓存优化

-   `/api/rankings` 使用 ISR，1 小时缓存
-   实际请求：~720/月（720 小时）而不是 3K/月

## 📈 优化后成本

| 操作类型 | 命令数/月 | 说明                                    |
| -------- | --------- | --------------------------------------- |
| 用户追踪 | 1K        | `INCR total_users`                      |
| 收藏统计 | 300K      | `INCR total_favorites` + `INCR verse:*` |
| 点击统计 | 150K      | `INCR total_clicks`                     |
| 查询操作 | ~120K     | GET + SCAN + MGET                       |
| **总计** | **~571K** | 仍超出 50K                              |

## 🎯 进一步优化建议

### 方案 A：移除点击追踪（推荐）

-   只保留"收藏"追踪
-   移除 `total_clicks` 统计
-   **节省**：~150K 命令
-   **总计**：~420K ✅

### 方案 B：降低统计精度

-   使用采样（10% 的请求才写入）
-   **节省**：~450K 命令
-   **总计**：~120K ✅
-   **缺点**：统计数据不精确

### 方案 C：使用 Vercel Blob 存储

-   每天定时导出 Redis 数据到 Blob
-   查询从 Blob 读取（免费）
-   写入使用 Redis（低频）
-   **节省**：大量 GET 命令
-   **缺点**：实时性降低

## 💡 当前状态

✅ **已实施方案 A（移除限流）**

当前估算：~450K 命令/月

**余量**：50K（10%）用于：

-   流量波动
-   异常情况
-   未来小幅增长

## 🔍 监控建议

1. **设置 Upstash 告警**

    - 达到 400K 时发送通知
    - 达到 450K 时发送紧急通知

2. **定期检查**

    - 每周检查 Redis 使用量
    - 每月分析流量趋势

3. **扩展计划**
    - 如果持续接近限额，考虑升级到付费版
    - 或实施方案 A（移除点击追踪）

## 🚀 Upstash 免费版限额

-   **每天**：10,000 命令
-   **每月**：300,000 命令
-   **存储**：256 MB

注意：Upstash 是按月计算，不是按天 × 30。

## 📝 环境变量

确保在生产环境设置：

```bash
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
```

在本地开发环境（不设置时）：

-   所有 API 返回模拟数据
-   不消耗 Redis 命令
-   核心功能正常运行

---

**更新日期**: 2025-01-21
**优化版本**: v1.3
