import { describe, expect, it } from 'vitest';
import { buildContextualInitials } from '../lib/memorize/contextualInitials';

describe('contextual pinyin initials', () => {
  it('computes primary readings from the complete phrase', () => {
    expect(buildContextualInitials('银行长老重复').map((initials) => initials[0])).toEqual([
      'y', 'h', 'z', 'l', 'c', 'f',
    ]);
  });

  it('accepts reasonable alternate initials for polyphonic characters', () => {
    const initials = buildContextualInitials('长');
    expect(initials[0]).toEqual(expect.arrayContaining(['c', 'z']));
  });

  it('returns initials only for Han characters', () => {
    expect(buildContextualInitials('神，2026 A爱')).toEqual([['s'], ['a']]);
  });

  it('fails safely with one empty accepted set per Han Recall Unit', () => {
    expect(buildContextualInitials('神，2026 A爱', () => {
      throw new Error('reading data unavailable');
    })).toEqual([[], []]);
  });
});
