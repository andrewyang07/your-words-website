import { describe, expect, it } from 'vitest';
import { evaluateInitialRecall, getNextRecallHint } from '../lib/review/initialRecall';

describe('evaluateInitialRecall', () => {
  it('matches Chinese recall by visible characters while ignoring punctuation', () => {
    const result = evaluateInitialRecall({
      text: '神爱世人，甚至将他的独生子赐给他们。',
      language: 'zh',
      input: '神爱世人甚至',
    });

    expect(result.isComplete).toBe(false);
    expect(result.isValidPrefix).toBe(true);
    expect(result.displayText).toBe('神爱世人，甚至__________。');
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
        text: 'For God so loved the world.',
        language: 'en',
        input: 'fg',
      })
    ).toBe('s');
  });
});
