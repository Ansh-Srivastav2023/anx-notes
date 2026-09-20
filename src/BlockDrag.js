import { Extension } from '@tiptap/core';

export const BlockDrag = Extension.create({
  name: 'blockDrag',

  addCommands() {
    return {
      /**
       * Move a top-level block from index `from` to index `to`.
       * Indices refer to children of the document (doc.childAt(i)).
       */
      moveBlock:
        (from, to) =>
        ({ state, dispatch }) => {
          const { doc } = state;

          if (from === to) return false;
          if (from < 0 || to < 0) return false;
          if (from >= doc.childCount) return false;
          if (to > doc.childCount) return false;

          const nodes = [];
          doc.forEach((node) => nodes.push(node));
          const [moved] = nodes.splice(from, 1);
          nodes.splice(to, 0, moved);

          if (dispatch) {
            const tr = state.tr.replaceWith(0, doc.content.size, nodes);
            dispatch(tr);
          }
          return true;
        },
    };
  },
});