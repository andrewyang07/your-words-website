# Local First Review Progress

> Status: Superseded. Deep Memorization keeps no learning progress; only transient current-tab recovery is permitted. See `docs/prd-daily-review.md`.

Daily Review progress will be local-first by default. Saved items, review stages, next review dates, streaks, and recent ratings should live in the browser so the memorization experience works as a pure frontend flow; account sync may mirror this state, but should not become required for review. The existing Redis backend is for aggregate stats and rankings, not guest-specific private progress. Progress for items that are no longer Saved Items may be retained for up to 180 days and then cleaned up, while active Saved Items are not removed by TTL.
