// Shared by scripts/build-pagefind-index.mjs (index time) and lib/search/pagefindClient.ts (query time) so both
// produce identical pinyin tokens (spec search-phase1 T5 / G1). Plain JS so the Node build script can import it.
//
// Pinyin lives in its own token namespace, never mixed with English words:
//   py<syl>            one syllable                    (神 → pyshen)
//   pb<syl><syl>       adjacent syllable pair          (神爱 → pbshenai)
//   pf<fz><fz>         adjacent pair, 模糊音-normalized (神爱 → pfsenai; sen ai → pfsenai)
//   pj<joined>         whole verse joined, prefix-searchable (神爱世人… → pjshenaishiren…)
//   pi<ab> / pt<abc>   initials pair / triple (神爱世人 → pisa … ptsas ptasr), every reading of 多音字
// so an English query such as "shi" or "Ai" can no longer match pinyin, and a pinyin query never matches English.

/** Every toneless syllable that occurs in the CUV text (ü written as v). */
export const PINYIN_SYLLABLES = new Set([
  'a',
  'ai',
  'an',
  'ang',
  'ao',
  'ba',
  'bai',
  'ban',
  'bang',
  'bao',
  'bei',
  'ben',
  'beng',
  'bi',
  'bian',
  'biao',
  'bie',
  'bin',
  'bing',
  'bo',
  'bu',
  'ca',
  'cai',
  'can',
  'cang',
  'cao',
  'ce',
  'ceng',
  'cha',
  'chai',
  'chan',
  'chang',
  'chao',
  'che',
  'chen',
  'cheng',
  'chi',
  'chong',
  'chou',
  'chu',
  'chuai',
  'chuan',
  'chuang',
  'chui',
  'chun',
  'chuo',
  'ci',
  'cong',
  'cou',
  'cu',
  'cuan',
  'cui',
  'cun',
  'cuo',
  'da',
  'dai',
  'dan',
  'dang',
  'dao',
  'de',
  'dei',
  'deng',
  'di',
  'dian',
  'diao',
  'die',
  'ding',
  'diu',
  'dong',
  'dou',
  'du',
  'duan',
  'dui',
  'dun',
  'duo',
  'e',
  'en',
  'er',
  'fa',
  'fan',
  'fang',
  'fei',
  'fen',
  'feng',
  'fo',
  'fou',
  'fu',
  'gai',
  'gan',
  'gang',
  'gao',
  'ge',
  'gei',
  'gen',
  'geng',
  'gong',
  'gou',
  'gu',
  'gua',
  'guai',
  'guan',
  'guang',
  'gui',
  'gun',
  'guo',
  'ha',
  'hai',
  'han',
  'hang',
  'hao',
  'he',
  'hei',
  'hen',
  'heng',
  'hong',
  'hou',
  'hu',
  'hua',
  'huai',
  'huan',
  'huang',
  'hui',
  'hun',
  'huo',
  'ji',
  'jia',
  'jian',
  'jiang',
  'jiao',
  'jie',
  'jin',
  'jing',
  'jiong',
  'jiu',
  'ju',
  'juan',
  'jue',
  'jun',
  'kai',
  'kan',
  'kang',
  'kao',
  'ke',
  'ken',
  'keng',
  'kong',
  'kou',
  'ku',
  'kua',
  'kuai',
  'kuan',
  'kuang',
  'kui',
  'kun',
  'kuo',
  'la',
  'lai',
  'lan',
  'lang',
  'lao',
  'le',
  'lei',
  'leng',
  'li',
  'lian',
  'liang',
  'liao',
  'lie',
  'lin',
  'ling',
  'liu',
  'long',
  'lou',
  'lu',
  'luan',
  'lun',
  'luo',
  'lv',
  'lve',
  'ma',
  'mai',
  'man',
  'mang',
  'mao',
  'me',
  'mei',
  'men',
  'meng',
  'mi',
  'mian',
  'miao',
  'mie',
  'min',
  'ming',
  'miu',
  'mo',
  'mou',
  'mu',
  'na',
  'nai',
  'nan',
  'nang',
  'nao',
  'ne',
  'nei',
  'nen',
  'neng',
  'ni',
  'nian',
  'niang',
  'niao',
  'nie',
  'ning',
  'niu',
  'nong',
  'nu',
  'nuan',
  'nuo',
  'nv',
  'nve',
  'ou',
  'pa',
  'pai',
  'pan',
  'pang',
  'pao',
  'pei',
  'pen',
  'peng',
  'pi',
  'pian',
  'piao',
  'pie',
  'pin',
  'ping',
  'po',
  'pou',
  'pu',
  'qi',
  'qia',
  'qian',
  'qiang',
  'qiao',
  'qie',
  'qin',
  'qing',
  'qiong',
  'qiu',
  'qu',
  'quan',
  'que',
  'qun',
  'ran',
  'rang',
  'rao',
  're',
  'ren',
  'reng',
  'ri',
  'rong',
  'rou',
  'ru',
  'ruan',
  'rui',
  'run',
  'ruo',
  'sa',
  'sai',
  'san',
  'sang',
  'sao',
  'se',
  'sen',
  'sha',
  'shai',
  'shan',
  'shang',
  'shao',
  'she',
  'shen',
  'sheng',
  'shi',
  'shou',
  'shu',
  'shua',
  'shuai',
  'shuan',
  'shuang',
  'shui',
  'shun',
  'shuo',
  'si',
  'song',
  'sou',
  'su',
  'suan',
  'sui',
  'sun',
  'suo',
  'ta',
  'tai',
  'tan',
  'tang',
  'tao',
  'te',
  'teng',
  'ti',
  'tian',
  'tiao',
  'tie',
  'ting',
  'tong',
  'tou',
  'tu',
  'tuan',
  'tui',
  'tun',
  'tuo',
  'wa',
  'wai',
  'wan',
  'wang',
  'wei',
  'wen',
  'weng',
  'wo',
  'wu',
  'xi',
  'xia',
  'xian',
  'xiang',
  'xiao',
  'xie',
  'xin',
  'xing',
  'xiong',
  'xiu',
  'xu',
  'xuan',
  'xue',
  'xun',
  'ya',
  'yan',
  'yang',
  'yao',
  'ye',
  'yi',
  'yin',
  'ying',
  'yong',
  'you',
  'yu',
  'yuan',
  'yue',
  'yun',
  'za',
  'zai',
  'zan',
  'zang',
  'zao',
  'ze',
  'zei',
  'zen',
  'zeng',
  'zha',
  'zhai',
  'zhan',
  'zhang',
  'zhao',
  'zhe',
  'zhen',
  'zheng',
  'zhi',
  'zhong',
  'zhou',
  'zhu',
  'zhua',
  'zhuan',
  'zhuang',
  'zhui',
  'zhun',
  'zhuo',
  'zi',
  'zong',
  'zou',
  'zu',
  'zuan',
  'zui',
  'zun',
  'zuo',
]);

