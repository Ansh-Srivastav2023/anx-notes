import { Extension } from '@tiptap/core';

export const StickyMarks = Extension.create({
  name: 'stickyMarks',

  addStorage() {
    return {
      fontFamily: null,
      fontSize: null,
    };
  },

  onTransaction({ editor, transaction }) {
    // Only process if selection actually changed
    if (!transaction.selectionSet) return;

    const { state } = editor;
    const { selection } = state;
    const { empty, $from } = selection;

    if (!empty) return;

    const parent = $from.parent;

    // Must be inside an editable textblock (paragraph, heading, table cell wrapper)
    if (!parent.isTextblock) return;

    // Check if current node is a code block or has code mark
    const isCode = parent.type.name === 'codeBlock' || $from.marks().some(m => m.type.name === 'code');
    if (isCode) return;

    const { fontFamily, fontSize } = editor.storage.stickyMarks;
    if (!fontFamily && !fontSize) return;

    // Get current active attributes at cursor
    const attrs = editor.getAttributes('textStyle');
    let chain = editor.chain();
    let needsRun = false;

    // Re-apply sticky font family if missing
    if (fontFamily && attrs.fontFamily !== fontFamily) {
      chain = chain.setFontFamily(fontFamily);
      needsRun = true;
    }

    // Re-apply sticky font size if missing
    if (fontSize && attrs.fontSize !== fontSize) {
      chain = chain.setFontSize(fontSize);
      needsRun = true;
    }

    if (needsRun) {
      // Use queueMicrotask to ensure state transaction finishes clean
      queueMicrotask(() => {
        chain.run();
      });
    }
  },

  addCommands() {
    return {
      setStickyFontFamily:
        (fontFamily) =>
        ({ editor, commands }) => {
          editor.storage.stickyMarks.fontFamily = fontFamily || null;
          return fontFamily
            ? commands.setFontFamily(fontFamily)
            : commands.unsetFontFamily();
        },

      setStickyFontSize:
        (fontSize) =>
        ({ editor, commands }) => {
          editor.storage.stickyMarks.fontSize = fontSize || null;
          return fontSize
            ? commands.setFontSize(fontSize)
            : commands.unsetFontSize();
        },
    };
  },
});