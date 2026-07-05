import { describe, expect, it } from 'vitest';
import { evaluateInitialRecall, getNextRecallHint } from '../lib/review/initialRecall';

describe('evaluateInitialRecall', () => {
  it('rejects full pinyin for Chinese recall', () => {
    const result = evaluateInitialRecall({
      text: '神爱世人，甚至将他的独生子赐给他们。',
      language: 'zh',
      input: 'shenaishirenshenzhi',
    });

    expect(result.isComplete).toBe(false);
    expect(result.isValidPrefix).toBe(false);
    expect(result.displayText).toBe('____，____________。');
  });

  it('does not accept Chinese characters as Chinese recall input', () => {
    const result = evaluateInitialRecall({
      text: '神爱世人。',
      language: 'zh',
      input: '神爱',
    });

    expect(result.isValidPrefix).toBe(false);
    expect(result.displayText).toBe('____。');
  });

  it('matches Chinese recall by pinyin initials', () => {
    const result = evaluateInitialRecall({
      text: '神爱世人。',
      language: 'zh',
      input: 'sasr',
    });

    expect(result.isComplete).toBe(true);
    expect(result.isValidPrefix).toBe(true);
    expect(result.displayText).toBe('神爱世人。');
  });

  it('matches English recall by first letters and ignores case', () => {
    const result = evaluateInitialRecall({
      text: 'For God so loved the world.',
      language: 'en',
      input: 'FGSLTW',
    });

    expect(result.isComplete).toBe(true);
    expect(result.isValidPrefix).toBe(true);
    expect(result.displayText).toBe('For God so loved the world.');
  });

  it('returns the next recall hint without changing validation rules', () => {
    expect(
      getNextRecallHint({
        text: '神爱世人。',
        language: 'zh',
        input: 'sa',
      })
    ).toBe('s');
  });
});
