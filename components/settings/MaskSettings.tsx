'use client';

import { useState } from 'react';
import { useMaskStore } from '@/stores/useMaskStore';
import { useTranslation } from '@/lib/i18n';
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
    const { t } = useTranslation();

    const [showHelp, setShowHelp] = useState(false);

    const modeOptions: SelectOption[] = [
        { value: 'punctuation', label: t('settings.mask.mode') + ' 1' }, // Simplified for now, ideally translate options too
        { value: 'prefix', label: t('settings.mask.mode') + ' 2' },
    ];

    const typeOptions: SelectOption[] = [
        { value: 'fixed', label: t('settings.mask.chars') + ' (Fixed)' },
        { value: 'range', label: t('settings.mask.chars') + ' (Range)' },
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
                    title={t('settings.mask.help.title')}
                    aria-label={t('settings.mask.help.title')}
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
                    label={t('settings.mask.label.display')}
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
                        label={t('settings.mask.label.min')}
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
                        label={t('settings.mask.label.max')}
                        min={1}
                        max={10}
                        value={maskCharsMax}
                        onChange={(val) => setMaskCharsRange(maskCharsMin, Math.max(val, maskCharsMin))}
                        className="w-full sm:w-auto max-w-[90px]"
                        showValue={false}
                    />
                    <span className="text-xs text-bible-600 dark:text-bible-400 font-chinese font-semibold flex-shrink-0">
                        {maskCharsMin}-{maskCharsMax} {t('settings.mask.unit.chars')}
                    </span>
                </div>
            )}

            {/* 恢复默认按钮 */}
            <button
                onClick={resetToDefaults}
                className="flex items-center gap-1 px-2.5 py-2 text-xs text-bible-600 dark:text-bible-400 hover:text-bible-800 dark:hover:text-bible-200 hover:bg-bible-50 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation border border-bible-200 dark:border-gray-700"
                title={t('settings.mask.resetFull')}
                aria-label={t('settings.mask.resetFull')}
            >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-chinese">{t('settings.mask.reset')}</span>
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
                            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40"
                            onClick={() => setShowHelp(false)}
                        />
                        {/* 提示框 */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="fixed left-1/2 top-[20vh] sm:top-1/2 -translate-x-1/2 sm:-translate-y-1/2 w-[95vw] sm:w-[90vw] max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-bible-300 dark:border-gray-600 z-50 p-4 sm:p-5"
                        >
                            {/* 标题和关闭按钮 */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📖</span>
                                    <h3 className="text-base font-bold text-bible-800 dark:text-bible-200 font-chinese">
                                        {t('settings.mask.help.title')}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-bible-100 dark:hover:bg-gray-700 rounded-full transition-colors touch-manipulation"
                                    style={{ WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
                                    aria-label={t('settings.mask.help.close')}
                                >
                                    <X className="w-5 h-5 text-bible-600 dark:text-bible-400" />
                                </button>
                            </div>

                            {/* 内容 */}
                            <div className="space-y-3 sm:space-y-4 text-sm text-bible-700 dark:text-bible-300 font-chinese">
                                {/* 每句提示 */}
                                <div className="p-2.5 sm:p-3 bg-bible-50 dark:bg-gray-700 rounded-lg">
                                    <p className="font-semibold text-bible-800 dark:text-bible-200 mb-1.5 sm:mb-2 text-sm">
                                        {t('settings.mask.help.mode1.title')}
                                    </p>
                                    <p className="text-xs mb-1.5 sm:mb-2 text-bible-600 dark:text-bible-400">
                                        {t('settings.mask.help.mode1.desc')}
                                    </p>
                                    <div className="p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded border border-bible-200 dark:border-gray-600 font-chinese text-xs">
                                        <p>{t('settings.mask.help.mode1.example')}</p>
                                    </div>
                                </div>

                                {/* 开头提示 */}
                                <div className="p-2.5 sm:p-3 bg-bible-50 dark:bg-gray-700 rounded-lg">
                                    <p className="font-semibold text-bible-800 dark:text-bible-200 mb-1.5 sm:mb-2 text-sm">
                                        {t('settings.mask.help.mode2.title')}
                                    </p>
                                    <p className="text-xs mb-1.5 sm:mb-2 text-bible-600 dark:text-bible-400">
                                        {t('settings.mask.help.mode2.desc')}
                                    </p>
                                    <div className="p-1.5 sm:p-2 bg-white dark:bg-gray-800 rounded border border-bible-200 dark:border-gray-600 font-chinese text-xs">
                                        <p>{t('settings.mask.help.mode2.example')}</p>
                                    </div>
                                </div>

                                {/* 使用建议 */}
                                <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-gold-50 dark:bg-gray-700 rounded-lg border border-gold-200 dark:border-gold-600">
                                    <span className="text-sm sm:text-base">💡</span>
                                    <p className="text-xs text-bible-700 dark:text-bible-300">
                                        <span className="font-semibold">{t('settings.mask.help.tip.label')}</span>
                                        {t('settings.mask.help.tip.text')}
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
