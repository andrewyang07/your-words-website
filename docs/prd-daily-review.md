# PRD: 每日复习背经体验

## Problem Statement

当前网站已经有经文浏览、搜索、收藏、遮字卡片和排行榜，但用户打开后更像是在浏览经文，而不是进入一个能稳定帮助自己背会经文的练习流程。用户需要一个低压力、短流程、可持续的每日复习体验：每次打开都知道该练什么、怎么练、练到什么程度算完成，并能看到自己在真实掌握经文，而不是只是在翻卡片或追积分。

## Solution

新增“每日复习”作为首页核心入口。每日复习从用户收藏的经文中生成固定小配额，一次只显示一个 Memorization Item，通过遮字阅读、Initial Recall、温柔反馈和 Review Rating 推进 Review Stage。收藏底层继续按单节保存；段落和整章通过显式 Review Group 组合，不破坏现有收藏、分享、排行榜逻辑。

每日复习默认本地优先保存进度，包括 Review Stage、nextReviewAt、Review Streak、recent ratings 和 Mastery Progress。产品的游戏性聚焦掌握感：完成每日配额、看到 New/Learning/Reviewing/Mastered 的变化、保持温和 streak，并允许用户完成后继续复习。

## User Stories

1. As a Bible memorization user, I want a clear “每日复习” entry point, so that I immediately know where to practice instead of browsing aimlessly.
2. As a returning user, I want the homepage to prioritize review, so that the site feels like a memorization tool rather than a verse gallery.
3. As a new user, I want the app to fall back to curated verses when I have not saved enough verses, so that I can start reviewing without setup.
4. As a user with saved verses, I want my saved verses to become the review pool, so that I do not need to manage a separate memorization list.
5. As a user with existing favorites, I want those favorites to keep working, so that my current data is not broken by the new review feature.
6. As a user, I want single saved verses to appear as review items, so that I can practice individual verses.
7. As a user, I want to save a passage for review, so that connected verses can be practiced together.
8. As a user, I want to save a whole chapter for review, so that I can memorize long passages in context.
9. As a user, I want passage and chapter review to preserve the existing per-verse favorite storage, so that sharing and rankings continue to work.
10. As a user, I want passage and chapter grouping to be explicit, so that the app does not incorrectly combine verses I did not mean to practice together.
11. As a user, I want the app to suggest grouping contiguous saved verses, so that I can create a Review Group with less work.
12. As a user, I want Review Group suggestions to wait for my confirmation, so that automatic grouping does not surprise me.
13. As a user, I want a saved verse that belongs to a Review Group to avoid duplicate review cards, so that I do not practice the same text twice in one session.
14. As a user, I want larger groups to take precedence over standalone verse review, so that chapter and passage practice remains coherent.
15. As a user, I want Daily Review to show one Memorization Item at a time, so that I can focus on recall.
16. As a mobile user, I want the review screen to stay simple and single-purpose, so that I can practice comfortably on a phone.
17. As a keyboard user, I want review to support keyboard-first interaction, so that typing and rating feel fast.
18. As a user, I want to read or meditate on the verse before recall, so that review starts with comprehension rather than pressure.
19. As a user, I want the text to be partially hidden during review, so that I can move from reading toward recall.
20. As a user, I want Initial Recall, so that I actively retrieve the verse instead of only revealing it.
21. As a Chinese Bible user, I want Initial Recall to accept each Chinese character as the input unit, so that I do not fight word segmentation.
22. As an English Bible user, I want Initial Recall to accept first letters of English words, so that the experience matches Bible Memory style practice.
23. As a user, I want the app to auto-fill matching text while I type recall inputs, so that I get immediate feedback.
24. As a user, I want punctuation, spaces, and letter case ignored during recall, so that trivial formatting does not block practice.
25. As a user, I want recall validation to follow the currently displayed Bible version, so that the rule is understandable.
26. As a user, I want wrong input to be handled gently, so that review feels like practice rather than an exam.
27. As a user, I want to request the next character or hint, so that I can keep moving when stuck.
28. As a user, I want to reveal the full text after recall, so that I can check myself.
29. As a user, I want to rate myself “会了 / 模糊 / 不会”, so that the app can schedule the next review.
30. As a user, I want review ratings to update Review Stage, so that my progress reflects my actual memory.
31. As a user, I want New items to become Learning when I recall them, so that new material starts moving through the system.
32. As a user, I want Learning items to come back soon, so that fragile memory is reinforced.
33. As a user, I want Reviewing items to return after a longer interval, so that stable memory is maintained.
34. As a user, I want Mastered items to still return occasionally, so that “mastered” does not mean forgotten later.
35. As a user, I want fuzzy or missed items to come back sooner, so that weak memory receives more practice.
36. As a user, I want chapter review to advance in chunks, so that a whole chapter does not feel overwhelming.
37. As a user, I want chapter chunks to follow natural paragraphs when available, so that the practice respects meaning.
38. As a user, I want chapter chunks to fall back to 3-5 verses when paragraph data is unavailable, so that the feature still works.
39. As a user, I want one Review Stage for a passage or chapter group, so that the group is treated as a coherent memorization unit.
40. As a user, I want chunk-level recent ratings for chapter review, so that weak chunks can be surfaced without splitting the chapter into separate objects.
41. As a user, I want a small daily quota, so that review feels achievable.
42. As a user, I want the quota to include a few short items and one chapter chunk when available, so that practice balances breadth and long-form memorization.
43. As a user, I want completion after the daily quota, so that I feel done instead of trapped by an endless queue.
44. As a motivated user, I want “继续复习” after completion, so that I can do more voluntarily.
45. As a user, I want extra review to feel optional, so that it does not become review debt.
46. As a user, I want a Review Streak, so that I can see my habit forming.
47. As a user, I want streaks to be gentle, so that missing a day does not feel punitive.
48. As a user, I want Mastery Progress, so that I can see how many items are New, Learning, Reviewing, and Mastered.
49. As a user, I want mastery progress instead of XP, so that the feedback reflects real memorization.
50. As a user, I want the completion page to show what improved today, so that I feel meaningful progress.
51. As a user, I want the completion page to invite me back tomorrow, so that the practice rhythm is clear.
52. As a user, I want review progress to work without an account, so that I can use the site as a pure frontend tool.
53. As a user, I want local progress to persist across reloads, so that my review history is not lost.
54. As a future synced user, I want account sync to mirror local review state, so that sync does not change the core review experience.
55. As a user, I want rankings to remain a discovery surface, so that popular verses are still useful without becoming the main game.
56. As a user, I want browsing and discovery to remain available, so that I can still find verses outside review.
57. As a user, I want saving a passage to also save each verse, so that existing verse-level features still work.
58. As a user, I want saving a chapter to also save each verse, so that chapter review does not bypass existing favorite behavior.
59. As a user, I want removing or changing a Review Group to be understandable, so that I can control how saved verses are practiced.
60. As a maintainer, I want the review feature to respect existing ADRs, so that the product stays focused on quiet mastery, multi-verse items, and local-first progress.

