import { Extension } from '@tiptap/core';

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

      /* ------------------------------------------------------------------
         Enter  →  soft line break inside the current paragraph
         Enter twice (Enter on an empty line)  →  new paragraph

         Applies to any paragraph, at any nesting depth — a top-level
         paragraph, a paragraph inside a blockquote, or a paragraph inside
         a table cell all count. The one deliberate exception is list
         items: Enter there is left to ListKeymap/StarterKit's own
         "next list item" behavior instead of being intercepted here.
      ------------------------------------------------------------------ */
      Enter: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) return false;
        if ($from.parent.type.name !== 'paragraph') return false;

        // Don't intercept Enter inside a list item — let the list's own
        // Enter handling (new list item / outdent on empty item) run.
        for (let depth = $from.depth; depth > 0; depth--) {
          if ($from.node(depth).type.name === 'listItem') return false;
        }

        // start() of $from is the start of $from's own parent node,
        // whatever depth that parent happens to be at — no depth
        // assumption needed here.
        const parentStart = $from.start();

        // blockSeparator '\n', leafText '\n' — hard breaks render as '\n'
        const textBefore = state.doc.textBetween(
          parentStart,
          $from.pos,
          '\n',
          '\n'
        );

        // Nothing typed yet in this paragraph → default Enter makes a new one
        if (textBefore === '') return false;

        // Is the cursor on an "empty line" (right after a break)?
        const lastBreak = textBefore.lastIndexOf('\n');
        const onEmptyLine =
          lastBreak !== -1 && textBefore.slice(lastBreak + 1).trim() === '';

        if (onEmptyLine) {
          // Remove the trailing hard break, then split into a new paragraph
          editor
            .chain()
            .focus()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .splitBlock()
            .run();
          return true;
        }

        // Normal Enter → soft break
        return editor.chain().focus().setHardBreak().run();
      },
    };
  },
});