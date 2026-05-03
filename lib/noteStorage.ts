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

    const existing = await getAllNotes();
    if (existing.length > 0) {
        localStorage.removeItem('bible-note-content');
        return null;
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

export function extractTitle(content: string): string {
    const firstLine = content.split('\n').find((line) => line.trim());
    return firstLine?.replace(/^#+\s*/, '').trim().slice(0, 30) || '无标题';
}
