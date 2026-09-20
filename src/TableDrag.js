import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

/** Walk up the selection to find the nearest table node. */
function getTableInfo(state) {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') {
      return { node: $from.node(d), pos: $from.before(d) };
    }
  }
  return null;
}

export const TableDrag = Extension.create({
  name: 'tableDrag',

  addCommands() {
    return {
      /**
       * Move a row from index `from` to index `to`.
       * Both indices refer to the original table order.
       */
      moveRow:
        (from, to) =>
        ({ state, dispatch }) => {
          const info = getTableInfo(state);
          if (!info) return false;
          const { node: tableNode, pos: tablePos } = info;

          if (
            from === to ||
            from < 0 || to < 0 ||
            from >= tableNode.childCount ||
            to >= tableNode.childCount
          ) {
            return false;
          }

          const rows = [];
          tableNode.forEach((row) => rows.push(row));
          const [moved] = rows.splice(from, 1);
          rows.splice(to, 0, moved);

          const newTable = tableNode.type.create(
            { ...tableNode.attrs },
            rows,
            tableNode.marks
          );

          if (dispatch) {
            const tr = state.tr.replaceWith(
              tablePos,
              tablePos + tableNode.nodeSize,
              newTable
            );

            // Put the cursor back inside the moved row
            let rowStart = tablePos + 1;
            for (let i = 0; i < to; i++) rowStart += newTable.child(i).nodeSize;
            try {
              const $pos = tr.doc.resolve(
                Math.min(rowStart + 2, tr.doc.content.size - 1)
              );
              tr.setSelection(TextSelection.near($pos));
            } catch { /* ignore */ }

            dispatch(tr);
          }
          return true;
        },

      /** Move a column from index `from` to index `to` (original order). */
      moveColumn:
        (from, to) =>
        ({ state, dispatch }) => {
          const info = getTableInfo(state);
          if (!info) return false;
          const { node: tableNode, pos: tablePos } = info;

          const firstRow = tableNode.child(0);
          const colCount = firstRow.childCount;

          if (
            from === to ||
            from < 0 || to < 0 ||
            from >= colCount || to >= colCount
          ) {
            return false;
          }

          // Compute reordering once, apply to every row
          const order = [];
          for (let i = 0; i < colCount; i++) order.push(i);
          const [moved] = order.splice(from, 1);
          order.splice(to, 0, moved);

          const newRows = [];
          tableNode.forEach((row) => {
            const cells = [];
            order.forEach((oldIdx) => cells.push(row.child(oldIdx)));
            newRows.push(row.type.create({ ...row.attrs }, cells));
          });

          const newTable = tableNode.type.create(
            { ...tableNode.attrs },
            newRows,
            tableNode.marks
          );

          if (dispatch) {
            const tr = state.tr.replaceWith(
              tablePos,
              tablePos + tableNode.nodeSize,
              newTable
            );
            dispatch(tr);
          }
          return true;
        },
    };
  },
});