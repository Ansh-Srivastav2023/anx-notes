import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { ListKeymap } from '@tiptap/extension-list-keymap';
import TextAlign from '@tiptap/extension-text-align';

import { FontSize } from './FontSize';
import { Shortcuts } from './Shortcuts';
import ShortcutsHelp from './ShortcutsHelp';
import { TableDrag } from './TableDrag';
import TableDragHandles from './TableDragHandles';
import { StickyMarks } from './StickyMarks';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { BlockDrag } from './BlockDrag';
import BlockDragHandles from './BlockDragHandles';
import { SlashCommands } from './SlashCommands';
/* ---------------------------------------------------------------- */
/*  Icons & Primitives                                               */
/* ---------------------------------------------------------------- */
function Icon({ children }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  undo: (<Icon><path d="M9 14 4 9l5-5" /><path d="M4 9h10a5 5 0 0 1 0 10h-3" /></Icon>),
  redo: (<Icon><path d="m15 14 5-5-5-5" /><path d="M20 9H10a5 5 0 0 0 0 10h3" /></Icon>),
  bold: (<Icon><path d="M6 4h7a4 4 0 0 1 0 8H6z" /><path d="M6 12h8a4 4 0 0 1 0 8H6z" /></Icon>),
  italic: (<Icon><path d="M19 4h-9" /><path d="M14 20H5" /><path d="M15 4 9 20" /></Icon>),
  underline: (<Icon><path d="M6 4v7a6 6 0 0 0 12 0V4" /><path d="M5 21h14" /></Icon>),
  strike: (<Icon><path d="M4 12h16" /><path d="M17 7a4 4 0 0 0-4-3h-2a4 4 0 0 0-1 7.9" /><path d="M7 17a4 4 0 0 0 4 3h2a4 4 0 0 0 1-7.9" /></Icon>),
  code: (<Icon><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></Icon>),
  bulletList: (<Icon><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></Icon>),
  orderedList: (<Icon><path d="M10 6h10" /><path d="M10 12h10" /><path d="M10 18h10" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></Icon>),
  quote: (<Icon><path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3" /><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3" /></Icon>),
  codeBlock: (<Icon><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m10 14-3-2 3-2" /><path d="m14 10 3 2-3 2" /></Icon>),
  table: (<Icon><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Icon>),
  divider: (<Icon><path d="M4 12h16" /><path d="M8 7h8" /><path d="M8 17h8" /></Icon>),
  chevron: (<Icon><path d="m6 9 6 6 6-6" /></Icon>),
  help: (<Icon><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></Icon>),
  alignLeft: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="18" y2="18" /></Icon>),
  alignCenter: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="5" y1="18" x2="19" y2="18" /></Icon>),
  alignRight: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="6" y1="18" x2="20" y2="18" /></Icon>),
  alignJustify: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></Icon>),
};

const FONT_FAMILIES = [
  { value: '', label: 'Default Font', style: { fontFamily: 'inherit' } },
  { value: 'Inter', label: 'Sans', style: { fontFamily: 'Inter, sans-serif' } },
  { value: 'Georgia', label: 'Serif', style: { fontFamily: 'Georgia, serif' } },
  { value: '"JetBrains Mono"', label: 'Mono', style: { fontFamily: '"JetBrains Mono", monospace' } },
  { value: 'Caveat', label: 'Hand', style: { fontFamily: 'Caveat, cursive' } },
  { value: 'Kalam', label: 'Kalam', style: { fontFamily: 'Kalam, serif' } },
  { value: '"Comic Sans MS"', label: 'Comic', style: { fontFamily: '"Comic Sans MS", cursive' } },
  { value: '"Times New Roman"', label: 'Times', style: { fontFamily: '"Times New Roman", serif' } },
];

const FONT_SIZES = [
  { value: '', label: 'Default Size' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '15px', label: '15' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '30px', label: '30' },
];

