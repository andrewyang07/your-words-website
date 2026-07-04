# Daily Review Product Design

## 目标

把网站从“经文浏览器”推进成“每天能真的背到一点”的背经工具。核心体验参考 Readwise Daily Review：一次只处理一个内容单元，低压力、短流程、可持续。

## 成功定义

一次 Daily Review 成功，不看页面停留时长、不看积分，而看用户是否把至少一个经文单元从“读过/熟悉”推进到“能主动回忆一点”。

## 核心原则

- 主动回忆优先于反复阅读。
- 固定小配额优先于清空所有到期项。
- 掌握感游戏化优先于社交竞争。
- 本地优先是产品默认；账号和云同步只能增强，不应成为背诵体验前提。
- 收藏就是 Review 池，不单独引入背诵 List。
- 收藏底层仍按单节保存；段落/整章通过本地 Review Group 元数据组合。

## 产品范围

核心产品包含：

- 首页主入口改为 Daily Review。
- 收藏项进入 Daily Review。
- Daily Review 一次显示一个 Memorization Item。
- 支持单节、连续段落、整章作为 Memorization Item；连续段落和整章由已收藏单节加 Review Group 组成。
- 整章 Review 时按 chunk 练习；优先自然段，无段落数据时每 3-5 节一组。
- Review 流程：遮字阅读 -> Initial Recall -> 自评。
- Initial Recall：中文按每个汉字输入，英文按每个单词首字母输入，系统自动补全文本。
- 输入校验按当前显示版本，忽略标点、空格、大小写；跨版本容错是独立能力，不改变核心流程。
- 支持 Keyboard Review Flow：输入、下一步、评分、提示都可用键盘完成。
- Review Rating：会了 / 模糊 / 不会。
- Review Stage：New / Learning / Reviewing / Mastered。
- 本地保存 stage、nextReviewAt、streak、recent ratings。
- 完成页显示今天完成、变熟的经文、下次继续。
- Mastery Progress 显示各 Review Stage 的数量，让用户看到掌握增长。

非核心目标：

- 账号系统和云同步不应改变本地可用性。
- 社交排行榜不应成为 Daily Review 的主动力。
- AI 讲解不应替代主动回忆。
- 积分商城和复杂徽章系统不应替代掌握感。
- 跨版本智能容错不应改变 Initial Recall 的基本规则。

## Review 配额

Daily Review 每天给固定小配额，而不是把所有到期项压给用户：

- 3 个单节或短段落
- 1 个整章 chunk

如果用户收藏不足，则用已有精选经文补齐。

用户完成当天配额后应获得明确完成感。完成页可以提供“继续复习”，让用户自愿进入额外一轮，但额外内容不应表现成未清空的债务。

Review Streak 应作为温和习惯反馈展示，例如“连续复习 3 天”。断掉后自然重新开始，不做警告、惩罚或强损失感设计。

Mastery Progress 应作为主要进度反馈，显示 New、Learning、Reviewing、Mastered 的数量。它替代积分式成长，让用户看到自己真实的背诵状态。

## 收藏与分组

不重写现有收藏模型。收藏仍是一节一节保存，避免影响现有收藏、分享、排行榜逻辑。

- 收藏单节：只保存该节。
- 收藏段落：保存范围内每一节，并写入一个 Passage Review Group。
- 收藏整章：保存该章每一节，并写入一个 Chapter Review Group。

Daily Review 生成 Memorization Item 时，优先识别 Review Group，把连续经文合并练习；未分组的收藏经文按单节练习。

如果某节经文同时是单节收藏，又属于段落/整章 Review Group，Daily Review 优先通过更大的 Review Group 练习它，不重复生成单节卡。

Review Group 应由用户显式创建。系统可以从连续收藏中提出 Group Suggestion，例如“要按段落复习诗 23:1-6 吗？”，但不应自动合并，避免误解用户意图。

## Review 流程

1. 显示经文引用和遮字文本。
2. 用户先读/默想。
3. 进入 Initial Recall。
4. 用户按首字母/汉字输入，系统逐步补全。
5. 错误时轻提示，不扣分，可请求显示下一个字。
6. 显示完整文本核对。
7. 用户选择：会了 / 模糊 / 不会。
8. 系统更新 Review Stage 和 nextReviewAt。
9. 进入下一张。

## 间隔复习

默认规则：

- New + 会了 -> Learning，明天
- New + 模糊/不会 -> New，今天稍后或明天
- Learning + 会了 -> Reviewing，3 天后
- Learning + 模糊 -> Learning，明天
- Learning + 不会 -> New，明天
- Reviewing + 会了 -> Mastered，7 天后
- Reviewing + 模糊 -> Learning，明天
- Reviewing + 不会 -> New，明天
- Mastered + 会了 -> Mastered，21/60 天后
- Mastered + 模糊/不会 -> Reviewing，3 天后

Review Stage 归属于 Memorization Item。单节 item 有自己的 stage；段落和整章 Review Group 也有自己的 stage。整章内部可以记录 chunk-level recent ratings 作为弱点提示，但不把整章拆成互相独立的复习对象。

## UI 方向

首页第一动作应该是 Daily Review。现有瀑布流保留为浏览/发现，不再作为主学习动作。

Daily Review 页面应像单卡片练习：

- 一次只显示一个 Memorization Item。
- 顶部显示进度，例如 `2 / 4`。
- 保留退出/稍后继续。
- 反馈温柔，不做考试感强的红叉扣分。
- 完成页强调掌握进展，不强调分数。
- 键盘快捷键是一等交互：`Enter` 下一步，`1/2/3` 评分，提示键或按钮显示下一个字。

## 研究依据

- Retrieval practice：主动提取比单纯复读更利于长期记忆。
- Spaced repetition：分散复习比集中复习更稳定。
- Self-determination theory：长期动机来自自主感、胜任感、关系感。
- Gamification misuse：积分/排行榜可能让用户追玩法而不是学习。

## 相关决策

- [ADR 0001: Quiet Mastery Gamification](./adr/0001-quiet-mastery-gamification.md)
- [ADR 0002: Memorization Items Can Span Verses](./adr/0002-memorization-items-can-span-verses.md)
- [ADR 0003: Local First Review Progress](./adr/0003-local-first-review-progress.md)
