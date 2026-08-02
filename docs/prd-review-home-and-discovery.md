# PRD: 纯净背经主页与发现页重构

> Status: Superseded by `docs/prd-daily-review.md`. The homepage now links to 深度背诵; `/review` is only a compatibility redirect to `/memorize`.

## Problem Statement

当前 Daily Review PR 已经加入 `/review` 和本地复习进度，但产品体验的边界需要更清楚：主页原本承担读经、选经、搜索、查看整章、帮助和侧边栏导航，这些是已有核心工作流，不能被复习列表整页替换；`/review` 则需要保持移动端友好的自查复习。

用户想要一个更纯净的背经入口：打开首页仍能读经、选经、查看整章和找经文，同时有一个清楚但不抢占页面的今日复习入口；需要复习时按本地进度从收藏中挑 3 个进入今日复习。`/discover` 可以作为更聚焦的发现界面存在，但不是旧首页能力的替代品。

## Solution

保留 `/` 的现有主页：读经/背诵模式切换、遮罩设置、书卷/章节浏览、搜索、收藏、分享、查看整章、帮助、侧边栏、排行榜和推广区块继续可用。在主页顶部加入轻量 Homepage Review Entry，提供明确的“今日复习”入口，但不替换原有主页内容。

将 `/review` 保留为 Daily Review 页面，但重做成 Self-Check Review：展示遮罩经文，用户可反复显示/隐藏全文，自行核对后选择“会了 / 模糊 / 不会”。显示/隐藏和三个评分按钮同时存在，不再把拼音输入、打字验证或 hint 作为核心流程。默认 Review Quota 为 3 个 Memorization Items，用户完成后可继续复习或增加复习量。

`/discover` 作为额外发现页：精选经文、搜索、书卷/章节浏览、收藏和分享可以在那里更轻量地呈现；它不能成为删掉主页读经/选经/侧边栏能力的理由。

分享 URL 只携带经文集合，不携带进度或评级。打开分享 URL 后显示 Shared Set 临时列表，按钮为“复习”和“加入收藏”。用户可先对 Shared Set 做 Shared Review，产生本地进度；之后加入收藏时沿用该进度。Shared Set 不会自动写入 Saved Items。

## User Stories