## Implementation Decisions

- Keep favorites as the storage-level Saved Item model. Do not replace the existing per-verse favorite storage.
- Add Review Group metadata for passages and chapters. A Review Group references saved verses and tells Daily Review to assemble them as a Memorization Item.
- Review Group creation is explicit. The app may show Group Suggestions for contiguous saved verses, but must not silently merge them.
- Apply Group Precedence during review selection. If a saved verse belongs to a passage or chapter Review Group, the group owns review for that verse.
- Daily Review selection should produce a Review Quota, not a complete due queue. The default quota is a few single-verse or short-passage items plus one chapter chunk when available.
- A completed quota creates a Successful Review and updates Review Streak. Continue Review starts another optional quota and must not present remaining items as debt.
- Add a local-first review progress store. It should track Review Stage, nextReviewAt, recent ratings, streak data, and Mastery Progress.
- Review Stage belongs to the Memorization Item. A single verse has its own stage; a passage or chapter Review Group has its own stage.
- Chapter Review should support chunk-level recent ratings as weak-point metadata, while keeping the chapter group as the review object.
- Use the Review Rating state machine already captured in product design: Got It lengthens intervals, Fuzzy shortens intervals, Missed moves the item back toward New or Learning.
- Build an Initial Recall engine independent of the UI. It should normalize punctuation, spaces, and case; Chinese input uses each Chinese character; English input uses first letters of words.
- Initial Recall validation follows the currently displayed Bible version. Cross-version intelligent tolerance is not part of the core rule.
- The review UI should be a single-card flow. It should support reading/meditation, masked text, Initial Recall, reveal/check, rating, next item, completion, and Continue Review.
- Keyboard Review Flow is a first-class interaction model. Enter advances, numeric shortcuts rate items, and a hint action reveals the next character or equivalent prompt.
- The homepage should promote 每日复习 as the primary action. Existing masonry browsing remains available as browsing/discovery.
- Existing rankings remain a discovery feature, not the primary motivation loop.
- Account and cloud sync are not prerequisites. If added later, they should mirror local-first state rather than redefining review behavior.

## Testing Decisions

- Test external behavior at the highest useful seams, not implementation details.
- Primary seam: a Daily Review domain module that accepts saved verse ids, Review Groups, review progress, verse data, and current date, then returns a Review Quota plus state transitions after ratings.
- Secondary seam: an Initial Recall engine that accepts verse text, language/version context, typed input, and hint state, then returns completed display text, match status, and next hint behavior.
- UI tests should cover the review page as a user flow only after the domain seams are stable: start review, type recall input, reveal/check, rate, complete quota, continue review.
- Store tests should verify persistence serialization and rehydration for Review Groups and review progress, similar in spirit to current Set serialization in favorites.
- Existing unit-test style in the repo uses Vitest for pure modules; new review selection, scheduling, grouping, and Initial Recall tests should follow that pattern.
- Existing tests around share/save summary show how to test duplicate handling; use similar assertions for Group Precedence and no duplicate review cards.
- Existing verse parser tests show range handling expectations; use similar coverage for passage and chapter group creation behavior where applicable.
- Avoid tests that assert component internals, CSS classes, or exact implementation structure. Prefer testing visible flow, returned quotas, state transitions, and persisted state shape.

## Out of Scope

- Replacing the current favorites model with a new list system.
- Making social rankings the Daily Review motivation loop.
- XP, scoreboards, item shops, or complex badge systems.
- Requiring accounts or cloud sync for review.
- AI explanation as a core review step.
- Cross-version smart recall tolerance beyond the current displayed version.
- Automatically grouping contiguous saved verses without user confirmation.
- Turning Mastered into permanent graduation with no future review.

## Further Notes

- User-facing copy should use “每日复习”; the domain concept may remain Daily Review in docs and code.
- The feature should respect ADR 0001: quiet mastery over social competition.
- The feature should respect ADR 0002: Memorization Items may span verses while favorites remain verse-level.
- The feature should respect ADR 0003: review progress is local-first by default.
- Current untracked `.claude/` changes are unrelated and should not be modified by this work.
