import { describe, expect, it } from 'vitest';
import {
  buildMemorizationSession,
  pressInitial,
  revealCurrentUnit,
  skipRecallStage,
  splitEditorialNotes,
} from '../lib/memorize/session';

describe('deep memorization session', () => {
  it('separates bracketed editorial notes from the memorized body', () => {
    expect(splitEditorialNotes('太初有道（有古卷作：话），道与神同在。【小字】')).toEqual({
      body: '太初有道，道与神同在。',
      notes: ['有古卷作：话', '小字'],
    });
  });

  it('creates deterministic nested masks while leaving punctuation visible', () => {
    const text = '耶和华是我的牧者，我必不致缺乏；他使我躺卧在青草地上。';
    const first = buildMemorizationSession(text, 'seed-42');
    const again = buildMemorizationSession(text, 'seed-42');
    const other = buildMemorizationSession(text, 'seed-43');

    expect(first.masks).toEqual(again.masks);
    expect(first.masks).not.toEqual(other.masks);
    expect([...first.masks.partial30].every((index) => first.masks.partial65.has(index))).toBe(true);
    expect(first.masks.partial30.size).toBe(Math.round(first.recallableCount * 0.3));
    expect(first.masks.partial65.size).toBe(Math.round(first.recallableCount * 0.65));
    expect(first.units.filter((unit) => !unit.recallable).map((unit) => unit.text).join('')).toBe('，；。');

    const hiddenRuns = first.units.reduce<number[]>((runs, unit, index) => {
      if (!unit.recallable || !first.masks.partial65.has(index)) return runs;
      const previousIsHidden = first.masks.partial65.has(index - 1);
      if (previousIsHidden) runs[runs.length - 1] += 1;
      else runs.push(1);
      return runs;
    }, []);
    expect(Math.max(...hiddenRuns)).toBeLessThanOrEqual(4);

    const clauseRanges = [[0, 7], [8, 14], [15, first.units.length - 1]];
    for (const [start, end] of clauseRanges) {
      expect([...first.masks.partial65].some((index) => index >= start && index <= end)).toBe(true);
    }
  });

  it('keeps a long CUV verse readable without pathological hidden runs', () => {
    const text = '爱是恒久忍耐，又有恩慈；爱是不嫉妒；爱是不自夸，不张狂，不做害羞的事，不求自己的益处，不轻易发怒，不计算人的恶。';
    const session = buildMemorizationSession(text, 'long-cuv');
    let run = 0;
    let longest = 0;
    session.units.forEach((unit, index) => {
      run = unit.recallable && session.masks.partial65.has(index) ? run + 1 : 0;
      longest = Math.max(longest, run);
    });
    expect(longest).toBeLessThanOrEqual(4);
  });

  it('skips punctuation, whitespace, digits and latin text during recall', () => {
    const session = buildMemorizationSession('你 好，2026 A年。', 'skip');
    expect(session.units.filter((unit) => unit.recallable).map((unit) => unit.text)).toEqual(['你', '好', '年']);
  });

  it('advances exactly one character, preserves cursor on errors, and supports reveal and skip', () => {
    const session = buildMemorizationSession('因为神爱世人', 'recall', [
      ['y'], ['w'], ['s'], ['a'], ['s'], ['r'],
    ]);

    const wrong = pressInitial(session.recall, session.units, 'x');
    expect(wrong).toMatchObject({ cursor: 0, lastAttempt: 'wrong', complete: false });

    const correct = pressInitial(wrong, session.units, 'Y');
    expect(correct).toMatchObject({ cursor: 1, lastAttempt: 'correct', complete: false });

    const revealed = revealCurrentUnit(correct, session.units);
    expect(revealed).toMatchObject({ cursor: 2, lastAttempt: 'revealed' });
    expect(skipRecallStage(revealed)).toMatchObject({ complete: true, skipped: true });
  });

  it('completes when the final recallable character is entered', () => {
    const session = buildMemorizationSession('神。', 'done', [['s']]);
    expect(pressInitial(session.recall, session.units, 's')).toMatchObject({ cursor: 1, complete: true });
  });
});