const MAX_SYLLABLE = 6;

/** 模糊音: zh/z, ch/c, sh/s, ang/an, eng/en, ing/in, r/l, n/l (same rules as fuzzyPinyin.ts normalizeFuzzy). */
export function fuzzySyllable(s) {
  return s
    .replace(/^zh/, 'z')
    .replace(/^ch/, 'c')
    .replace(/^sh/, 's')
    .replace(/ang$/, 'an')
    .replace(/eng$/, 'en')
    .replace(/ing$/, 'in')
    .replace(/^r/, 'l')
    .replace(/^n/, 'l');
}

/** Lowercase, ü → v, keep letters only. */
export function cleanSyllable(s) {
  return String(s)
    .toLowerCase()
    .replace(/ü/g, 'v')
    .replace(/[^a-z]/g, '');
}

/** Fewer syllables wins; on a tie the split with the longer earlier syllable (shen|ai over she|nai). */
function better(a, b) {
  if (a.length !== b.length) return a.length < b.length;
  for (let i = 0; i < a.length; i += 1) if (a[i].length !== b[i].length) return a[i].length > b[i].length;
  return false;
}

/**
 * Split Latin input into pinyin syllables, or null when it is not pinyin. Spaces are honoured; each chunk is split by
 * the fewest-syllables dynamic programme ("shenaishiren" → shen ai shi ren; "xian" stays one syllable).
 */
export function segmentPinyin(input) {
  const chunks = String(input).toLowerCase().replace(/ü/g, 'v').trim().split(/\s+/).filter(Boolean);
  if (chunks.length === 0) return null;
  const out = [];
  for (const chunk of chunks) {
    if (!/^[a-z]+$/.test(chunk)) return null;
    const best = new Array(chunk.length + 1).fill(null);
    best[0] = [];
    for (let i = 0; i < chunk.length; i += 1) {
      if (!best[i]) continue;
      for (let len = 1; len <= MAX_SYLLABLE && i + len <= chunk.length; len += 1) {
        const syl = chunk.slice(i, i + len);
        if (!PINYIN_SYLLABLES.has(syl)) continue;
        const next = [...best[i], syl];
        if (!best[i + len] || better(next, best[i + len])) best[i + len] = next;
      }
    }
    if (!best[chunk.length]) return null;
    out.push(...best[chunk.length]);
  }
  return out;
}

/** Readings indexed per character: the in-context reading first, then up to two other readings (多音字, T6). */
const MAX_READINGS = 3;

const initialOf = (syllable) => syllable[0];

/**
 * Index tokens for one verse / book name. Each position is a syllable or an array of readings (in-context first).
 *   py / pb / pf  every reading (and every reading pair) so 行 matches xing, hang and heng
 *   pi<ab>        initials pair, pt<abc> initials triple (首字母: sasr → ptsas ptasr), from every reading
 *   pj<joined>    in-context readings only
 */
