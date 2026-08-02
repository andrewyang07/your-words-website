export interface VerseCharacter {
  text: string;
  recallable: boolean;
  acceptedInitials: string[];
}

export interface RecallState {
  cursor: number;
  complete: boolean;
  skipped: boolean;
  lastAttempt: 'idle' | 'correct' | 'wrong' | 'revealed';
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
  recall: RecallState;
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
    return { text: char, recallable, acceptedInitials: initials };
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
    recall: { cursor: 0, complete: recallableIndices.length === 0, skipped: false, lastAttempt: 'idle' },
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

export function pressInitial(state: RecallState, units: VerseCharacter[], input: RecallKeyboardInput): RecallState {
  if (state.complete) return state;
  const current = recallableUnits(units)[state.cursor];
  const offeredInitials = input.kind === 'single' ? [input.initial] : input.initials;
  if (!current || !offeredInitials.some((initial) => current.acceptedInitials.includes(initial))) {
    return { ...state, lastAttempt: 'wrong' };
  }

  const cursor = state.cursor + 1;
  return {
    ...state,
    cursor,
    complete: cursor >= recallableUnits(units).length,
    lastAttempt: 'correct',
  };
}

function normalizeInitial(initial: string): string | null {
  const normalized = initial.toLocaleLowerCase();
  return /^[a-z]$/u.test(normalized) ? normalized : null;
}

export function revealCurrentUnit(state: RecallState, units: VerseCharacter[]): RecallState {
  if (state.complete) return state;
  const cursor = Math.min(state.cursor + 1, recallableUnits(units).length);
  return { ...state, cursor, complete: cursor >= recallableUnits(units).length, lastAttempt: 'revealed' };
}

export function skipRecallStage(state: RecallState): RecallState {
  return { ...state, complete: true, skipped: true, lastAttempt: 'idle' };
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
