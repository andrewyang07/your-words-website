import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import type { SuggestionItem } from '@/lib/editorSearch';

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
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SuggestionItem>({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
