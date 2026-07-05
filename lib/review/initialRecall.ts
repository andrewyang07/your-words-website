import { pinyin } from 'pinyin-pro';

export type RecallLanguage = 'zh' | 'en';

export interface InitialRecallInput {
  text: string;
  language: RecallLanguage;
  input: string;
}

export interface InitialRecallResult {
  displayText: string;
  isComplete: boolean;
  isValidPrefix: boolean;
  expectedInput: string;
  normalizedInput: string;
}

interface RecallUnit {
  text: string;
  token: string;
  initialToken?: string;
  recallable: boolean;
}

const chineseCharPattern = /[\p{Script=Han}A-Za-z0-9]/u;
const englishWordPattern = /[A-Za-z0-9]+/g;

export function evaluateInitialRecall({ text, language, input }: InitialRecallInput): InitialRecallResult {
  const units = language === 'en' ? buildEnglishUnits(text) : buildChineseUnits(text);
  const expectedInput = units.filter((unit) => unit.recallable).map((unit) => unit.token).join('');
  const expectedInitials = units.filter((unit) => unit.recallable).map((unit) => unit.initialToken ?? unit.token).join('');
  const normalizedInput = normalizeInput(input);
  const hasNonPinyinInput = input.trim().length > 0 && normalizedInput.length === 0;
  const inputMode = hasNonPinyinInput
    ? 'invalid'
    : expectedInput.startsWith(normalizedInput)
    ? 'full'
    : expectedInitials.startsWith(normalizedInput)
      ? 'initials'
      : 'invalid';
  const isValidPrefix = inputMode !== 'invalid';
  const visibleCount = isValidPrefix ? getVisibleCount(units, normalizedInput, inputMode) : 0;
  let seenRecallable = 0;

  const displayText = units.map((unit) => {
    if (!unit.recallable) return unit.text;
    seenRecallable += 1;
    return seenRecallable <= visibleCount ? unit.text : '_'.repeat(unit.text.length);
  }).join('');

  return {
    displayText,
    isComplete: isValidPrefix && visibleCount === units.filter((unit) => unit.recallable).length,
    isValidPrefix,
    expectedInput: inputMode === 'initials' ? expectedInitials : expectedInput,
    normalizedInput,
  };
}

export function getNextRecallHint(input: InitialRecallInput): string | null {
  const result = evaluateInitialRecall(input);
  if (!result.isValidPrefix || result.isComplete) return null;
  return result.expectedInput[result.normalizedInput.length] ?? null;
}

function normalizeInput(input: string): string {
  return Array.from(input.toLocaleLowerCase()).filter((char) => /[a-z0-9]/u.test(char)).join('');
}

function buildChineseUnits(text: string): RecallUnit[] {
  return Array.from(text).map((char) => {
    const recallable = chineseCharPattern.test(char);
    const token = recallable ? pinyin(char, { toneType: 'none', type: 'array' }).join('').toLocaleLowerCase() : '';

    return {
      text: char,
      token,
      initialToken: token[0],
      recallable,
    };
  });
}

function buildEnglishUnits(text: string): RecallUnit[] {
  const units: RecallUnit[] = [];
  let cursor = 0;

  for (const match of text.matchAll(englishWordPattern)) {
    const word = match[0];
    const index = match.index ?? 0;
    if (index > cursor) {
      units.push({ text: text.slice(cursor, index), token: '', recallable: false });
    }
    units.push({ text: word, token: word[0].toLocaleLowerCase(), recallable: true });
    cursor = index + word.length;
  }

  if (cursor < text.length) {
    units.push({ text: text.slice(cursor), token: '', recallable: false });
  }

  return units;
}

function getVisibleCount(units: RecallUnit[], input: string, mode: 'full' | 'initials'): number {
  let consumed = '';
  let visible = 0;

  for (const unit of units) {
    if (!unit.recallable) continue;
    const token = mode === 'initials' ? unit.initialToken ?? unit.token : unit.token;
    if (!input.startsWith(consumed + token)) break;
    consumed += token;
    visible += 1;
  }

  return visible;
}
