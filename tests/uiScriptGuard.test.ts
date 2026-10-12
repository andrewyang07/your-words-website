/**
 * Guard: UI chrome must not hard-code single-script Chinese. JSX text and user-facing attributes
 * (title / aria-label / placeholder / alt) in the scanned files may only contain characters that read the
 * same in 简 and 繁; anything script-specific must go through pick()/pickScript/ScriptText/copy maps.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import * as OpenCC from 'opencc-js';
import { describe, expect, it } from 'vitest';

const toTrad = OpenCC.Converter({ from: 'cn', to: 'tw' });
const toSimp = OpenCC.Converter({ from: 'tw', to: 'cn' });
const ATTRS = new Set(['title', 'aria-label', 'placeholder', 'alt']);

/** Files that are fully script-aware; add a file here once it is clean. */
const SCANNED = [
  'components/bible-note',
  'components/search',
  'components/navigation/SideMenu.tsx',
  'components/memorize/ReciteLinkList.tsx',
  'components/verses/VerseCard.tsx',
  'app/rankings/page.tsx',
  'app/search',
  'app/layout.tsx',
];

function listFiles(target: string): string[] {
  const abs = path.resolve(target);
  if (statSync(abs).isFile()) return [abs];
  return readdirSync(abs)
    .flatMap((name) => listFiles(path.join(target, name)))
    .filter((f) => f.endsWith('.tsx'));
}

function isScriptSpecific(text: string) {
  return /[\u3400-\u9fff]/.test(text) && (toTrad(text) !== text || toSimp(text) !== text);
}

export function findSingleScriptStrings(file: string) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: string[] = [];
  const report = (node: ts.Node, text: string) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    hits.push(`${path.relative(process.cwd(), file)}:${line + 1} ${text.trim()}`);
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && isScriptSpecific(node.text)) report(node, node.text);
    // String literals rendered directly from a JSX expression, e.g. {open ? '背诵' : '阅读'}.
    if (ts.isStringLiteralLike(node) && isScriptSpecific(node.text)) {
      const cond = ts.isConditionalExpression(node.parent) ? node.parent : null;
      const scriptBranch = cond && /language|traditional|simplified|script/i.test(cond.condition.getText());
      let parent = scriptBranch ? undefined : node.parent;
      while (
        parent &&
        (ts.isConditionalExpression(parent) || ts.isParenthesizedExpression(parent) || ts.isBinaryExpression(parent))
      ) {
        parent = parent.parent;
      }
      const owner = parent && ts.isJsxExpression(parent) ? parent.parent : undefined;
      if (owner && parent !== node.parent && (!ts.isJsxAttribute(owner) || ATTRS.has(owner.name.getText()))) {
        report(node, node.text); // conditional branch
      } else if (owner && !ts.isJsxAttribute(owner)) {
        report(node, node.text);
      }
    }
    const scriptAwareLabel =
      ts.isJsxAttribute(node) &&
      ts.isJsxAttributes(node.parent) &&
      node.parent.properties.some((p) => ts.isJsxAttribute(p) && p.name.getText() === 'data-aria-label-traditional');
    if (ts.isJsxAttribute(node) && !scriptAwareLabel && ATTRS.has(node.name.getText()) && node.initializer) {
      const init = node.initializer;
      const lit = ts.isStringLiteral(init)
        ? init
        : ts.isJsxExpression(init) && init.expression && ts.isStringLiteralLike(init.expression)
          ? init.expression
          : null;
      if (lit && isScriptSpecific(lit.text)) report(node, `${node.name.getText()}="${lit.text}"`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

describe('UI script guard', () => {
  it('has no hard-coded single-script Chinese in script-aware UI files', () => {
    const hits = SCANNED.flatMap(listFiles).flatMap(findSingleScriptStrings);
    expect(hits).toEqual([]);
  });
});
