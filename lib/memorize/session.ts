export interface VerseCharacter {
  text: string;
  recallable: boolean;
  acceptedInitials: string[];
  acceptedZhuyin: string[];
}

export interface AcceptedPhonetics {
  pinyin: string[];
  zhuyin: string[];
}

export interface RecallState {
  cursor: number;
  complete: boolean;
  skipped: boolean;
  lastAttempt: 'idle' | 'correct' | 'wrong' | 'revealed';
  consecutiveWrongAttempts: number;
  wrongAttempts: number;
  assistanceCount: number;
  hintVisible: boolean;
}

export type RecallKeyboardInput =
  | { kind: 'single'; initial: string }
  | { kind: 'group'; initials: readonly string[] };

export interface MemorizationSession {
  seed: string;
  body: string;
  notes: string[];
  units: VerseCharacter[];
  recallableCount: number;
  masks: {
    partial30: Set<number>;
    partial65: Set<number>;
  };
  maskRecall: {
    partial30: RecallState;
    partial65: RecallState;
  };
  recall: RecallState;
  skippedStages: Set<MemorizationStageNumber>;
}

export type MemorizationStageNumber = 0 | 1 | 2 | 3;

export type StageCompletionFacts =
  | { outcome: 'incomplete'; assistanceCount: number }
  | { outcome: 'independent'; assistanceCount: 0 }
  | { outcome: 'assisted' | 'skipped'; assistanceCount: number };

export interface RoundCompletionFacts {
  assistanceCount: number;
  skippedStageCount: number;
}

const hanPattern = /\p{Script=Han}/u;
const notePattern = /（([^（）]*)）|\(([^()]*)\)|【([^【】]*)】|\[([^\[\]]*)\]/gu;

export function splitEditorialNotes(text: string): { body: string; notes: string[] } {
  const notes: string[] = [];
  const body = text.replace(notePattern, (_match, ...groups: Array<string | number>) => {
    const note = groups.slice(0, 4).find((group) => typeof group === 'string' && group.length > 0);
    if (typeof note === 'string') notes.push(note.trim());
    return '';
  });

  return { body: body.replace(/\s+([，。；：！？])/gu, '$1').trim(), notes };
}

export function buildMemorizationSession(
  text: string,
  seed: string,
  acceptedInitials: string[][] = []
): MemorizationSession {
  const { body, notes } = splitEditorialNotes(text);
  let recallIndex = 0;
  const units = Array.from(body).map((char): VerseCharacter => {
    const recallable = hanPattern.test(char);
    const initials = recallable ? acceptedInitials[recallIndex++] ?? [] : [];
    return { text: char, recallable, acceptedInitials: initials, acceptedZhuyin: [] };
  });
  const recallableIndices = units.flatMap((unit, index) => unit.recallable ? [index] : []);
  const partial65 = chooseSpreadMask(units, recallableIndices, Math.round(recallableIndices.length * 0.65), `${seed}:65`);
  const partial30 = chooseSpreadMask(units, [...partial65], Math.round(recallableIndices.length * 0.3), `${seed}:30`);

  return {
    seed,
    body,
    notes,
    units,
    recallableCount: recallableIndices.length,
    masks: { partial30, partial65 },
    maskRecall: {
      partial30: initialRecallState(partial30.size),
      partial65: initialRecallState(partial65.size),
    },
    recall: initialRecallState(recallableIndices.length),
    skippedStages: new Set(),
  };
}

export function withAcceptedInitials(
  session: MemorizationSession,
  acceptedInitials: string[][],
): MemorizationSession {
  let recallIndex = 0;
  return {
    ...session,
    units: session.units.map((unit) => unit.recallable
      ? { ...unit, acceptedInitials: acceptedInitials[recallIndex++] ?? [] }
      : unit),
  };
}

export function withAcceptedPhonetics(
  session: MemorizationSession,
  accepted: AcceptedPhonetics[],
): MemorizationSession {
  let recallIndex = 0;
  return {
    ...session,
    units: session.units.map((unit) => {
      if (!unit.recallable) return unit;
      const phonetics = accepted[recallIndex++] ?? { pinyin: [], zhuyin: [] };
      return { ...unit, acceptedInitials: phonetics.pinyin, acceptedZhuyin: phonetics.zhuyin };
    }),
  };
}

