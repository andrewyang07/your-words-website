'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { getAllNotes, deleteNote, createNote } from '@/lib/noteStorage';

interface NoteSummary {
    id: string;
    title: string;
    updatedAt: number;
}

interface NoteListProps {
    isOpen: boolean;
    onClose: () => void;
    currentNoteId: string | null;
    onSelectNote: (id: string) => void;
    onNewNote: () => void;
}

function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    return `${days}天前`;
}

export default function NoteList({ isOpen, onClose, currentNoteId, onSelectNote, onNewNote }: NoteListProps) {
    const [notes, setNotes] = useState<NoteSummary[]>([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const loadNotes = useCallback(async () => {
        const all = await getAllNotes();
        setNotes(all);
    }, []);

    useEffect(() => {
        if (isOpen) loadNotes();
    }, [isOpen, loadNotes]);

    const handleDelete = async (id: string) => {
        setConfirmDeleteId(null);
        await deleteNote(id);
        const updated = await getAllNotes();
        setNotes(updated);

        if (id === currentNoteId) {
            if (updated.length > 0) {
                onSelectNote(updated[0].id);
            } else {
                onNewNote();
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[10000] bg-black/50 dark:bg-black/70"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 z-[10001] flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-gray-800"
                    >
                        {/* 头部 */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-bible-200 dark:border-gray-700">
                            <h3 className="font-semibold text-bible-800 dark:text-bible-200 font-chinese">我的笔记</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onNewNote}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bible-500 hover:bg-bible-600 text-white text-sm font-chinese transition-colors"
                                    aria-label="新建笔记"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    新建
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors"
                                    aria-label="关闭笔记列表"
                                >
                                    <X className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                                </button>
                            </div>
                        </div>

                        {/* 列表 */}
                        <div className="flex-1 overflow-y-auto py-2">
                            {notes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                                    <FileText className="w-10 h-10 text-bible-300 dark:text-gray-600" />
                                    <p className="text-sm text-bible-500 dark:text-gray-400 font-chinese">
                                        还没有笔记，点击新建开始
                                    </p>
                                </div>
                            ) : (
                                notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className={`group flex items-start gap-2 px-4 py-3 cursor-pointer transition-colors ${
                                            note.id === currentNoteId
                                                ? 'bg-bible-100 dark:bg-gray-700'
                                                : 'hover:bg-bible-50 dark:hover:bg-gray-700/50'
                                        }`}
                                        onClick={() => { onSelectNote(note.id); onClose(); }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-chinese text-bible-800 dark:text-bible-200 line-clamp-2 leading-snug">
                                                {note.title}
                                            </p>
                                            <p className="text-xs text-bible-400 dark:text-gray-500 font-chinese mt-0.5">
                                                {relativeTime(note.updatedAt)}
                                            </p>
                                        </div>
                                        {confirmDeleteId === note.id ? (
                                            <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); void handleDelete(note.id); }}
                                                    className="px-2 py-0.5 rounded text-xs font-chinese bg-red-500 hover:bg-red-600 text-white transition-colors"
                                                >
                                                    刪除
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                                    className="px-2 py-0.5 rounded text-xs font-chinese bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex-shrink-0 mt-0.5"
                                                aria-label="删除笔记"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