1. As a returning memorization user, I want the homepage to show my Saved Items, so that I immediately see what I am trying to memorize.
2. As a returning memorization user, I want Saved Items to be masked by default, so that opening the app puts me in recall mode instead of reading mode.
3. As a returning memorization user, I want to tap a saved verse card to reveal or hide the full verse text, so that I can quickly self-check without leaving the homepage.
4. As a returning memorization user, I want a clear 今日复习 button, so that I know how to start a focused Daily Review.
5. As a returning memorization user, I want Daily Review to select a small batch from my Saved Items, so that review feels achievable.
6. As a returning memorization user, I want the default Review Quota to be 3 items, so that I can finish even on a busy day.
7. As a motivated memorization user, I want to continue reviewing after completing the default quota, so that I can do more without feeling forced.
8. As a motivated memorization user, I want to increase the review amount, so that I can practice more when I have time.
9. As a mobile user, I want review to avoid typing and keyboard focus, so that the screen does not jump around while I practice.
10. As a mobile user, I want a simple reveal-and-rate flow, so that I can review comfortably one-handed.
11. As a Bible memorization user, I want Daily Review to show masked text first, so that I try to recall before reading.
12. As a Bible memorization user, I want to reveal the full text when ready, so that I can compare my recall with the verse.
13. As a Bible memorization user, I want to rate myself 会了, so that the item comes back later.
14. As a Bible memorization user, I want to rate myself 模糊, so that the item comes back soon.
15. As a Bible memorization user, I want to rate myself 不会, so that the item comes back fastest.
16. As a Bible memorization user, I want review priority to use due items first, so that scheduled review remains meaningful.
17. As a Bible memorization user, I want weak items to be prioritized, so that verses I missed or felt fuzzy return sooner.
18. As a Bible memorization user, I want new Saved Items to enter the review pool, so that newly saved verses become practice material.
19. As a Bible memorization user, I want Mastered items to return occasionally, so that mastered does not mean forgotten forever.
20. As a Bible memorization user, I want Review Stage to stay mostly internal, so that the UI does not feel technical.
21. As a Bible memorization user, I want gentle status copy instead of XP or grades, so that review feels reflective rather than competitive.
22. As a Bible memorization user, I want completion feedback after the quota, so that I feel done.
23. As a Bible memorization user, I want Continue Review to feel optional, so that I do not feel trapped by an endless queue.
24. As a new user, I want an empty homepage to explain that I need Saved Items, so that I know why there is nothing to review.
25. As a new user, I want Starter Suggestions when I have no Saved Items, so that I can begin without searching first.
26. As a new user, I want one action to add recommended verses, so that I can quickly create my first review pool.
27. As a new user, I want adding Starter Suggestions to keep me on the homepage, so that I can see the new Saved Items before reviewing.
28. As a new user, I want to go to Discovery from the empty state, so that I can choose my own verses.
29. As a discovery user, I want `/discover` to show curated verses, so that I can find useful verses to save.
30. As a discovery user, I want `/discover` cards to show full text by default, so that I can decide what to save quickly.
31. As a discovery user, I want to search Bible text and references, so that I can find specific verses.
32. As a discovery user, I want to browse by book and chapter, so that I can find verses in context.
33. As a discovery user, I want to save verses from Discovery, so that they enter Daily Review.
34. As a discovery user, I want to share individual verses from Discovery, so that I can send a verse to someone else.
35. As a discovery user, I want the Discovery UI to be lighter than the old homepage, so that finding verses is not visually noisy.
36. As a user who likes the app promo, I want the App promotion to remain in the footer, so that it is available without interrupting review.
37. As a user with Saved Items, I want to share all my saved verses, so that another person can import my full review pool.
38. As a user with Saved Items, I want to enter selection mode, so that I can choose only some verses to share.
39. As a user selecting verses, I want card taps to select or unselect in selection mode, so that the interaction matches iOS-style selection.
40. As a user selecting verses, I want normal mode taps to reveal or hide cards, so that selection does not break ordinary review-home behavior.
41. As a user selecting verses, I want to see the selected count, so that I know what will be shared.
42. As a user selecting verses, I want to cancel selection mode, so that I can return to normal browsing.
43. As a user sharing many verses, I want sharing to be limited to a safe URL size, so that links remain reliable.
44. As a recipient of a share link, I want to see the Shared Set as a temporary list, so that I can inspect it before saving.
45. As a recipient of a share link, I want Shared Set cards to be masked by default, so that the shared experience still feels like memorization.
46. As a recipient of a share link, I want to tap Shared Set cards to reveal full text, so that I can inspect verses before saving.
47. As a recipient of a share link, I want an 加入收藏 button, so that I explicitly choose when shared verses become Saved Items.
48. As a recipient of a share link, I want no automatic import, so that opening a link does not silently change my local review pool.
49. As a recipient of a share link, I want a 复习 button, so that I can try the shared verses immediately.
50. As a recipient of a share link, I want Shared Review progress to be saved locally, so that if I later add the verses, my effort is not lost.
51. As a recipient of a share link, I want share links to exclude the sender's progress, so that my review journey is my own.
52. As a local-first user, I want progress to work without an account, so that review is usable as a pure frontend app.
53. As a local-first user, I want progress to persist across reloads, so that my ratings continue to schedule future review.
54. As a local-first user, I want canceled favorites to stop appearing in Daily Review, so that my visible review pool matches my current Saved Items.
55. As a local-first user, I want progress for unsaved/orphan items to be retained temporarily, so that accidental unsave/resave does not erase progress.
56. As a local-first user, I want orphan progress to expire after about 180 days, so that browser storage does not grow forever.
57. As a user who changes favorites, I want active Saved Item progress never to be removed by TTL, so that ongoing memorization is safe.
58. As a user reviewing repeated items, I want recentRatings to stay bounded, so that local storage remains compact.
59. As a maintainer, I want the homepage and Discovery responsibilities separated, so that future UI changes do not re-mix browsing and review.
60. As a maintainer, I want Self-Check Review to reuse the review progress store, so that the existing local-first foundation remains useful.
61. As a maintainer, I want typed Initial Recall to stop being the core path, so that the implementation matches the simpler product direction.
62. As a maintainer, I want review selection and scheduling in a domain module, so that tests can cover behavior without component internals.
63. As a maintainer, I want share links to reuse existing verse encoding where possible, so that old sharing behavior is not needlessly rewritten.
64. As a maintainer, I want old localStorage favorites to remain compatible, so that existing users do not lose Saved Items.
65. As a maintainer, I want no migration for recent-favorite sorting, so that this slice stays focused and avoids fake recency data.
66. As a maintainer, I want list sorting limited to Bible order and random order, so that the UI does not promise unavailable metadata.
67. As a maintainer, I want existing mask settings reused, so that homepage and review behavior stay consistent with current user settings.
68. As a maintainer, I want this feature to respect Quiet Mastery, so that review motivation stays personal and non-competitive.

## Implementation Decisions

