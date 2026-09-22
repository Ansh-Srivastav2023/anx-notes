import { Extension, textInputRule, InputRule } from '@tiptap/core';

/* ------------------------------------------------------------------ */
/*  Superscript helper                                                */
/* ------------------------------------------------------------------ */
const SUPERSCRIPT_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '-': '⁻', '+': '⁺',
};

function toSuperscript(str) {
  return str
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] || ch)
    .join('');
}

const superscriptRule = new InputRule({
  find: /\^([+-]?\d+)$/,
  handler: ({ state, range, match }) => {
    state.tr.insertText(
      toSuperscript(match[1]),
      range.from,
      range.to
    );
  },
});

/* ------------------------------------------------------------------ */
/*  Type-to-convert shortcuts                                         */
/*  Entries WITH a `find` regex become live input rules.              */
/*  Entries WITHOUT `find` are display-only (they show in the help    */
/*  popover but the actual conversion lives elsewhere).               */
/* ------------------------------------------------------------------ */
export const SHORTCUT_GROUPS = [
  {
    title: 'Commands',
    items: [
      { input: '/',    output: 'Slash command menu' },
      { input: '[] ',  output: 'Checklist' },
      { input: '[ ] ', output: 'Checklist' },
    ],
  },
  {
    title: 'Arrows',
    items: [
      { input: '-->', output: '⟶', find: /-->$/ },
      { input: '<--', output: '⟵', find: /<--$/ },
      { input: '==>', output: '⟹', find: /==>$/ },
      { input: '=>',  output: '⇛', find: /=>$/  },
    ],
  },
  {
    title: 'Punctuation',
    items: [
      { input: '...', output: '…',  find: /\.\.\.$/ },
      { input: '-- ', output: '— ', find: /-- $/    },
    ],
  },
  {
    title: 'Math & comparison',
    items: [
      { input: '!=', output: '≠', find: /!=$/  },
      { input: '<=', output: '≤', find: /<=$/  },
      { input: '>=', output: '≥', find: />=$/  },
      { input: '+-', output: '±', find: /\+-$/ },
    ],
  },
  {
    title: 'Fractions',
    items: [
      { input: '1/2', output: '½', find: /1\/2$/ },
      { input: '1/3', output: '⅓', find: /1\/3$/ },
      { input: '2/3', output: '⅔', find: /2\/3$/ },
      { input: '1/4', output: '¼', find: /1\/4$/ },
      { input: '3/4', output: '¾', find: /3\/4$/ },
      { input: '1/8', output: '⅛', find: /1\/8$/ },
    ],
  },
  {
    title: 'Legal & trademark',
    items: [
      { input: '(c)',  output: '©', find: /\(c\)$/i  },
      { input: '(r)',  output: '®', find: /\(r\)$/i  },
      { input: '(tm)', output: '™', find: /\(tm\)$/i },
    ],
  },
  {
    title: 'Superscripts',
    items: [
      { input: '^0 … ^9', output: '⁰ … ⁹' },
      { input: '^12',     output: '¹²'     },
      { input: '^-3',     output: '⁻³'     },
      { input: '^+45',    output: '⁺⁴⁵'    },
    ],
  },
  {
    title: 'Markdown blocks',
    items: [
      { input: '# ',   output: 'Heading 1' },
      { input: '## ',  output: 'Heading 2' },
      { input: '### ', output: 'Heading 3' },
      { input: '- ',   output: 'Bullet list' },
      { input: '1. ',  output: 'Numbered list' },
      { input: '> ',   output: 'Quote' },
      { input: '```',  output: 'Code block' },
      { input: '---',  output: 'Divider' },
    ],
  },
  {
    title: 'Inline formatting',
    items: [
      { input: '**text**', output: 'Bold' },
      { input: '*text*',   output: 'Italic' },
      { input: '~~text~~', output: 'Strikethrough' },
      { input: '`text`',   output: 'Code' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Keyboard shortcuts                                                */
/*  `Mod` = ⌘ on Mac / Ctrl elsewhere.                                */
/*  The popover swaps placeholders for real key caps.                 */
/* ------------------------------------------------------------------ */
export const KEYBOARD_GROUPS = [
  {
    title: 'Formatting',
    items: [
      { keys: ['Mod', 'B'],          output: 'Bold' },
      { keys: ['Mod', 'I'],          output: 'Italic' },
      { keys: ['Mod', 'U'],          output: 'Underline' },
      { keys: ['Mod', 'Shift', 'X'], output: 'Strikethrough' },
      { keys: ['Mod', 'E'],          output: 'Inline code' },
    ],
  },
  {
    title: 'Blocks',
    items: [
      { keys: ['Mod', 'Alt', '1'],   output: 'Heading 1' },
      { keys: ['Mod', 'Alt', '2'],   output: 'Heading 2' },
      { keys: ['Mod', 'Alt', '3'],   output: 'Heading 3' },
      { keys: ['Mod', 'Shift', '8'], output: 'Bullet list' },
      { keys: ['Mod', 'Shift', '7'], output: 'Numbered list' },
      { keys: ['Mod', 'Shift', '9'], output: 'Checklist' },
      { keys: ['Mod', 'Shift', 'B'], output: 'Quote' },
      { keys: ['Mod', 'Alt', 'C'],   output: 'Code block' },
    ],
  },
  {
    title: 'Alignment',
    items: [
      { keys: ['Mod', 'Alt', 'L'], output: 'Left' },
      { keys: ['Mod', 'Alt', 'E'], output: 'Center' },
      { keys: ['Mod', 'Alt', 'R'], output: 'Right' },
      { keys: ['Mod', 'Alt', 'J'], output: 'Justify' },
    ],
  },
  {
    title: 'Tables & lists',
    items: [
      { keys: ['Mod', 'Alt', 'T'], output: 'Insert table' },
      { keys: ['Tab'],             output: 'Indent (in list)' },
      { keys: ['Shift', 'Tab'],    output: 'Outdent (in list)' },
    ],
  },
  {
    title: 'Editor & navigation',
    items: [
      { keys: ['Mod', 'K'],          output: 'Command palette' },
      { keys: ['Mod', 'F'],          output: 'Find & replace' },
      { keys: ['Mod', '/'],          output: 'This panel' },
      { keys: ['Mod', 'S'],          output: 'Save now' },
      { keys: ['Mod', 'N'],          output: 'New document' },
      { keys: ['Mod', 'Z'],          output: 'Undo' },
      { keys: ['Mod', 'Shift', 'Z'], output: 'Redo' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Build Tiptap rules                                                */
/*  Static replacements use textInputRule. The dynamic superscript    */
/*  rule uses InputRule so any digit sequence works.                  */
/* ------------------------------------------------------------------ */
const allRules = SHORTCUT_GROUPS
  .flatMap((group) =>
    group.items
      .filter((item) => item.find)
      .map((item) =>
        textInputRule({ find: item.find, replace: item.output })
      )
  )
  .concat(superscriptRule);

export const Shortcuts = Extension.create({
  name: 'shortcuts',
  addInputRules() {
    return allRules;
  },
});