export function pinyinIndexTokens(positions) {
  const readings = positions
    .map((p) => [...new Set((Array.isArray(p) ? p : [p]).map(cleanSyllable).filter(Boolean))].slice(0, MAX_READINGS))
    .filter((r) => r.length > 0);
  const tokens = new Set();
  const initials = readings.map((r) => [...new Set(r.map(initialOf))]);
  for (let i = 0; i < readings.length; i += 1) {
    for (const a of readings[i]) tokens.add(`py${a}`);
    if (i + 1 < readings.length) {
      for (const a of readings[i]) {
        for (const b of readings[i + 1]) {
          tokens.add(`pb${a}${b}`);
          tokens.add(`pf${fuzzySyllable(a)}${fuzzySyllable(b)}`);
        }
      }
      for (const a of initials[i]) {
        for (const b of initials[i + 1]) {
          tokens.add(`pi${a}${b}`);
          if (i + 2 < readings.length) for (const c of initials[i + 2]) tokens.add(`pt${a}${b}${c}`);
        }
      }
    }
  }
  if (readings.length > 0) tokens.add(`pj${readings.map((r) => r[0]).join('')}`);
  return [...tokens];
}

/**
 * Initials input (T6 / G2): "sasr" (all initials) or "shenasr" (full syllables mixed with initials).
 * Returns up to two initial strings to try plus the full syllables (≥ 2 letters) the mixed reading contains.
 */
export function initialsReadings(input) {
  const chunk = String(input).toLowerCase().replace(/ü/g, 'v').replace(/\s+/g, '');
  if (!/^[a-z]{2,12}$/.test(chunk)) return [];
  const out = [{ initials: chunk, syllables: [] }];
  // Mixed: cover as many letters as possible with syllables of ≥ 2 letters; the rest are initials.
  const best = new Array(chunk.length + 1).fill(null);
  best[0] = { covered: 0, units: [] };
  for (let i = 0; i < chunk.length; i += 1) {
    if (!best[i]) continue;
    // A lone letter is an initial (covers nothing) unless it is itself a syllable (a / e / o).
    const options = [[chunk[i], PINYIN_SYLLABLES.has(chunk[i]) ? 1 : 0]];
    for (let len = 2; len <= MAX_SYLLABLE && i + len <= chunk.length; len += 1) {
      const syl = chunk.slice(i, i + len);
      if (PINYIN_SYLLABLES.has(syl)) options.push([syl, len]);
    }
    for (const [unit, covered] of options) {
      const next = { covered: best[i].covered + covered, units: [...best[i].units, unit] };
      const j = i + unit.length;
      if (
        !best[j] ||
        next.covered > best[j].covered ||
        (next.covered === best[j].covered && better(next.units, best[j].units))
      ) {
        best[j] = next;
      }
    }
  }
  const mixed = best[chunk.length];
  if (mixed && mixed.covered > 0) {
    const initials = mixed.units.map(initialOf).join('');
    if (initials !== chunk && initials.length >= 2) {
      out.push({ initials, syllables: mixed.units.filter((u) => u.length >= 2) });
    }
  }
  return out;
}

/** Pagefind terms for an initials string: overlapping triples (or the pair for two letters) + full syllables. */
export function initialsQueryTerm({ initials, syllables }) {
  const terms = [];
  if (initials.length === 2) terms.push(`pi${initials}`);
  for (let i = 0; i + 3 <= initials.length; i += 1) terms.push(`pt${initials.slice(i, i + 3)}`);
  for (const syl of syllables) terms.push(`py${syl}`);
  return [...new Set(terms)].join(' ');
}

/**
 * Query-time Pagefind searches for a pinyin query (all terms must match):
 *   exact  pb pairs (or py for a single syllable)
 *   fuzzy  pf pairs (模糊音), only when it differs from exact
 *   prefix pj<joined> for input typed without spaces (matches verses that start with it)
 */
export function pinyinQueryTerms(syllables, typedWithoutSpaces) {
  const syl = syllables.map(cleanSyllable).filter(Boolean);
  if (syl.length === 0) return { exact: null, fuzzy: null, prefix: null };
  if (syl.length === 1) {
    return { exact: `py${syl[0]}`, fuzzy: null, prefix: typedWithoutSpaces ? `pj${syl[0]}` : null };
  }
  const pairs = [];
  const fuzzyPairs = [];
  for (let i = 0; i + 1 < syl.length; i += 1) {
    pairs.push(`pb${syl[i]}${syl[i + 1]}`);
    fuzzyPairs.push(`pf${fuzzySyllable(syl[i])}${fuzzySyllable(syl[i + 1])}`);
  }
  const exact = [...new Set(pairs)].join(' ');
  const fuzzy = [...new Set(fuzzyPairs)].join(' ');
  return { exact, fuzzy: fuzzy === exact ? null : fuzzy, prefix: typedWithoutSpaces ? `pj${syl.join('')}` : null };
}
