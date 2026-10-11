#!/usr/bin/env node
/**
 * Guard: Tailwind 3 silently drops color opacity modifiers that are not on the theme's opacity
 * scale (e.g. `dark:bg-gray-950/82` generates no CSS). Fails on any `/NN` modifier not in the scale.
 * Use an arbitrary value instead: `bg-gray-950/[.82]`.
 *
 * Usage: node scripts/check-tailwind-opacity.mjs [dir ...]   (default: app components lib stores pages)
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
// tailwind.config.ts does not extend `opacity`, so the default theme scale is the real scale.
export const OPACITY_SCALE = new Set(Object.keys(require('tailwindcss/defaultTheme').opacity));

const COLOR_UTILITIES =
  'bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|divide|from|via|to|fill|stroke|decoration|placeholder|accent|caret|shadow';
// e.g. dark:hover:bg-gray-950/82, border-amber-200/12, bg-white/86, text-bible-700/5
const CLASS_PATTERN = new RegExp(
  String.raw`(?<![\w/-])((?:[\w-]+:)*-?(?:${COLOR_UTILITIES})-(?:[a-z]+(?:-\d{2,3})?|\[[^\]\s]+\]))\/(\d+)(?![\w.\]%])`,
  'g',
);

export function findOffScaleOpacity(source) {
  const hits = [];
  source.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(CLASS_PATTERN)) {
      if (!OPACITY_SCALE.has(match[2])) hits.push({ line: index + 1, className: `${match[1]}/${match[2]}` });
    }
  });
  return hits;
}

const EXTENSIONS = /\.(?:[cm]?[jt]sx?|mdx|html|css)$/;
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.test(entry)) yield full;
  }
}

export function scan(dirs) {
  const problems = [];
  for (const dir of dirs.filter((candidate) => existsSync(candidate))) {
    for (const file of walk(dir)) {
      for (const hit of findOffScaleOpacity(readFileSync(file, 'utf8'))) problems.push({ file, ...hit });
    }
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['app', 'components', 'lib', 'stores', 'pages'];
  const problems = scan(dirs);
  for (const { file, line, className } of problems) {
    console.error(
      `${file}:${line}  ${className}  — not on the Tailwind opacity scale; use /[.${className.split('/').pop().padStart(2, '0')}]`,
    );
  }
  if (problems.length) {
    console.error(`\n${problems.length} off-scale opacity modifier(s). Allowed: ${[...OPACITY_SCALE].join(', ')}`);
    process.exit(1);
  }
  console.log('tailwind opacity modifiers: OK');
}
