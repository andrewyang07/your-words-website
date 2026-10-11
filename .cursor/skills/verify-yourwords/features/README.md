# yourwords.me feature map

| Feature | File | Automated (flow / check) |
|---|---|---|
| Home & page routes | [home-and-routes.md](home-and-routes.md) | `home`, `homeEntries`; HTTP route checks |
| Favorites (收藏) | [favorites.md](favorites.md) | `favorites` |
| Deep memorize (`/memorize`, `?v=`, `/review`) | [memorize.md](memorize.md) | `memorizeDirect`; HTTP redirect + metadata |
| 背诵链接 (`?p=`, `?s=`, `?create=1`, share dialog, completion card) | [recite-link.md](recite-link.md) | `reciteLink`, `reciteLinkEdgeCases`, `createLink` |
| Performance budgets (`/`, `/search`, `/memorize`, `/note`) | [perf.md](perf.md) | `check-perf.sh` via `run-all.sh --perf` |
| OG previews (`/api/og/memorize`, metadata) | [og-preview.md](og-preview.md) | HTTP OG checks |

A proof for a feature should cover every entry point listed in its file, not just the most convenient one.
