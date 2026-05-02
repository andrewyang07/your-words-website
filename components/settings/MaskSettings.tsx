'use client';

import { useState } from 'react';
import { useMaskStore } from '@/stores/useMaskStore';
import Select, { SelectOption } from '@/components/ui/Select';
import Slider from '@/components/ui/Slider';
import { RotateCcw, HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MaskSettings() {
    const {
        maskMode,
        maskCharsType,
        maskCharsFixed,
        maskCharsMin,
        maskCharsMax,
        setMaskMode,
        setMaskCharsType,
        setMaskCharsFixed,
        setMaskCharsRange,
        resetToDefaults,
    } = useMaskStore();

    const [showHelp, setShowHelp] = useState(false);

    const modeOptions: SelectOption[] = [
        { value: 'punctuation', label: '每句提示' },
        { value: 'prefix', label: '開頭提示' },
    ];

    const typeOptions: SelectOption[] = [
        { value: 'fixed', label: '固定提示字數' },
        { value: 'range', label: '隨機提示字數' },
    ];

    return (
        <div className="relative flex flex-wrap items-center gap-2 text-sm">
            {/* 模式选择 + 帮助按钮 */}
            <div className="flex items-center gap-1.5">
                <Select
                    value={maskMode}
                    onChange={(val) => setMaskMode(val as 'punctuation' | 'prefix')}
                    options={modeOptions}
                    className="w-36 sm:w-40"
                />
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-bible-500 hover:text-bible-700 dark:text-bible-400 dark:hover:text-bible-200 hover:bg-bible-100 dark:hover:bg-gray-700 rounded-full transition-colors touch-manipulation"
                    title="查看提示模式說明"
                    aria-label="查看提示模式說明"
                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                >
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>

            {/* 类型选择 */}
            <Select
                value={maskCharsType}
                onChange={(val) => setMaskCharsType(val as 'fixed' | 'range')}
                options={typeOptions}
                className="w-36 sm:w-40"
            />

            {/* 滑块控制 */}
            {maskCharsType === 'fixed' ? (
                <Slider
                    id="mask-slider"
                    label="最多提示:"
                    min={1}
                    max={10}
                    value={maskCharsFixed}
                    onChange={setMaskCharsFixed}
                    className="w-full sm:w-auto max-w-[160px]"
                />
            ) : (
                <div className="flex flex-row items-center gap-1.5 w-full sm:w-auto max-w-[320px]">
                    <Slider
                        id="mask-min"
                        label="最少:"
                        min={1}
                        max={10}
                        value={maskCharsMin}
                        onChange={(val) => setMaskCharsRange(Math.min(val, maskCharsMax), maskCharsMax)}
                        className="w-full sm:w-auto max-w-[90px]"
                        showValue={false}
                    />
                    <span className="text-xs text-bible-600 dark:text-bible-400 font-chinese flex-shrink-0">-</span>
                    <Slider
                        id="mask-max"
                        label="最多:"
                        min={1}
                        max={10}
                        value={maskCharsMax}
                        onChange={(val) => setMaskCharsRange(maskCharsMin, Math.max(val, maskCharsMin))}
                        className="w-full sm:w-auto max-w-[90px]"
                        showValue={false}
                    />
                    <span className="text-xs text-bible-600 dark:text-bible-400 font-chinese font-semibold flex-shrink-0">
                        {maskCharsMin}-{maskCharsMax}字
                    </span>
                </div>
            )}

            {/* 恢复默认按钮 */}
            <button
                onClick={resetToDefaults}
                className="flex items-center gap-1 px-2.5 py-2 text-xs text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation border border-bible-200 dark:border-gray-700"
                title="恢復默認設置"
                aria-label="恢復默認設置"
            >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-chinese">恢復默認</span>
            </button>

            {/* 帮助提示框 */}
            <AnimatePresence>
                {showHelp && (
                    <>
                        {/* 遮罩层 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9998] bg-black/30 dark:bg-black/50"
                            onClick={() => setShowHelp(false)}
                        />
                        {/* 提示框 */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="fixed left-1/2 top-[20vh] z-[9999] w-[95vw] max-w-md -translate-x-1/2 rounded-2xl border border-stone-900/10 bg-white p-4 shadow-[0_24px_70px_rgba(68,64,60,0.24)] sm:top-1/2 sm:w-[90vw] sm:-translate-y-1/2 sm:p-5 dark:border-white/10 dark:bg-gray-950"
                        >
                            {/* 标题和关闭按钮 */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📖</span>
                                    <h3 className="text-base font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                        提示模式說明
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-bible-100 dark:hover:bg-gray-700 rounded-full transition-colors touch-manipulation"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    aria-label="關閉"
                                >
                                    <X className="w-5 h-5 text-bible-600 dark:text-bible-400" />
                                </button>
                            </div>

                            {/* 内容 */}
                            <div className="space-y-3 sm:space-y-4 text-sm text-bible-700 dark:text-bible-300 font-chinese">
                                {/* 每句提示 */}
                                <div className="p-2.5 sm:p-3 bg-bible-50 dark:bg-gray-700 rounded-lg">
                                    <p className="font-semibold text-bible-800 dark:text-bible-200 mb-1.5 sm:mb-2 text-sm">
                                        • 每句提示
                                    </p>
                                    <p className="text-xs mb-1.5 sm:mb-2 text-bible-600 dark:text-bible-400">
                                        在每個句子開頭最多顯示提示字，短句也會保留遮字
                                    </p>
                                    <div className="p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded border border-bible-200 dark:border-gray-600 font-chinese text-xs">
                                        <p>這律〇，總要晝夜思〇（短句也會遮字）</p>
                                    </div>
                                </div>

                                {/* 开头提示 */}
                                <div className="p-2.5 sm:p-3 bg-bible-50 dark:bg-gray-700 rounded-lg">
                                    <p className="font-semibold text-bible-800 dark:text-bible-200 mb-1.5 sm:mb-2 text-sm">
                                        • 開頭提示
                                    </p>
                                    <p className="text-xs mb-1.5 sm:mb-2 text-bible-600 dark:text-bible-400">
                                        只在全文開頭最多顯示提示字，其餘保留遮字
                                    </p>
                                    <div className="p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded border border-bible-200 dark:border-gray-600 font-chinese text-xs">
                                        <p>這律〇〇〇〇〇〇〇〇〇〇（只有開頭有提示）</p>
                                    </div>
                                </div>

                                {/* 使用建议 */}
                                <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-gold-50 dark:bg-gray-700 rounded-lg border border-gold-200 dark:border-gold-600">
                                    <span className="text-sm sm:text-base">💡</span>
                                    <p className="text-xs text-bible-700 dark:text-bible-300">
                                        <span className="font-semibold">建議：</span>
                                        初學者推薦「每句提示」，更容易記憶；
                                        熟練後可使用「開頭提示」增加挑戰。
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
