## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five default canonical labels. See `docs/agents/triage-labels.md`.

### Domain docs

Domain documentation uses a single-context layout. See `docs/agents/domain.md`.

## Quality bar

Every change must pass `npm run check` (ESLint + Tailwind opacity guard + Prettier check, `tsc --noEmit`, Vitest) and `npm run build`. CI runs the same on every PR; hooks run it locally:

| Where | What runs |
| --- | --- |
| pre-commit | `lint-staged` (Prettier + ESLint `--fix` on staged files), then `npm run type-check` |
| commit-msg | commitlint — Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`, `style:` …) |
| pre-push | `npm run test:unit` |
| CI (`.github/workflows/ci.yml`) | lint, commitlint on PR commits, type-check, unit tests, build |

Do not bypass hooks (`--no-verify`) or add `eslint-disable` / `@ts-expect-error` without a one-line reason next to it.

Principles (inspired by pstack):

- **Prove it works.** Write or update a failing test first for behavior changes (Vitest + Testing Library in `tests/`). For UI, run the `verify-yourwords` skill (`.cursor/skills/verify-yourwords/`) and look at the screenshots; type-checks are not proof.
- **Types are the contract.** `strict` + `noUncheckedIndexedAccess` are on. Narrow (`?.`, `??`, guards) instead of casting; `!` only where an invariant makes it safe (loop bounds), `any` is banned — use `unknown` and parse.
- **No floating promises.** Await it, or mark fire-and-forget with `void` deliberately.
- **Deep modules, small surface.** Put pure logic in `lib/` with tests; keep components thin. No import cycles (`import/no-cycle`).
- **No slop.** Delete dead code and unused imports instead of commenting them out; no speculative abstractions, no drive-by refactors in unrelated files; comments explain *why*, not *what*.
- **Small, reviewable commits** with conventional messages; keep formatting-only changes in their own commit (add big ones to `.git-blame-ignore-revs`).
