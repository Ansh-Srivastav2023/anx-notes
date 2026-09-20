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
  stripHtml,
} from './storage';

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

/* Undo toast */
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

  const currentDocIdRef = useRef(currentDocId);
  useEffect(() => {
    currentDocIdRef.current = currentDocId;
  }, [currentDocId]);

  const saveTimerRef = useRef(null);
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
  }, [flushSave]);

  const handleSelectDocument = useCallback(
    (id) => {
      const target = documents.find((d) => d.id === id);
      if (!target || target.deletedAt) return;
      if (id === currentDocId) return;
      flushSave();
      setCurrentDocId(id);
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

  /* Soft delete → moves to trash + shows undo */
  const handleDelete = useCallback((id) => {
    if (!id) return;
    const target = documents.find((d) => d.id === id);
    if (!target) return;

    setDocuments((docs) =>
      docs.map((d) =>
        d.id === id ? { ...d, deletedAt: Date.now() } : d
      )
    );

    // If we just trashed the currently-open doc, switch to another
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
          initialContent={currentDoc?.content || ''}
          onChange={handleEditorChange}
          helpOpen={helpOpen}
          setHelpOpen={setHelpOpen}
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