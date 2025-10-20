'use client';

import { useMaskStore } from '@/stores/useMaskStore';
import Select, { SelectOption } from '@/components/ui/Select';
import Slider from '@/components/ui/Slider';
import { RotateCcw } from 'lucide-react';

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

    const modeOptions: SelectOption[] = [
        { value: 'punctuation', label: '短語提示模式' },
        { value: 'prefix', label: '開頭提示模式' },
    ];

    const typeOptions: SelectOption[] = [
        { value: 'fixed', label: '固定字數' },
        { value: 'range', label: '隨機字數' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            {/* 模式选择 */}
            <Select
                value={maskMode}
                onChange={(val) => setMaskMode(val as 'punctuation' | 'prefix')}
                options={modeOptions}
                className="w-36 sm:w-40"
            />

            {/* 类型选择 */}
            <Select
                value={maskCharsType}
                onChange={(val) => setMaskCharsType(val as 'fixed' | 'range')}
                options={typeOptions}
                className="w-24 sm:w-32"
            />

            {/* 滑块控制 */}
            {maskCharsType === 'fixed' ? (
                <Slider
                    id="mask-slider"
                    label="顯示:"
                    min={1}
                    max={10}
                    value={maskCharsFixed}
                    onChange={setMaskCharsFixed}
                    className="w-full sm:w-auto"
                />
            ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <Slider
                        id="mask-min"
                        label="顯示:"
                        min={1}
                        max={maskCharsMax}
                        value={maskCharsMin}
                        onChange={(val) => setMaskCharsRange(val, maskCharsMax)}
                        className="w-full sm:w-auto"
                    />
                    <span className="text-xs text-bible-600 dark:text-bible-400 font-chinese">-</span>
                    <Slider
                        id="mask-max"
                        label=""
                        min={maskCharsMin}
                        max={10}
                        value={maskCharsMax}
                        onChange={(val) => setMaskCharsRange(maskCharsMin, val)}
                        className="w-full sm:w-auto"
                        showValue={true}
                    />
                    <span className="text-xs text-bible-600 dark:text-bible-400 font-chinese">字</span>
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
        </div>
    );
}
