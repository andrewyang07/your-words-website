import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import type { SuggestionItem } from '@/lib/editorSearch';

const BibleSuggestionPluginKey = new PluginKey('bibleSuggestion');

export type BibleSuggestionOptions = {
  suggestion: Partial<SuggestionOptions<SuggestionItem>>;
};

export const BibleSuggestion = Extension.create<BibleSuggestionOptions>({
  name: 'bibleSuggestion',

  addOptions() {
    return {
      suggestion: {
        char: '@',
        allowSpaces: true,
        startOfLine: false,
        pluginKey: BibleSuggestionPluginKey,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SuggestionItem>({
        editor: this.editor,
        ...this.options.suggestion,
        pluginKey: BibleSuggestionPluginKey,
      }),
    ];
  },
});
