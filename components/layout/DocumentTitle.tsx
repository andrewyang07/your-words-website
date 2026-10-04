'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getDocumentTitle } from '@/lib/uiScript';

interface DocumentTitleProps {
    traditional: string;
    simplified: string;
    /** Skip the "| 你的話語" brand suffix (for the home page title). */
    absolute?: boolean;
}

/**
 * Next.js metadata is static (server-rendered, zh-TW by default) and its <title> can be (re)hoisted into
 * <head> after hydration. This keeps the browser tab title in the user's chosen 简/繁 script, re-applying
 * it whenever the metadata <title> is swapped back in.
 */
export default function DocumentTitle({ traditional, simplified, absolute }: DocumentTitleProps) {
    const language = useAppStore((state) => state.language);

    useEffect(() => {
        const title = getDocumentTitle(language, { traditional, simplified }, absolute);
        const apply = () => {
            if (document.title !== title) document.title = title;
        };
        apply();
        const observer = new MutationObserver(apply);
        observer.observe(document.head, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [language, traditional, simplified, absolute]);

    return null;
}
