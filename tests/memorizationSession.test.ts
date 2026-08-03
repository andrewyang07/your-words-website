import { describe, expect, it } from 'vitest';
import {
  buildMemorizationSession,
  completionFactsForRound,
  completionFactsForStage,
  groupedInitialsInput,
  pressInitial,
  revealMaskedCurrentUnit,
  revealCurrentUnit,
  skipMemorizationStage,
  skipRecallStage,
  singleInitialInput,
  singleZhuyinInput,
  splitEditorialNotes,
  withAcceptedInitials,
  withAcceptedPhonetics,
} from '../lib/memorize/session';

describe('deep memorization session', () => {
  it('separates bracketed editorial notes from the memorized body', () => {
    expect(splitEditorialNotes('太初有道（有古卷作：话），道与神同在。【小字】')).toEqual({
      body: '太初有道，道与神同在。',
      notes: ['有古卷作：话', '小字'],
    });
  });

  it('keeps editorial notes outside contextual Recall Unit alignment', () => {
    const session = buildMemorizationSession('神（小字）爱', 'note-initials', [['s'], ['a']]);
    expect(session.units.filter((unit) => unit.recallable)).toEqual([
      expect.objectContaining({ text: '神', acceptedInitials: ['s'] }),
      expect.objectContaining({ text: '爱', acceptedInitials: ['a'] }),
    ]);
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

    const wrong = pressInitial(session.recall, session.units, singleInitialInput('x'));
    expect(wrong).toMatchObject({ cursor: 0, lastAttempt: 'wrong', complete: false });

    const correct = pressInitial(wrong, session.units, singleInitialInput('Y'));
    expect(correct).toMatchObject({ cursor: 1, lastAttempt: 'correct', complete: false });

    const revealed = revealCurrentUnit(correct, session.units);
    expect(revealed).toMatchObject({ cursor: 2, lastAttempt: 'revealed' });
    expect(skipRecallStage(revealed)).toMatchObject({ complete: true, skipped: true });
  });

  it('offers a hint after two consecutive errors and resets the streak after advancing', () => {
    const session = buildMemorizationSession('神爱', 'hint', [['s'], ['a']]);

    const firstWrong = pressInitial(session.recall, session.units, singleInitialInput('x'));
    expect(firstWrong).toMatchObject({ cursor: 0, consecutiveWrongAttempts: 1, hintVisible: false, wrongAttempts: 1 });

    const secondWrong = pressInitial(firstWrong, session.units, singleInitialInput('y'));
    expect(secondWrong).toMatchObject({ cursor: 0, consecutiveWrongAttempts: 2, hintVisible: true, wrongAttempts: 2, assistanceCount: 1 });

    const repeatedWrong = pressInitial(secondWrong, session.units, singleInitialInput('z'));
    expect(repeatedWrong).toMatchObject({ consecutiveWrongAttempts: 3, assistanceCount: 1 });

    const correct = pressInitial(repeatedWrong, session.units, singleInitialInput('s'));
    expect(correct).toMatchObject({ cursor: 1, consecutiveWrongAttempts: 0, hintVisible: false, wrongAttempts: 3, assistanceCount: 1 });
  });

  it('reveals exactly one masked Recall Unit and records assistance', () => {
    const session = buildMemorizationSession('神爱世人', 'masked-reveal', [['s'], ['a'], ['s'], ['r']]);
    const mask = new Set([0, 2]);

    const revealed = revealMaskedCurrentUnit(session.maskRecall.partial30, session.units, mask);

    expect(revealed).toMatchObject({ cursor: 1, complete: false, lastAttempt: 'revealed', assistanceCount: 1 });
  });

  it('records skipped stages only in the transient session', () => {
    const session = buildMemorizationSession('神爱', 'skip-facts', [['s'], ['a']]);
    const afterRead = skipMemorizationStage(session, 0);
    const afterPartial = skipMemorizationStage(afterRead, 1);

    expect([...afterPartial.skippedStages]).toEqual([0, 1]);
    expect(afterPartial.maskRecall.partial30).toMatchObject({ complete: false, skipped: false });
    expect(session.skippedStages.size).toBe(0);
  });

  it('adds resolved readings without resetting current-round facts', () => {
    const session = skipMemorizationStage(buildMemorizationSession('神爱', 'hydrate'), 0);
    const hydrated = withAcceptedInitials(session, [['s'], ['a']]);

    expect([...hydrated.skippedStages]).toEqual([0]);
    expect(hydrated.units.filter((unit) => unit.recallable).map((unit) => unit.acceptedInitials)).toEqual([['s'], ['a']]);
  });

  it('keeps unresolved readings escapable without claiming a key hint', () => {
    const session = buildMemorizationSession('神', 'unresolved');
    const once = pressInitial(session.recall, session.units, singleInitialInput('x'));
    const twice = pressInitial(once, session.units, singleInitialInput('y'));

    expect(twice).toMatchObject({ cursor: 0, hintVisible: false, assistanceCount: 0 });
    expect(revealCurrentUnit(twice, session.units)).toMatchObject({ complete: true, assistanceCount: 1 });
    expect(skipRecallStage(twice)).toMatchObject({ complete: true, skipped: true });
  });

  it('reports independent, assisted, and skipped stage completion from transient facts', () => {
    const initial = buildMemorizationSession('神', 'completion-facts', [['s']]);
    const independent = {
      ...initial,
      maskRecall: {
        ...initial.maskRecall,
        partial30: { ...initial.maskRecall.partial30, complete: true },
      },
    };
    expect(completionFactsForStage(independent, 1)).toEqual({ outcome: 'independent', assistanceCount: 0 });

    const assisted = {
      ...independent,
      maskRecall: {
        ...independent.maskRecall,
        partial30: { ...independent.maskRecall.partial30, assistanceCount: 2 },
      },
    };
    expect(completionFactsForStage(assisted, 1)).toEqual({ outcome: 'assisted', assistanceCount: 2 });
    expect(completionFactsForStage(skipMemorizationStage(assisted, 1), 1)).toEqual({ outcome: 'skipped', assistanceCount: 2 });
  });

  it('summarizes only current-round assistance and skipped stages', () => {
    const initial = buildMemorizationSession('神爱', 'round-facts', [['s'], ['a']]);
    const session = skipMemorizationStage({
      ...initial,
      maskRecall: {
        partial30: { ...initial.maskRecall.partial30, assistanceCount: 1 },
        partial65: { ...initial.maskRecall.partial65, assistanceCount: 2 },
      },
      recall: { ...initial.recall, assistanceCount: 1 },
    }, 0);

    expect(completionFactsForRound(session)).toEqual({ assistanceCount: 4, skippedStageCount: 1 });
    expect(completionFactsForRound(initial)).toEqual({ assistanceCount: 0, skippedStageCount: 0 });
  });

  it('completes when the final recallable character is entered', () => {
    const session = buildMemorizationSession('神。', 'done', [['s']]);
    expect(pressInitial(session.recall, session.units, singleInitialInput('s'))).toMatchObject({ cursor: 1, complete: true });
  });

  it('accepts a T9 letter group when it contains the expected initial', () => {
    const session = buildMemorizationSession('神', 't9', [['s']]);
    expect(pressInitial(session.recall, session.units, groupedInitialsInput('PQRS'))).toMatchObject({ cursor: 1, complete: true });
  });

  it('accepts one Zhuyin first symbol without changing pinyin behavior', () => {
    const session = withAcceptedPhonetics(buildMemorizationSession('神愛', 'zhuyin'), [
      { pinyin: ['s'], zhuyin: ['ㄕ'] },
      { pinyin: ['a'], zhuyin: ['ㄞ'] },
    ]);

    const first = pressInitial(session.recall, session.units, singleZhuyinInput('ㄕ'));
    expect(first).toMatchObject({ cursor: 1, lastAttempt: 'correct' });
    expect(pressInitial(first, session.units, singleInitialInput('a'))).toMatchObject({ cursor: 2, complete: true });
  });

  it('offers Zhuyin alternatives as the same current-unit hint', () => {
    const session = withAcceptedPhonetics(buildMemorizationSession('圾', 'zhuyin-variants'), [
      { pinyin: ['j'], zhuyin: ['ㄐ', 'ㄙ'] },
    ]);

    const twiceWrong = pressInitial(
      pressInitial(session.recall, session.units, singleZhuyinInput('ㄅ')),
      session.units,
      singleZhuyinInput('ㄆ'),
    );
    expect(twiceWrong).toMatchObject({ cursor: 0, hintVisible: true, assistanceCount: 1 });
  });

  it('rejects malformed keyboard inputs before they reach recall state', () => {
    expect(() => singleInitialInput('S!')).toThrow();
    expect(() => groupedInitialsInput('S!')).toThrow();
    expect(() => groupedInitialsInput('S')).toThrow();
    expect(() => singleZhuyinInput('ㄕㄞ')).toThrow();
    expect(() => singleZhuyinInput('S')).toThrow();
  });
});
