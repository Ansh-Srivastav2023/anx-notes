import { Extension } from '@tiptap/core';
import { Suggestion } from "@tiptap/suggestion";   // ✅ v3
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import SlashCommandsList from './SlashCommandsList';
import { slashCommandItems } from './slashCommandItems.jsx';

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }) => {
          const q = query.toLowerCase().trim();
          if (!q) return slashCommandItems.slice(0, 10);
          return slashCommandItems
            .filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                (item.keywords || []).some((k) => k.includes(q))
            )
            .slice(0, 10);
        },
        render: () => {
  let component;
  let popup;

  return {
    onStart: (props) => {
      component = new ReactRenderer(SlashCommandsList, {
        props,
        editor: props.editor,
      });
      if (!props.clientRect) return;

      // Decide placement before creating tippy — don't rely on flip
      const rect = props.clientRect();
      const needed = 320;                                   // approx menu height
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placement =
        spaceBelow < needed && spaceAbove > spaceBelow
          ? 'top-start'
          : 'bottom-start';

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement,                                          // <-- decided above
        maxWidth: 'none',
        popperOptions: {
          strategy: 'fixed',
          modifiers: [
            { name: 'flip', enabled: false },               // <-- we handle it
            {
              name: 'preventOverflow',
              options: {
                boundary: 'viewport',
                rootBoundary: 'viewport',
                padding: 8,
                altAxis: true,
              },
            },
          ],
        },
      });
    },
    onUpdate: (props) => {
      component.updateProps(props);
      if (!props.clientRect) return;
      popup[0].setProps({ getReferenceClientRect: props.clientRect });
    },
    onKeyDown: (props) => {
      if (props.event.key === 'Escape') {
        popup[0].hide();
        return true;
      }
      return component.ref?.onKeyDown(props) ?? false;
    },
    onExit: () => {
      popup[0].destroy();
      component.destroy();
    },
  };
},
      }),
    ];
  },
});