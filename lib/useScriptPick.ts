import { useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { pickScript } from '@/lib/uiScript';

/** Returns a stable `pick(traditional, simplified)` bound to the current UI script. */
export function useScriptPick() {
  const language = useAppStore((state) => state.language);
  return useCallback(
    (traditional: string, simplified: string) => pickScript(language, traditional, simplified),
    [language]
  );
}