- `/` keeps the existing homepage reading and discovery workflows.
- Homepage Review Entry provides the Daily Review entry without replacing the homepage.
- Homepage masking and reading mode continue to use the existing mask settings and verse cards.
- Homepage card tap still reveals or hides that verse's full text in normal mode.
- Existing homepage favorite sharing remains available; a future selected-share flow should be added without replacing reading or chapter browsing.
- If selected sharing is added later, selection mode must not break normal reveal/hide card behavior.
- Share URL size limits should remain conservative; keep the existing 200-verse guard unless implementation proves a better limit.
- Favorite and discovery sorting should not promise “recently saved” unless favorite storage gains real timestamp metadata.
- Empty or low-saved states can point users to existing homepage discovery and `/discover`.
- Starter Suggestions use a fixed initial set of recommended verses, with a “换一批” style action for alternate random suggestions.
- Adding Starter Suggestions writes Saved Items and stays on the homepage; it does not auto-start Daily Review.
- `/discover` can also provide curated verses, search, book/chapter browsing, saving, and single-verse sharing.
- Discovery cards default to full text for easier verse selection.
- The existing App promotion, rankings, global stats, help, and Side Menu remain available on the homepage unless a separate design removes them deliberately.
- `/review` remains the Daily Review route but is rebuilt around Self-Check Review.
- Self-Check Review flow is: masked text, reveal or hide full text as needed, Review Rating, next item.
- Typed Initial Recall, pinyin input, automatic text filling, and hint actions are removed from the core Daily Review flow.
- Default Review Quota is 3 items.
- The user may continue reviewing after completion or increase the amount voluntarily.
- Review selection uses Review Priority: due items first, then recently Fuzzy/Missed items, then new Saved Items, then Mastered items.
- Review Rating labels remain 会了 / 模糊 / 不会.
- Scheduling rules stay simple: Missed returns tomorrow; Fuzzy returns in 2 days; Got It grows by stage; Mastered + Got It returns in about 30 days.
- Review Stage remains an internal scheduling concept. UI should use gentler copy such as 新, 复习中, 熟悉 only where useful.
- Active Saved Item progress is local-first and should not expire.
- Progress for items that are no longer Saved Items is orphan progress and may be cleaned after 180 days.
- Shared links carry verse membership only, not progress, ratings, or stages.
- Opening a shared URL shows a Shared Set temporary list. It does not automatically add Saved Items.
- Shared Set buttons are `复习` and `加入收藏`.
- Shared Set cards default to masked text and support tap-to-reveal.
- Shared Review may create local progress before verses are saved.
- If a Shared Set is later added to Saved Items, previously created local progress is reused.
- If Shared Review progress remains orphaned, it follows the 180-day orphan progress cleanup rule.
- Existing favorites storage must remain compatible. Do not require a favorite migration for this PRD.
- Existing Review Group and Memorization Item concepts remain valid, but this slice can focus on single Saved Items first unless existing group behavior is already stable.

## Testing Decisions

- Tests should assert external behavior at stable seams, not component internals or CSS classes.
- Primary seam: the Daily Review domain module that selects a Review Quota and applies Review Rating scheduling.
- The review selection tests should cover default quota 3, due-first ordering, weak-item priority, new Saved Items, Mastered fallback, and include-more/continue behavior.
- The scheduling tests should cover Missed tomorrow, Fuzzy in 2 days, Got It by stage, and Mastered + Got It around 30 days.
- Store tests should cover local-first review progress persistence, orphan progress retention, 180-day cleanup, and compatibility with existing persisted shape.
- Share tests should cover all-saved sharing, Selected Share sharing, 200-verse guard behavior, Shared Set decoding, explicit add-to-favorites, and no sender progress in URLs.
- UI flow tests should focus on user-visible flows: homepage review entry, preserved reading/discovery controls, opening a Shared Set, adding a Shared Set, starting Daily Review, reveal/hide, rating, and completion.
- Discovery tests should cover default full-text cards, saving from Discovery, and search/browse entry points if the project already has UI test support.
- Prior art: existing unit tests for daily review selection, review storage, Initial Recall, share utilities, and verse parsing show the preferred Vitest style.
- Initial Recall tests can remain for future capability, but they should no longer define the acceptance path for Daily Review.

## Out of Scope

- Account system or cloud sync.
- Sharing sender progress, ratings, stages, streaks, or review history.
- Making rankings a primary motivation loop.
- XP, scores, competitive badges, or social game mechanics.
- Full favorite storage migration for addedAt metadata.
- Recently saved sorting.
- Typed Initial Recall as the core Daily Review interaction.
- Pinyin-specific recall, dictation, or automatic grading in this slice.
- Requiring Review Groups, passage groups, or chapter groups before single-verse Daily Review works.
- Server-side share storage or short-link generation.
- Importing a Shared Set automatically on page open.

## Further Notes

- This PRD supersedes the parts of the earlier Daily Review PRD that made typed Initial Recall central.
- It keeps the useful foundation from the existing Daily Review PR: local-first review progress, Review Rating, Review Stage, Review Quota, and `/review`.
- It respects ADR 0001 Quiet Mastery Gamification, ADR 0002 Memorization Items Can Span Verses, ADR 0003 Local First Review Progress, ADR 0004 Homepage Keeps Discovery With Review Entry, and ADR 0005 Self-Check Review Over Typed Recall.
- Use the domain language from `CONTEXT.md`: Homepage Review Entry, Saved Item, Shared Set, Shared Review, Selected Share, Starter Suggestions, Discovery Surface, Daily Review, Review Quota, Self-Check Review, Review Rating, Review Priority, and Review Stage.
- Current unrelated `.claude/` worktree content should not be modified.
