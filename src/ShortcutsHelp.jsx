import React, { useEffect, useMemo, useRef } from 'react';
import { SHORTCUT_GROUPS, KEYBOARD_GROUPS } from './Shortcuts';

/* Platform-aware key labels */
function getKeyLabels() {
  if (typeof navigator === 'undefined') {
    return { Mod: 'Ctrl', Shift: 'Shift', Alt: 'Alt' };
  }
  const platform =
    (navigator.userAgentData && navigator.userAgentData.platform) ||
    navigator.platform ||
    '';
  const isMac = /Mac|iPhone|iPad/i.test(platform);
  return isMac
    ? { Mod: '⌘', Shift: '⇧', Alt: '⌥' }
    : { Mod: 'Ctrl', Shift: 'Shift', Alt: 'Alt' };
}

function KeyChip({ children }) {
  return <kbd className="shortcuts-kbd">{children}</kbd>;
}

function TextRow({ item }) {
  return (
    <li className="shortcuts-row">
      <span className="shortcuts-input">
        <KeyChip>{item.input}</KeyChip>
      </span>
      <span className="shortcuts-arrow" aria-hidden="true">→</span>
      <span className="shortcuts-output">{item.output}</span>
    </li>
  );
}

function KeyboardRow({ item, labels }) {
  return (
    <li className="shortcuts-row">
      <span className="shortcuts-input shortcuts-input--keys">
        {item.keys.map((k, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="shortcuts-plus">+</span>}
            <KeyChip>{labels[k] || k}</KeyChip>
          </React.Fragment>
        ))}
      </span>
      <span className="shortcuts-arrow" aria-hidden="true">→</span>
      <span className="shortcuts-output">{item.output}</span>
    </li>
  );
}

function Group({ title, children }) {
  return (
    <section className="shortcuts-group">
      <h4 className="shortcuts-group-title">{title}</h4>
      <ul className="shortcuts-list">{children}</ul>
    </section>
  );
}

export default function ShortcutsHelp({ open, onClose, anchorRef }) {
  const panelRef = useRef(null);
  const labels = useMemo(getKeyLabels, []);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e) => {
      const panel = panelRef.current;
      const anchor = anchorRef?.current;
      if (
        panel && !panel.contains(e.target) &&
        (!anchor || !anchor.contains(e.target))
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const rect = anchorRef?.current?.getBoundingClientRect();
  const style = rect
    ? { top: rect.bottom + 8, left: Math.max(8, rect.right - 340) }
    : { top: 60, right: 16 };

  return (
    <div
      ref={panelRef}
      className="shortcuts-popover"
      style={style}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <header className="shortcuts-popover-header">
        <span>Shortcuts</span>
        <button
          type="button"
          className="shortcuts-popover-close"
          onClick={onClose}
          aria-label="Close"
          title="Close (Esc)"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div className="shortcuts-popover-body">
        <h3 className="shortcuts-section-title">Type to convert</h3>
        {SHORTCUT_GROUPS.map((group) => (
          <Group key={group.title} title={group.title}>
            {group.items.map((item) => (
              <TextRow key={item.input} item={item} />
            ))}
          </Group>
        ))}

        <h3 className="shortcuts-section-title shortcuts-section-title--spaced">
          Keyboard
        </h3>
        {KEYBOARD_GROUPS.map((group) => (
          <Group key={group.title} title={group.title}>
            {group.items.map((item) => (
              <KeyboardRow
                key={item.keys.join('+')}
                item={item}
                labels={labels}
              />
            ))}
          </Group>
        ))}
      </div>

      <footer className="shortcuts-popover-footer">
        Type in the editor to apply · <kbd className="shortcuts-kbd">{labels.Mod}</kbd>+<kbd className="shortcuts-kbd">/</kbd> to toggle this panel
      </footer>
    </div>
  );
}