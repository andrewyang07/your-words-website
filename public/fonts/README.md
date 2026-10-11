# OG image font

`NotoSerifSC-og-subset.otf` — Noto Serif CJK SC Regular (© Google / Adobe, SIL Open Font License 1.1,
https://openfontlicense.org), subset with `pyftsubset` to every character in `public/data/CUV_bible.json`
and `public/data/books.json`, plus ASCII and common punctuation. Used only by `app/api/og/memorize`
(Satori has no system fonts). Regenerate the subset if new characters are needed.
