import React, { useMemo } from 'react';

export default function RecentBar({
  documents = [],
  recentIds = [],
  currentDocId,
  onSelect,
  onRemove,
  onNewDocument,
}) {
  const recents = useMemo(() => {
    const docsById = new Map(documents.map((d) => [d.id, d]));
    return recentIds
      .map((id) => docsById.get(id))
      .filter((d) => Boolean(d && !d.deletedAt));
  }, [documents, recentIds]);

  return (
    <nav className="recent-bar" aria-label="Open documents">
      {recents.map((doc) => {
        const isActive = doc.id === currentDocId;
        const displayTitle = doc.title?.trim() || 'Untitled note';

        return (
          <div
            key={doc.id}
            className="recent-item"
            data-active={isActive ? 'true' : 'false'}
          >
            <button
              type="button"
              className="recent-link"
              onClick={() => onSelect(doc.id)}
              aria-current={isActive ? 'page' : undefined}
              title={displayTitle}
            >
              <span className="recent-title">{displayTitle}</span>
            </button>

            <button
              type="button"
              className="recent-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(doc.id);
              }}
              aria-label={`Close ${displayTitle}`}
              title="Close"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      <button
        type="button"
        className="recent-add"
        onClick={onNewDocument}
        title="New document"
        aria-label="New document"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
    </nav>
  );
}