import React, { useMemo } from 'react';

export default function RecentBar({
  documents = [],
  recentIds = [],
  currentDocId,
  onSelect,
  onRemove,
}) {
  // Memoize document lookup to prevent recalculating on every render
  const recents = useMemo(() => {
    const docsById = new Map(documents.map((d) => [d.id, d]));
    return recentIds
      .map((id) => docsById.get(id))
      .filter((d) => Boolean(d && !d.deletedAt));
  }, [documents, recentIds]);

  if (recents.length === 0) return null;

  return (
    <nav className="recent-bar" aria-label="Recently opened documents">
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

            {recents.length > 1 && (
              <button
                type="button"
                className="recent-remove"
                onClick={(e) => {
                  e.stopPropagation(); // Prevents triggering onSelect if item wrapper has click handlers
                  onRemove(doc.id);
                }}
                aria-label={`Remove ${displayTitle} from recent notes`}
                title="close"
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
            )}
          </div>
        );
      })}
    </nav>
  );
}