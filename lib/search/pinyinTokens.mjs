// Shared by scripts/build-pagefind-index.mjs (index time) and lib/search/pagefindClient.ts (query time) so both
// produce identical pinyin tokens (spec search-phase1 T5 / G1). Plain JS so the Node build script can import it.
//
// Pinyin lives in its own token namespace, never mixed with English words:
//   py<syl>            one syllable                    (神 → pyshen)
//   pb<syl><syl>       adjacent syllable pair          (神爱 → pbshenai)
//   pf<fz><fz>         adjacent pair, 模糊音-normalized (神爱 → pfsenai; sen ai → pfsenai)
//   pj<joined>         whole verse joined, prefix-searchable (神爱世人… → pjshenaishiren…)
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

/** Index tokens for a list of syllables (one verse or book name). */
export function pinyinIndexTokens(syllables) {
  const syl = syllables.map(cleanSyllable).filter(Boolean);
  const tokens = new Set();
  for (let i = 0; i < syl.length; i += 1) {
    tokens.add(`py${syl[i]}`);
    if (i + 1 < syl.length) {
      tokens.add(`pb${syl[i]}${syl[i + 1]}`);
      tokens.add(`pf${fuzzySyllable(syl[i])}${fuzzySyllable(syl[i + 1])}`);
    }
  }
  if (syl.length > 0) tokens.add(`pj${syl.join('')}`);
  return [...tokens];
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
