import React, { useEffect, useMemo, useRef, useState } from 'react';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function CommandPalette({
  open,
  onClose,
  documents,
  currentDocId,
  actions,
  onSelectDocument,
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo(() => {
    const q = query.toLowerCase().trim();

    const docItems = documents
      .filter((d) => !d.deletedAt)
      .slice(0, 40)
      .filter((d) => !q || (d.title || '').toLowerCase().includes(q))
      .map((d) => ({
        id: `doc:${d.id}`,
        category: 'Documents',
        title: d.title || 'Untitled note',
        subtitle: d.id === currentDocId ? 'Current' : undefined,
        run: () => {
          onSelectDocument(d.id);
          onClose();
        },
      }));

    const actionItems = actions
      .filter((a) => {
        if (!q) return true;
        const title = (a.title || '').toLowerCase();
        const kws = (a.keywords || []).join(' ').toLowerCase();
        return title.includes(q) || kws.includes(q);
      })
      .map((a) => ({
        id: `act:${a.id}`,
        category: 'Actions',
        title: a.title,
        subtitle: a.hint,
        run: () => {
          a.run();
          onClose();
        },
      }));

    return [...actionItems, ...docItems];
  }, [query, documents, currentDocId, actions, onSelectDocument, onClose]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  /* Keep the highlighted item visible */
  useEffect(() => {
    if (!open) return;
    const container = listRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-idx="${selected}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selected, open]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[selected]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  const grouped = items.reduce((acc, item, idx) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ ...item, idx });
    return acc;
  }, {});

  return (
    <div className="palette-backdrop" onClick={onClose} role="presentation">
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="palette-search">
          <span className="palette-search-icon"><SearchIcon /></span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents and commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <kbd className="palette-kbd">Esc</kbd>
        </div>

        <div className="palette-list" ref={listRef}>
          {items.length === 0 && (
            <div className="palette-empty">
              {query ? `No matches for "${query}"` : 'Nothing to show'}
            </div>
          )}

          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category} className="palette-group">
              <div className="palette-group-title">{category}</div>
              {catItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="palette-item"
                  data-idx={item.idx}
                  data-selected={item.idx === selected ? 'true' : 'false'}
                  onMouseEnter={() => setSelected(item.idx)}
                  onClick={item.run}
                >
                  <span className="palette-item-title">{item.title}</span>
                  {item.subtitle && (
                    <span className="palette-item-subtitle">{item.subtitle}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="palette-footer">
          <kbd className="palette-kbd">↑</kbd>
          <kbd className="palette-kbd">↓</kbd>
          <span>navigate</span>
          <kbd className="palette-kbd">↵</kbd>
          <span>select</span>
        </div>
      </div>
    </div>
  );
}