# Your Words

Your Words is a local-first, account-free Bible reading and memorization app.

## Product language

**Quick Memorization (快速背诵)** is the existing reading-page mask interaction. It stays lightweight and keeps the normal reading navigation.

**Deep Memorization (深度背诵)** is the immersive `/memorize` flow for reproducing one CUV verse character-by-character. A session progresses through full reading, roughly 30% masking, nested roughly 65% masking, and pinyin-initial recall.

**Saved Verse (收藏经文)** is a verse in the existing favorites store. Saved verses are the picker source for Deep Memorization; there are no groups, queues, schedules, or starter verses.

**Direct Verse** is a verse opened by a Deep Memorization share URL. It does not need to be saved and opening it does not save it.

**Session** is one transient attempt at one verse. Its random masks remain fixed until retry. Sessions do not create learning history, mastery, scores, streaks, schedules, ratings, or completion counts.

**Recall Unit** is one Han character that consumes one pinyin-initial input. Punctuation, whitespace, digits, Latin characters, and editorial notes are not Recall Units.

The former Daily Review product and its Review Quota, Review Stage, Review Rating, Review Group, scheduling, mastery, and streak terminology are obsolete.
