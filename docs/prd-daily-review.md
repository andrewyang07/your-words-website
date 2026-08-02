# PRD: 深度背诵

This document replaces the former Daily Review PRD.

## Goal

Help a user reproduce one favorited CUV verse character-by-character in a focused, mobile-first flow without accounts, scheduling, scoring, or persistent learning history. The reading page's existing mask interaction remains the lightweight 快速背诵 option.

## Flow

1. `/memorize` lists the user's saved verses. An empty list says “先收藏一节想背的经文” and links back to Scripture browsing.
2. Selecting a verse hides ordinary navigation and begins a new session with a fixed random mask.
3. Four stages are independently skippable: read the full verse; mask about 30% of Han characters; increase the same mask to about 65%; mask all Han characters and reveal them sequentially with pinyin initials.
   From every later stage, the user can return to the previous stage and move forward again without resetting the session.
4. Completion offers retry, choose another saved verse, or finish and return.

## Rules

- CUV only; one verse per session; consecutive favorites remain separate.
- The 65% mask contains every position from the 30% mask. Punctuation and layout remain visible.
- Bracketed editorial notes are excluded from recall and may be shown separately.
- The final stage accepts an in-page A–Z keyboard and physical letter keys. Correct input advances one Recall Unit; incorrect input changes no progress.
- “显示这个字” advances exactly one unit. “跳过本轮” exits the stage.
- Pinyin is computed from the complete phrase, with reasonable alternate initials for polyphonic characters.
- Direct links may open a verse that is not saved. They never carry progress or auto-save.
- No backend, groups, selection sets, history, mastery, ratings, streaks, schedules, counts, audio, sorting, multiple choice, spaced repetition, reminders, or analytics.
