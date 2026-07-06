'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Copy, Eye, EyeOff, ListOrdered, RefreshCcw, Share2, Shuffle, Sparkles, X } from 'lucide-react';
import { Book, Verse } from '../../types/verse';
import { useAppStore } from '../../stores/useAppStore';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { useVerseStore } from '../../stores/useVerseStore';
import { decodeVerseList, encodeVerseList } from '../../lib/bibleBookMapping';
import { loadChapterVerses } from '../../lib/dataLoader';
import { logError } from '../../lib/errorHandler';
import { buildShareUrl, shareOrCopy } from '../../lib/shareUtils.mjs';
import { maskVerseText } from '../../lib/utils';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import {
    canShareVerseCount,
    nextStarterBatchIndex,
    parseSavedVerseId,
    SHARE_VERSE_LIMIT,
    sortSavedVerses,
    STARTER_SUGGESTION_BATCHES,
    toggleSelection,
    type SavedSortMode,
} from './reviewHomeHelpers';

type SelectionMode = 'off' | 'selecting';

async function loadVersesByIds(ids: string[], language: 'simplified' | 'traditional'): Promise<Verse[]> {
    const refs = ids.map(parseSavedVerseId).filter((ref): ref is NonNullable<ReturnType<typeof parseSavedVerseId>> => Boolean(ref));
    const chapterGroups = new Map<string, Set<number>>();

    refs.forEach(({ bookKey, chapter, verse }) => {
        const key = `${bookKey}-${chapter}`;
        if (!chapterGroups.has(key)) chapterGroups.set(key, new Set());
        chapterGroups.get(key)!.add(verse);
    });

    const loaded: Verse[] = [];
    for (const [key, verses] of chapterGroups) {
        const dashIndex = key.lastIndexOf('-');
        const bookKey = key.slice(0, dashIndex);
        const chapter = Number(key.slice(dashIndex + 1));
        const chapterVerses = await loadChapterVerses(bookKey, chapter, language);
        loaded.push(...chapterVerses.filter((verse) => verses.has(verse.verse)));
    }

    return loaded;
}

