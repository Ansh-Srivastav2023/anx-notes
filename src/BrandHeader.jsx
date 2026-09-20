import React from 'react';

// Modern clean SVG icon representing a stylized document with an active pen dot
function NoteIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function AppBrand() {
  return (
    <div className="app-brand">
      <div className="app-logo" aria-label="ANX Notes Logo">
        {/* Option A: Modern SVG Icon */}
        <NoteIcon />
        
        {/* Option B: Monogram (Uncomment to use 'ANX' monogram instead of SVG) */}
        {/* <span>ANX</span> */}
      </div>

      <div className="app-brand-text">
        <span className="app-brand-title">
          ANX <span className="app-brand-accent">Notes</span>
        </span>
      </div>
    </div>
  );
}