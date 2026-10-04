'use client';

import { useScriptPick } from '@/lib/useScriptPick';

interface ScriptTextProps {
    traditional: string;
    simplified: string;
}

/** Renders text in the active UI script; usable from server components. */
export default function ScriptText({ traditional, simplified }: ScriptTextProps) {
    const pick = useScriptPick();
    return <>{pick(traditional, simplified)}</>;
}
