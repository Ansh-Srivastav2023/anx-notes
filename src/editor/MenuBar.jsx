import React, { useEffect, useRef, useState } from 'react';
import { icons } from './icons';
import { FONT_FAMILIES, FONT_SIZES } from './fontOptions';
import { toggleTaskListSmart } from './taskList';
import TablePicker from './TablePicker';

/* ---------------------------------------------------------------- */
/*  Toolbar primitives                                               */
/* ---------------------------------------------------------------- */
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

function ToolbarDropdown({
  label,
  value,
  options,
  onSelect,
  width = 132,
  previewStyle,
}) {
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


function TableSplitButton({ editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const insertTable = (rows, cols) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  };

    return (
        <div className="table-split" ref={ref}>
        <button
            type="button"
            className="tool-btn table-split-main"
            onClick={() => insertTable(3, 3)}
            title="Insert table (3 × 3)"
            aria-label="Insert table (3 × 3)"
        >
            {icons.table}
        </button>
        <button
            type="button"
            className="table-split-caret"
            aria-label="Choose table size"
            aria-expanded={open}
            title="Choose table size"
            onClick={() => setOpen((o) => !o)}
        >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
            </svg>
        </button>
        {open && (
            <TablePicker
            onSelect={(rows, cols) => {
                insertTable(rows, cols);
                setOpen(false);
            }}
            onClose={() => setOpen(false)}
            />
        )}
        </div>
    );
}

/* ---------------------------------------------------------------- */
/*  Toolbar                                                          */
/* ---------------------------------------------------------------- */
export default function MenuBar({ editor, helpBtnRef, setHelpOpen, onOpenFind }) {
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
      <ToolButton
        label="Checklist"
        active={editor.isActive('taskList')}
        onClick={() => toggleTaskListSmart(editor)}
      >
        {icons.checklist}
      </ToolButton>

      <ToolButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>{icons.quote}</ToolButton>
      <ToolButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{icons.codeBlock}</ToolButton>

      <span className="tool-sep" />

      <ToolButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>{icons.divider}</ToolButton>
    <TableSplitButton editor={editor} />

        <span className="toolbar-spacer" />

              <span className="toolbar-spacer" />

        <ToolButton
            label="Find and replace (Ctrl+F)"
            onClick={onOpenFind}
        >
            {icons.search}
        </ToolButton>

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
}