import { useEffect, useState } from 'react';
import type { UiScript } from '@/lib/uiScript';

type Convert = (value: string) => string;

let convertersPromise: Promise<{ toSimplified: Convert; toTraditional: Convert }> | null = null;
let loaded: { toSimplified: Convert; toTraditional: Convert } | null = null;

/** Lazily loads OpenCC (tw⇄cn). Shared by search result cards so only one copy is fetched. */
export function loadScriptConverters() {
  convertersPromise ??= import('opencc-js').then((opencc) => {
    loaded = {
      toSimplified: opencc.Converter({ from: 'tw', to: 'cn' }),
      toTraditional: opencc.Converter({ from: 'cn', to: 'tw' }),
    };
    return loaded;
  });
  return convertersPromise;
}

/**
 * Picks the verse text for the active UI script. Pagefind results carry Traditional `text` plus
 * `textSimplified`; MiniSearch / context verses carry only Simplified CUV `text`. Whatever is missing is
 * converted with OpenCC (identity until the converter has loaded).
 */
export function pickVerseText(
  text: string,
  textSimplified: string | undefined,
  script: UiScript,
  convert?: { toSimplified: Convert; toTraditional: Convert } | null,
): string {
  if (script === 'simplified') {
    if (textSimplified) return textSimplified;
    return convert ? convert.toSimplified(text) : text;
  }
  if (textSimplified) return text;
  return convert ? convert.toTraditional(text) : text;
}

/** Converts a query to the given script so highlights match the displayed verse text. */
export function queryForScript(
  query: string,
  script: UiScript,
  convert?: { toSimplified: Convert; toTraditional: Convert } | null,
) {
  if (!convert || !/[\u3400-\u9fff]/.test(query)) return query;
  return script === 'traditional' ? convert.toTraditional(query) : convert.toSimplified(query);
}

/** Returns the OpenCC converters once loaded (null until then); triggers the load when `needed`. */
export function useScriptConverters(needed: boolean) {
  const [converters, setConverters] = useState(loaded);
  useEffect(() => {
    if (!needed || converters) return;
    let cancelled = false;
    void loadScriptConverters().then((c) => {
      if (!cancelled) setConverters(c);
    });
    return () => {
      cancelled = true;
    };
  }, [needed, converters]);
  return converters;
}

/** Converts free CJK text of unknown script to the given UI script (identity until OpenCC has loaded). */
export function toScript(
  text: string,
  script: UiScript,
  convert?: { toSimplified: Convert; toTraditional: Convert } | null,
): string {
  if (!convert || !text) return text;
  return script === 'traditional' ? convert.toTraditional(text) : convert.toSimplified(text);
}
