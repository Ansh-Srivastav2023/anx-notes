import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import TextAlign from '@tiptap/extension-text-align';

import { FontSize } from './FontSize';
import { Shortcuts } from './Shortcuts';
import { TableDrag } from './TableDrag';
import { StickyMarks } from './StickyMarks';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { BlockDrag } from './BlockDrag';
import { SlashCommands } from './SlashCommands';

import ShortcutsHelp from './ShortcutsHelp';
import TableDragHandles from './TableDragHandles';
import BlockDragHandles from './BlockDragHandles';
import MenuBar from './editor/MenuBar';
import StatusBar from './editor/StatusBar';
import Outline from './editor/Outline';

import { FindReplace } from './editor/FindReplaceExtension';
import FindReplaceBar from './editor/FindReplace';

export default function SlackEditor({
  docId,
  initialContent = '',
  onChange,
  initialSelection,
  onSelectionChange,
  helpOpen = false,
  setHelpOpen = () => {},
  readMode = false,
  onToggleReadMode = () => {},
  outlineOpen = false,
  setOutlineOpen = () => {},
}) {
  const scrollRef = useRef(null);
  const helpBtnRef = useRef(null);
  const [findOpen, setFindOpen] = useState(false);

  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  const restoredEditorsRef = useRef(new WeakSet());

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: true,
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      StickyMarks,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      Shortcuts,
      BlockDrag,
      TableDrag,
      FindReplace,
      KeyboardShortcuts,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'tableCell', 'tableHeader'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Placeholder.configure({
        placeholder: 'Start typing your note…  Try # for a heading or - for a list',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'task-item' },
      }),
      SlashCommands,
      TableCell,
    ],
    editorProps: {
      attributes: {
        spellcheck: 'false',
      },
    },
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      if (!restoredEditorsRef.current.has(editor)) return;
      try {
        onSelectionChangeRef.current?.({
          from: editor.state.selection.from,
          to: editor.state.selection.to,
        });
      } catch { /* ignore */ }
    },
  });

  /* Toggle editability when read mode changes */
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readMode);
  }, [editor, readMode]);

  useLayoutEffect(() => {
    if (!editor) return;
    if (restoredEditorsRef.current.has(editor)) return;

    if (!initialSelection) {
      restoredEditorsRef.current.add(editor);
      return;
    }

    const maxPos = editor.state.doc.content.size;
    const from = Math.max(0, Math.min(initialSelection.from ?? 0, maxPos));
    const to = Math.max(from, Math.min(initialSelection.to ?? from, maxPos));

    try {
      editor.commands.setTextSelection({ from, to });
    } catch {
      restoredEditorsRef.current.add(editor);
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          const dom = editor.view.domAtPos(from).node;
          const el = dom?.nodeType === 1 ? dom : dom?.parentElement;
          el?.scrollIntoView({ block: 'center', behavior: 'instant' });
        } catch { /* ignore */ }
        restoredEditorsRef.current.add(editor);
      });
    });
  }, [editor, initialSelection]);

  useLayoutEffect(() => {
    if (!editor) return undefined;
    return () => {
      try {
        onSelectionChangeRef.current?.({
          from: editor.state.selection.from,
          to: editor.state.selection.to,
        });
      } catch { /* ignore */ }
    };
  }, [editor]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setHelpOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setHelpOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        e.stopPropagation();
        setFindOpen(true);
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    if (!editor) return undefined;

    const onKeyDown = (e) => {
      const isTab =
        e.key === 'Tab' || e.key === 'ISO_Left_Tab' || e.code === 'Tab';
      if (!isTab) return;

      const target = e.target;
      if (!target || typeof target.closest !== 'function') return;
      if (!target.closest('.ProseMirror')) return;

      const isShiftTab = e.shiftKey || e.key === 'ISO_Left_Tab';
      const inList =
        editor.isActive('listItem') || editor.isActive('taskItem');

      if (inList) {
        e.preventDefault();
        e.stopPropagation();
        if (isShiftTab) {
          editor.chain().focus().liftListItem('listItem').run();
        } else {
          editor.chain().focus().sinkListItem('listItem').run();
        }
        return;
      }

      if (isShiftTab) return;

      e.preventDefault();
      e.stopPropagation();
      editor.chain().focus().insertContent('\u00A0\u00A0\u00A0\u00A0').run();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [editor]);

  useEffect(() => {
    if (!outlineOpen) return;
    // Close if the viewport is phone-sized
    if (typeof window !== 'undefined' && window.innerWidth <= 640) {
      setOutlineOpen(false);
    }
  }, [docId, outlineOpen, setOutlineOpen]);

  return (
    <div className="editor-shell" data-read-mode={readMode ? 'true' : 'false'}>
      <FindReplaceBar
        editor={editor}
        open={findOpen}
        onClose={() => setFindOpen(false)}
      />

        <MenuBar
          editor={editor}
          helpBtnRef={helpBtnRef}
          setHelpOpen={setHelpOpen}
          onOpenFind={() => setFindOpen(true)}
          outlineOpen={outlineOpen}
          onToggleOutline={() => setOutlineOpen((o) => !o)}
          readMode={readMode}
          onToggleReadMode={onToggleReadMode}
        />

      <div className="editor-main">
        <div className="editor-body" ref={scrollRef}>
          <EditorContent editor={editor} />
        </div>

        {outlineOpen && !readMode && (
          <Outline
            editor={editor}
            open={outlineOpen}
            onClose={() => setOutlineOpen(false)}
          />
        )}
      </div>

      {!readMode && (
        <>
          <TableDragHandles editor={editor} />
          <BlockDragHandles editor={editor} />
          <StatusBar editor={editor} />
        </>
      )}

      <ShortcutsHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        anchorRef={helpBtnRef}
      />
    </div>
  );
}