export default function HomePageClient() {
    const { language } = useAppStore();
    const { books, loadBooks } = useVerseStore();
    const { addFavorites, getFavoritesList } = useFavoritesStore();
    const [loading, setLoading] = useState(true);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedVerses, setSavedVerses] = useState<Verse[]>([]);
    const [sharedEncoded, setSharedEncoded] = useState('');
    const [sharedVerses, setSharedVerses] = useState<Verse[]>([]);
    const [revealedSharedIds, setRevealedSharedIds] = useState<string[]>([]);
    const [sortMode, setSortMode] = useState<SavedSortMode>('bible');
    const [randomSeed, setRandomSeed] = useState(1);
    const [revealedIds, setRevealedIds] = useState<string[]>([]);
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('off');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [starterBatchIndex, setStarterBatchIndex] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    const favoritesList = getFavoritesList();
    const favoritesKey = favoritesList.join('|');
    const favoritesCount = favoritesList.length;

    useEffect(() => {
        loadBooks(language)
            .then(() => setLoading(false))
            .catch((err) => {
                setError(err.message || '加载数据失败');
                setLoading(false);
            });
    }, [language, loadBooks]);

    useEffect(() => {
        if (books.length === 0) return;
        let cancelled = false;
        const favoriteIds = favoritesKey ? favoritesKey.split('|') : [];

        setLoadingSaved(true);
        loadVersesByIds(favoriteIds, language)
            .then((verses) => {
                if (!cancelled) setSavedVerses(verses);
            })
            .catch((err) => {
                logError('ReviewHome:loadSavedVerses', err);
                if (!cancelled) setSavedVerses([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingSaved(false);
            });

        return () => {
            cancelled = true;
        };
    }, [books, favoritesKey, language]);

    useEffect(() => {
        if (typeof window === 'undefined' || books.length === 0) return;
        let cancelled = false;
        const encoded = new URLSearchParams(window.location.search).get('s') ?? '';
        const refs = decodeVerseList(encoded);

        setSharedEncoded(encoded);
        if (!encoded || refs.length === 0) {
            setSharedVerses([]);
            return;
        }

        loadVersesByIds(
            refs.map(({ bookKey, chapter, verse }) => `${bookKey}-${chapter}-${verse}`),
            language
        )
            .then((verses) => {
                if (!cancelled) setSharedVerses(verses);
            })
            .catch((err) => {
                logError('ReviewHome:loadSharedVerses', err);
                if (!cancelled) setSharedVerses([]);
            });

        return () => {
            cancelled = true;
        };
    }, [books, language]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(null), 2600);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const sortedSavedVerses = useMemo(
        () => sortSavedVerses(savedVerses, books, sortMode, randomSeed),
        [books, randomSeed, savedVerses, sortMode]
    );

    const starterIds = STARTER_SUGGESTION_BATCHES[starterBatchIndex] ?? STARTER_SUGGESTION_BATCHES[0];
    const selectedCount = selectedIds.length;
    const isSelecting = selectionMode === 'selecting';

    const shareVerses = useCallback(
        async (verses: Verse[], label: 'all' | 'selected') => {
            if (!canShareVerseCount(verses.length)) {
                setToast(verses.length > SHARE_VERSE_LIMIT ? '最多分享 200 节，请先少选一些。' : '先选择要分享的经文。');
                return;
            }

            try {
                const encoded = encodeVerseList(verses.map((verse) => ({ bookKey: verse.bookKey, chapter: verse.chapter, verse: verse.verse })));
                const url = buildShareUrl({ origin: window.location.origin, pathname: window.location.pathname, encoded });
                const result = await shareOrCopy({
                    title: label === 'all' ? '我的收藏经文' : '我选的经文',
                    text: label === 'all' ? '这些收藏经文想分享给你。' : '这几节经文想分享给你。',
                    url,
                    navigatorRef: navigator,
                });

                setToast(result === 'shared' ? '已打开系统分享。' : '链接已复制。');
            } catch (err) {
                logError('ReviewHome:shareVerses', err);
                setToast('分享失败，请稍后重试。');
            }
        },
        []
    );

    const handleCardClick = (id: string) => {
        if (isSelecting) {
            setSelectedIds((current) => toggleSelection(current, id));
            return;
        }

        setRevealedIds((current) => toggleSelection(current, id));
    };

    const cancelSelection = () => {
        setSelectionMode('off');
        setSelectedIds([]);
    };

    const startSelection = () => {
        setRevealedIds([]);
        setSelectionMode('selecting');
        setSelectedIds([]);
    };

    const shareSelected = () => {
        const selected = sortedSavedVerses.filter((verse) => selectedIds.includes(verse.id));
        shareVerses(selected, 'selected');
    };

    const addStarterSuggestions = () => {
        addFavorites(starterIds);
        setToast('已加入起步经文。');
    };

    const addSharedSet = () => {
        addFavorites(sharedVerses.map((verse) => verse.id));
        setToast('已加入收藏。');
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

    return (
        <main className="min-h-screen bg-[#f8f5ee] text-stone-950 dark:bg-[#0e1116] dark:text-stone-50">
            <header className="sticky top-0 z-20 border-b border-stone-900/10 bg-[#f8f5ee]/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1116]/85">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
                    <Link href="/" className="flex min-w-0 items-center gap-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-900/10 bg-white/60 p-1 dark:border-white/10 dark:bg-white/[0.04]">
                            <Image src="/logo-light.png" alt="你的话语" width={40} height={40} priority className="h-full w-full rounded-lg object-contain" />
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-lg font-semibold tracking-[0.04em] font-chinese">你的话语</span>
                            <span className="block text-xs text-stone-500 dark:text-stone-400 font-chinese">收藏经文</span>
                        </span>
                    </Link>

                    <Link
                        href="/review"
                        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 font-chinese"
                    >
                        <Sparkles className="h-4 w-4" />
                        今日复习
                    </Link>
                </div>
            </header>

            <section className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm text-stone-500 dark:text-stone-400 font-chinese">打开就先回想，再查看。</p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl font-chinese">我的背诵经文</h1>
                    </div>

                    {savedVerses.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSortMode('bible')}
                                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-3 py-2 text-sm font-chinese ${
                                    sortMode === 'bible'
                                        ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950'
                                        : 'border border-stone-900/10 bg-white/70 text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200'
                                }`}
                            >
                                <ListOrdered className="h-4 w-4" />
                                圣经顺序
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSortMode('random');
                                    setRandomSeed((seed) => seed + 1);
                                }}
                                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-3 py-2 text-sm font-chinese ${
                                    sortMode === 'random'
                                        ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950'
                                        : 'border border-stone-900/10 bg-white/70 text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200'
                                }`}
                            >
                                <Shuffle className="h-4 w-4" />
                                随机
                            </button>
                        </div>
                    )}
                </div>

                {toast && (
                    <div className="mb-4 rounded-xl border border-stone-900/10 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-200 font-chinese">
                        {toast}
                    </div>
                )}

                {loadingSaved ? (
                    <div className="py-16 text-center text-stone-500 font-chinese">加载收藏中...</div>
                ) : sharedVerses.length > 0 ? (
                    <SharedSetPanel
                        encoded={sharedEncoded}
                        verses={sharedVerses}
                        revealedIds={revealedSharedIds}
                        onToggle={(id) => setRevealedSharedIds((current) => toggleSelection(current, id))}
                        onAdd={addSharedSet}
                    />
                ) : savedVerses.length === 0 ? (
                    <EmptyReviewHome
                        starterIds={starterIds}
                        onAdd={addStarterSuggestions}
                        onNext={() => setStarterBatchIndex((current) => nextStarterBatchIndex(current))}
                    />
                ) : (
                    <>
                        <div className="mb-4 rounded-2xl border border-stone-900/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                            {isSelecting ? (
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200 font-chinese">已选择 {selectedCount} 节</span>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={shareSelected}
                                            disabled={!canShareVerseCount(selectedCount)}
                                            className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-stone-950 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-stone-950 font-chinese"
                                        >
                                            <Share2 className="h-4 w-4" />
                                            分享所选
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelSelection}
                                            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-3 py-2 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200 font-chinese"
                                        >
                                            <X className="h-4 w-4" />
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-sm text-stone-500 dark:text-stone-400 font-chinese">共 {savedVerses.length} 节，默认遮罩。</span>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => shareVerses(sortedSavedVerses, 'all')}
                                            disabled={!canShareVerseCount(sortedSavedVerses.length)}
                                            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-3 py-2 text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200 font-chinese"
                                        >
                                            <Copy className="h-4 w-4" />
                                            分享全部
                                        </button>
                                        <button
                                            type="button"
                                            onClick={startSelection}
                                            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-3 py-2 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200 font-chinese"
                                        >
                                            <Check className="h-4 w-4" />
                                            选择分享
                                        </button>
                                    </div>
                                    {savedVerses.length > SHARE_VERSE_LIMIT && (
                                        <p className="basis-full text-xs text-amber-700 dark:text-amber-300 font-chinese">超过 200 节，分享前请减少数量。</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {sortedSavedVerses.map((verse) => (
                                <SavedVerseCard
                                    key={verse.id}
                                    verse={verse}
                                    revealed={revealedIds.includes(verse.id)}
                                    selecting={isSelecting}
                                    selected={selectedIds.includes(verse.id)}
                                    onClick={() => handleCardClick(verse.id)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}

function EmptyReviewHome({ starterIds, onAdd, onNext }: { starterIds: string[]; onAdd: () => void; onNext: () => void }) {
    return (
        <div className="rounded-2xl border border-stone-900/10 bg-white/72 p-5 dark:border-white/10 dark:bg-white/[0.04] sm:p-6">
            <h2 className="text-xl font-semibold font-chinese">还没有收藏经文</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300 font-chinese">
                先收藏几节经文，首页就会变成你的背诵列表。可以从起步建议开始，也可以去发现页找经文。
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {starterIds.map((id) => {
                    const ref = parseSavedVerseId(id);
                    return (
                        <div key={id} className="rounded-xl border border-stone-900/10 bg-[#f8f5ee] p-3 text-sm dark:border-white/10 dark:bg-black/20 font-chinese">
                            {ref ? `${ref.bookKey} ${ref.chapter}:${ref.verse}` : id}
                        </div>
                    );
                })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm text-white dark:bg-white dark:text-stone-950 font-chinese"
                >
                    <Sparkles className="h-4 w-4" />
                    加入起步经文
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200 font-chinese"
                >
                    <RefreshCcw className="h-4 w-4" />
                    换一批
                </button>
                <Link
                    href="/discover"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200 font-chinese"
                >
                    去发现页
                </Link>
            </div>
        </div>
    );
}

function SharedSetPanel({
    encoded,
    verses,
    revealedIds,
    onToggle,
    onAdd,
}: {
    encoded: string;
    verses: Verse[];
    revealedIds: string[];
    onToggle: (id: string) => void;
    onAdd: () => void;
}) {
    return (
        <section className="space-y-4">
            <div className="rounded-2xl border border-stone-900/10 bg-white/72 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-sm text-stone-500 dark:text-stone-400 font-chinese">分享集合</p>
                <h2 className="mt-1 text-xl font-semibold font-chinese">朋友分享了 {verses.length} 节经文</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300 font-chinese">先查看或复习，不会自动加入你的收藏。</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={`/review?s=${encodeURIComponent(encoded)}`}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm text-white dark:bg-white dark:text-stone-950 font-chinese"
                    >
                        <Sparkles className="h-4 w-4" />
                        复习
                    </Link>
                    <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-stone-900/10 bg-white px-4 py-2 text-sm text-stone-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-200 font-chinese"
                    >
                        <Check className="h-4 w-4" />
                        加入收藏
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {verses.map((verse) => (
                    <SavedVerseCard
                        key={verse.id}
                        verse={verse}
                        revealed={revealedIds.includes(verse.id)}
                        selecting={false}
                        selected={false}
                        onClick={() => onToggle(verse.id)}
                    />
                ))}
            </div>
        </section>
    );
}

function SavedVerseCard({
    verse,
    revealed,
    selecting,
    selected,
    onClick,
}: {
    verse: Verse;
    revealed: boolean;
    selecting: boolean;
    selected: boolean;
    onClick: () => void;
}) {
    const displayText = revealed ? verse.text : maskVerseText(verse.text, 'punctuation', 2);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`min-h-[168px] rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
                selected
                    ? 'border-stone-950 bg-stone-950 text-white dark:border-white dark:bg-white dark:text-stone-950'
                    : 'border-stone-900/10 bg-white/76 text-stone-950 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-stone-50 dark:hover:bg-white/[0.07]'
            }`}
            aria-pressed={selecting ? selected : revealed}
        >
            <div className="mb-4 flex items-start justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium font-chinese ${selected ? 'bg-white/15' : 'bg-stone-900/[0.05] dark:bg-white/[0.07]'}`}>
                    {verse.book} {verse.chapter}:{verse.verse}
                </span>
                {selecting ? (
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-white/80 bg-white/20 dark:border-stone-950/70' : 'border-stone-400/50'}`}>
                        {selected && <Check className="h-4 w-4" />}
                    </span>
                ) : revealed ? (
                    <EyeOff className="h-4 w-4 opacity-70" />
                ) : (
                    <Eye className="h-4 w-4 opacity-70" />
                )}
            </div>

            <p className="text-[17px] leading-8 font-chinese">{displayText}</p>
        </button>
    );
}
