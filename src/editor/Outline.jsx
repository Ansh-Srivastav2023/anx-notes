import React, { useEffect, useState } from 'react';

export default function Outline({ editor, open, onClose }) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => forceRender((n) => n + 1);
    editor.on('transaction', update);
    return () => { editor.off('transaction', update); };
  }, [editor]);

  if (!open || !editor) return null;

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

  const jumpTo = (pos) => {
    try {
      editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
    } catch { /* ignore */ }
  };

  return (
    <aside className="outline" aria-label="Document outline">
      <header className="outline-header">
        <span className="outline-title">Outline</span>
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
        {headings.length === 0 ? (
          <div className="outline-empty">
            Add headings (H1, H2, H3) to build an outline.
          </div>
        ) : (
          headings.map((h, i) => (
            <button
              key={`${h.pos}-${i}`}
              type="button"
              className="outline-item"
              data-level={h.level}
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