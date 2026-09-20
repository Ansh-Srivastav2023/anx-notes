import React from 'react';

const Svg = ({ children }) => (
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

/* Small "Aa" preview in the target font, used as the icon for font entries */
const FontIcon = ({ family }) => (
  <span className="slash-font-icon" style={{ fontFamily: family }}>
    Aa
  </span>
);

export const slashCommandItems = [
  /* ---------- Blocks ---------- */
  {
    title: 'Heading 1',
    subtitle: 'Big section title',
    keywords: ['h1', 'title', 'heading'],
    icon: <span className="slash-glyph">H1</span>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    subtitle: 'Medium heading',
    keywords: ['h2', 'heading'],
    icon: <span className="slash-glyph">H2</span>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    subtitle: 'Small heading',
    keywords: ['h3', 'heading'],
    icon: <span className="slash-glyph">H3</span>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    title: 'Bullet list',
    subtitle: 'Unordered list',
    keywords: ['ul', 'bullet', 'unordered', 'list'],
    icon: <Svg><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" /></Svg>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered list',
    subtitle: 'Ordered list',
    keywords: ['ol', 'ordered', 'number', 'list'],
    icon: <Svg><path d="M10 6h10" /><path d="M10 12h10" /><path d="M10 18h10" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></Svg>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Quote',
    subtitle: 'Blockquote',
    keywords: ['quote', 'blockquote', 'citation'],
    icon: <Svg><path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3" /><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3" /></Svg>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Code block',
    subtitle: 'Preformatted text',
    keywords: ['code', 'codeblock', 'pre'],
    icon: <Svg><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m10 14-3-2 3-2" /><path d="m14 10 3 2-3 2" /></Svg>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Table',
    subtitle: '3 × 3 with header row',
    keywords: ['table', 'grid', 'rows'],
    icon: <Svg><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /><path d="M15 3v18" /></Svg>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Divider',
    subtitle: 'Horizontal rule',
    keywords: ['divider', 'hr', 'rule', 'separator'],
    icon: <Svg><path d="M4 12h16" /></Svg>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: 'Text',
    subtitle: 'Plain paragraph',
    keywords: ['text', 'paragraph', 'plain'],
    icon: <Svg><path d="M4 7h16" /><path d="M4 12h12" /><path d="M4 17h8" /></Svg>,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },

  /* ---------- Fonts ---------- */
  {
    title: 'Font: Sans',
    subtitle: 'Inter — clean, modern',
    keywords: ['font', 'sans', 'inter', 'default'],
    icon: <FontIcon family="Inter, sans-serif" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('Inter').run();
    },
  },
  {
    title: 'Font: Serif',
    subtitle: 'Georgia — classic',
    keywords: ['font', 'serif', 'georgia'],
    icon: <FontIcon family="Georgia, serif" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('Georgia').run();
    },
  },
  {
    title: 'Font: Mono',
    subtitle: 'JetBrains Mono — code',
    keywords: ['font', 'mono', 'code', 'jetbrains'],
    icon: <FontIcon family="'JetBrains Mono', monospace" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('"JetBrains Mono"').run();
    },
  },
  {
    title: 'Font: Hand',
    subtitle: 'Caveat — handwritten',
    keywords: ['font', 'hand', 'handwriting', 'caveat'],
    icon: <FontIcon family="Caveat, cursive" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('Caveat').run();
    },
  },
  {
    title: 'Font: Kalam',
    subtitle: 'Kalam — handwritten pen',
    keywords: ['font', 'kalam', 'handwriting'],
    icon: <FontIcon family="Kalam, serif" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('Kalam').run();
    },
  },
  {
    title: 'Font: Comic',
    subtitle: 'Comic Sans — playful',
    keywords: ['font', 'comic', 'playful'],
    icon: <FontIcon family="'Comic Sans MS', cursive" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('"Comic Sans MS"').run();
    },
  },
  {
    title: 'Font: Times',
    subtitle: 'Times New Roman — traditional',
    keywords: ['font', 'times', 'serif'],
    icon: <FontIcon family="'Times New Roman', serif" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('"Times New Roman"').run();
    },
  },
  {
    title: 'Font: Default',
    subtitle: 'Reset to editor default',
    keywords: ['font', 'default', 'reset', 'clear'],
    icon: <span className="slash-glyph">A</span>,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.chain().focus().setStickyFontFamily('').run();
    },
  },
];