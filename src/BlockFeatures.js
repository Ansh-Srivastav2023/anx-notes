import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { Fragment } from '@tiptap/pm/model';

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'aside[data-callout]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0];
  },
});

export const SectionColumn = Node.create({
  name: 'sectionColumn',
  content: 'block+',
  isolating: true,
  parseHTML() {
    return [{ tag: 'div[data-section-column]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-section-column': '' }), 0];
  },
});

export const SectionGroup = Node.create({
  name: 'sectionGroup',
  group: 'block',
  content: 'sectionColumn{2,4}',
  defining: true,
  isolating: true,
  parseHTML() {
    return [{ tag: 'div[data-section-group]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-section-group': '' }), 0];
  },
});

const BLOCK_ID_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'taskList',
  'horizontalRule',
  'table',
  'callout',
  'sectionGroup',
];

export const BlockFeatures = Extension.create({
  name: 'blockFeatures',

  addGlobalAttributes() {
    return [{
      types: BLOCK_ID_TYPES,
      attributes: {
        blockId: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-block-id'),
          renderHTML: (attributes) => (
            attributes.blockId
              ? { 'data-block-id': attributes.blockId, id: `block-${attributes.blockId}` }
              : {}
          ),
        },
      },
    }];
  },

  addCommands() {
    return {
      ensureBlockIdAt:
        (pos, id) =>
        ({ state, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (!node) return false;
          if (node.attrs.blockId === id) return true;
          if (dispatch) {
            dispatch(state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, blockId: id }));
          }
          return true;
        },

      toggleCalloutAt:
        (pos) =>
        ({ state, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (!node) return false;
          if (dispatch) {
            const replacement = node.type.name === 'callout'
              ? node.content
              : state.schema.nodes.callout.create(null, Fragment.from(node));
            dispatch(state.tr.replaceWith(pos, pos + node.nodeSize, replacement));
          }
          return true;
        },

      addSectionAt:
        (pos, side = 'right') =>
        ({ state, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          const columnType = state.schema.nodes.sectionColumn;
          const groupType = state.schema.nodes.sectionGroup;
          if (!node || !columnType || !groupType) return false;

          const emptyColumn = columnType.createAndFill();
          if (!emptyColumn) return false;

          let columns;
          if (node.type === groupType) {
            columns = [];
            node.forEach((column) => columns.push(column));
            if (columns.length >= 4) return false;
            if (side === 'left') columns.unshift(emptyColumn);
            else columns.push(emptyColumn);
          } else {
            const occupiedColumn = columnType.create(null, Fragment.from(node));
            columns = side === 'left'
              ? [emptyColumn, occupiedColumn]
              : [occupiedColumn, emptyColumn];
          }

          if (dispatch) {
            const group = groupType.create(node.type === groupType ? node.attrs : null, columns);
            dispatch(state.tr.replaceWith(pos, pos + node.nodeSize, group));
          }
          return true;
        },

      removeBlockAt:
        (pos) =>
        ({ state, dispatch }) => {
          const node = state.doc.nodeAt(pos);
          if (!node) return false;
          if (dispatch) {
            const tr = state.doc.childCount === 1
              ? state.tr.replaceWith(pos, pos + node.nodeSize, state.schema.nodes.paragraph.create())
              : state.tr.delete(pos, pos + node.nodeSize);
            dispatch(tr);
          }
          return true;
        },
    };
  },
});
