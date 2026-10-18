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
import { BlockFeatures, Callout, SectionColumn, SectionGroup } from './BlockFeatures';
import { SlashCommands } from './SlashCommands';

import TableDragHandles from './TableDragHandles';
import BlockDragHandles from './BlockDragHandles';
import MenuBar from './editor/MenuBar';
import StatusBar from './editor/StatusBar';
import Outline from './editor/Outline';

const EDITOR_ZOOM_KEY = 'anx-notes.editorZoom';
const MIN_ZOOM = 70;
const MAX_ZOOM = 160;
const ZOOM_STEP = 10;

function loadEditorZoom() {
  try {
    const stored = Number.parseInt(localStorage.getItem(EDITOR_ZOOM_KEY), 10);
    return Number.isFinite(stored) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, stored)) : 100;
  } catch {
    return 100;
  }
}

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
  const [zoom, setZoom] = useState(loadEditorZoom);
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    try { localStorage.setItem(EDITOR_ZOOM_KEY, String(zoom)); } catch { /* ignore */ }
  }, [zoom]);

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
      Callout,
      SectionColumn,
      SectionGroup,
      BlockFeatures,
      TableDrag,
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
      onChange?.(editor.getHTML(), docId);
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

  useEffect(() => {
    if (!editor) return undefined;
    const revealLinkedBlock = () => {
      const hash = decodeURIComponent(window.location.hash || '');
      const params = new URLSearchParams(hash.replace(/^#/, ''));
      const linkedBlockId = params.get('block');
      const linkedBlockIndex = Number.parseInt(params.get('index'), 10);
      const targetId = linkedBlockId
        ? `block-${linkedBlockId}`
        : hash.startsWith('#block-') ? hash.slice(1) : null;
      if (!targetId && !Number.isInteger(linkedBlockIndex)) return;
      requestAnimationFrame(() => {
        const target = (targetId && document.getElementById(targetId))
          || (Number.isInteger(linkedBlockIndex)
            ? editor.view.dom.querySelector(`:scope > :nth-child(${linkedBlockIndex + 1})`)
            : null);
        target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    };
    revealLinkedBlock();
    window.addEventListener('hashchange', revealLinkedBlock);
    return () => window.removeEventListener('hashchange', revealLinkedBlock);
  }, [editor, docId]);

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
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setOutlineOpen(false);
    }
  }, [docId, outlineOpen, setOutlineOpen]);

  return (
    <div
      className="editor-shell"
      data-read-mode={readMode ? 'true' : 'false'}
      data-outline-open={outlineOpen && !readMode ? 'true' : 'false'}
      style={{ '--editor-zoom': zoom / 100 }}
    >
        <div className="toolbar-hover-zone" aria-hidden="true" />

        <MenuBar
          editor={editor}
          outlineOpen={outlineOpen}
          onToggleOutline={() => setOutlineOpen((o) => !o)}
          readMode={readMode}
          onToggleReadMode={onToggleReadMode}
        />

      <div className="editor-main">
        <div className="editor-body" ref={scrollRef}>
          <EditorContent editor={editor} />
        </div>

        {!readMode && (
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
          <BlockDragHandles editor={editor} docId={docId} />
          <StatusBar editor={editor} />
        </>
      )}

      <div className="editor-zoom" role="group" aria-label="Editor zoom">
        <button
          type="button"
          className="editor-zoom-button"
          onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
        </button>
        <button
          type="button"
          className="editor-zoom-value"
          onClick={() => setZoom(100)}
          aria-label={`Reset zoom, currently ${zoom}%`}
          title="Reset to 100%"
        >
          {zoom}%
        </button>
        <button
          type="button"
          className="editor-zoom-button"
          onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" /></svg>
        </button>
      </div>

    </div>
  );
}
