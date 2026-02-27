import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance } from 'tippy.js';
import BibleSuggestionList, { type BibleSuggestionListRef } from './BibleSuggestionList';
import SlashCommandList, { type SlashCommandListRef } from './SlashCommandList';

export interface SuggestionPopupRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export function renderSuggestionPopup(type: 'bible' | 'slash') {
  let component: ReactRenderer | null = null;
  let popup: Instance[] | null = null;

  return {
    onStart: (props: any) => {
      const Component = type === 'bible' ? BibleSuggestionList : SlashCommandList;

      component = new ReactRenderer(Component as any, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) return;

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        maxWidth: 'none',
      });
    },

    onUpdate: (props: any) => {
      component?.updateProps(props);

      if (popup?.[0] && props.clientRect) {
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      }
    },

    onKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        popup?.[0]?.hide();
        return true;
      }

      const ref = component?.ref as SuggestionPopupRef | null;
      return ref?.onKeyDown(props) ?? false;
    },

    onExit: () => {
      popup?.[0]?.destroy();
      component?.destroy();
    },
  };
}
