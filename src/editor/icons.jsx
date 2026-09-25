import React from 'react';

export function Icon({ children }) {
  return (
    <svg
      width="16"
      height="16"
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

export const icons = {
    undo: (<Icon><path d="M9 14 4 9l5-5" /><path d="M4 9h10a5 5 0 0 1 0 10h-3" /></Icon>),
    redo: (<Icon><path d="m15 14 5-5-5-5" /><path d="M20 9H10a5 5 0 0 0 0 10h3" /></Icon>),
    bold: (<Icon><path d="M6 4h7a4 4 0 0 1 0 8H6z" /><path d="M6 12h8a4 4 0 0 1 0 8H6z" /></Icon>),
    italic: (<Icon><path d="M19 4h-9" /><path d="M14 20H5" /><path d="M15 4 9 20" /></Icon>),
    underline: (<Icon><path d="M6 4v7a6 6 0 0 0 12 0V4" /><path d="M5 21h14" /></Icon>),
    strike: (<Icon><path d="M4 12h16" /><path d="M17 7a4 4 0 0 0-4-3h-2a4 4 0 0 0-1 7.9" /><path d="M7 17a4 4 0 0 0 4 3h2a4 4 0 0 0 1-7.9" /></Icon>),
    code: (<Icon><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></Icon>),
    bulletList: (<Icon><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></Icon>),
    orderedList: (<Icon><path d="M10 6h10" /><path d="M10 12h10" /><path d="M10 18h10" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></Icon>),
    checklist: (
        <Icon>
        <path d="m3 7 2 2 4-4" />
        <path d="m3 17 2 2 4-4" />
        <path d="M13 6h8" />
        <path d="M13 12h8" />
        <path d="M13 18h8" />
        </Icon>
    ),
    quote: (<Icon><path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3" /><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3" /></Icon>),
    codeBlock: (<Icon><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m10 14-3-2 3-2" /><path d="m14 10 3 2-3 2" /></Icon>),
    table: (<Icon><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Icon>),
    divider: (<Icon><path d="M4 12h16" /><path d="M8 7h8" /><path d="M8 17h8" /></Icon>),
    chevron: (<Icon><path d="m6 9 6 6 6-6" /></Icon>),
    search: (<Icon><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>),
    help: (<Icon><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></Icon>),
    alignLeft: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="18" y2="18" /></Icon>),
    alignCenter: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="5" y1="18" x2="19" y2="18" /></Icon>),
    alignRight: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="6" y1="18" x2="20" y2="18" /></Icon>),
    alignJustify: (<Icon><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></Icon>),
      outline: (
    <Icon>
      <path d="M4 6h4" />
      <path d="M4 12h4" />
      <path d="M4 18h4" />
      <path d="M12 6h8" />
      <path d="M12 12h8" />
      <path d="M12 18h8" />
    </Icon>
  ),
  bookOpen: (
    <Icon>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </Icon>
  ),
};