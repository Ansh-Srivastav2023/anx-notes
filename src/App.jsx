import React, { useCallback, useEffect, useRef, useState } from 'react';
import SlackEditor from './SlackEditor';
import DocumentMenu from './DocumentMenu';
import DocumentsModal from './DocumentsModal';
import TemplatesModal from './TemplatesModal';
import { ACCENT_COLORS, DEFAULT_ACCENT_ID, getAccent, darkenHex, hexToRgba } from './editor/accentColors';
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
import WelcomePage from './WelcomePage';

const RECENTS_KEY = 'anx-notes.recents';
const MAX_RECENTS = 8;
const READMODE_KEY = 'anx-notes.readMode';
const ACCENT_KEY = 'anx-notes.accent';

/* A doc counts as "blank" if it has no text content, no structural
   elements (table/image), and still carries the default title.
   Blank docs are never persisted and are pruned when you leave them. */
function isBlankDoc(doc) {
  if (!doc || doc.deletedAt) return false;

  const html = (doc.content || '').trim();
  if (!html) return true;

  // If the user inserted a table or image, that's intentional — keep it
  if (/<(table|img)\b/i.test(html)) return false;

  // Strip tags and non-breaking spaces, then look for any remaining text
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  if (text) return false;

  // No text at all — if the user has not renamed it, it's blank
  const title = (doc.title || '').trim();
  if (title && title !== 'Untitled note') return false;

  return true;
}

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
      <div
        className="app-logo"
        aria-label="ANX Notes Logo"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="brandMain"
              x1="45"
              y1="35"
              x2="275"
              y2="285"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#38BDF8" />
              <stop offset="0.38" stopColor="#3B82F6" />
              <stop offset="0.72" stopColor="#6366F1" />
              <stop offset="1" stopColor="#A855F7" />
            </linearGradient>

            <linearGradient
              id="brandWriting"
              x1="80"
              y1="210"
              x2="235"
              y2="230"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#38BDF8" />
              <stop offset="0.5" stopColor="#818CF8" />
              <stop offset="1" stopColor="#C084FC" />
            </linearGradient>

            <filter
              id="brandShadow"
              x="-40%"
              y="-40%"
              width="180%"
              height="190%"
            >
              <feDropShadow
                dx="0"
                dy="8"
                stdDeviation="8"
                floodColor="#6366F1"
                floodOpacity="0.20"
              />
            </filter>
          </defs>

          {/* Main note */}
          <path
            d="
              M82 34
              H194
              L270 110
              V260
              C270 278 256 292 238 292
              H82
              C58 292 42 276 42 252
              V74
              C42 50 58 34 82 34
              Z
            "
            fill="url(#brandMain)"
            filter="url(#brandShadow)"
          />

          {/* Fold */}
          <path
            d="
              M194 35
              V94
              C194 104 202 112 212 112
              H269
            "
            fill="none"
            stroke="white"
            strokeOpacity="0.42"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="
              M194 35
              L269 110
              H212
              C202 110 194 102 194 92
              Z
            "
            fill="#A855F7"
            fillOpacity="0.32"
          />

          {/* Note lines */}
          <path
            d="M82 145 H177"
            stroke="white"
            strokeOpacity="0.72"
            strokeWidth="9"
            strokeLinecap="round"
          />

          <path
            d="M82 169 H216"
            stroke="white"
            strokeOpacity="0.32"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Handwriting */}
          <path
            d="
              M82 225
              C97 210 109 244 124 227
              C139 211 151 242 166 227
              C181 212 194 235 207 220
              C215 212 222 210 230 210
            "
            stroke="url(#brandWriting)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pen tip */}
          <path
            d="
              M222 210
              L239 193
              C242 190 247 190 250 193
              L253 196
              C256 199 256 203 253 206
              L235 224
              Z
            "
            fill="white"
            fillOpacity="0.92"
          />

          <path
            d="M222 210 L235 224"
            stroke="#6366F1"
            strokeWidth="5"
            strokeLinecap="round"
          />

          <path
            d="M222 210 L219 228 L235 224 Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="app-brand-text">
        <span className="app-brand-title">
          ANX
          <span className="app-brand-accent"> Notes</span>
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

  const [readMode, setReadMode] = useState(() => {
    try { return localStorage.getItem(READMODE_KEY) === 'true'; } catch { return false; }
  });
  const [accentId, setAccentId] = useState(() => {
    try { return localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT_ID; } catch { return DEFAULT_ACCENT_ID; }
  });
  const [outlineOpen, setOutlineOpen] = useState(false);

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
      if (currentDocId) {
        const target = initial.find(
          (d) => d.id === currentDocId && !d.deletedAt
        );
        if (!target) setCurrentDocId(null);
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
      // Never persist blank untitled docs — they'll never come back
      // from IndexedDB, so nothing shows up on reload.
      const toSave = documents.filter((d) => !isBlankDoc(d));
      saveDocuments(toSave);
    }, 200);
    return () => clearTimeout(t);
  }, [documents, booted]);

  /* Apply accent color and toolbar colors whenever theme or accentId changes */
  useEffect(() => {
    const el = document.documentElement;
    const accent = getAccent(accentId);
    const palette = theme === 'dark' ? accent.dark : accent.light;

    /* 1. Accent tokens (unchanged) */
    const accentKeys = ['--accent', '--accent-soft', '--accent-border', '--accent-ring'];
    accentKeys.forEach((k) => el.style.setProperty(k, palette[k]));

    /* 2. Toolbar tokens derived from the accent swatch */
    const swatch = accent.swatch;
    const isDark = theme === 'dark';

    // Darken the swatch more in dark mode so the toolbar reads as "chrome"
    const toolbarBg = darkenHex(swatch, isDark ? 0.86 : 0.76);

    el.style.setProperty('--toolbar-bg', toolbarBg);
    el.style.setProperty('--toolbar-bg-hover', hexToRgba('#ffffff', isDark ? 0.06 : 0.08));
    el.style.setProperty('--toolbar-bg-active', hexToRgba(swatch, isDark ? 0.28 : 0.35));
    el.style.setProperty('--toolbar-text', hexToRgba('#ffffff', isDark ? 0.72 : 0.82));
    el.style.setProperty('--toolbar-text-hover', '#ffffff');
    el.style.setProperty('--toolbar-text-active', '#ffffff');
    el.style.setProperty('--toolbar-border', hexToRgba('#ffffff', isDark ? 0.06 : 0.10));
    el.style.setProperty('--toolbar-sep', hexToRgba('#ffffff', isDark ? 0.10 : 0.18));
    el.style.setProperty('--toolbar-surface', hexToRgba('#ffffff', isDark ? 0.05 : 0.06));
    el.style.setProperty('--toolbar-surface-hover', hexToRgba('#ffffff', isDark ? 0.10 : 0.14));
    el.style.setProperty('--toolbar-surface-border', hexToRgba('#ffffff', isDark ? 0.10 : 0.16));

    try { localStorage.setItem(ACCENT_KEY, accentId); } catch { /* ignore */ }
  }, [accentId, theme]);

  /* Persist read mode */
  useEffect(() => {
    try { localStorage.setItem(READMODE_KEY, readMode ? 'true' : 'false'); } catch { /* ignore */ }
  }, [readMode]);

  useEffect(() => {
    if (!booted) return;
    setDocuments((docs) => {
      const pruned = docs.filter(
        (d) => d.id === currentDocId || !isBlankDoc(d)
      );
      return pruned.length === docs.length ? docs : pruned;
    });
  }, [currentDocId, booted]);


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

    // Only pivot the current doc if we just closed the active tab.
    // Closing a background tab shouldn't disturb what you're editing.
    if (id !== currentDocIdRef.current) return;

    flushSave();

    // Prefer the next still-valid recent tab (keeps the strip order intuitive)
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

    // Nothing else open → clear the current doc so the welcome page shows.
    // The doc itself stays in `documents` and remains accessible from
    // the ⋯ menu, the command palette, and the welcome page's Recent list.
    setCurrentDocId(null);
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

    /* ⌘⇧R / Ctrl+Shift+R — toggle read mode */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setReadMode((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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

        <RecentBar
          documents={documents}
          recentIds={recentIds}
          currentDocId={currentDocId}
          onSelect={handleSelectDocument}
          onRemove={handleRemoveRecent}
          onNewDocument={handleNewDocument}
        />

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
          readMode={readMode}
          onToggleReadMode={() => setReadMode((v) => !v)}
          accentId={accentId}
          onSelectAccent={setAccentId}
        />
      </header>

        <main className="app-main">
        {currentDocId ? (
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
            readMode={readMode}
            onToggleReadMode={() => setReadMode((v) => !v)}
            outlineOpen={outlineOpen}
            setOutlineOpen={setOutlineOpen}
          />
        ) : (
          <WelcomePage
            documents={documents}
            onOpenDocument={handleSelectDocument}
            onNewDocument={handleNewDocument}
            onOpenBrowser={() => setDocsModalOpen(true)}
            onOpenTemplates={() => setTemplatesModalOpen(true)}
            onOpenShortcuts={() => setHelpOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
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