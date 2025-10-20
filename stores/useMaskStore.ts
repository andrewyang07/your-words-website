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
}

export const useMaskStore = create<MaskState>()(
    persist(
        (set) => ({
            // 默认值
            maskMode: 'punctuation',
            maskCharsType: 'fixed',
            maskCharsFixed: 2,
            maskCharsMin: 1,
            maskCharsMax: 3,

            // 更新方法
            setMaskMode: (mode) => set({ maskMode: mode }),
            setMaskCharsType: (type) => set({ maskCharsType: type }),
            setMaskCharsFixed: (value) => set({ maskCharsFixed: value }),
            setMaskCharsRange: (min, max) => set({ maskCharsMin: min, maskCharsMax: max }),
        }),
        {
            name: 'mask-settings',
        }
    )
);
