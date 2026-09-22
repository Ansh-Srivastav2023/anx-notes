import React, { useCallback, useEffect, useRef, useState } from 'react';
import SlackEditor from './SlackEditor';
import DocumentMenu from './DocumentMenu';
import DocumentsModal from './DocumentsModal';
import TemplatesModal from './TemplatesModal';
import {
  loadDocuments,
  saveDocuments,
  loadCurrentId,
  saveCurrentId,
  createDocument,
  createTemplate,
  loadTemplates,
  saveTemplates,
  exportDocumentAsHtml,
  exportDocumentAsJson,
  exportDocumentAsMarkdown,
  importFromFile,
} from './storage';
import RecentBar from './RecentBar';
import CommandPalette from './editor/CommandPalette';

const RECENTS_KEY = 'anx-notes.recents';
const MAX_RECENTS = 8;

function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecents(ids) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function AppBrand() {
  return (
    <div className="app-brand">
      <div className="app-logo" aria-label="ANX Notes Logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      </div>
      <div className="app-brand-text">
        <span className="app-brand-title">
          ANX <span className="app-brand-accent">Notes</span>
        </span>
      </div>
    </div>
  );
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function UndoToast({ payload, onDismiss }) {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  return (
    <div className="toast-notification toast-notification--undo" role="status">
      <span>{payload.message}</span>
      <button
        type="button"
        className="toast-undo-btn"
        onClick={() => {
          clearTimeout(timerRef.current);
          payload.onUndo();
          onDismiss();
        }}
      >
        Undo
      </button>
    </div>
  );
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(loadCurrentId);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [undoPayload, setUndoPayload] = useState(null);
  const [recentIds, setRecentIds] = useState(loadRecents);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const currentDocIdRef = useRef(currentDocId);
  useEffect(() => {
    currentDocIdRef.current = currentDocId;
  }, [currentDocId]);

  const saveTimerRef = useRef(null);
  const cursorPositionsRef = useRef({});
  const pendingContentRef = useRef(null);

  /* Boot: async load from IndexedDB */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [docs, tpls] = await Promise.all([loadDocuments(), loadTemplates()]);
      if (cancelled) return;
      const initial =
        docs.length > 0 ? docs : [createDocument('My first note')];
      setDocuments(initial);
      setTemplates(tpls);
      if (!initial.some((d) => d.id === currentDocId)) {
        const firstActive = initial.find((d) => !d.deletedAt);
        setCurrentDocId(firstActive?.id ?? initial[0].id);
      }
      setBooted(true);
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Persist theme */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  /* Persist documents + templates (debounced, async) */
  useEffect(() => {
    if (!booted) return;
    const t = setTimeout(() => {
      saveDocuments(documents);
    }, 200);
    return () => clearTimeout(t);
  }, [documents, booted]);

  useEffect(() => {
    if (!booted) return;
    saveTemplates(templates);
  }, [templates, booted]);

  useEffect(() => {
    saveCurrentId(currentDocId);
  }, [currentDocId]);

  /* NOTE: the "push current to front" effect has been REMOVED.
     The recent bar is now static — items keep their position and only
     change when you open a new document, close a chip, or delete a doc. */

  /* ⌘K / Ctrl+K — command palette */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* Drop any recents that point at docs that no longer exist or are trashed */
  useEffect(() => {
    if (!booted) return;
    const validIds = new Set(
      documents.filter((d) => !d.deletedAt).map((d) => d.id)
    );
    setRecentIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      if (next.length === prev.length) return prev;
      saveRecents(next);
      return next;
    });
  }, [documents, booted]);

  const currentDoc = documents.find((d) => d.id === currentDocId && !d.deletedAt);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingContentRef.current !== null && currentDocIdRef.current) {
      const docId = currentDocIdRef.current;
      const html = pendingContentRef.current;
      setDocuments((docs) =>
        docs.map((d) =>
          d.id === docId ? { ...d, content: html, updatedAt: Date.now() } : d
        )
      );
      pendingContentRef.current = null;
    }
  }, []);

  const handleRemoveRecent = useCallback((id) => {
    setRecentIds((prev) => {
      const next = prev.filter((x) => x !== id);
      saveRecents(next);
      return next;
    });

    if (id !== currentDocIdRef.current) return;

    flushSave();

    const nextRecent = recentIds
      .filter((x) => x !== id)
      .find((rid) => {
        const doc = documents.find((d) => d.id === rid);
        return doc && !doc.deletedAt;
      });

    if (nextRecent) {
      setCurrentDocId(nextRecent);
      return;
    }

    const fallback = [...documents]
      .filter((d) => !d.deletedAt && d.id !== id)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    if (fallback) {
      setCurrentDocId(fallback.id);
      return;
    }

    const fresh = createDocument('Untitled note');
    setDocuments((docs) => [fresh, ...docs]);
    setCurrentDocId(fresh.id);
  }, [documents, recentIds, flushSave]);

  const handleEditorChange = useCallback(
    (html) => {
      pendingContentRef.current = html;
      const docId = currentDocIdRef.current;
      if (!docId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setDocuments((docs) =>
          docs.map((d) =>
            d.id === docId ? { ...d, content: html, updatedAt: Date.now() } : d
          )
        );
        saveTimerRef.current = null;
        pendingContentRef.current = null;
      }, 400);
    },
    []
  );

  useEffect(() => () => flushSave(), [flushSave]);

  /* --- documents --- */

  const handleNewDocument = useCallback(() => {
    flushSave();
    const doc = createDocument('Untitled note');
    setDocuments((docs) => [doc, ...docs]);
    setCurrentDocId(doc.id);

    // Add the new document to the recent bar without reordering existing tabs
    setRecentIds((prev) => {
      if (prev.includes(doc.id)) return prev;
      const next = [...prev, doc.id].slice(-MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  }, [flushSave]);

  const handleSelectDocument = useCallback(
    (id) => {
      const target = documents.find((d) => d.id === id);
      if (!target || target.deletedAt) return;
      if (id !== currentDocId) {
        flushSave();
        setCurrentDocId(id);
      }

      // Ensure the doc appears in the bar without disturbing existing positions
      setRecentIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id].slice(-MAX_RECENTS);
        saveRecents(next);
        return next;
      });
    },
    [currentDocId, documents, flushSave]
  );

  const handleSaveNow = useCallback(() => {
    flushSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1200);
  }, [flushSave]);

  const handleRename = useCallback((id, title) => {
    if (!id) return;
    setDocuments((docs) =>
      docs.map((d) =>
        d.id === id ? { ...d, title, updatedAt: Date.now() } : d
      )
    );
  }, []);

  const handleDelete = useCallback((id) => {
    if (!id) return;
    const target = documents.find((d) => d.id === id);
    if (!target) return;

    setDocuments((docs) =>
      docs.map((d) =>
        d.id === id ? { ...d, deletedAt: Date.now() } : d
      )
    );

    if (id === currentDocIdRef.current) {
      const next = documents.find((d) => d.id !== id && !d.deletedAt);
      if (next) setCurrentDocId(next.id);
    }

    setUndoPayload({
      message: `Deleted "${target.title || 'note'}"`,
      onUndo: () => {
        setDocuments((docs) =>
          docs.map((d) => (d.id === id ? { ...d, deletedAt: null } : d))
        );
      },
    });
  }, [documents]);

  const handleRestore = useCallback((id) => {
    setDocuments((docs) =>
      docs.map((d) => (d.id === id ? { ...d, deletedAt: null } : d))
    );
  }, []);

  const handleDeleteForever = useCallback((id) => {
    setDocuments((docs) => {
      const next = docs.filter((d) => d.id !== id);
      if (next.filter((d) => !d.deletedAt).length === 0) {
        const fresh = createDocument('Untitled note');
        setCurrentDocId(fresh.id);
        return [fresh, ...next];
      }
      return next;
    });
  }, []);

  const handleEmptyTrash = useCallback(() => {
    setDocuments((docs) => docs.filter((d) => !d.deletedAt));
  }, []);

  /* --- templates --- */

  const handleSaveAsTemplate = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (!doc) return;
    const name = window.prompt(
      'Template name',
      doc.title || 'Untitled template'
    );
    if (!name) return;
    const tpl = createTemplate(name.trim(), doc.content || '');
    setTemplates((prev) => [tpl, ...prev]);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1200);
  }, [documents]);

  const handleUseTemplate = useCallback((tpl) => {
    flushSave();
    const doc = createDocument(tpl.title || 'Untitled note');
    doc.content = tpl.content || '';
    setDocuments((docs) => [doc, ...docs]);
    setCurrentDocId(doc.id);

    // Template-created doc also lands in the bar
    setRecentIds((prev) => {
      if (prev.includes(doc.id)) return prev;
      const next = [...prev, doc.id].slice(-MAX_RECENTS);
      saveRecents(next);
      return next;
    });
  }, [flushSave]);

  const handleDeleteTemplate = useCallback((id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* --- export / import --- */

  const handleExportHtml = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (doc) exportDocumentAsHtml(doc);
  }, [documents]);

  const handleExportJson = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (doc) exportDocumentAsJson(doc);
  }, [documents]);

  const handleExportMarkdown = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (doc) exportDocumentAsMarkdown(doc);
  }, [documents]);

  const handleImportFile = useCallback(
    async (file) => {
      flushSave();
      const doc = await importFromFile(file);
      setDocuments((docs) => [doc, ...docs]);
      setCurrentDocId(doc.id);

      // Imported doc also lands in the bar
      setRecentIds((prev) => {
        if (prev.includes(doc.id)) return prev;
        const next = [...prev, doc.id].slice(-MAX_RECENTS);
        saveRecents(next);
        return next;
      });
    },
    [flushSave]
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  /* Global shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 's') { e.preventDefault(); handleSaveNow(); }
      if (e.key === 'n') { e.preventDefault(); handleNewDocument(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleSaveNow, handleNewDocument]);

  if (!booted) {
    return (
      <div className="app app--loading">
        <div className="app-loading">Loading your notes…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <AppBrand />
        <div className="app-title">
          <h1>{currentDoc?.title || 'ANX Notes'}</h1>
        </div>
        <div className="app-header-spacer" />
        <DocumentMenu
          documents={documents.filter((d) => !d.deletedAt)}
          currentDocId={currentDocId}
          onSelectDocument={handleSelectDocument}
          onNewDocument={handleNewDocument}
          onSave={handleSaveNow}
          onRename={(title) => handleRename(currentDocIdRef.current, title)}
          onDelete={() => handleDelete(currentDocIdRef.current)}
          onExportHtml={handleExportHtml}
          onExportJson={handleExportJson}
          onExportMarkdown={handleExportMarkdown}
          onImportFile={handleImportFile}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenShortcuts={() => setHelpOpen(true)}
          onSeeAll={() => setDocsModalOpen(true)}
          onSaveAsTemplate={handleSaveAsTemplate}
          onOpenTemplates={() => setTemplatesModalOpen(true)}
        />
      </header>

      <main className="app-main">
        <SlackEditor
          key={currentDocId}
          docId={currentDocId}
          initialContent={currentDoc?.content || ''}
          initialSelection={cursorPositionsRef.current[currentDocId]}
          onSelectionChange={(sel) => {
            if (currentDocId) {
              cursorPositionsRef.current[currentDocId] = sel;
            }
          }}
          onChange={handleEditorChange}
          helpOpen={helpOpen}
          setHelpOpen={setHelpOpen}
          topBar={
            <RecentBar
              documents={documents}
              recentIds={recentIds}
              currentDocId={currentDocId}
              onSelect={handleSelectDocument}
              onRemove={handleRemoveRecent}
            />
          }
        />
      </main>

      <DocumentsModal
        open={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        documents={documents}
        currentDocId={currentDocId}
        onSelect={handleSelectDocument}
        onRename={handleRename}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onDeleteForever={handleDeleteForever}
        onEmptyTrash={handleEmptyTrash}
        onNewDocument={handleNewDocument}
      />

      <TemplatesModal
        open={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        templates={templates}
        currentDocTitle={currentDoc?.title}
        onUseTemplate={handleUseTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onSaveCurrentAsTemplate={handleSaveAsTemplate}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        documents={documents}
        currentDocId={currentDocId}
        onSelectDocument={handleSelectDocument}
        actions={[
          { id: 'new-doc',      title: 'New document',        keywords: ['create', 'add'],                    run: handleNewDocument },
          { id: 'save',         title: 'Save now',            keywords: ['write', 'persist'],                 run: handleSaveNow },
          { id: 'open-docs',    title: 'Open document…',      keywords: ['browse', 'list', 'files', 'all'],   run: () => setDocsModalOpen(true) },
          { id: 'templates',    title: 'New from template…',  keywords: ['template', 'start'],                run: () => setTemplatesModalOpen(true) },
          { id: 'save-tpl',     title: 'Save as template…',   keywords: ['template', 'reuse'],                run: handleSaveAsTemplate },
          { id: 'export-html',  title: 'Export as HTML',      keywords: ['download', 'save', 'html'],         run: handleExportHtml },
          { id: 'export-json',  title: 'Export as JSON',      keywords: ['download', 'backup', 'json'],       run: handleExportJson },
          { id: 'export-md',    title: 'Export as Markdown',  keywords: ['download', 'md', 'markdown'],       run: handleExportMarkdown },
          { id: 'theme',        title: 'Toggle theme',        keywords: ['dark', 'light', 'mode'],            run: toggleTheme },
          { id: 'shortcuts',    title: 'Keyboard shortcuts',  keywords: ['help', 'keys'],                     run: () => setHelpOpen(true) },
          { id: 'delete',       title: 'Delete this document', keywords: ['remove', 'trash', 'delete'],       run: () => handleDelete(currentDocIdRef.current) },
        ]}
      />

      {saveToast && (
        <div className="toast-notification" role="status" aria-live="polite">
          Saved
        </div>
      )}

      {undoPayload && (
        <UndoToast
          payload={undoPayload}
          onDismiss={() => setUndoPayload(null)}
        />
      )}
    </div>
  );
}