# Taiwan Zhuyin recall data

`taiwan-zhuyin-cuv.json` is a client-sized extraction of Taiwan Mandarin
readings from [McBopomofo](https://github.com/openvanilla/McBopomofo), pinned
at commit `73d0379eca621377fb46416ceb4a7dc9bb576d47`.

Source and license:

- Input: `Source/Data/data.txt`, built with the upstream `make` command.
- Input SHA-256: `7ff0f309eecefa671319cd90802b25ad797301b29838dc2a71d473c1506bdc73`.
- License: MIT, copyright 2011–2026 Mengjuei Hsieh et al. The complete notice
  is preserved in `McBopomofo-LICENSE.txt`.
- McBopomofo's `Source/Data/pyproject.toml` declares the data tooling MIT and
  the repository contains no separate license for the model sub-data.

The deterministic generator keeps only Han terms found in this repository's
CUV/CUVT files, selects the model's highest-scored reading for each term, adds
the corresponding simplified spelling with the already-pinned `opencc-js`
dependency, and stores only the first Zhuyin symbol for each character. It
does not include an IME runtime or make network requests at app runtime/build.

Regenerate after checking out the pinned McBopomofo commit and running its
`make -C Source/Data all`:

```sh
node scripts/build-taiwan-zhuyin-data.mjs /path/to/McBopomofo/Source/Data/data.txt
```

Generated artifact:

- Entries: 25,832 dual-script CUV/CUVT terms.
- Deterministic longest-match coverage: 929,899 of 929,906 Han characters
  (99.999%) in each bundled CUV and CUVT corpus.
- SHA-256: `ba7a7c066d7b232e1e582390e5cd931f41e8ff43a296eb190b582ed7f4a044ce`.
- Size: 459,862 bytes raw; 126,213 bytes gzip; 88,237 bytes Brotli.
