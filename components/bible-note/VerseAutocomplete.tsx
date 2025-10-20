'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface VerseSuggestion {
    display: string; // 显示文本，例如 "马太福音 5:1"
    insert: string; // 插入文本，例如 "太5:1"
    book: string;
    chapter: number;
    verse: number;
}

interface VerseAutocompleteProps {
    suggestions: VerseSuggestion[];
    onSelect: (suggestion: VerseSuggestion) => void;
    position: { top: number; left: number };
    selectedIndex: number;
}

export default function VerseAutocomplete({
    suggestions,
    onSelect,
    position,
    selectedIndex,
}: VerseAutocompleteProps) {
    const listRef = useRef<HTMLDivElement>(null);

    // 滚动到选中项
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    if (suggestions.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                ref={listRef}
                className="fixed z-50 w-64 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-bible-200 dark:border-gray-700 py-1"
                style={{ top: position.top, left: position.left }}
            >
                {suggestions.map((suggestion, index) => (
                    <button
                        key={`${suggestion.book}-${suggestion.chapter}-${suggestion.verse}`}
                        onClick={() => onSelect(suggestion)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                            index === selectedIndex
                                ? 'bg-bible-100 dark:bg-gray-700'
                                : 'hover:bg-bible-50 dark:hover:bg-gray-700/50'
                        }`}
                    >
                        <span className="text-sm text-bible-800 dark:text-bible-200 font-chinese">
                            {suggestion.display}
                        </span>
                        {index === selectedIndex && (
                            <Check className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                        )}
                    </button>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}

