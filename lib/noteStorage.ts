export interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: number;
    updatedAt: number;
}

const DB_NAME = 'your-words-notes';
const STORE_NAME = 'notes';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

export async function getAllNotes(): Promise<Pick<Note, 'id' | 'title' | 'updatedAt'>[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
            const notes: Note[] = req.result;
            const summaries = notes
                .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }))
                .sort((a, b) => b.updatedAt - a.updatedAt);
            resolve(summaries);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function getNote(id: string): Promise<Note | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

export async function saveNote(note: Note): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(note);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
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
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function migrateFromLocalStorage(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    const content = localStorage.getItem('bible-note-content');
    if (!content) return null;

    // Check if already migrated by seeing if we have notes
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
    const firstLine = content.split('\n').find((l) => l.trim());
    return firstLine?.replace(/^#+\s*/, '').trim().slice(0, 30) || '无标题';
}
