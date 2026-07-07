# Your Words

This context defines the product language for a Bible memorization web app focused on short, effective daily review sessions.

## Language

**Daily Review**:
A short, guided memorization flow, shown to users as 每日复习, intended to move a user from reading a verse toward recalling it without seeing the full text.
_Avoid_: Training session, browsing session, study page, game round

**Successful Review**:
A Daily Review is successful when the user moves at least one verse from reading familiarity toward blank recall.
_Avoid_: Page view, time spent, points earned

**Review Quota**:
The small, user-adjustable set of items selected for one Daily Review from Saved Items.
_Avoid_: Due queue, inbox zero, all pending reviews, single-card drill

**Continue Review**:
An optional extra review round after the user completes the chosen Review Quota.
_Avoid_: Endless due queue, required backlog

**Review Streak**:
The count of consecutive days the user completed a Daily Review quota, presented as gentle habit feedback without punishment for breaks.
_Avoid_: Penalty, pressure streak, loss aversion mechanic

**Mastery Progress**:
A summary of how many Memorization Items are in each Review Stage.
_Avoid_: Points, XP, score

**Blank Recall**:
Reciting a verse with no visible verse text, followed by feedback or self-check.
_Avoid_: Reading, reveal, passive review

**Self-Check Review**:
A Daily Review flow where the user sees masked text, reveals the full text, then gives a Review Rating based on their own recall.
_Avoid_: Typing test, dictation, automatic grading, hint-driven recall

**Initial Recall**:
Recalling a verse by typing the first letter of each English word or each Chinese character, with the app filling in the matching text as feedback.
_Avoid_: Full typing test, dictation, spelling test

**Keyboard Review Flow**:
A Daily Review interaction model where typing, advancing, rating, and requesting hints can be completed from the keyboard.
_Avoid_: Mouse-only review, passive card flipping

**Saved Item**:
A verse the user saved and expects to see in Daily Review. Saved verses remain the storage-level favorite unit.
_Avoid_: Memorization List, playlist, separate review list

**Shared Set**:
A set of verses received through a share link. A Shared Set stays separate from Saved Items until the user explicitly adds it to this device, but local review progress created from it can be reused if it is saved later.
_Avoid_: Auto-imported favorites, server playlist, remote collection

**Shared Review**:
A Self-Check Review run from a Shared Set before the verses are added as Saved Items. Shared Review may create local review progress, treated as orphan progress until those verses are saved.
_Avoid_: Imported progress, account sync, stateless preview

**Selected Share**:
A temporary user-selected subset of Saved Items used to create a share link.
_Avoid_: Review Group, playlist, saved collection

**Starter Suggestions**:
A small set of suggested verses shown when the user has no Saved Items, intended to help them create their first review pool.
_Avoid_: Daily Review fallback, required onboarding, default saved items

**Discovery Surface**:
A non-review area for finding verses to save, such as curated verses, search, rankings, or chapter browsing. Discovery can live on the homepage or a focused route, and should help create Saved Items rather than act as the Daily Review pool.
_Avoid_: Fallback review queue, memorization session, replacing reading with review

**Homepage Review Entry**:
A lightweight homepage panel that starts Daily Review from Saved Items while preserving reading mode, masking controls, book/chapter browsing, search, help, and the Side Menu.
_Avoid_: Full homepage replacement, forced review session, hiding discovery workflows

**Memorization Item**:
A review unit assembled from saved verses. It may be one saved verse, a connected passage, or a whole chapter grouping.
_Avoid_: Card, row, verse when the unit may span multiple verses

**Review Group**:
Local metadata that tells Daily Review to practice a set of saved verses together as a passage or chapter.
_Avoid_: Replacing favorites, server collection, playlist

**Group Suggestion**:
A prompt that offers to create a Review Group from contiguous saved verses without automatically changing how they are reviewed.
_Avoid_: Automatic merge, hidden grouping

**Group Precedence**:
When a saved verse belongs to a Review Group, Daily Review should practice it through the group rather than duplicating it as a standalone verse.
_Avoid_: Duplicate review cards, double counting

**Passage**:
A connected range of verses practiced as one unit because the user wants to recall it together.
_Avoid_: Multiple cards, verse list

**Chapter Review**:
Practicing a whole Bible chapter as one Memorization Item.
_Avoid_: Chapter browsing, reading mode

**Review Stage**:
The internal memorization state of a Memorization Item inside the Daily Review flow: New, Learning, Reviewing, or Mastered. User-facing UI may summarize it more gently.
_Avoid_: Level, rank, badge

**Review Rating**:
The user's post-recall judgment for a verse: Got It, Fuzzy, or Missed.
_Avoid_: Score, grade, pass/fail

**Review Priority**:
The order Daily Review uses when selecting a Review Quota: due items first, then recently Fuzzy or Missed items, then new Saved Items, then Mastered items.
_Avoid_: Random feed, chronological favorites, all pending items
