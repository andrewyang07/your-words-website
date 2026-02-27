import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import type { SlashCommandItem } from './SlashCommandList';

const SlashCommandPluginKey = new PluginKey('slashCommand');

export type SlashCommandOptions = {
  suggestion: Partial<SuggestionOptions<SlashCommandItem>>;
};

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: false,
        startOfLine: true,
        pluginKey: SlashCommandPluginKey,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        ...this.options.suggestion,
        pluginKey: SlashCommandPluginKey,
      }),
    ];
  },
});
