import { Extension } from '@tiptap/core';

/**
 * Remembers the last font family / size chosen and re-applies it
 * whenever the cursor enters an empty textblock (paragraph, heading,
 * or empty table cell). This gives the editor a "current typing
 * style" feel — like Word or Google Docs.
 */
export const StickyMarks = Extension.create({
  name: 'stickyMarks',

  addStorage() {
    return {
      fontFamily: null,
      fontSize: null,
    };
  },

  onCreate() {
    const editor = this.editor;

    editor.on('selectionUpdate', () => {
      const { state } = editor;
      const { selection } = state;
      const { empty, $from } = selection;

      // Only react to collapsed cursors
      if (!empty) return;

      const parent = $from.parent;
      if (!parent.isTextblock) return;

      // Only when the block is still empty
      if (parent.content.size > 0) return;

      const { fontFamily, fontSize } = editor.storage.stickyMarks;

      // Nothing sticky to apply
      if (!fontFamily && !fontSize) return;

      const attrs = editor.getAttributes('textStyle');
      const chain = editor.chain();

      let needsRun = false;
      if (fontFamily && attrs.fontFamily !== fontFamily) {
        chain.setFontFamily(fontFamily);
        needsRun = true;
      }
      if (fontSize && attrs.fontSize !== fontSize) {
        chain.setFontSize(fontSize);
        needsRun = true;
      }
      if (needsRun) chain.run();
    });
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