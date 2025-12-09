'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export default function LanguageInit() {
    const { hasInitializedLanguage, setLanguage, setHasInitializedLanguage } = useAppStore();

    useEffect(() => {
        // Only run if not initialized
        if (!hasInitializedLanguage) {
            // Check if window/navigator is available (client-side)
            if (typeof window !== 'undefined' && window.navigator) {
                const browserLang = window.navigator.language.toLowerCase();
                
                // Logic:
                // zh-cn, zh-sg -> simplified
                // zh-tw, zh-hk, zh-mo, zh -> traditional
                // others -> en
                
                if (browserLang === 'zh-cn' || browserLang === 'zh-sg') {
                    setLanguage('simplified');
                } else if (browserLang.startsWith('zh')) {
                    setLanguage('traditional');
                } else {
                    setLanguage('en');
                }
                
                // Mark as initialized so we don't overwrite user preference later
                setHasInitializedLanguage(true);
            }
        }
    }, [hasInitializedLanguage, setLanguage, setHasInitializedLanguage]);

    return null;
}
