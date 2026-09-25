import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ACCENT_COLORS } from './editor/accentColors';

// --- Icons ---
function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

// --- Custom Hook for Dropdown State & Click-Outside ---
function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return { isOpen, setIsOpen, wrapRef };
}

// --- Main Component ---
export default function DocumentMenu({
  documents,
  currentDocId,
  onSelectDocument,
  onNewDocument,
  onSave,
  onRename,
  onDelete,
  onExportHtml,
  onExportMarkdown,
  onExportJson,
  onImportFile,
  theme,
  onToggleTheme,
  onOpenShortcuts,
  onSaveAsTemplate,
  onOpenTemplates, 
  onSeeAll,
  readMode,
  onToggleReadMode,
  accentId,
  onSelectAccent,
}) {
  const { isOpen, setIsOpen, wrapRef } = useDropdown();
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  const fileInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const isCommittedRef = useRef(false);

  const currentDoc = useMemo(
    () => documents.find((d) => d.id === currentDocId),
    [documents, currentDocId]
  );

  useEffect(() => {
    if (renaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  // Reset rename state when menu closes
  useEffect(() => {
    if (!isOpen) setRenaming(false);
  }, [isOpen]);

  const startRename = () => {
    setDraftTitle(currentDoc?.title || '');
    isCommittedRef.current = false;
    setRenaming(true);
  };

  const commitRename = () => {
    if (isCommittedRef.current) return;
    isCommittedRef.current = true;
    const t = draftTitle.trim() || 'Untitled note';
    onRename(t);
    setRenaming(false);
  };

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onImportFile(file);
      setIsOpen(false);
    } catch (err) {
      alert(`Could not import file: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const confirmDelete = () => {
    if (documents.length <= 1) {
      alert('You need at least one document.');
      return;
    }
    if (window.confirm(`Delete "${currentDoc?.title || 'this document'}"?`)) {
      onDelete();
      setIsOpen(false);
    }
  };

  const executeAction = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="doc-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Document menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Document menu"
      >
        <DotsIcon />
      </button>

      {isOpen && (
        <div className="doc-menu" role="menu">
          {/* Section: Rename */}
          <div className="doc-menu-section">
            <div className="doc-menu-section-label">Current document</div>
            {renaming ? (
              <input
                ref={renameInputRef}
                className="doc-menu-rename-input"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                onBlur={commitRename}
                maxLength={80}
              />
            ) : (
              <button
                type="button"
                className="doc-menu-title"
                onClick={startRename}
                title="Click to rename"
              >
                <span className="doc-menu-title-text">
                  {currentDoc?.title || 'Untitled note'}
                </span>
                <span className="doc-menu-title-hint">rename</span>
              </button>
            )}
          </div>

          <div className="doc-menu-sep" />

          {/* Section: File Actions */}
          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onNewDocument)}
          >
            <span>New document</span>
            <kbd className="doc-menu-kbd">ctrl+N</kbd>
          </button>

          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onSeeAll)}
          >
            <span>Open document…</span>
            <span className="doc-menu-icon">
              <FolderIcon />
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onSave)}
          >
            <span>Save now</span>
            <kbd className="doc-menu-kbd">ctrl+S</kbd>
          </button>

          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onOpenTemplates)}
            >
            <span>New from template…</span>
            </button>

            <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onSaveAsTemplate)}
            >
            <span>Save as template…</span>
        </button>

          <div className="doc-menu-sep" />

          {/* Section: Import / Export */}
          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => fileInputRef.current?.click()}
          >
            <span>Import from file…</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onExportHtml)}
          >
            <span>Export as HTML</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onExportJson)}
          >
            <span>Export as JSON</span>
          </button>

          <button
  type="button"
  role="menuitem"
  className="doc-menu-item"
  onClick={() => executeAction(onExportMarkdown)}
>
  <span>Export as Markdown</span>
</button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.json,text/html,application/json"
            style={{ display: 'none' }}
            onChange={handleFilePick}
          />

          <div className="doc-menu-sep" />

          {/* Section: Settings */}
          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onToggleTheme)}
          >
            <span>{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
            <span className="doc-menu-icon">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </span>
          </button>

          {onOpenShortcuts && (
            <button
              type="button"
              role="menuitem"
              className="doc-menu-item"
              onClick={() => executeAction(onOpenShortcuts)}
            >
              <span>Keyboard shortcuts</span>
              <kbd className="doc-menu-kbd">ctrl+/</kbd>
            </button>
          )}

          <div className="doc-menu-sep" />

                    {onOpenShortcuts && (
            <button
              type="button"
              role="menuitem"
              className="doc-menu-item"
              onClick={() => executeAction(onOpenShortcuts)}
            >
              <span>Keyboard shortcuts</span>
              <kbd className="doc-menu-kbd">ctrl+/</kbd>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            className="doc-menu-item"
            onClick={() => executeAction(onToggleReadMode)}
          >
            <span>{readMode ? 'Exit read mode' : 'Read mode'}</span>
            <kbd className="doc-menu-kbd">ctrl+shift+R</kbd>
          </button>

          <div className="doc-menu-sep" />
          <div className="doc-menu-section-label doc-menu-section-label--tight">
            Accent color
          </div>
          <div className="doc-menu-swatches">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className="doc-menu-swatch"
                data-selected={c.id === accentId ? 'true' : 'false'}
                onClick={() => onSelectAccent(c.id)}
                title={c.label}
                aria-label={c.label}
                style={{ '--swatch': c.swatch }}
              />
            ))}
          </div>

          {/* Section: Danger Zone */}
          <button
            type="button"
            role="menuitem"
            className="doc-menu-item doc-menu-item--danger"
            onClick={confirmDelete}
          >
            <span>Delete this document</span>
          </button>
        </div>
      )}
    </div>
  );
}