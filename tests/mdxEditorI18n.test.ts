import { describe, expect, it } from 'vitest';
import { createMdxEditorTranslation } from '@/lib/mdxEditorI18n';

describe('createMdxEditorTranslation', () => {
  it('localizes block type chrome for traditional Chinese', () => {
    const t = createMdxEditorTranslation('traditional');
    expect(t('toolbar.blockTypeSelect.placeholder', 'Block type')).toBe('區塊類型');
    expect(t('toolbar.blockTypes.paragraph', 'Paragraph')).toBe('段落');
    expect(t('toolbar.blockTypes.heading', 'Heading {{level}}', { level: 2 })).toBe('標題 2');
  });

  it('localizes block type chrome for simplified Chinese', () => {
    const t = createMdxEditorTranslation('simplified');
    expect(t('toolbar.blockTypeSelect.placeholder', 'Block type')).toBe('块类型');
    expect(t('toolbar.blockTypes.heading', 'Heading {{level}}', { level: 3 })).toBe('标题 3');
  });

  it('falls back to defaultValue for unknown keys', () => {
    const t = createMdxEditorTranslation('traditional');
    expect(t('toolbar.unknown', 'Fallback')).toBe('Fallback');
  });
});
