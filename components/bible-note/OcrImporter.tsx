'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { ImagePlus, Loader2, ScanText, Check, X } from 'lucide-react';
import { parseVerseReferences, type VerseReference } from '@/lib/verseParser';

declare global {
    interface Window {
        Tesseract?: {
            recognize: (
                image: File,
                lang: string,
                options?: { logger?: (msg: { status?: string; progress?: number }) => void }
            ) => Promise<{ data: { text: string } }>;
        };
    }
}

interface OcrImporterProps {
    onInsertReferences: (references: VerseReference[], expand: boolean) => void;
}

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

function loadTesseractScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
    if (window.Tesseract) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${TESSERACT_CDN}"]`) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Failed to load OCR engine')));
            return;
        }

        const script = document.createElement('script');
        script.src = TESSERACT_CDN;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load OCR engine'));
        document.body.appendChild(script);
    });
}

export default function OcrImporter({ onInsertReferences }: OcrImporterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecognizing, setIsRecognizing] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrText, setOcrText] = useState('');
    const [selectedRefs, setSelectedRefs] = useState<Set<string>>(new Set());
    const [expandOnInsert, setExpandOnInsert] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // 全局粘贴监听
    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) void handleImageUpload(file);
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const references = useMemo(() => parseVerseReferences(ocrText), [ocrText]);

    const toggleRef = (key: string) => {
        setSelectedRefs((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const handleImageUpload = async (file: File) => {
        setError(null);
        setIsRecognizing(true);
        setOcrProgress(0);
        setOcrText('');
        setSelectedRefs(new Set());

        try {
            await loadTesseractScript();
            if (!window.Tesseract) {
                throw new Error('OCR 引擎加载失败');
            }

            const result = await window.Tesseract.recognize(file, 'chi_sim+chi_tra+eng', {
                logger: (m) => {
                    if (typeof m.progress === 'number') {
                        setOcrProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const text = result.data.text || '';
            setOcrText(text);
            const autoRefs = parseVerseReferences(text);
            setSelectedRefs(new Set(autoRefs.map((r) => r.original)));
        } catch (err) {
            console.error('OCR recognition error:', err);
            setError('OCR 识别失败，请尝试更清晰的图片或稍后重试。');
        } finally {
            setIsRecognizing(false);
        }
    };

    const handleInsert = () => {
        const picked = references.filter((ref) => selectedRefs.has(ref.original));
        if (picked.length === 0) return;
        onInsertReferences(picked, expandOnInsert);
        setIsOpen(false);
        setOcrText('');
        setSelectedRefs(new Set());
    };

    return (
        <div className="relative z-[220] overflow-visible">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/[0.08] touch-manipulation"
                title="OCR 识别并插入经文引用（Beta）"
                aria-label="OCR 识别并插入经文引用"
            >
                <ScanText className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                <span className="font-chinese">OCR 识别截图</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-[9999] mt-2 w-[min(90vw,560px)] rounded-2xl border border-stone-900/10 bg-white p-4 shadow-[0_24px_70px_rgba(68,64,60,0.24)] dark:border-white/10 dark:bg-gray-950">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h4 className="font-semibold text-bible-800 dark:text-bible-200 font-chinese">OCR 识别经文引用（Beta）</h4>
                            <p className="text-xs text-bible-500 dark:text-bible-400 font-chinese">
                                纯前端本地识别，不上传服务器。建议上传清晰截图。
                            </p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-bible-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="关闭 OCR 面板"
                        >
                            <X className="w-4 h-4 text-bible-600 dark:text-bible-400" />
                        </button>
                    </div>

                    <label
                        className={`flex items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                            isDragging
                                ? 'border-bible-500 bg-bible-100/50 dark:bg-bible-900/30'
                                : 'border-bible-300 dark:border-gray-600 hover:bg-bible-50 dark:hover:bg-gray-700/50'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const file = e.dataTransfer.files[0];
                            if (file) void handleImageUpload(file);
                        }}
                    >
                        <ImagePlus className="w-5 h-5 text-bible-600 dark:text-bible-400" />
                        <span className="text-sm font-chinese text-bible-700 dark:text-bible-300">上传 / 拖放 / 粘贴截图（jpg/png）</span>
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleImageUpload(file);
                                e.currentTarget.value = '';
                            }}
                        />
                    </label>

                    {isRecognizing && (
                        <div className="mt-3 p-3 rounded-lg bg-bible-50 dark:bg-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Loader2 className="w-4 h-4 animate-spin text-bible-600 dark:text-bible-400" />
                                <span className="text-sm font-chinese text-bible-700 dark:text-bible-300">识别中... {ocrProgress}%</span>
                            </div>
                            <div className="h-2 bg-bible-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div className="h-full bg-bible-500 transition-all" style={{ width: `${ocrProgress}%` }} />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-chinese">{error}</p>
                    )}

                    {references.length > 0 && (
                        <div className="mt-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-bible-500 dark:text-bible-400 font-chinese">
                                    识别到 {references.length} 条引用
                                </span>
                                <button
                                    onClick={() => {
                                        if (selectedRefs.size === references.length) {
                                            setSelectedRefs(new Set());
                                        } else {
                                            setSelectedRefs(new Set(references.map((r) => r.original)));
                                        }
                                    }}
                                    className="text-xs text-bible-600 dark:text-bible-400 hover:underline font-chinese"
                                >
                                    {selectedRefs.size === references.length ? '取消全选' : '全选'}
                                </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto border border-bible-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                                {references.map((ref, idx) => (
                                    <button
                                        key={`${ref.original}-${idx}`}
                                        onClick={() => toggleRef(ref.original)}
                                        className={`w-full text-left px-2 py-1.5 rounded-md font-chinese text-sm transition-colors ${
                                            selectedRefs.has(ref.original)
                                                ? 'bg-bible-100 dark:bg-gray-700 text-bible-800 dark:text-bible-200'
                                                : 'hover:bg-bible-50 dark:hover:bg-gray-700/50 text-bible-700 dark:text-bible-300'
                                        }`}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <Check className={`w-3.5 h-3.5 ${selectedRefs.has(ref.original) ? 'opacity-100' : 'opacity-0'}`} />
                                            {ref.original}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <label className="flex items-center gap-2 text-sm font-chinese text-bible-700 dark:text-bible-300">
                                <input
                                    type="checkbox"
                                    checked={expandOnInsert}
                                    onChange={(e) => setExpandOnInsert(e.target.checked)}
                                />
                                插入后自动展开经文内容
                            </label>

                            <button
                                onClick={handleInsert}
                                disabled={selectedRefs.size === 0}
                                className="w-full h-10 rounded-lg bg-bible-500 hover:bg-bible-600 disabled:bg-bible-300 text-white font-chinese transition-colors"
                            >
                                插入已选引用 ({selectedRefs.size})
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

