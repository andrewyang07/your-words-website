import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';

const TS_FILES = ['**/*.{ts,tsx,mts,cts}'];

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/pagefind',
      'public/pagefind/**',
      '.pagefind-source',
      '.pagefind-source/**',
      '.verify/**',
      'next-env.d.ts',
      'public/sw.js',
    ],
  },
  ...nextVitals,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      // React Compiler-oriented rules: the app does not use the compiler; these flag idiomatic code.
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'import/no-cycle': ['error', { ignoreExternal: true }],
      'import/no-self-import': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index'], 'object', 'type'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'never',
        },
      ],
    },
  },
  {
    // CLI scripts print progress to stdout.
    files: ['scripts/**', '.cursor/**'],
    rules: { 'no-console': 'off' },
  },
  // Type-aware TypeScript rules (typescript-eslint "recommended-type-checked" subset that catches real bugs).
  {
    files: TS_FILES,
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false, arguments: false } }],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false }],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  prettier,
];

export default config;
