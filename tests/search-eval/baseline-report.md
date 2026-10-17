# Search eval baseline (T3)

Hit = expected verse in the top 5. Regenerate: `SEARCH_EVAL_WRITE=1 npx vitest run tests/search-eval`.

| Path | In scope (this phase) | Appendix A (1–21) |
|---|---|---|
| Pagefind (primary) | 30/47 (63.8%) | 16/21 |
| MiniSearch (fallback) | 36/47 (76.6%) | 17/21 |

Launch gate (Pagefind, in scope): ≥ 88.8% (baseline + 25 pts, and ≥ 80%).

| # | Query | Expect | Category | Scope | Pagefind | MiniSearch | Pagefind top 3 |
|---|---|---|---|---|---|---|---|
| 1 | 神爱世人那节 | 约翰福音 3:16 | colloquial-shell | ✓ | ✗ | ✓ #1 |  |
| 2 | 不要忧虑明天 | 马太福音 6:34 | fuzzy-memory | ✓ | ✓ #1 | ✓ #1 | 马太福音 6:34 |
| 3 | love is patient | 哥林多前书 13:4 | english | ✓ | ✓ #1 | ✓ #1 | 哥林多前书 13:4 |
| 4 | shen ai shi ren | 约翰福音 3:16 | pinyin-full | ✓ | ✗ #19 | ✗ | 约书亚记 10:2; 约伯记 34:28; 诗篇 119:165 |
| 5 | shen ai si ren | 约翰福音 3:16 | pinyin-fuzzy | ✓ | ✓ #1 | ✗ | 约翰福音 3:16; 何西阿书 6:6; 出埃及记 2:23 |
| 6 | sasr | 约翰福音 3:16 | pinyin-initials | ✓ | ✗ | ✗ |  |
| 7 | God so loved the world | 约翰福音 3:16 | english | ✓ | ✓ #1 | ✓ #1 | 约翰福音 3:16 |
| 8 | 我靠着那加给我力量的 | 腓立比书 4:13 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 腓立比书 4:13 |
| 9 | 叫一切信他的 | 约翰福音 3:16 | exact-phrase | ✓ | ✓ #2 | ✓ #2 | 约翰福音 3:15; 约翰福音 3:16 |
| 10 | 神爱世仁 | 约翰福音 3:16 | typo | ✓ | ✓ #1 | ✓ #1 | 约翰福音 3:16 |
| 11 | 凡事都能作 | 腓立比书 4:13 | near-synonym | ✓ | ✗ | ✓ #2 | 歌罗西书 3:20; 提摩太后书 4:5; 提摩太前书 3:4 |
| 12 | 约 3:16 | 约翰福音 3:16 | reference | ✓ | ✓ #1 | ✓ #1 | 约翰福音 3:16 |
| 13 | 约3:16 | 约翰福音 3:16 | reference | ✓ | ✓ #1 | ✓ #1 | 约翰福音 3:16 |
| 14 | 罗8:28 | 罗马书 8:28 | reference | ✓ | ✓ #1 | ✓ #1 | 罗马书 8:28 |
| 15 | 林前13 | 哥林多前书 13:1 | chapter-reference | ✓ | ✓ #1 | ✓ #1 | 哥林多前书 13:1; 哥林多前书 13:2; 哥林多前书 13:3 |
| 16 | Jn 3:16 | 约翰福音 3:16 | reference | ✓ | ✓ #1 | ✓ #1 | 约翰福音 3:16 |
| 17 | Rom 8 28 | 罗马书 8:28 | reference | ✓ | ✓ #1 | ✓ #1 | 罗马书 8:28 |
| 18 | 神愛世人 | 约翰福音 3:16 | traditional | ✓ | ✓ #1 | ✓ #1 | 约翰福音 3:16 |
| 19 | 饶恕 | 马太福音 6:14 | topic | ✓ | ✓ #2 | ✓ #3 | 以赛亚书 2:9; 马太福音 6:14; 但以理书 9:9 |
| 20 | 盼望 | 罗马书 15:13 | topic | ✓ | ✗ #49 | ✗ #14 | 罗马书 5:4; 诗篇 71:14; 诗篇 147:11 |
| 21 | 撒该 | 路加福音 19:2 / 路加福音 19:5 / 路加福音 19:8 | name | ✓ | ✓ #1 | ✓ #1 | 路加福音 19:2; 路加福音 19:5; 路加福音 19:8 |
| 22 | 靠着加给我力量的 | 腓立比书 4:13 | fuzzy-memory | ✓ | ✓ #1 | ✓ #1 | 腓立比书 4:13 |
| 23 | 上帝爱世人 | 约翰福音 3:16 | near-synonym | ✓ | ✓ #1 | ✓ #2 | 约翰福音 3:16; 约翰福音 3:19; 约翰福音 17:23 |
| 24 | shenaishiren | 约翰福音 3:16 | pinyin-full | ✓ | ✓ #1 | ✗ | 约翰福音 3:16 |
| 25 | shenasr | 约翰福音 3:16 | pinyin-mixed | ✓ | ✗ | ✗ | 诗篇 60:10; 诗篇 108:11; 诗篇 83:1 |
| 26 | 世人 神 爱 | 约翰福音 3:16 | word-order | ✓ | ✗ | ✓ #1 | 约伯记 36:28; 约伯记 33:14; 诗篇 33:13 |
| 27 | verse about God so loved the world | 约翰福音 3:16 | colloquial-shell | ✓ | ✗ | ✓ #1 |  |
| 28 | 耶和华是我的牧者 | 诗篇 23:1 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 诗篇 23:1 |
| 29 | the lord is my shepherd | 诗篇 23:1 | english | ✓ | ✗ | ✗ #24 |  |
| 30 | ye he hua shi wo de mu zhe | 诗篇 23:1 | pinyin-full | ✓ | ✗ #33 | ✗ | 撒母耳记上 24:6; 申命记 33:9; 士师记 14:6 |
| 31 | 你们要先求他的国 | 马太福音 6:33 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 马太福音 6:33 |
| 32 | 万事都互相效力 | 罗马书 8:28 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 罗马书 8:28 |
| 33 | 万事互相效力叫爱神的人得益处 | 罗马书 8:28 | fuzzy-memory | ✓ | ✓ #1 | ✓ #1 | 罗马书 8:28 |
| 34 | 爱是恒久忍耐 | 哥林多前书 13:4 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 哥林多前书 13:4 |
| 35 | 爱是长久忍耐 | 哥林多前书 13:4 | typo | ✓ | ✗ | ✓ #1 |  |
| 36 | 应当一无挂虑 | 腓立比书 4:6 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 腓立比书 4:6 |
| 37 | yi wu gua lv | 腓立比书 4:6 | pinyin-full | ✓ | ✗ #39 | ✗ | 以赛亚书 1:8; 路加福音 12:58; 路加福音 16:6 |
| 38 | 我就是道路真理生命 | 约翰福音 14:6 | fuzzy-memory | ✓ | ✓ #1 | ✓ #1 | 约翰福音 14:6 |
| 39 | I am the way the truth and the life | 约翰福音 14:6 | english | ✓ | ✓ #1 | ✓ #1 | 约翰福音 14:6 |
| 40 | 你的话是我脚前的灯 | 诗篇 119:105 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 诗篇 119:105 |
| 41 | 喜乐的心乃是良药 | 箴言 17:22 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 箴言 17:22 |
| 42 | 快乐的心乃是良药 | 箴言 17:22 | near-synonym | ✓ | ✗ | ✓ #1 |  |
| 43 | 常常喜乐 不住祷告 | 帖撒罗尼迦前书 5:16 / 帖撒罗尼迦前书 5:17 | word-order | ✓ | ✗ | ✓ #1 |  |
| 44 | trust in the lord with all your heart | 箴言 3:5 | english | ✓ | ✗ | ✓ #2 |  |
| 45 | 专心仰赖耶和华 | 箴言 3:5 | exact-phrase | ✓ | ✓ #1 | ✓ #1 | 箴言 3:5 |
| 46 | the verse that says in nothing be anxious | 腓立比书 4:6 | colloquial-shell | ✓ | ✗ | ✗ #12 |  |
| 47 | 平安 | 约翰福音 14:27 | topic | ✓ | ✗ | ✗ #28 | 罗马书 3:17; 诗篇 122:7; 箴言 3:17 |
| 48 | when I feel lonely | 申命记 31:6 | semantic | 以后 | ✗ | ✗ |  |
| 49 | 神会保护我不害怕 | 以赛亚书 41:10 | semantic | 以后 | ✗ | ✗ #9 |  |
| 50 | what does the bible say about worry | 马太福音 6:34 | semantic | 以后 | ✗ | ✗ |  |
