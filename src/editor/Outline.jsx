import React, { useEffect, useState } from 'react';

export default function Outline({ editor, open, onClose }) {
  const [, forceRender] = useState(0);
  const [activePos, setActivePos] = useState(null);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => {
      forceRender((n) => n + 1);
      const { $from } = editor.state.selection;
      for (let depth = $from.depth; depth > 0; depth--) {
        if ($from.node(depth).type.name === 'heading') {
          setActivePos($from.before(depth));
          return;
        }
      }
    };
    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    update();
    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  useEffect(() => {
    if (!open || !editor) return undefined;
    const scrollParent = editor.view.dom.closest('.editor-body');
    if (!scrollParent) return undefined;
    const updateFromScroll = () => {
      const marker = scrollParent.getBoundingClientRect().top + 100;
      let closest = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'heading') return;
        const dom = editor.view.nodeDOM(pos);
        const top = dom?.nodeType === 1 ? dom.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
        if (top <= marker) closest = pos;
      });
      if (closest !== null) setActivePos(closest);
    };
    scrollParent.addEventListener('scroll', updateFromScroll, { passive: true });
    updateFromScroll();
    return () => scrollParent.removeEventListener('scroll', updateFromScroll);
  }, [editor, open]);

  if (!editor) return null;

  const headings = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level,
        text: node.textContent?.trim() || 'Untitled heading',
        pos,
      });
    }
  });

  const titleHeading = headings.find((heading) => heading.level === 1);
  const outlineHeadings = titleHeading ? headings.filter((heading) => heading.pos !== titleHeading.pos) : headings;

  const jumpTo = (pos) => {
    try {
      editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
      setActivePos(pos);
    } catch { /* ignore */ }
  };

  return (
    <aside
      className="outline"
      data-open={open ? 'true' : 'false'}
      aria-label="Document outline"
      aria-hidden={!open}
    >
      <header className="outline-header">
        <span className="outline-title">{titleHeading?.text || 'Document outline'}</span>
        <button
          type="button"
          className="outline-close"
          onClick={onClose}
          aria-label="Close outline"
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div className="outline-body">
        {outlineHeadings.length === 0 ? (
          <div className="outline-empty">
            Add headings (H1, H2, H3) to build an outline.
          </div>
        ) : (
          outlineHeadings.map((h, i) => (
            <button
              key={`${h.pos}-${i}`}
              type="button"
              className="outline-item"
              data-level={h.level}
              data-active={activePos === h.pos ? 'true' : 'false'}
              onClick={() => jumpTo(h.pos)}
              title={h.text}
            >
              {h.text}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
