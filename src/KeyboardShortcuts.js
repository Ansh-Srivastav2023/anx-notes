// import { Extension, textInputRule } from '@tiptap/core';
import { Extension, InputRule } from '@tiptap/core';

export const KeyboardShortcuts = Extension.create({
  name: 'keyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-L': () => this.editor.chain().focus().setTextAlign('left').run(),
      'Mod-Alt-E': () => this.editor.chain().focus().setTextAlign('center').run(),
      'Mod-Alt-R': () => this.editor.chain().focus().setTextAlign('right').run(),
      'Mod-Alt-J': () => this.editor.chain().focus().setTextAlign('justify').run(),

      'Mod-Alt-T': () =>
        this.editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),

      // Toggle checklist — matches Google Docs / Notion (Mod+Shift+9)
      'Mod-Shift-9': () =>
        this.editor.chain().focus().toggleTaskList().run(),

      /* Enter → soft break inside a paragraph; blank line → new paragraph */
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) return false;
        if ($from.depth !== 1) return false;
        if ($from.parent.type.name !== 'paragraph') return false;

        const parentStart = $from.start();

        const textBefore = state.doc.textBetween(
          parentStart,
          $from.pos,
          '\n',
          '\n'
        );

        if (textBefore === '') return false;

        const lastBreak = textBefore.lastIndexOf('\n');
        const onEmptyLine =
          lastBreak !== -1 && textBefore.slice(lastBreak + 1).trim() === '';

        if (onEmptyLine) {
          editor
            .chain()
            .focus()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .splitBlock()
            .run();
          return true;
        }

        return editor.chain().focus().setHardBreak().run();
      },
    };
  },

    addInputRules() {
    const startChecklist = (find) =>
      new InputRule({
        find,
        handler: ({ state, range, editor }) => {
          const { tr } = state;
          tr.delete(range.from, range.to);
          editor.view.dispatch(tr);
          editor.commands.toggleTaskList();
        },
      });

    return [
      startChecklist(/^\[\] $/),
      startChecklist(/^\[ \] $/),
    ];
  },
});