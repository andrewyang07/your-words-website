import { describe, expect, it } from 'vitest';
import { dropStopTerms } from '../lib/search/pagefindClient';
import { pinyinIndexTokens, pinyinQueryTerms, segmentPinyin } from '../lib/search/pinyinTokens.mjs';
import { splitLeadingReference } from '../lib/search/runClientSearch';

describe('pinyin tokens (T5 / G1)', () => {
  it('segments spaced and unspaced pinyin, rejects English', () => {
    expect(segmentPinyin('shenaishiren')).toEqual(['shen', 'ai', 'shi', 'ren']);
    expect(segmentPinyin('shen ai si ren')).toEqual(['shen', 'ai', 'si', 'ren']);
    expect(segmentPinyin('yi wu gua lü')).toEqual(['yi', 'wu', 'gua', 'lv']);
    expect(segmentPinyin('xian')).toEqual(['xian']);
    expect(segmentPinyin('love is patient')).toBeNull();
    expect(segmentPinyin('God so loved')).toBeNull();
  });

  it('index and query use the same prefixed namespace (never a bare English word)', () => {
    const index = pinyinIndexTokens(['shen', 'ai', 'shi', 'ren']);
    expect(index).toEqual(expect.arrayContaining(['pyshen', 'pbshenai', 'pfsenai', 'pjshenaishiren']));
    expect(index.every((t) => /^p[ybfjit]/.test(t))).toBe(true);
    const q = pinyinQueryTerms(['sen', 'ai', 'si', 'ren'], false);
    for (const term of q.fuzzy!.split(' ')) expect(index).toContain(term);
    expect(pinyinQueryTerms(['shen', 'ai', 'shi', 'ren'], true).prefix).toBe('pjshenaishiren');
  });
});

describe('heavy stop terms', () => {
  it('drops 的 / the from the word sub-search only when something remains', () => {
    expect(dropStopTerms('的')).toBeNull();
    expect(dropStopTerms('的人')).toBe('人');
    expect(dropStopTerms('the')).toBeNull();
    expect(dropStopTerms('the lord is my shepherd')).toBe('lord is my shepherd');
    expect(dropStopTerms('神爱世人')).toBe('神爱世人');
  });
});

describe('leading verse reference + extra text', () => {
  it.each([
    ['John 3:16 meaning', 'John 3:16', 'meaning'],
    ['约3:16 神爱世人', '约3:16', '神爱世人'],
    ['约翰福音3:16和合本', '约翰福音3:16', '和合本'],
    ['Rom 8:28-30 all things', 'Rom 8:28-30', 'all things'],
  ])('%s', (q, reference, rest) => {
    expect(splitLeadingReference(q)).toEqual({ reference, rest });
  });

  it('plain references and text are not split', () => {
    expect(splitLeadingReference('John 3:16')).toBeNull();
    expect(splitLeadingReference('约3:16-18')).toBeNull();
    expect(splitLeadingReference('神爱世人')).toBeNull();
  });
});

describe('T6: initials and 多音字', () => {
  it('reads initials-only and mixed input', async () => {
    const { initialsReadings, initialsQueryTerm } = await import('../lib/search/pinyinTokens.mjs');
    expect(initialsReadings('sasr').map(initialsQueryTerm)).toContain('ptsas ptasr');
    expect(initialsReadings('shenasr').map(initialsQueryTerm)).toContain('ptsas ptasr pyshen');
    expect(initialsReadings('a')).toEqual([]);
    for (const two of ['ys', 'jn', 'ps']) expect(initialsReadings(two)).toEqual([]);
    expect(initialsReadings('ysj').length).toBeGreaterThan(0);
    expect(initialsReadings('love is')).toEqual(initialsReadings('loveis'));
  });

  it('indexes every reading of a 多音字 and initials pairs / triples', async () => {
    const { pinyinIndexTokens } = await import('../lib/search/pinyinTokens.mjs');
    const tokens = pinyinIndexTokens([['xing', 'hang'], ['shan']]);
    expect(tokens).toEqual(expect.arrayContaining(['pyxing', 'pyhang', 'pbxingshan', 'pbhangshan', 'pixs', 'pihs']));
    expect(tokens).toContain('pjxingshan');
    expect(tokens).not.toContain('pjhangshan');
    expect(pinyinIndexTokens(['shen', 'ai', 'shi', 'ren'])).toEqual(expect.arrayContaining(['ptsas', 'ptasr']));
  });
});

describe('whole-word pinyin pairs (pw)', () => {
  it('indexes a reading pair only when both characters are in one word', () => {
    // 在|世人|中|升高: 中升 spans two words, 升高 is one word.
    const tokens = pinyinIndexTokens(['zai', 'shi', 'ren', 'zhong', 'sheng', 'gao'], [0, 1, 1, 2, 3, 3]);
    expect(tokens).toContain('pwshiren');
    expect(tokens).toContain('pwshenggao');
    expect(tokens).not.toContain('pwzhongsheng');
    expect(tokens).toContain('pbzhongsheng');
  });
  it('covers every reading of a 多音字 word (重生 → chong / zhong)', () => {
    expect(pinyinIndexTokens([['chong', 'zhong'], 'sheng'], [0, 0])).toEqual(
      expect.arrayContaining(['pwchongsheng', 'pwzhongsheng']),
    );
  });
  it('query: two syllables also search the word pair', () => {
    expect(pinyinQueryTerms(['zhong', 'sheng'], false).word).toBe('pwzhongsheng');
    expect(pinyinQueryTerms(['shen', 'ai', 'shi', 'ren'], false).word).toBeNull();
  });
});
