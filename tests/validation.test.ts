import { describe, expect, it } from 'vitest';
import { isValidVerseId, validateIncrementBody, validateTrackUserBody, VERSE_ID_MAX_LENGTH } from '../lib/validation';

describe('isValidVerseId', () => {
  it.each(['43-3-16', '1-1-1', '19-23-1', '19-119-176', '66-22-21', '19-150-6'])('accepts %s', (id) => {
    expect(isValidVerseId(id)).toBe(true);
  });

  it.each([
    ['empty string', ''],
    ['path traversal', '../'],
    ['path traversal inside key', '../../etc/passwd'],
    ['two segments', '1-1'],
    ['four segments', '1-2-3-4'],
    ['redis glob', '*-*-*'],
    ['key separator injection', '1-2-3:favorites'],
    ['leading whitespace', ' 1-2-3'],
    ['trailing newline', '1-2-3\n'],
    ['negative number', '1--2-3'],
    ['letters', 'a-b-c'],
    ['unicode digits', '１-２-３'],
    ['book out of range (0)', '0-1-1'],
    ['book out of range (67)', '67-1-1'],
    ['chapter out of range (0)', '1-0-1'],
    ['chapter out of range (151)', '1-151-1'],
    ['verse out of range (0)', '1-1-0'],
    ['verse out of range (177)', '1-1-177'],
  ])('rejects %s', (_label, id) => {
    expect(isValidVerseId(id)).toBe(false);
  });

  it('rejects overlong strings, even if they look numeric', () => {
    expect(isValidVerseId('1'.repeat(VERSE_ID_MAX_LENGTH + 1))).toBe(false);
    expect(isValidVerseId(`1-1-${'1'.repeat(5000)}`)).toBe(false);
    expect(isValidVerseId('a'.repeat(10_000))).toBe(false);
    // 17 chars, matches the regex but is over the length bound
    expect(isValidVerseId('1-1-11111111111111')).toBe(false);
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['number', 43],
    ['boolean', true],
    ['array', ['43-3-16']],
    ['object', { id: '43-3-16' }],
    ['String object', new String('43-3-16')],
  ])('rejects non-string %s', (_label, value) => {
    expect(isValidVerseId(value)).toBe(false);
  });
});

describe('validateIncrementBody', () => {
  it('accepts a valid favorite', () => {
    expect(validateIncrementBody({ action: 'favorite', verseId: '43-3-16' })).toEqual({ ok: true, action: 'favorite', verseId: '43-3-16' });
  });

  it.each([
    ['null', null],
    ['array', []],
    ['string', 'favorite'],
    ['number', 1],
    ['missing everything', {}],
    ['missing verseId', { action: 'favorite' }],
    ['missing action', { verseId: '43-3-16' }],
    ['unsupported action click', { action: 'click', verseId: '43-3-16' }],
    ['action wrong type', { action: ['favorite'], verseId: '43-3-16' }],
    ['verseId empty', { action: 'favorite', verseId: '' }],
    ['verseId traversal', { action: 'favorite', verseId: '../' }],
    ['verseId 1-1', { action: 'favorite', verseId: '1-1' }],
    ['verseId number', { action: 'favorite', verseId: 43 }],
    ['verseId overlong', { action: 'favorite', verseId: '1-1-1'.padEnd(5000, '1') }],
  ])('rejects %s', (_label, body) => {
    expect(validateIncrementBody(body).ok).toBe(false);
  });
});

describe('validateTrackUserBody', () => {
  it('accepts an empty body or {}', () => {
    expect(validateTrackUserBody('')).toEqual({ ok: true });
    expect(validateTrackUserBody('  ')).toEqual({ ok: true });
    expect(validateTrackUserBody('{}')).toEqual({ ok: true });
  });

  it.each(['not json', '[]', 'null', '"x"', '{"verseId":"../"}', '{"verseId":"43-3-16"}', '{"a":1}'])('rejects %s', (raw) => {
    expect(validateTrackUserBody(raw).ok).toBe(false);
  });
});
