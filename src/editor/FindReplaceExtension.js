import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const findReplaceKey = new PluginKey('findReplace');

/** Find all occurrences of `searchTerm` in the doc, case-insensitively. */
export function findMatches(doc, searchTerm) {
  if (!searchTerm) return [];
  const matches = [];
  const term = searchTerm.toLowerCase();
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = (node.text || '').toLowerCase();
    let start = 0;
    while (true) {
      const idx = text.indexOf(term, start);
      if (idx === -1) break;
      matches.push({ from: pos + idx, to: pos + idx + searchTerm.length });
      start = idx + searchTerm.length;
    }
  });
  return matches;
}

function buildDecorations(doc, matches, currentIndex) {
  if (!matches.length) return DecorationSet.empty;
  const decos = matches.map((m, i) =>
    Decoration.inline(m.from, m.to, {
      class: i === currentIndex ? 'find-match find-match--current' : 'find-match',
    })
  );
  return DecorationSet.create(doc, decos);
}

export const FindReplace = Extension.create({
  name: 'findReplace',

  addCommands() {
    return {
      setFindState:
        ({ term, index }) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(findReplaceKey, { type: 'set', term, index });
          return true;
        },
      clearFindState:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(findReplaceKey, { type: 'clear' });
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: findReplaceKey,
        state: {
          init() {
            return { term: '', index: 0, decorations: DecorationSet.empty };
          },
          apply(tr, old) {
            const meta = tr.getMeta(findReplaceKey);

            if (meta?.type === 'clear') {
              return { term: '', index: 0, decorations: DecorationSet.empty };
            }
            if (meta?.type === 'set') {
              const matches = findMatches(tr.doc, meta.term);
              return {
                term: meta.term,
                index: meta.index,
                decorations: buildDecorations(tr.doc, matches, meta.index),
              };
            }
            if (tr.docChanged && old.term) {
              const matches = findMatches(tr.doc, old.term);
              return {
                ...old,
                decorations: buildDecorations(tr.doc, matches, old.index),
              };
            }
            return old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state).decorations;
          },
        },
      }),
    ];
  },
});