function ToolButton({ onClick, active, disabled, label, wide, children }) {
  return (
    <button
      type="button"
      className={wide ? 'tool-btn tool-btn--wide' : 'tool-btn'}
      data-active={active ? 'true' : 'false'}
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function ToolbarDropdown({ label, value, options, onSelect, width = 132, previewStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div className="tool-dropdown" ref={ref}>
      <button
        type="button"
        className="tool-dropdown-trigger"
        style={{ width }}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tool-dropdown-label" style={previewStyle}>
          {current.label}
        </span>
        <span className="tool-dropdown-caret">{icons.chevron}</span>
      </button>

      {open && (
        <div className="tool-dropdown-menu" role="menu" style={{ minWidth: width }}>
          {options.map((opt) => (
            <button
              key={opt.value || 'default'}
              type="button"
              role="menuitem"
              className="tool-dropdown-item"
              data-selected={opt.value === value ? 'true' : 'false'}
              style={opt.style}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Toolbar                                                          */
/* ---------------------------------------------------------------- */
const MenuBar = ({ editor, helpBtnRef, setHelpOpen }) => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => forceRender((n) => n + 1);
    editor.on('transaction', update);
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor) return null;

  const activeFamily = editor.getAttributes('textStyle').fontFamily || '';
  const activeSize = editor.getAttributes('textStyle').fontSize || '';

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <ToolButton
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        {icons.undo}
      </ToolButton>
      <ToolButton
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        {icons.redo}
      </ToolButton>

      <span className="tool-sep" />

      <ToolbarDropdown
        label="Font family"
        value={activeFamily}
        options={FONT_FAMILIES}
        width={120}
        previewStyle={{ fontFamily: activeFamily || 'inherit' }}
        onSelect={(v) => editor.chain().focus().setStickyFontFamily(v).run()}
      />
      <ToolbarDropdown
        label="Font size"
        value={activeSize}
        options={FONT_SIZES}
        width={86}
        onSelect={(v) => editor.chain().focus().setStickyFontSize(v).run()}
      />

      <span className="tool-sep" />

      <ToolButton label="Heading 1" wide active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolButton>
      <ToolButton label="Heading 2" wide active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolButton>
      <ToolButton label="Heading 3" wide active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolButton>

      <span className="tool-sep" />

      <ToolButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>{icons.bold}</ToolButton>
      <ToolButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>{icons.italic}</ToolButton>
      <ToolButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>{icons.underline}</ToolButton>
      <ToolButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>{icons.strike}</ToolButton>
      <ToolButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>{icons.code}</ToolButton>

      <span className="tool-sep" />

      <ToolButton label="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>{icons.alignLeft}</ToolButton>
      <ToolButton label="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>{icons.alignCenter}</ToolButton>
      <ToolButton label="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>{icons.alignRight}</ToolButton>
      <ToolButton label="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>{icons.alignJustify}</ToolButton>

      <span className="tool-sep" />

      <ToolButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>{icons.bulletList}</ToolButton>
      <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>{icons.orderedList}</ToolButton>
      <ToolButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>{icons.quote}</ToolButton>
      <ToolButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{icons.codeBlock}</ToolButton>

      <span className="tool-sep" />

      <ToolButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>{icons.divider}</ToolButton>
      <ToolButton
        label="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        {icons.table}
      </ToolButton>

      <span className="toolbar-spacer" />

      <span ref={helpBtnRef} style={{ display: 'inline-flex' }}>
        <ToolButton
          label="Keyboard shortcuts (Ctrl+/)"
          onClick={() => setHelpOpen((o) => !o)}
        >
          {icons.help}
        </ToolButton>
      </span>
    </div>
  );
};

/* ---------------------------------------------------------------- */
/*  Status bar                                                       */
/* ---------------------------------------------------------------- */
const StatusBar = ({ editor }) => {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => forceRender((n) => n + 1);
    editor.on('transaction', update);
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor) return null;

  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  return (
    <div className="status-bar">
      <span>
        {words} {words === 1 ? 'word' : 'words'} · {chars}{' '}
        {chars === 1 ? 'character' : 'characters'}
      </span>
      <span className="status-hint">
        Shortcuts: <code>--&gt;</code> <code>&lt;--</code> <code>=&gt;</code>{' '}
        <code>...</code> <code>!=</code> <code>1/2</code> · <kbd>Ctrl</kbd>+<kbd>/</kbd> for all
      </span>
    </div>
  );
};

/* ---------------------------------------------------------------- */
/*  Main Editor                                                      */
/* ---------------------------------------------------------------- */
export default function SlackEditor({
  initialContent = '',
  onChange,
  helpOpen = false,
  setHelpOpen = () => {},
}) {
  const scrollRef = useRef(null);
  const helpBtnRef = useRef(null);

  /* 1. Create the editor FIRST so `editor` is defined below */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: true,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      StickyMarks,
      FontFamily.configure({ types: ['textStyle'] }),
      FontSize,
      Shortcuts,
      ListKeymap,
      BlockDrag,
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
      SlashCommands,
      TableCell,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  /* 2. Ctrl/Cmd + / opens the shortcuts help */
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

  /* 3. Tab / Shift+Tab — capture-phase handler that beats WKWebView */
  useEffect(() => {
    if (!editor) return undefined;

    const onKeyDown = (e) => {
      const isTab =
        e.key === 'Tab' ||
        e.key === 'ISO_Left_Tab' ||
        e.code === 'Tab';
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

      // Not in a list: let Shift+Tab do its normal focus-backwards thing
      if (isShiftTab) return;

      // Plain Tab outside a list — keep focus in the editor
      e.preventDefault();
      e.stopPropagation();
      editor.chain().focus().insertContent('\u00A0\u00A0\u00A0\u00A0').run();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [editor]);

  return (
    <div className="editor-shell">
      <MenuBar editor={editor} helpBtnRef={helpBtnRef} setHelpOpen={setHelpOpen} />

      <div className="editor-body" ref={scrollRef}>
        <EditorContent editor={editor} />
      </div>

      <TableDragHandles editor={editor} />
      <BlockDragHandles editor={editor} />
      <StatusBar editor={editor} />

      <ShortcutsHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        anchorRef={helpBtnRef}
      />
    </div>
  );
}