# Redis 成本分析和优化

> 最近更新：2026-10-02（API hardening：真实缓存策略 + 写入限流）。
> 之前的版本声称 `/api/rankings` 有 "ISR 缓存 1 小时"，这是**错误的**：该路由同时设置了
> `export const dynamic = 'force-dynamic'` 和 `export const revalidate = 3600`，`force-dynamic` 使 `revalidate`
> 完全不生效，每次请求都会执行 SCAN + MGET。`/api/stats` 与 `/api/stats/top-verses` 也完全没有缓存。

Upstash Free：**500,000 命令/月**（以 Upstash 控制台当前显示为准）。Upstash 按**命令**计费（`EVAL` 算 1 条；`INCR`/`GET`/`SCAN`/`MGET`/`EXPIRE` 各算 1 条；`MGET` 多个 key 也只算 1 条）。

## 📊 当前 API 端点

### 读取 API（GET）—— 现在由 CDN 通过 `Cache-Control` 缓存

| 端点                    | 缓存头（正常数据）                                           | 缓存头（空结果 / Redis 降级） | 每次回源的 Redis 命令                    |
| ----------------------- | ------------------------------------------------------------ | ----------------------------- | ---------------------------------------- |
| `/api/stats`            | `public, s-maxage=300, stale-while-revalidate=900`           | `s-maxage=30, swr=30`         | 2（`GET total_users`、`GET total_favorites`） |
| `/api/stats/top-verses` | `public, s-maxage=600, stale-while-revalidate=1800`          | `s-maxage=30, swr=30`         | SCAN×N + 1 MGET（约 5，见下）            |
| `/api/rankings`         | `public, s-maxage=600, stale-while-revalidate=1800`          | `s-maxage=30, swr=30`         | SCAN×N + 1 MGET（约 5，见下）            |

要点：

-   **不再使用** `export const dynamic = 'force-dynamic'` / `export const revalidate`。缓存策略统一由响应头表达（见 `lib/cachePolicy.ts`），Vercel CDN 遵守 `s-maxage` 与 `stale-while-revalidate`。
-   TTL 的含义：全局计数可以滞后数分钟。`stats` 最多 5 分钟新鲜 + 15 分钟 SWR；排行榜类（昂贵的 SCAN+MGET）最多 10 分钟新鲜 + 30 分钟 SWR。
-   **空结果 / 任何降级只缓存 30 秒**：`lib/redisUtils.ts` 的 `safeRedis*Result` 辅助函数返回 `{ value, degraded }`，`degraded` 在 Redis 未配置 / 出错 / SCAN 中途出错或被截断时为 true，与"key 不存在"区分开。路由只要任一步（SCAN、MGET、`/api/stats` 的两个 GET 中任意一个）降级，或结果为空，就用 30 秒策略。`safeRedis*` 辅助函数在 Redis 出错时会吞掉错误并返回 `[]` / `'0'`，如果按正常 TTL 缓存会把一次短暂故障固定在 CDN 10+ 分钟。
-   HTTP 500、本地开发模拟数据：`Cache-Control: no-store`。
-   **用户自己的"我的收藏"是本地状态（zustand / IndexedDB），从不经过这些接口**，不受缓存影响，点星标立即生效。
-   `SCAN` 会遍历整个 keyspace（`COUNT 100`），所以每次回源约 `ceil(keys/100)` 次 SCAN + 1 次 MGET。下文按约 300 个不同的 `verse:*` key 估算 ≈ **5 条命令/次**；key 越多越贵，这也是排行榜 TTL 取得较长的原因。

### 写入 API（POST）—— 严格校验 + 按 IP 限流

| 端点                    | 输入校验                                                                                               | 限流（每 IP，固定窗口）   | 每次允许的写入命令                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------- | ----------------------------------- |
| `/api/stats/increment`  | `action` 必须为 `"favorite"`；`verseId` 必须是三段规范正整数 `^[1-9]\d*-[1-9]\d*-[1-9]\d*$`（不允许前导零）、长度 ≤ 16、书 1–66 / 章 1–150 / 节 1–176；请求体 ≤ 1024 字符；非法 → **HTTP 400，不触碰 Redis（连限流计数也不增加），不产生任何 key** | **30 次 / 60 秒**         | 2 INCR（`total_favorites`、`verse:<id>`） |
| `/api/stats/track-user` | 不接收任何字段：空 body 或 `{}` 通过，其余（含 `verseId`）→ 400                                       | **10 次 / 3600 秒**       | 1 INCR（`total_users`）             |

限流实现（`lib/rateLimit.ts`）：Redis `INCR rl:<scope>:<sha256(ip)[:16]>:<windowIndex>`，仅当返回值为 1（窗口第一次）时再 `EXPIRE`。
**稳态每次请求 1 条命令，窗口首次 2 条**（对比 `@upstash/ratelimit` 固定窗口稳态 2 条 / 首次 3 条，且无需新增依赖）。
Redis 未配置 / 报错 / 超过 800ms → **放行（fail-open）**，本地开发无需 KV 变量。超限返回 `429` + `Retry-After`。

## 💰 命令预算（1000 DAU 假设，沿用旧文档的场景）

