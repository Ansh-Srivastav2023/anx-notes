import React from 'react';

function Icon({ children, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
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

export default function WelcomePage({
  documents = [],
  onOpenDocument,
  onNewDocument,
  onOpenBrowser,
  onOpenTemplates,
  onOpenShortcuts,
  theme,
  onToggleTheme,
}) {
  const recents = [...documents]
    .filter((d) => !d.deletedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);

  return (
    <div className="welcome">
      <div className="welcome-inner">
        <header className="welcome-hero">
          <div className="welcome-logo" aria-hidden="true">
  <svg
    width="100%"
    height="100%"
    viewBox="0 0 320 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="welcomeBrandMain"
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
        id="welcomeBrandWriting"
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
        id="welcomeBrandShadow"
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

    <path
      d="M82 34 H194 L270 110 V260 C270 278 256 292 238 292 H82 C58 292 42 276 42 252 V74 C42 50 58 34 82 34 Z"
      fill="url(#welcomeBrandMain)"
      filter="url(#welcomeBrandShadow)"
    />
    <path
      d="M194 35 V94 C194 104 202 112 212 112 H269"
      fill="none"
      stroke="white"
      strokeOpacity="0.42"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M194 35 L269 110 H212 C202 110 194 102 194 92 Z"
      fill="#A855F7"
      fillOpacity="0.32"
    />
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
    <path
      d="M82 225 C97 210 109 244 124 227 C139 211 151 242 166 227 C181 212 194 235 207 220 C215 212 222 210 230 210"
      stroke="url(#welcomeBrandWriting)"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M222 210 L239 193 C242 190 247 190 250 193 L253 196 C256 199 256 203 253 206 L235 224 Z"
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
            <h1 className="welcome-title welcome-title--brand">
                ANX <span className="welcome-title-accent">Notes</span>
            </h1>
          <p className="welcome-tagline">
            A minimal notes editor with tables, checklists, fonts, and slash
            commands. Everything saves automatically to your browser.
          </p>

          <div className="welcome-actions">
            <button
              type="button"
              className="welcome-btn welcome-btn--primary"
              onClick={onNewDocument}
            >
              <Icon><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
              New document
            </button>
            <button
              type="button"
              className="welcome-btn"
              onClick={onOpenBrowser}
            >
              <Icon>
                <path d="M4 4h5l2 3h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
              </Icon>
              Browse all
            </button>
          </div>
        </header>

        {recents.length > 0 && (
          <section className="welcome-section">
            <h2 className="welcome-section-title">Recent</h2>
            <div className="welcome-docs">
              {recents.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="welcome-doc"
                  onClick={() => onOpenDocument(doc.id)}
                >
                  <span className="welcome-doc-title">
                    {doc.title || 'Untitled note'}
                  </span>
                  <span className="welcome-doc-date">
                    {formatDate(doc.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="welcome-section">
          <h2 className="welcome-section-title">Get started</h2>
          <div className="welcome-grid">
            <button
              type="button"
              className="welcome-card"
              onClick={onOpenTemplates}
            >
              <div className="welcome-card-icon">
                <Icon size={18}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                </Icon>
              </div>
              <div>
                <div className="welcome-card-title">Start from a template</div>
                <div className="welcome-card-sub">
                  Reuse a note as a starting point
                </div>
              </div>
            </button>

            <button
              type="button"
              className="welcome-card"
              onClick={onOpenShortcuts}
            >
              <div className="welcome-card-icon">
                <Icon size={18}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </Icon>
              </div>
              <div>
                <div className="welcome-card-title">Keyboard shortcuts</div>
                <div className="welcome-card-sub">
                  Format, navigate, and search faster
                </div>
              </div>
            </button>

            <button
              type="button"
              className="welcome-card"
              onClick={onToggleTheme}
            >
              <div className="welcome-card-icon">
                {theme === 'dark' ? (
                  <Icon size={18}>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </Icon>
                ) : (
                  <Icon size={18}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </Icon>
                )}
              </div>
              <div>
                <div className="welcome-card-title">
                  {theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'}
                </div>
                <div className="welcome-card-sub">
                  Preference is saved locally
                </div>
              </div>
            </button>
          </div>
        </section>

        <section className="welcome-section">
          <h2 className="welcome-section-title">Quick tips</h2>
          <ul className="welcome-tips">
            <li>
              <kbd className="welcome-kbd">/</kbd> opens the slash command menu
            </li>
            <li>
              <kbd className="welcome-kbd">**bold**</kbd>{' '}
              <kbd className="welcome-kbd">- list</kbd>{' '}
              <kbd className="welcome-kbd"># title</kbd> — markdown shortcuts
              work as you type
            </li>
            <li>
              <kbd className="welcome-kbd">Cmd</kbd>
              <kbd className="welcome-kbd">K</kbd> opens the command palette
            </li>
            <li>
              <kbd className="welcome-kbd">Cmd</kbd>
              <kbd className="welcome-kbd">F</kbd> searches inside the current
              document
            </li>
            <li>Drag any block by its grip to reorder — including tables</li>
            <li>
              Type <kbd className="welcome-kbd">[]</kbd> for a checklist item
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}