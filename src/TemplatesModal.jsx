import React, { useEffect, useRef, useState } from 'react';

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

export default function TemplatesModal({
  open,
  onClose,
  templates,
  onUseTemplate,
  onDeleteTemplate,
  onSaveCurrentAsTemplate,
  currentDocTitle,
}) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="docs-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="docs-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Templates"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="docs-modal-header docs-modal-header--plain">
          <div>
            <h2 className="docs-modal-heading">Templates</h2>
            <p className="docs-modal-subheading">
              Reusable starting points for new notes
            </p>
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

        <div className="docs-modal-actions docs-modal-actions--plain">
          <button
            type="button"
            className="docs-modal-new"
            onClick={onSaveCurrentAsTemplate}
            title={`Save "${currentDocTitle || 'Untitled'}" as a template`}
          >
            Save current as template
          </button>
          <span className="docs-modal-count">
            {templates.length} {templates.length === 1 ? 'template' : 'templates'}
          </span>
        </div>

        <div className="docs-modal-list">
          {templates.length === 0 && (
            <div className="docs-modal-empty">
              No templates yet — save one from the current note
            </div>
          )}

          {templates.map((tpl, idx) => (
            <div key={tpl.id} className="docs-modal-row">
              <button
                type="button"
                ref={idx === 0 ? firstRef : null}
                className="docs-modal-open"
                onClick={() => {
                  onUseTemplate(tpl);
                  onClose();
                }}
                title="Create a new note from this template"
              >
                <span className="docs-modal-title">{tpl.title}</span>
                <span className="docs-modal-date">
                  {new Date(tpl.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </button>
              <div className="docs-modal-row-actions">
                {confirmDelete === tpl.id ? (
                  <>
                    <button
                      type="button"
                      className="docs-modal-icon-btn"
                      onClick={() => setConfirmDelete(null)}
                      title="Cancel"
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      className="docs-modal-icon-btn docs-modal-icon-btn--danger"
                      onClick={() => {
                        onDeleteTemplate(tpl.id);
                        setConfirmDelete(null);
                      }}
                      title="Confirm delete"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="docs-modal-icon-btn docs-modal-icon-btn--danger"
                    onClick={() => setConfirmDelete(tpl.id)}
                    aria-label="Delete template"
                    title="Delete template"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}