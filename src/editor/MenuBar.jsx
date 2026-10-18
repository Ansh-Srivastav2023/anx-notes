import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { icons } from './icons';
import { FONT_FAMILIES, FONT_SIZES } from './fontOptions';
import { toggleTaskListSmart } from './taskList';
import TablePicker from './TablePicker';

/* ---------------------------------------------------------------- */
/*  Toolbar primitives                                               */
/* ---------------------------------------------------------------- */
function ToolButton({ onClick, active, disabled, label, wide, mod, children }) {
  const className = [
    'tool-btn',
    wide ? 'tool-btn--wide' : '',
    mod ? `tool-btn--${mod}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
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
  const [menuPosition, setMenuPosition] = useState(null);
  const ref = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      const trigger = ref.current?.querySelector('.tool-dropdown-trigger');
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setMenuPosition({
        left: rect.left,
        bottom: Math.max(8, window.innerHeight - rect.top + 8),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const clickedTrigger = ref.current?.contains(e.target);
      const clickedMenu = menuRef.current?.contains(e.target);
      if (!clickedTrigger && !clickedMenu) setOpen(false);
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
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tool-dropdown-label" style={previewStyle}>
          {current.label}
        </span>
        <span className="tool-dropdown-caret">{icons.chevron}</span>
      </button>

      {open && menuPosition && createPortal(
        <div
          ref={menuRef}
          className="tool-dropdown-menu tool-dropdown-menu--portal"
          role="menu"
          style={{
            minWidth: width,
            left: menuPosition.left,
            bottom: menuPosition.bottom,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value || 'default'}
              type="button"
              role="menuitem"
              className="tool-dropdown-item"
              data-selected={opt.value === value ? 'true' : 'false'}
              style={opt.style}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function applyFontFamily(editor, value) {
  const chain = editor.chain().focus();
  if (value) chain.setFontFamily(value);
  else chain.unsetFontFamily();
  const result = chain.run();
  if (editor.storage?.stickyMarks) editor.storage.stickyMarks.fontFamily = value || null;
  return result;
}

function applyFontSize(editor, value) {
  const chain = editor.chain().focus();
  if (value) chain.setFontSize(value);
  else chain.unsetFontSize();
  const result = chain.run();
  if (editor.storage?.stickyMarks) editor.storage.stickyMarks.fontSize = value || null;
  return result;
}

/* ---------------------------------------------------------------- */
/*  Toolbar                                                          */
/* ---------------------------------------------------------------- */
export default function MenuBar({
  editor,
  outlineOpen = false,
  onToggleOutline = () => {},
  readMode = false,
  onToggleReadMode = () => {},
}) {
  const [, forceRender] = useState(0);
  const [formattingOpen, setFormattingOpen] = useState(false);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const toolbarRef = useRef(null);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => forceRender((n) => n + 1);
    editor.on('transaction', update);
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  useEffect(() => {
    if (!formattingOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      const clickedToolbar = toolbarRef.current?.contains(event.target);
      const clickedDropdown = event.target instanceof Element
        && event.target.closest('.tool-dropdown-menu--portal');
      if (!clickedToolbar && !clickedDropdown) setFormattingOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [formattingOpen]);

  if (!editor) return null;

  const activeFamily = editor.getAttributes('textStyle').fontFamily || '';
  const activeSize = editor.getAttributes('textStyle').fontSize || '';

  return (
    <div ref={toolbarRef} className="toolbar" role="toolbar" aria-label="Formatting" data-expanded={formattingOpen || tablePickerOpen ? 'true' : 'false'}>
      {formattingOpen && (
        <div className="toolbar-advanced" aria-label="Advanced formatting">
          <ToolButton label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>{icons.undo}</ToolButton>
          <ToolButton label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>{icons.redo}</ToolButton>
          <span className="tool-sep" />
          <ToolbarDropdown label="Font family" value={activeFamily} options={FONT_FAMILIES} width={116} previewStyle={{ fontFamily: activeFamily || 'inherit' }} onSelect={(v) => applyFontFamily(editor, v)} />
          <ToolbarDropdown label="Font size" value={activeSize} options={FONT_SIZES} width={76} onSelect={(v) => applyFontSize(editor, v)} />
          <span className="tool-sep" />
          <ToolButton label="Heading 1" wide active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolButton>
          <ToolButton label="Heading 2" wide active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolButton>
          <ToolButton label="Heading 3" wide active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolButton>
          <span className="tool-sep" />
          <ToolButton label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>{icons.underline}</ToolButton>
          <ToolButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>{icons.strike}</ToolButton>
          <ToolButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>{icons.code}</ToolButton>
          <ToolButton label="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{icons.codeBlock}</ToolButton>
          <ToolButton label="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>{icons.quote}</ToolButton>
          <ToolButton label="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>{icons.divider}</ToolButton>
        </div>
      )}

      <div className="toolbar-primary">
        <button
          type="button"
          className="tool-btn tool-btn--format"
          data-active={formattingOpen ? 'true' : 'false'}
          aria-expanded={formattingOpen}
          aria-label="More formatting"
          title="More formatting"
          onClick={() => setFormattingOpen((open) => !open)}
        >
          Aa
        </button>
        <ToolButton label="Checklist" active={editor.isActive('taskList')} onClick={() => toggleTaskListSmart(editor)}>{icons.checklist}</ToolButton>
        <span className="toolbar-table-picker">
          <ToolButton label="Insert table" active={tablePickerOpen} onClick={() => setTablePickerOpen((open) => !open)}>{icons.table}</ToolButton>
          {tablePickerOpen && (
            <TablePicker
              onClose={() => setTablePickerOpen(false)}
              onSelect={(rows, cols) => {
                editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                setTablePickerOpen(false);
              }}
            />
          )}
        </span>
        <span className="tool-sep" />
        <ToolButton label="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>{icons.alignLeft}</ToolButton>
        <ToolButton label="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>{icons.alignCenter}</ToolButton>
        <ToolButton label="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>{icons.alignRight}</ToolButton>
        <ToolButton label="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>{icons.alignJustify}</ToolButton>
        <ToolButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>{icons.bulletList}</ToolButton>
        <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>{icons.orderedList}</ToolButton>
        <span className="tool-sep" />
        <ToolButton label={readMode ? 'Exit read mode' : 'Read mode'} active={readMode} onClick={onToggleReadMode} mod="readmode">{icons.bookOpen}</ToolButton>
        <ToolButton label={outlineOpen ? 'Hide outline' : 'Show outline'} active={outlineOpen} onClick={onToggleOutline} mod="outline">{icons.outline}</ToolButton>
      </div>
    </div>
  );
}