假设：`W` = 每月收藏写入 ≈ 150K；`/api/stats` 30K 请求/月；`top-verses` 30K 请求/月；`rankings` 3K 请求/月；约 300 个 `verse:*` key（SCAN+MGET ≈ 5 条命令）。

### 改动前（main 上的真实行为：读接口全部未缓存）

| 项目                       | 计算                         | 命令/月    |
| -------------------------- | ---------------------------- | ---------- |
| 收藏写入                   | 150K × 2 INCR                | 300K       |
| 用户追踪                   | 1K × 1                       | 1K         |
| `/api/stats`               | 30K × 2                      | 60K        |
| `/api/stats/top-verses`    | 30K × 5                      | 150K       |
| `/api/rankings`            | 3K × 5（旧文档误写成 720 × 3，因为以为有 ISR） | 15K        |
| **合计**                   |                              | **≈ 526K** |

### 改动后

| 项目                       | 计算                                                   | 命令/月         |
| -------------------------- | ------------------------------------------------------ | --------------- |
| 收藏写入                   | 150K × 2 INCR                                          | 300K            |
| 限流（收藏）               | 150K × (1 INCR + 窗口首次 EXPIRE 占比 e，0 ≤ e ≤ 1)    | +150K … +300K   |
| 用户追踪                   | 1K × (1 + 限流 1~2)                                    | ≈ 3K            |
| `/api/stats`               | 每区域上限：30×86400/300 = 8,640 次回源 × 2            | ≤ 17K           |
| `/api/stats/top-verses`    | 每区域上限：30×86400/600 = 4,320 次回源 × 5            | ≤ 22K           |
| `/api/rankings`            | 同上                                                   | ≤ 22K           |
| 读合计                     | 每个活跃 CDN 区域的**上限**（流量稀疏时按真实请求数更少） | ≤ ~60K / 区域   |

-   **读节省**：225K → ≤ 60K/区域，约省 **105K–165K**（1–2 个活跃区域）。
-   **限流额外开销**：每次允许的收藏 +1（窗口首次 +2）≈ **+150K … +300K**（e 取决于用户是否集中点收藏：一次点 20 个只付 1 次 EXPIRE）。
-   **非法请求 0 条命令**；被限流的请求仅 1 条（`INCR`）。
-   **诚实的结论**：在这个 150K 写入/月的假设场景下，限流的额外成本可能**抵消甚至超过**缓存的节省（净变化约 −15K … +195K），合计仍在 500K 附近。这个场景是旧文档的假设，真实流量未知；请以 Upstash 控制台实际用量为准。如果真实写入量接近假设，建议后续优化（**未包含在本 PR**）：
    1. 用单条 Lua `EVAL`（Upstash 计 1 条命令）把"限流计数 + `total_favorites` + `verse:<id>`"合并：每次收藏 3 → 1 条命令，总写入从 300K 降到 150K（含限流）。需要在真实 Redis 上验证脚本。
    2. 不再维护 `total_favorites` 计数器，改由（已被缓存的）排行榜 SCAN+MGET 求和：省 150K。注意这会改变首页显示的历史数字，需要产品确认。
    3. 在 Vercel Firewall 配置 Rate Limit 规则（0 条 Redis 命令），再把应用内限流降级为兜底（需要 Vercel 权限）。

## ✅ 优化历史

### v1.3.1

-   移除旧的服务端限流 key（`GET` + `INCR` 每请求，且每个时间戳一个 key，过于昂贵）。
-   移除点击追踪（`total_clicks`）。
-   删除未使用的 API 端点 `/api/stats/verse/[verseId]`、`/api/stats/verses`。

### API hardening（本次）

-   读接口增加真实 CDN 缓存头，删除互相矛盾的 `force-dynamic` + `revalidate`（见上）。
-   写接口严格校验输入（400，零 Redis 访问），增加按 IP 的固定窗口限流（INCR + 首次 EXPIRE，fail-open）。
-   前端遇到 429：**不回滚**本地收藏状态，把全局计数放入有上限（50）的延迟队列并按 `Retry-After` 重试；`track-user` 遇到 429 则不写 `user-tracked`，下次访问再试。

## 🔍 监控建议

1. **设置 Upstash 告警**
    - 达到 400K 时发送通知
    - 达到 450K 时发送紧急通知
2. **定期检查**
    - 每周检查 Redis 使用量（关注 `rl:*` key 数量与命令数）
    - 每月分析流量趋势
3. **扩展计划**
    - 如果持续接近限额，优先实施上面的"后续优化"，其次考虑升级付费版

## 🚀 Upstash 免费版限额

以 Upstash 控制台当前显示为准：约 **500,000 命令/月**，256 MB 存储（旧文档写的 "每天 10,000 / 每月 300,000" 已过时）。

## 📝 环境变量

确保在生产环境设置：

```bash
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
```

在本地开发环境（不设置时）：

-   `next dev`：所有统计 API 返回模拟数据 / 静默成功；非法输入仍然返回 400
-   限流自动放行（fail-open），不消耗 Redis 命令
-   核心功能正常运行

---

**更新日期**: 2026-10-02