export function singleInitialInput(initial: string): RecallKeyboardInput {
  const normalized = normalizeInitial(initial);
  if (!normalized) throw new Error('Single recall input must be one A-Z letter');
  return { kind: 'single', initial: normalized };
}

export function groupedInitialsInput(initials: string): RecallKeyboardInput {
  const normalized = Array.from(initials).map(normalizeInitial);
  if (normalized.length < 2 || normalized.some((initial) => !initial)) {
    throw new Error('Grouped recall input must contain at least two A-Z letters');
  }
  return { kind: 'group', initials: normalized as string[] };
}

export function singleZhuyinInput(symbol: string): RecallKeyboardInput {
  if (!/^[ㄅ-ㄩ]$/u.test(symbol)) throw new Error('Single Zhuyin recall input must be one Bopomofo symbol');
  return { kind: 'single', initial: symbol };
}

export function pressInitial(state: RecallState, units: VerseCharacter[], input: RecallKeyboardInput): RecallState {
  return pressInitialAgainstUnits(state, recallableUnits(units), input);
}

export function pressMaskedInitial(
  state: RecallState,
  units: VerseCharacter[],
  maskedIndices: Set<number>,
  input: RecallKeyboardInput,
): RecallState {
  const maskedUnits = orderedMaskIndices(maskedIndices)
    .map((index) => units[index])
    .filter((unit): unit is VerseCharacter => Boolean(unit?.recallable));
  return pressInitialAgainstUnits(state, maskedUnits, input);
}

export function orderedMaskIndices(mask: Set<number>): number[] {
  return [...mask].sort((left, right) => left - right);
}

export function currentAcceptedInitials(
  state: RecallState,
  units: VerseCharacter[],
  maskedIndices?: Set<number>,
): string[] {
  const candidates = maskedIndices
    ? orderedMaskIndices(maskedIndices).map((index) => units[index]).filter((unit): unit is VerseCharacter => Boolean(unit?.recallable))
    : recallableUnits(units);
  return candidates[state.cursor]?.acceptedInitials ?? [];
}

export function currentAcceptedZhuyin(
  state: RecallState,
  units: VerseCharacter[],
  maskedIndices?: Set<number>,
): string[] {
  const candidates = maskedIndices
    ? orderedMaskIndices(maskedIndices).map((index) => units[index]).filter((unit): unit is VerseCharacter => Boolean(unit?.recallable))
    : recallableUnits(units);
  return candidates[state.cursor]?.acceptedZhuyin ?? [];
}

function pressInitialAgainstUnits(state: RecallState, units: VerseCharacter[], input: RecallKeyboardInput): RecallState {
  if (state.complete) return state;
  const current = units[state.cursor];
  const offeredInitials = input.kind === 'single' ? [input.initial] : input.initials;
  if (!current || !offeredInitials.some((initial) => current.acceptedInitials.includes(initial) || current.acceptedZhuyin.includes(initial))) {
    const consecutiveWrongAttempts = state.consecutiveWrongAttempts + 1;
    const canOfferHint = Boolean(current && (current.acceptedInitials.length > 0 || current.acceptedZhuyin.length > 0));
    return {
      ...state,
      lastAttempt: 'wrong',
      consecutiveWrongAttempts,
      wrongAttempts: state.wrongAttempts + 1,
      hintVisible: canOfferHint && consecutiveWrongAttempts >= 2,
      assistanceCount: state.assistanceCount + (canOfferHint && consecutiveWrongAttempts === 2 ? 1 : 0),
    };
  }

  const cursor = state.cursor + 1;
  return {
    ...state,
    cursor,
    complete: cursor >= units.length,
    lastAttempt: 'correct',
    consecutiveWrongAttempts: 0,
    hintVisible: false,
  };
}

function initialRecallState(unitCount: number): RecallState {
  return {
    cursor: 0,
    complete: unitCount === 0,
    skipped: false,
    lastAttempt: 'idle',
    consecutiveWrongAttempts: 0,
    wrongAttempts: 0,
    assistanceCount: 0,
    hintVisible: false,
  };
}

function normalizeInitial(initial: string): string | null {
  const normalized = initial.toLocaleLowerCase();
  return /^[a-z]$/u.test(normalized) ? normalized : null;
}

export function revealCurrentUnit(state: RecallState, units: VerseCharacter[]): RecallState {
  return revealAgainstUnitCount(state, recallableUnits(units).length);
}

