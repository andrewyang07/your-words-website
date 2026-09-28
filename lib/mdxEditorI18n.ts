import type { Translation } from '@mdxeditor/editor';
import type { Language } from '@/types/verse';

type Dictionary = Record<string, string>;

const traditional: Dictionary = {
  'toolbar.blockTypeSelect.placeholder': '區塊類型',
  'toolbar.blockTypeSelect.selectBlockTypeTooltip': '選擇區塊類型',
  'toolbar.blockTypes.paragraph': '段落',
  'toolbar.blockTypes.quote': '引用',
  'toolbar.blockTypes.heading': '標題 {{level}}',
  'toolbar.bold': '粗體',
  'toolbar.removeBold': '取消粗體',
  'toolbar.italic': '斜體',
  'toolbar.removeItalic': '取消斜體',
  'toolbar.underline': '底線',
  'toolbar.removeUnderline': '取消底線',
  'toolbar.bulletedList': '無序列表',
  'toolbar.numberedList': '有序列表',
  'toolbar.checkList': '待辦列表',
  'toolbar.link': '建立連結',
  'toolbar.thematicBreak': '插入分隔線',
  'toolbar.undo': '復原 {{shortcut}}',
  'toolbar.redo': '重做 {{shortcut}}',
  'toolbar.toggleGroup': '切換群組',
  'dialog.close': '關閉對話框',
};

const simplified: Dictionary = {
  'toolbar.blockTypeSelect.placeholder': '块类型',
  'toolbar.blockTypeSelect.selectBlockTypeTooltip': '选择块类型',
  'toolbar.blockTypes.paragraph': '段落',
  'toolbar.blockTypes.quote': '引用',
  'toolbar.blockTypes.heading': '标题 {{level}}',
  'toolbar.bold': '粗体',
  'toolbar.removeBold': '取消粗体',
  'toolbar.italic': '斜体',
  'toolbar.removeItalic': '取消斜体',
  'toolbar.underline': '下划线',
  'toolbar.removeUnderline': '取消下划线',
  'toolbar.bulletedList': '无序列表',
  'toolbar.numberedList': '有序列表',
  'toolbar.checkList': '待办列表',
  'toolbar.link': '创建链接',
  'toolbar.thematicBreak': '插入分隔线',
  'toolbar.undo': '撤销 {{shortcut}}',
  'toolbar.redo': '重做 {{shortcut}}',
  'toolbar.toggleGroup': '切换分组',
  'dialog.close': '关闭对话框',
};

function applyInterpolations(template: string, interpolations?: Record<string, unknown>): string {
  if (!interpolations) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = interpolations[key];
    return value == null ? '' : String(value);
  });
}

export function createMdxEditorTranslation(language: Language): Translation {
  const dict = language === 'simplified' ? simplified : traditional;
  return (key, defaultValue, interpolations) => {
    const template = dict[key] ?? defaultValue;
    return applyInterpolations(template, interpolations);
  };
}
