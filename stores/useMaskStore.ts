import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MaskMode = 'punctuation' | 'prefix';
export type MaskCharsType = 'fixed' | 'range';

interface MaskState {
    maskMode: MaskMode;
    maskCharsType: MaskCharsType;
    maskCharsFixed: number;
    maskCharsMin: number;
    maskCharsMax: number;
    setMaskMode: (mode: MaskMode) => void;
    setMaskCharsType: (type: MaskCharsType) => void;
    setMaskCharsFixed: (value: number) => void;
    setMaskCharsRange: (min: number, max: number) => void;
    resetToDefaults: () => void;
}

// 默认值常量
const DEFAULT_SETTINGS = {
    maskMode: 'punctuation' as MaskMode,
    maskCharsType: 'fixed' as MaskCharsType,
    maskCharsFixed: 2,
    maskCharsMin: 1,
    maskCharsMax: 3,
};

export const useMaskStore = create<MaskState>()(
    persist(
        (set) => ({
            // 默认值
            ...DEFAULT_SETTINGS,

            // 更新方法
            setMaskMode: (mode) => set({ maskMode: mode }),
            setMaskCharsType: (type) => set({ maskCharsType: type }),
            setMaskCharsFixed: (value) => set({ maskCharsFixed: value }),
            setMaskCharsRange: (min, max) => set({ maskCharsMin: min, maskCharsMax: max }),
            resetToDefaults: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: 'mask-settings',
        }
    )
);
