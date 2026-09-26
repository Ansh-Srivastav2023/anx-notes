import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  exportBackup,
  importFromFile,
  importBackupFile,
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
  const title = (doc.title || '').trim();
  const hasMetadata = Boolean(doc.pinned || doc.folder || doc.tags?.length);
  if (!html) return !hasMetadata && (!title || title === 'Untitled note');

  // If the user inserted a table or image, that's intentional — keep it
  if (/<(table|img)\b/i.test(html)) return false;

  // Strip tags and non-breaking spaces, then look for any remaining text
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  if (text) return false;

  // No text at all — if the user has not renamed it, it's blank
  if (title && title !== 'Untitled note') return false;
  if (hasMetadata) return false;

  return true;
}

function applyPendingContent(documents, pending) {
  const timestamp = Date.now();
  return documents.map((doc) => {
    const html = pending.get(doc.id);
    return html === undefined ? doc : { ...doc, content: html, updatedAt: timestamp };
  });
}

function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? [...new Set(arr.filter((id) => typeof id === 'string' && id))].slice(-MAX_RECENTS)
      : [];
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

const CELEBRATION_COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#fbbf24', '#fb7185', '#34d399'];

function CelebrationBurst({ origin, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 950);
    return () => clearTimeout(timer);
  }, [onDone]);

  const particles = Array.from({ length: 30 }, (_, index) => {
    const angle = (index / 30) * Math.PI * 2;
    const distance = 46 + (index % 5) * 15;
    return {
      color: CELEBRATION_COLORS[index % CELEBRATION_COLORS.length],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 10,
      delay: (index % 5) * 18,
      rotation: 20 + (index % 4) * 20,
    };
  });

  return (
    <div className="celebration-burst" style={{ left: origin.x, top: origin.y }} aria-hidden="true">
      <span className="celebration-flash" />
      {particles.map((particle, index) => (
        <span
          className="celebration-particle"
          key={index}
          style={{
            backgroundColor: particle.color,
            '--burst-x': `${particle.dx}px`,
            '--burst-y': `${particle.dy}px`,
            '--burst-delay': `${particle.delay}ms`,
            '--burst-rotation': `${particle.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}

function AppBrand({ onCelebrate }) {
  return (
    <div className="app-brand">
      <button
        type="button"
        className="app-logo"
        aria-label="ANX Notes Logo"
        title="Celebrate"
        onClick={onCelebrate}
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
      </button>

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
  try {
    const saved = window.localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* use the system preference */
  }
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
  const [bootError, setBootError] = useState('');
  const [theme, setTheme] = useState(getInitialTheme);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(loadCurrentId);
  const [helpOpen, setHelpOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [undoPayload, setUndoPayload] = useState(null);
  const [recentIds, setRecentIds] = useState(loadRecents);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const recentIdsRef = useRef(recentIds);

  useLayoutEffect(() => {
    recentIdsRef.current = recentIds;
  }, [recentIds]);

  const commitRecentIds = useCallback((update) => {
    const previous = recentIdsRef.current;
    const next = typeof update === 'function' ? update(previous) : update;
    if (!Array.isArray(next) || next === previous) return previous;
    recentIdsRef.current = next;
    setRecentIds(next);
    saveRecents(next);
    return next;
  }, []);

  const [readMode, setReadMode] = useState(() => {
    try { return localStorage.getItem(READMODE_KEY) === 'true'; } catch { return false; }
  });
  const [accentId, setAccentId] = useState(() => {
    try { return localStorage.getItem(ACCENT_KEY) || DEFAULT_ACCENT_ID; } catch { return DEFAULT_ACCENT_ID; }
  });
  const [outlineOpen, setOutlineOpen] = useState(false);

  const currentDocIdRef = useRef(currentDocId);
  useLayoutEffect(() => {
    currentDocIdRef.current = currentDocId;
  }, [currentDocId]);

  const saveTimerRef = useRef(null);
  const saveRevisionRef = useRef(0);
  const documentsRef = useRef(documents);
  const cursorPositionsRef = useRef({});
  const pendingContentRef = useRef(new Map());
  const touchStartRef = useRef(null);

  useLayoutEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  /* Boot: async load from IndexedDB */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [docs, tpls] = await Promise.all([loadDocuments(), loadTemplates()]);
        if (cancelled) return;
        const initial = docs.length > 0 ? docs : [createDocument('My first note')];
        setDocuments(initial);
        setTemplates(tpls);
        if (currentDocId) {
          const target = initial.find(
            (d) => d.id === currentDocId && !d.deletedAt
          );
          if (!target) {
            currentDocIdRef.current = null;
            setCurrentDocId(null);
          } else {
            // A persisted document must also have a visible tab after reload.
            commitRecentIds((prev) => {
              if (prev.includes(target.id)) return prev;
              return [...prev, target.id].slice(-MAX_RECENTS);
            });
          }
        }
        setBooted(true);
      } catch (error) {
        if (!cancelled) setBootError(error.message || 'Browser storage is unavailable.');
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Persist theme */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { window.localStorage.setItem('theme', theme); } catch { /* ignore */ }
  }, [theme]);

  /* Persist documents + templates (debounced, async) */
  useEffect(() => {
    if (!booted) return;
    setSaveStatus('saving');
    const revision = ++saveRevisionRef.current;
    const t = setTimeout(() => {
      // Never persist blank untitled docs — they'll never come back
      // from IndexedDB, so nothing shows up on reload.
      const toSave = documents.filter((d) => !isBlankDoc(d));
      saveDocuments(toSave).then((saved) => {
        if (saveRevisionRef.current === revision) {
          setSaveStatus(saved ? 'saved' : 'offline');
        }
      });
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

    // Keep the toolbar understated and use the accent for interaction states.
    // This keeps bright accents from turning the whole toolbar into a banner.
    el.style.setProperty('--toolbar-bg', isDark ? darkenHex(swatch, 0.84) : '#f8fafc');
    el.style.setProperty('--toolbar-bg-hover', isDark
      ? hexToRgba('#ffffff', 0.07)
      : hexToRgba('#0f172a', 0.055));
    el.style.setProperty('--toolbar-bg-active', hexToRgba(swatch, isDark ? 0.24 : 0.10));
    el.style.setProperty('--toolbar-text', isDark ? 'rgba(255, 255, 255, 0.72)' : '#475569');
    el.style.setProperty('--toolbar-text-hover', isDark ? '#ffffff' : '#0f172a');
    el.style.setProperty('--toolbar-text-active', palette['--accent']);
    el.style.setProperty('--toolbar-border', isDark
      ? hexToRgba('#ffffff', 0.08)
      : '#e2e8f0');
    el.style.setProperty('--toolbar-sep', isDark
      ? hexToRgba('#ffffff', 0.12)
      : hexToRgba('#0f172a', 0.12));
    el.style.setProperty('--toolbar-surface', isDark
      ? hexToRgba('#ffffff', 0.05)
      : hexToRgba('#0f172a', 0.035));
    el.style.setProperty('--toolbar-surface-hover', isDark
      ? hexToRgba('#ffffff', 0.10)
      : hexToRgba('#0f172a', 0.07));
    el.style.setProperty('--toolbar-surface-border', isDark
      ? hexToRgba('#ffffff', 0.12)
      : hexToRgba('#0f172a', 0.12));
    el.style.setProperty('--toolbar-accent-line', hexToRgba(swatch, isDark ? 0.55 : 0.28));

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
    commitRecentIds((prev) => {
      const next = prev.filter((id) => validIds.has(id));
      if (next.length === prev.length) return prev;
      return next;
    });
  }, [documents, booted, commitRecentIds]);

  const currentDoc = documents.find((d) => d.id === currentDocId && !d.deletedAt);

  useEffect(() => {
    if (!booted || !currentDocId || currentDoc) return;
    currentDocIdRef.current = null;
    setCurrentDocId(null);
  }, [booted, currentDocId, currentDoc]);

  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingContentRef.current.size === 0) return;
    const pending = new Map(pendingContentRef.current);
    setDocuments((docs) => applyPendingContent(docs, pending));
    pending.forEach((html, docId) => {
      if (pendingContentRef.current.get(docId) === html) {
        pendingContentRef.current.delete(docId);
      }
    });
  }, []);

  const handleRemoveRecent = useCallback((id) => {
    // Use the ref here because React state updates are asynchronous. This
    // prevents a rapid close/select sequence from choosing a stale tab.
    const nextRecents = recentIdsRef.current.filter((x) => x !== id);
    recentIdsRef.current = nextRecents;
    setRecentIds(nextRecents);
    saveRecents(nextRecents);

    // Only pivot the current doc if we just closed the active tab.
    // Closing a background tab shouldn't disturb what you're editing.
    if (id !== currentDocIdRef.current) return;

    flushSave();

    // Prefer the next still-valid recent tab (keeps the strip order intuitive)
    const nextRecent = nextRecents.find((rid) => {
        const doc = documents.find((d) => d.id === rid);
        return doc && !doc.deletedAt;
    });

    if (nextRecent) {
      currentDocIdRef.current = nextRecent;
      setCurrentDocId(nextRecent);
      return;
    }

    // Nothing else open → clear the current doc so the welcome page shows.
    // The doc itself stays in `documents` and remains accessible from
    // the ⋯ menu, the command palette, and the welcome page's Recent list.
    currentDocIdRef.current = null;
    setCurrentDocId(null);
  }, [documents, flushSave]);

  const handleEditorChange = useCallback(
    (html, sourceDocId) => {
      setSaveStatus('saving');
      const docId = sourceDocId || currentDocIdRef.current;
      if (!docId) return;
      pendingContentRef.current.set(docId, html);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const pending = new Map(pendingContentRef.current);
        setDocuments((docs) => applyPendingContent(docs, pending));
        pending.forEach((latestHtml, pendingDocId) => {
          if (pendingContentRef.current.get(pendingDocId) === latestHtml) {
            pendingContentRef.current.delete(pendingDocId);
          }
        });
        saveTimerRef.current = null;
      }, 400);
    },
    []
  );

  useEffect(() => () => flushSave(), [flushSave]);

  useEffect(() => {
    const persistPending = () => {
      if (pendingContentRef.current.size === 0) return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const pending = new Map(pendingContentRef.current);
      const snapshot = applyPendingContent(documentsRef.current, pending);
      documentsRef.current = snapshot;
      pendingContentRef.current.clear();
      setDocuments(snapshot);
      saveDocuments(snapshot.filter((doc) => !isBlankDoc(doc)));
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistPending();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', persistPending);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', persistPending);
    };
  }, []);

  /* --- documents --- */

  const handleNewDocument = useCallback(() => {
    flushSave();
    const doc = createDocument('Untitled note');
    setDocuments((docs) => [doc, ...docs]);
    currentDocIdRef.current = doc.id;
    setCurrentDocId(doc.id);

    // Add the new document to the recent bar without reordering existing tabs
    commitRecentIds((prev) => {
      if (prev.includes(doc.id)) return prev;
      return [...prev, doc.id].slice(-MAX_RECENTS);
    });
  }, [flushSave, commitRecentIds]);

  const handleSelectDocument = useCallback(
    (id) => {
      const target = documents.find((d) => d.id === id);
      if (!target || target.deletedAt) return;
      if (id !== currentDocId) {
        flushSave();
        currentDocIdRef.current = id;
        setCurrentDocId(id);
      }

      // Ensure the doc appears in the bar without disturbing existing positions
      commitRecentIds((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id].slice(-MAX_RECENTS);
      });
    },
    [currentDocId, documents, flushSave, commitRecentIds]
  );

  const handleSaveNow = useCallback(() => {
    setSaveStatus('saving');
    const snapshot = applyPendingContent(documentsRef.current, pendingContentRef.current);
    flushSave();
    const revision = ++saveRevisionRef.current;
    saveDocuments(snapshot.filter((doc) => !isBlankDoc(doc))).then((saved) => {
      if (saveRevisionRef.current === revision) {
        setSaveStatus(saved ? 'saved' : 'offline');
      }
    });
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

  const handleTogglePin = useCallback((id) => {
    setDocuments((docs) => docs.map((doc) => (
      doc.id === id ? { ...doc, pinned: !doc.pinned, updatedAt: Date.now() } : doc
    )));
  }, []);

  const handleEditMetadata = useCallback((doc) => {
    const tags = window.prompt('Tags (comma separated)', (doc.tags || []).join(', '));
    if (tags === null) return;
    const folder = window.prompt('Folder', doc.folder || '');
    if (folder === null) return;
    setDocuments((docs) => docs.map((item) => (
      item.id === doc.id
        ? {
            ...item,
            tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
            folder: folder.trim().slice(0, 60),
            updatedAt: Date.now(),
          }
        : item
    )));
  }, []);

  const handleReorderRecent = useCallback((draggedId, targetId) => {
    const next = [...recentIdsRef.current];
    const from = next.indexOf(draggedId);
    const to = next.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    recentIdsRef.current = next;
    setRecentIds(next);
    saveRecents(next);
  }, []);

  const handleDelete = useCallback((id) => {
    if (!id) return;
    const target = documents.find((d) => d.id === id);
    if (!target) return;

    flushSave();

    setDocuments((docs) =>
      docs.map((d) =>
        d.id === id ? { ...d, deletedAt: Date.now() } : d
      )
    );

    if (id === currentDocIdRef.current) {
      const nextRecent = recentIdsRef.current
        .filter((recentId) => recentId !== id)
        .map((recentId) => documents.find((d) => d.id === recentId))
        .find((d) => d && !d.deletedAt);
      const next = nextRecent || documents.find((d) => d.id !== id && !d.deletedAt);
      const nextId = next?.id || null;
      currentDocIdRef.current = nextId;
      setCurrentDocId(nextId);
      commitRecentIds((prev) => {
        const withoutDeleted = prev.filter((recentId) => recentId !== id);
        return nextId && !withoutDeleted.includes(nextId)
          ? [...withoutDeleted, nextId].slice(-MAX_RECENTS)
          : withoutDeleted;
      });
    } else {
      commitRecentIds((prev) => prev.filter((recentId) => recentId !== id));
    }

    setUndoPayload({
      message: `Deleted "${target.title || 'note'}"`,
      onUndo: () => {
        setDocuments((docs) =>
          docs.map((d) => (d.id === id ? { ...d, deletedAt: null } : d))
        );
        commitRecentIds((prev) => prev.includes(id) ? prev : [...prev, id].slice(-MAX_RECENTS));
        if (!currentDocIdRef.current) {
          currentDocIdRef.current = id;
          setCurrentDocId(id);
        }
      },
    });
  }, [documents, flushSave, commitRecentIds]);

  const handleRestore = useCallback((id) => {
    setDocuments((docs) =>
      docs.map((d) => (d.id === id ? { ...d, deletedAt: null } : d))
    );
    commitRecentIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id].slice(-MAX_RECENTS);
    });
  }, [commitRecentIds]);

  const handleDeleteForever = useCallback((id) => {
    const remaining = documents.filter((d) => d.id !== id);
    const active = remaining.filter((d) => !d.deletedAt);
    const currentId = currentDocIdRef.current;
    const currentStillValid = active.some((d) => d.id === currentId);
    const nextCurrent = currentStillValid
      ? currentId
      : currentId
        ? active[0]?.id || null
        : null;

    setDocuments(remaining);
    currentDocIdRef.current = nextCurrent;
    setCurrentDocId(nextCurrent);

    const nextRecents = recentIdsRef.current.filter((recentId) => recentId !== id);
    recentIdsRef.current = nextRecents;
    setRecentIds(nextRecents);
    saveRecents(nextRecents);
  }, [documents]);

  const handleEmptyTrash = useCallback(() => {
    const remaining = documents.filter((d) => !d.deletedAt);
    const currentId = currentDocIdRef.current;
    const currentStillValid = remaining.some((d) => d.id === currentId);
    setDocuments(remaining);
    if (currentId && !currentStillValid) {
      const nextCurrent = remaining[0]?.id || null;
      currentDocIdRef.current = nextCurrent;
      setCurrentDocId(nextCurrent);
      if (nextCurrent && !recentIdsRef.current.includes(nextCurrent)) {
        const nextRecents = [...recentIdsRef.current, nextCurrent].slice(-MAX_RECENTS);
        recentIdsRef.current = nextRecents;
        setRecentIds(nextRecents);
        saveRecents(nextRecents);
      }
    }
  }, [documents]);

  /* --- templates --- */

  const handleSaveAsTemplate = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (!doc) return;
    const name = window.prompt(
      'Template name',
      doc.title || 'Untitled template'
    );
    if (!name) return;
    const latestContent = pendingContentRef.current.get(doc.id) ?? doc.content ?? '';
    const tpl = createTemplate(name.trim(), latestContent);
    setTemplates((prev) => [tpl, ...prev]);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 1200);
  }, [documents]);

  const handleUseTemplate = useCallback((tpl) => {
    flushSave();
    const doc = createDocument(tpl.title || 'Untitled note');
    doc.content = tpl.content || '';
    setDocuments((docs) => [doc, ...docs]);
    currentDocIdRef.current = doc.id;
    setCurrentDocId(doc.id);

    // Template-created doc also lands in the bar
    commitRecentIds((prev) => {
      if (prev.includes(doc.id)) return prev;
      return [...prev, doc.id].slice(-MAX_RECENTS);
    });
  }, [flushSave, commitRecentIds]);

  const handleDeleteTemplate = useCallback((id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* --- export / import --- */

  const handleExportHtml = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (doc) exportDocumentAsHtml({ ...doc, content: pendingContentRef.current.get(doc.id) ?? doc.content });
  }, [documents]);

  const handleExportJson = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (doc) exportDocumentAsJson({ ...doc, content: pendingContentRef.current.get(doc.id) ?? doc.content });
  }, [documents]);

  const handleExportMarkdown = useCallback(() => {
    const doc = documents.find((d) => d.id === currentDocIdRef.current);
    if (doc) exportDocumentAsMarkdown({ ...doc, content: pendingContentRef.current.get(doc.id) ?? doc.content });
  }, [documents]);

  const handleExportBackup = useCallback(() => {
    const snapshot = applyPendingContent(documents, pendingContentRef.current);
    exportBackup(snapshot, templates);
  }, [documents, templates]);

  const handleImportFile = useCallback(
    async (file) => {
      flushSave();
      const doc = await importFromFile(file);
      setDocuments((docs) => [doc, ...docs]);
      currentDocIdRef.current = doc.id;
      setCurrentDocId(doc.id);

      // Imported doc also lands in the bar
      commitRecentIds((prev) => {
        if (prev.includes(doc.id)) return prev;
        return [...prev, doc.id].slice(-MAX_RECENTS);
      });
    },
    [flushSave, commitRecentIds]
  );

  const handleImportFiles = useCallback(async (files) => {
    const selected = Array.from(files || []).filter(Boolean);
    if (!selected.length) return;
    flushSave();
    const imported = [];
    for (const file of selected) imported.push(await importFromFile(file));
    setDocuments((docs) => [...imported, ...docs]);
    const last = imported[imported.length - 1];
    currentDocIdRef.current = last.id;
    setCurrentDocId(last.id);
    commitRecentIds((prev) => [...prev, ...imported.map((doc) => doc.id)].slice(-MAX_RECENTS));
  }, [flushSave, commitRecentIds]);

  const handleImportBackup = useCallback(async (file) => {
    const backup = await importBackupFile(file);
    if (!backup.documents.length) throw new Error('The backup has no documents.');
    flushSave();
    setDocuments((docs) => [...backup.documents, ...docs]);
    setTemplates((prev) => [...backup.templates, ...prev]);
    const first = backup.documents[0];
    currentDocIdRef.current = first.id;
    setCurrentDocId(first.id);
    commitRecentIds((prev) => [...prev, ...backup.documents.map((doc) => doc.id)].slice(-MAX_RECENTS));
  }, [flushSave, commitRecentIds]);

  const handleDropFiles = useCallback(async (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(event.dataTransfer?.files || []);
    if (!files.length) return;
    try {
      await handleImportFiles(files);
    } catch (error) {
      window.alert(`Could not import files: ${error.message}`);
    }
  }, [handleImportFiles]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const celebrate = useCallback((event) => {
    setCelebration({ id: Date.now(), x: event.clientX, y: event.clientY });
  }, []);

  const clearCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  const closeDocumentsModal = useCallback(() => setDocsModalOpen(false), []);
  const closeTemplatesModal = useCallback(() => setTemplatesModalOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const dismissUndo = useCallback(() => setUndoPayload(null), []);

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

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Tab' || !(event.ctrlKey || event.metaKey)) return;
      const ids = recentIdsRef.current.filter((id) => documents.some((doc) => doc.id === id && !doc.deletedAt));
      if (ids.length < 2) return;
      event.preventDefault();
      const currentIndex = ids.indexOf(currentDocIdRef.current);
      const direction = event.shiftKey ? -1 : 1;
      const startIndex = currentIndex < 0 ? (direction > 0 ? -1 : 0) : currentIndex;
      const nextId = ids[(startIndex + direction + ids.length) % ids.length];
      handleSelectDocument(nextId);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [documents, handleSelectDocument]);

  const handleTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const edgeSize = 28;
    const fromEdge = touch.clientX <= edgeSize || touch.clientX >= window.innerWidth - edgeSize;
    touchStartRef.current = fromEdge ? { x: touch.clientX, y: touch.clientY } : null;
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (touchStartRef.current === null) return;
    const touch = event.changedTouches[0];
    const delta = touch.clientX - touchStartRef.current.x;
    const verticalDelta = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(delta) < 70 || Math.abs(verticalDelta) > 50) return;
    const ids = recentIdsRef.current.filter((id) => documents.some((doc) => doc.id === id && !doc.deletedAt));
    const index = ids.indexOf(currentDocIdRef.current);
    if (index < 0 || ids.length < 2) return;
    const nextId = ids[(index + (delta < 0 ? 1 : -1) + ids.length) % ids.length];
    handleSelectDocument(nextId);
  }, [documents, handleSelectDocument]);

  if (bootError) {
    return (
      <div className="app app--loading">
        <div className="app-loading">
          {bootError} Your notes were not modified. Reload the page to try again.
        </div>
      </div>
    );
  }

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
        <AppBrand onCelebrate={celebrate} />

        <RecentBar
          documents={documents}
          recentIds={recentIds}
          currentDocId={currentDocId}
          onSelect={handleSelectDocument}
          onRemove={handleRemoveRecent}
          onNewDocument={handleNewDocument}
          onReorder={handleReorderRecent}
        />

        <div className={`save-status save-status--${saveStatus}`} role="status" aria-live="polite">
          <span className="save-status-dot" aria-hidden="true" />
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'offline' ? 'Offline' : 'Saved'}
        </div>

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
          onExportBackup={handleExportBackup}
          onImportFile={handleImportFile}
          onImportFiles={handleImportFiles}
          onImportBackup={handleImportBackup}
          saveStatus={saveStatus}
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

        <main
          className={`app-main${isDraggingFile ? ' app-main--drop-active' : ''}`}
          onDragOver={(event) => {
            if (event.dataTransfer?.types?.includes('Files')) {
              event.preventDefault();
              setIsDraggingFile(true);
            }
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setIsDraggingFile(false);
          }}
          onDrop={handleDropFiles}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isDraggingFile && <div className="file-drop-overlay">Drop files to import</div>}
        {currentDoc ? (
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
            recentIds={recentIds}
            onLogoCelebrate={celebrate}
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
        onClose={closeDocumentsModal}
        documents={documents}
        currentDocId={currentDocId}
        onSelect={handleSelectDocument}
        onRename={handleRename}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onDeleteForever={handleDeleteForever}
        onEmptyTrash={handleEmptyTrash}
        onNewDocument={handleNewDocument}
        onTogglePin={handleTogglePin}
        onEditMetadata={handleEditMetadata}
      />

      <TemplatesModal
        open={templatesModalOpen}
        onClose={closeTemplatesModal}
        templates={templates}
        currentDocTitle={currentDoc?.title}
        onUseTemplate={handleUseTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onSaveCurrentAsTemplate={handleSaveAsTemplate}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
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
          onDismiss={dismissUndo}
        />
      )}

      {celebration && (
        <CelebrationBurst
          key={celebration.id}
          origin={celebration}
          onDone={clearCelebration}
        />
      )}
    </div>
  );
}
