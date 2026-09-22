/**
 * Convert the current paragraph (or selection) into a task list,
 * splitting on soft breaks so each line gets its own checkbox.
 */
export function toggleTaskListSmart(editor) {
  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;
  const { paragraph, hardBreak, taskList, taskItem } = state.schema.nodes;

  // Only special-case top-level paragraphs
  if ($from.depth !== 1 || $from.parent.type.name !== 'paragraph') {
    return editor.chain().focus().toggleTaskList().run();
  }

  // Does this paragraph contain any soft breaks?
  let hasHardBreak = false;
  $from.parent.forEach((child) => {
    if (child.type === hardBreak) hasHardBreak = true;
  });

  if (!hasHardBreak) {
    return editor.chain().focus().toggleTaskList().run();
  }

  // Split the paragraph content into segments on each hard break
  const segments = [[]];
  $from.parent.forEach((child) => {
    if (child.type === hardBreak) {
      segments.push([]);
    } else {
      segments[segments.length - 1].push(child);
    }
  });

  // Build one task item per segment
  const items = segments.map((seg) =>
    taskItem.create(null, paragraph.create(null, seg))
  );
  const list = taskList.create(null, items);

  // Replace the original paragraph with the new task list
  const paraStart = $from.before(1);
  const paraEnd = paraStart + $from.parent.nodeSize;

  editor.view.dispatch(state.tr.replaceWith(paraStart, paraEnd, list));
  return true;
}