export function revealMaskedCurrentUnit(
  state: RecallState,
  units: VerseCharacter[],
  maskedIndices: Set<number>,
): RecallState {
  const unitCount = orderedMaskIndices(maskedIndices)
    .filter((index) => units[index]?.recallable)
    .length;
  return revealAgainstUnitCount(state, unitCount);
}

function revealAgainstUnitCount(state: RecallState, unitCount: number): RecallState {
  if (state.complete) return state;
  const cursor = Math.min(state.cursor + 1, unitCount);
  return {
    ...state,
    cursor,
    complete: cursor >= unitCount,
    lastAttempt: 'revealed',
    consecutiveWrongAttempts: 0,
    hintVisible: false,
    assistanceCount: state.assistanceCount + 1,
  };
}

export function skipRecallStage(state: RecallState): RecallState {
  return { ...state, complete: true, skipped: true, lastAttempt: 'idle' };
}

export function skipMemorizationStage(
  session: MemorizationSession,
  stage: MemorizationStageNumber,
): MemorizationSession {
  const skippedStages = new Set(session.skippedStages).add(stage);
  if (stage === 3) {
    return { ...session, skippedStages, recall: skipRecallStage(session.recall) };
  }
  return { ...session, skippedStages };
}

export function completionFactsForStage(
  session: MemorizationSession,
  stage: MemorizationStageNumber,
): StageCompletionFacts {
  const recall = recallStateForStage(session, stage);
  const assistanceCount = recall?.assistanceCount ?? 0;
  if (session.skippedStages.has(stage)) return { outcome: 'skipped', assistanceCount };
  if (!recall?.complete) return { outcome: 'incomplete', assistanceCount };
  return assistanceCount > 0
    ? { outcome: 'assisted', assistanceCount }
    : { outcome: 'independent', assistanceCount: 0 };
}

export function completionFactsForRound(session: MemorizationSession): RoundCompletionFacts {
  return {
    assistanceCount:
      session.maskRecall.partial30.assistanceCount
      + session.maskRecall.partial65.assistanceCount
      + session.recall.assistanceCount,
    skippedStageCount: session.skippedStages.size,
  };
}

function recallStateForStage(session: MemorizationSession, stage: MemorizationStageNumber): RecallState | null {
  if (stage === 1) return session.maskRecall.partial30;
  if (stage === 2) return session.maskRecall.partial65;
  if (stage === 3) return session.recall;
  return null;
}

function recallableUnits(units: VerseCharacter[]) {
  return units.filter((unit) => unit.recallable);
}

function chooseSpreadMask(units: VerseCharacter[], candidates: number[], count: number, seed: string): Set<number> {
  if (count <= 0) return new Set();
  const random = seededRandom(seed);
  const shuffled = shuffle(candidates, random);
  const selected = new Set<number>();

  const clauses = candidateClauses(units, new Set(candidates))
    .sort((left, right) => right.length - left.length);
  for (const clause of clauses) {
    if (selected.size >= count) break;
    const available = shuffle(clause, random);
    const choice = available.find((index) => {
      selected.add(index);
      const acceptable = longestRun(units, selected) <= 4;
      selected.delete(index);
      return acceptable;
    });
    if (choice !== undefined) selected.add(choice);
  }

  for (const index of shuffled) {
    if (selected.size >= count) break;
    selected.add(index);
    if (longestRun(units, selected) > 4) selected.delete(index);
  }
  for (const index of shuffled) {
    if (selected.size >= count) break;
    selected.add(index);
  }
  return selected;
}

function candidateClauses(units: VerseCharacter[], candidates: Set<number>): number[][] {
  const clauses: number[][] = [];
  let clause: number[] = [];
  units.forEach((unit, index) => {
    if (unit.recallable) {
      if (candidates.has(index)) clause.push(index);
      return;
    }
    if (clause.length > 0) clauses.push(clause);
    clause = [];
  });
  if (clause.length > 0) clauses.push(clause);
  return clauses;
}

function shuffle(values: number[], random: () => number): number[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function longestRun(units: VerseCharacter[], selected: Set<number>): number {
  let current = 0;
  let longest = 0;
  units.forEach((unit, index) => {
    current = unit.recallable && selected.has(index) ? current + 1 : 0;
    longest = Math.max(longest, current);
  });
  return longest;
}

function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
