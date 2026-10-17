export type EvalQuery = {
  id: number;
  query: string;
  expect: string[];
  category: string;
  inScope: boolean;
  note?: string;
};

export type EvalRow = { q: EvalQuery; rank: number | null; top: string[] };
export type EvalResult = { rows: EvalRow[]; inScopeHits: number; inScopeTotal: number };

const TOP_N = 5;

/** Chapter queries (expect "X 13:1" + category chapter-reference): hit when the top 5 are verses 1–5 in order. */
export function rankOf(q: EvalQuery, refs: string[]): number | null {
  if (q.category === 'chapter-reference') {
    const [book, cv] = q.expect[0]!.split(' ');
    const chapter = cv!.split(':')[0];
    const want = Array.from({ length: TOP_N }, (_, i) => `${book} ${chapter}:${i + 1}`);
    return want.every((r, i) => refs[i] === r) ? 1 : null;
  }
  const i = refs.findIndex((r) => q.expect.includes(r));
  return i === -1 ? null : i + 1;
}

export async function evaluate(queries: EvalQuery[], search: (q: string) => Promise<string[]>): Promise<EvalResult> {
  const rows: EvalRow[] = [];
  for (const q of queries) {
    let refs: string[] = [];
    try {
      refs = await search(q.query);
    } catch {
      refs = [];
    }
    rows.push({ q, rank: rankOf(q, refs), top: refs.slice(0, 3) });
  }
  const scoped = rows.filter((r) => r.q.inScope);
  return {
    rows,
    inScopeHits: scoped.filter((r) => r.rank !== null && r.rank <= TOP_N).length,
    inScopeTotal: scoped.length,
  };
}

const pct = (n: number, d: number) => `${((100 * n) / d).toFixed(1)}%`;
const cell = (r: EvalRow) => (r.rank !== null && r.rank <= TOP_N ? `✓ #${r.rank}` : r.rank ? `✗ #${r.rank}` : '✗');

export function formatReport({ pagefind, mini }: { pagefind: EvalResult; mini: EvalResult }): string {
  const lines: string[] = [];
  const appendix = (res: EvalResult) => res.rows.slice(0, 21).filter((r) => r.rank !== null && r.rank <= TOP_N).length;
  lines.push('# Search eval baseline (T3)', '');
  lines.push(
    'Hit = expected verse in the top 5. Regenerate: `SEARCH_EVAL_WRITE=1 npx vitest run tests/search-eval`.',
    '',
  );
  lines.push('| Path | In scope (this phase) | Appendix A (1–21) |', '|---|---|---|');
  for (const [name, res] of [
    ['Pagefind (primary)', pagefind],
    ['MiniSearch (fallback)', mini],
  ] as const) {
    lines.push(
      `| ${name} | ${res.inScopeHits}/${res.inScopeTotal} (${pct(res.inScopeHits, res.inScopeTotal)}) | ${appendix(res)}/21 |`,
    );
  }
  const target = Math.min(100, Math.max(80, (100 * pagefind.inScopeHits) / pagefind.inScopeTotal + 25));
  lines.push('', `Launch gate (Pagefind, in scope): ≥ ${target.toFixed(1)}% (baseline + 25 pts, and ≥ 80%).`, '');
  lines.push(
    '| # | Query | Expect | Category | Scope | Pagefind | MiniSearch | Pagefind top 3 |',
    '|---|---|---|---|---|---|---|---|',
  );
  pagefind.rows.forEach((r, i) => {
    lines.push(
      `| ${r.q.id} | ${r.q.query} | ${r.q.expect.join(' / ')} | ${r.q.category} | ${r.q.inScope ? '✓' : '以后'} | ${cell(r)} | ${cell(mini.rows[i]!)} | ${r.top.join('; ')} |`,
    );
  });
  return `${lines.join('\n')}\n`;
}
