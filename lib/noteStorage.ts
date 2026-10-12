import Dexie, { type Table } from 'dexie';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

class BibleNotesDatabase extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('your-words-notes');
    this.version(2).stores({
      notes: 'id, title, createdAt, updatedAt',
    });
  }
}

const db = new BibleNotesDatabase();

export async function getAllNotes(): Promise<Pick<Note, 'id' | 'title' | 'updatedAt'>[]> {
  const notes = await db.notes.orderBy('updatedAt').reverse().toArray();
  return notes.map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
}

export async function getNote(id: string): Promise<Note | null> {
  return (await db.notes.get(id)) ?? null;
}

export async function saveNote(note: Note): Promise<void> {
  await db.notes.put(note);
}

export async function createNote(): Promise<Note> {
  const now = Date.now();
  const note: Note = {
    id: crypto.randomUUID(),
    title: '无标题',
    content: '',
    createdAt: now,
    updatedAt: now,
  };
  await saveNote(note);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

export async function migrateFromLocalStorage(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const content = localStorage.getItem('bible-note-content');
  if (!content) return null;

  const existingNotes = await db.notes.toArray();
  const duplicate = existingNotes.find((note) => note.content === content);
  if (duplicate) {
    localStorage.removeItem('bible-note-content');
    return duplicate.id;
  }

  const now = Date.now();
  const note: Note = {
    id: crypto.randomUUID(),
    title: extractTitle(content),
    content,
    createdAt: now,
    updatedAt: now,
  };
  await saveNote(note);
  localStorage.removeItem('bible-note-content');
  return note.id;
}

const UNTITLED = '无标题';

/** Decodes the HTML entities / backslash escapes MDXEditor writes into markdown (e.g. a trailing space → `&#x20;`). */
export function decodeMarkdownText(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\\([\\`*_{}\[\]()#+\-.!>~|])/g, '$1');
}

export function extractTitle(content: string): string {
  const firstLine = content.split('\n').find((line) => decodeMarkdownText(line).trim());
  if (!firstLine) return UNTITLED;
  const title = decodeMarkdownText(firstLine.replace(/^\s*#+\s*/, ''))
    .replace(/\*\*|__|~~/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(title).slice(0, 30).join('') || UNTITLED;
}

/** Title for display: cleans titles saved by older builds and localizes the untitled placeholder. */
export function displayNoteTitle(title: string, language: 'simplified' | 'traditional'): string {
  const cleaned = decodeMarkdownText(title).replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned === UNTITLED || cleaned === '無標題') return language === 'traditional' ? '無標題' : UNTITLED;
  return cleaned;
}
