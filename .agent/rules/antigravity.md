---
description: Antigravity development rules
---

# Antigravity Rules

These rules must be strictly followed by AI agents working on this project.

## 0. Critical Principles
- **🚫 NO Over-Engineering**: Always choose the simplest solution that works. Do not add abstraction layers, complex patterns, or new dependencies unless absolutely necessary.
- **✋ Human Check Required**: Before adding significant complexity, refactoring core logic, or introducing new architectural patterns, YOU MUST ASK THE USER FOR PERMISSION first.

## 1. i18n Workflow (Strict)
This project uses a custom i18n implementation (`lib/i18n.ts`). Follow this workflow rigidly:
1.  **Detect**: Identify hardcoded strings in the UI components.
2.  **Add Keys**: Add translation keys to `lib/i18n.ts` for ALL 3 languages (`traditional`, `simplified`, `en`) *simultaneously*.
    - Ensure logical nesting (e.g., `component.feature.label`).
3.  **Replace**: specific string with `t('key')` in the component immediately.
4.  **Verify**: Check that no hardcoded strings remain in the file.

## 2. Code Simplicity
- One component, one responsibility.
- No deep nesting (>3 levels).
- Avoid complex `useMemo`/`useCallback` unless proving performance issues.
