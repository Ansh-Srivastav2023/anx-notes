import React, { useEffect, useRef, useState } from 'react';
import { findMatches } from './FindReplaceExtension';

function Icon({ children }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function FindReplace({ editor, open, onClose }) {
  const [term, setTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const inputRef = useRef(null);

  /* Focus and reset when opening/closing */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setTerm('');
      setReplaceTerm('');
      setCurrentIndex(0);
      setMatchCount(0);
      editor?.commands.clearFindState();
    }
  }, [open, editor]);

  /* Recompute matches when the term or doc changes */
  useEffect(() => {
    if (!editor || !open) return undefined;

    const recompute = () => {
      const matches = findMatches(editor.state.doc, term);
      setMatchCount(matches.length);
      if (matches.length === 0) {
        if (currentIndex !== -1) setCurrentIndex(-1);
      } else if (currentIndex < 0 || currentIndex >= matches.length) {
        setCurrentIndex(0);
      }
      editor.commands.setFindState({
        term,
        index: Math.max(0, Math.min(currentIndex, matches.length - 1)),
      });
    };

    recompute();

    const handler = ({ transaction }) => {
      if (transaction.docChanged) recompute();
    };
    editor.on('transaction', handler);
    return () => editor.off('transaction', handler);
  }, [editor, term, currentIndex, open]);

  const jump = (dir) => {
    if (matchCount === 0) return;
    const next = (currentIndex + dir + matchCount) % matchCount;
    setCurrentIndex(next);
    editor.commands.setFindState({ term, index: next });

    const matches = findMatches(editor.state.doc, term);
    const m = matches[next];
    if (m) {
      editor
        .chain()
        .setTextSelection({ from: m.from, to: m.to })
        .scrollIntoView()
        .run();
    }
  };

  const handleReplace = () => {
    if (matchCount === 0 || currentIndex < 0) return;
    const matches = findMatches(editor.state.doc, term);
    const m = matches[currentIndex];
    if (!m) return;

    editor
      .chain()
      .focus()
      .insertContentAt({ from: m.from, to: m.to }, replaceTerm)
      .run();
    // Match list refreshes via the transaction listener
  };

  const handleReplaceAll = () => {
    if (matchCount === 0) return;
    const matches = findMatches(editor.state.doc, term);
    const chain = editor.chain().focus();
    // Replace from last to first so earlier positions stay valid
    for (let i = matches.length - 1; i >= 0; i--) {
      chain.insertContentAt(
        { from: matches[i].from, to: matches[i].to },
        replaceTerm
      );
    }
    chain.run();
  };

  if (!open) return null;

  return (
    <div className="find-replace" role="dialog" aria-label="Find and replace">
      <div className="find-row">
        <button
          type="button"
          className="find-toggle"
          onClick={() => setShowReplace((v) => !v)}
          title={showReplace ? 'Hide replace' : 'Show replace'}
          aria-label={showReplace ? 'Hide replace' : 'Show replace'}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: showReplace ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          className="find-input"
          placeholder="Find"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setCurrentIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              jump(e.shiftKey ? -1 : 1);
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
        />

        <span className="find-count">
          {matchCount > 0 ? `${currentIndex + 1}/${matchCount}` : '0/0'}
        </span>

        <button type="button" className="find-btn" onClick={() => jump(-1)} title="Previous" aria-label="Previous match" disabled={matchCount === 0}>
          <Icon><path d="m18 15-6-6-6 6" /></Icon>
        </button>
        <button type="button" className="find-btn" onClick={() => jump(1)} title="Next" aria-label="Next match" disabled={matchCount === 0}>
          <Icon><path d="m6 9 6 6 6-6" /></Icon>
        </button>
        <button type="button" className="find-btn" onClick={onClose} title="Close (Esc)" aria-label="Close">
          <Icon>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </Icon>
        </button>
      </div>

      {showReplace && (
        <div className="find-row">
          <span className="find-toggle-spacer" />
          <input
            type="text"
            className="find-input"
            placeholder="Replace"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleReplace();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
          />
          <button
            type="button"
            className="find-action"
            onClick={handleReplace}
            disabled={matchCount === 0}
          >
            Replace
          </button>
          <button
            type="button"
            className="find-action"
            onClick={handleReplaceAll}
            disabled={matchCount === 0}
          >
            All
          </button>
        </div>
      )}
    </div>
  );
}