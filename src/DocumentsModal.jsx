import React, { useEffect, useMemo, useRef, useState } from 'react';
import { stripHtml } from './storage';

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

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* Highlight every occurrence of `q` inside `text` */
function Highlight({ text, query }) {
  if (!query) return text;
  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  const parts = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="docs-modal-mark">
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    i = idx + q.length;
  }
  return parts;
}

/* Build a short snippet around the first match */
function buildSnippet(html, query) {
  const plain = stripHtml(html || '');
  if (!query) return plain.slice(0, 120);
  const idx = plain.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return plain.slice(0, 120);
  const start = Math.max(0, idx - 30);
  return (start > 0 ? '… ' : '') + plain.slice(start, start + 120);
}

export default function DocumentsModal({
  open,
  onClose,
  documents,
  currentDocId,
  onSelect,
  onRename,
  onDelete,
  onRestore,
  onDeleteForever,
  onEmptyTrash,
  onNewDocument,
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all'); // 'all' | 'trash'
  const [renamingId, setRenamingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const renameRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (renamingId && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renamingId]);

  /* Reset tab + query when modal re-opens */
  useEffect(() => {
    if (open) {
      setTab('all');
      setQuery('');
      setRenamingId(null);
    }
  }, [open]);

  const activeDocs = useMemo(
    () => documents.filter((d) => !d.deletedAt),
    [documents]
  );
  const trashedDocs = useMemo(
    () =>
      documents
        .filter((d) => d.deletedAt)
        .sort((a, b) => b.deletedAt - a.deletedAt),
    [documents]
  );

  const filtered = useMemo(() => {
    const source = tab === 'trash' ? trashedDocs : activeDocs;
    const sorted = source
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt);
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((d) => {
      if ((d.title || '').toLowerCase().includes(q)) return true;
      const plain = stripHtml(d.content || '').toLowerCase();
      return plain.includes(q);
    });
  }, [tab, activeDocs, trashedDocs, query]);

  if (!open) return null;

  const startRename = (doc) => {
    setRenamingId(doc.id);
    setDraftTitle(doc.title || '');
  };

  const commitRename = () => {
    if (!renamingId) return;
    const t = draftTitle.trim() || 'Untitled note';
    onRename(renamingId, t);
    setRenamingId(null);
  };

  const handleSelect = (doc) => {
    onSelect(doc.id);
    onClose();
  };

  return (
    <div className="docs-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="docs-modal"
        role="dialog"
        aria-modal="true"
        aria-label="All documents"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="docs-modal-header">
          <div className="docs-modal-search">
            <span className="docs-modal-search-icon"><SearchIcon /></span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search titles and content…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="docs-modal-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>
          <button
            type="button"
            className="docs-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="docs-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className="docs-modal-tab"
            data-active={tab === 'all' ? 'true' : 'false'}
            onClick={() => setTab('all')}
          >
            All
            <span className="docs-modal-tab-count">{activeDocs.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            className="docs-modal-tab"
            data-active={tab === 'trash' ? 'true' : 'false'}
            onClick={() => setTab('trash')}
          >
            Trash
            <span className="docs-modal-tab-count">{trashedDocs.length}</span>
          </button>

          <div className="docs-modal-tabs-spacer" />

          {tab === 'all' ? (
            <button
              type="button"
              className="docs-modal-new"
              onClick={() => {
                onNewDocument();
                onClose();
              }}
            >
              + New
            </button>
          ) : (
            trashedDocs.length > 0 && (
              <button
                type="button"
                className="docs-modal-new docs-modal-new--danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Permanently delete all ${trashedDocs.length} items? This cannot be undone.`
                    )
                  ) {
                    onEmptyTrash();
                  }
                }}
              >
                Empty trash
              </button>
            )
          )}
        </div>

        <div className="docs-modal-list">
          {filtered.length === 0 && (
            <div className="docs-modal-empty">
              {query
                ? `No matches for "${query}"`
                : tab === 'trash'
                ? 'Trash is empty'
                : 'No documents yet'}
            </div>
          )}

          {filtered.map((doc) => {
            const isActive = doc.id === currentDocId;
            const isRenaming = renamingId === doc.id;
            const isTrashed = Boolean(doc.deletedAt);
            const q = query.trim();
            const showSnippet =
              q && !(doc.title || '').toLowerCase().includes(q.toLowerCase());
            const snippet = showSnippet ? buildSnippet(doc.content, q) : null;

            return (
              <div
                key={doc.id}
                className="docs-modal-row"
                data-active={isActive ? 'true' : 'false'}
                data-trashed={isTrashed ? 'true' : 'false'}
              >
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    className="docs-modal-rename"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={commitRename}
                    maxLength={80}
                  />
                ) : (
                  <button
                    type="button"
                    className="docs-modal-open"
                    onClick={() => !isTrashed && handleSelect(doc)}
                    onDoubleClick={() => !isTrashed && startRename(doc)}
                    disabled={isTrashed}
                    title={
                      isTrashed
                        ? 'This note is in the trash'
                        : 'Click to open · Double-click to rename'
                    }
                  >
                    <span className="docs-modal-main">
                      <span className="docs-modal-title">
                        <Highlight text={doc.title || 'Untitled note'} query={q} />
                      </span>
                      {snippet && (
                        <span className="docs-modal-snippet">
                          <Highlight text={snippet} query={q} />
                        </span>
                      )}
                    </span>
                    <span className="docs-modal-date">
                      {isTrashed
                        ? `Deleted ${formatDate(doc.deletedAt)}`
                        : formatDate(doc.updatedAt)}
                    </span>
                  </button>
                )}

                {!isRenaming && (
                  <div className="docs-modal-row-actions">
                    {isTrashed ? (
                      <>
                        <button
                          type="button"
                          className="docs-modal-icon-btn"
                          onClick={() => onRestore(doc.id)}
                          aria-label="Restore"
                          title="Restore"
                        >
                          <RestoreIcon />
                        </button>
                        <button
                          type="button"
                          className="docs-modal-icon-btn docs-modal-icon-btn--danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Permanently delete "${doc.title || 'this note'}"? This cannot be undone.`
                              )
                            ) {
                              onDeleteForever(doc.id);
                            }
                          }}
                          aria-label="Delete forever"
                          title="Delete forever"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="docs-modal-icon-btn"
                          onClick={() => startRename(doc)}
                          aria-label="Rename"
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="docs-modal-icon-btn docs-modal-icon-btn--danger"
                          onClick={() => onDelete(doc.id)}
                          aria-label="Delete"
                          title="Move to trash"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}