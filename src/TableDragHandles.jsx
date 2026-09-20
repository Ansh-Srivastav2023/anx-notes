import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD = 5;
const MENU_MARGIN = 8;

function RowGripIcon() {
  return <span className="table-grip-bar table-grip-bar--row" aria-hidden="true" />;
}

function ColGripIcon() {
  return <span className="table-grip-bar table-grip-bar--col" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  Grip menu                                                          */
/* ------------------------------------------------------------------ */
function GripMenu({ editor, menu, onClose, menuRef }) {
  const isRow = menu.type === 'row';
  const [pos, setPos] = useState({ x: menu.x, y: menu.y });

  /* Flip the menu when it would overflow the viewport */
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = menu.x;
    let y = menu.y;

    // Vertical: prefer below the cursor, flip up if no room
    if (y + rect.height + MENU_MARGIN > vh) {
      const above = menu.y - rect.height - 12;
      if (above > MENU_MARGIN) {
        y = above;
      } else {
        // Clamp so it fits, even if it overlaps the cursor a bit
        y = Math.max(MENU_MARGIN, vh - rect.height - MENU_MARGIN);
      }
    }

    // Horizontal: shift left if it would spill past the right edge
    if (x + rect.width + MENU_MARGIN > vw) {
      x = vw - rect.width - MENU_MARGIN;
    }
    if (x < MENU_MARGIN) x = MENU_MARGIN;

    setPos({ x, y });
  }, [menu.x, menu.y, menuRef]);

  const setCursorPos = (chain) => {
    if (menu.pos !== null && menu.pos !== undefined) {
      return chain.focus().setTextSelection(menu.pos);
    }
    return chain.focus();
  };

  return (
    <div
      ref={menuRef}
      className="grip-menu"
      style={{ top: pos.y, left: pos.x, position: 'fixed' }}
      role="menu"
    >
      {isRow ? (
        <>
          <div className="grip-menu-header">Row {menu.index + 1}</div>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).addRowBefore().run();
              onClose();
            }}
          >
            Insert row above
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).addRowAfter().run();
              onClose();
            }}
          >
            Insert row below
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item table-menu-item--danger"
            onClick={() => {
              setCursorPos(editor.chain()).deleteRow().run();
              onClose();
            }}
          >
            Delete row
          </button>
          <div className="table-menu-sep" />
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).toggleHeaderRow().run();
              onClose();
            }}
          >
            Toggle header row
          </button>
          <div className="table-menu-sep" />
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).selectRow().mergeCells().run();
              onClose();
            }}
          >
            Merge row cells
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).splitCell().run();
              onClose();
            }}
          >
            Split cell
          </button>
        </>
      ) : (
        <>
          <div className="grip-menu-header">Column {menu.index + 1}</div>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).addColumnBefore().run();
              onClose();
            }}
          >
            Insert column left
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).addColumnAfter().run();
              onClose();
            }}
          >
            Insert column right
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item table-menu-item--danger"
            onClick={() => {
              setCursorPos(editor.chain()).deleteColumn().run();
              onClose();
            }}
          >
            Delete column
          </button>
          <div className="table-menu-sep" />
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).selectColumn().mergeCells().run();
              onClose();
            }}
          >
            Merge column cells
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).splitCell().run();
              onClose();
            }}
          >
            Split cell
          </button>
          <div className="table-menu-sep" />
          <div className="grip-menu-label">Align</div>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).setTextAlign('left').run();
              onClose();
            }}
          >
            Left
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).setTextAlign('center').run();
              onClose();
            }}
          >
            Center
          </button>
          <button
            type="button"
            role="menuitem"
            className="table-menu-item"
            onClick={() => {
              setCursorPos(editor.chain()).setTextAlign('right').run();
              onClose();
            }}
          >
            Right
          </button>
        </>
      )}
      <div className="table-menu-sep" />
      <button
        type="button"
        role="menuitem"
        className="table-menu-item table-menu-item--danger"
        onClick={() => {
          setCursorPos(editor.chain()).deleteTable().run();
          onClose();
        }}
      >
        Delete table
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function TableDragHandles({ editor }) {
  const [data, setData] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [hintState, setHintState] = useState(null);
  const [menuState, setMenuState] = useState(null);

  const dataRef = useRef(null);
  const dragRef = useRef(null);
  const hintRef = useRef(null);
  const pendingRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => { dataRef.current = data; }, [data]);
  useEffect(() => { dragRef.current = dragState; }, [dragState]);
  useEffect(() => { hintRef.current = hintState; }, [hintState]);

  /* -------------------------------------------------------------- */
  /*  Track geometry — ALL coordinates are viewport-relative         */
  /*  (no window.scrollX/Y) because the editor scrolls inside its    */
  /*  own .editor-body container, not the window.                    */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!editor) return undefined;

    const update = () => {
      requestAnimationFrame(() => {
        if (!editor.isActive('table')) { setData(null); return; }

        const { from } = editor.state.selection;
        let node;
        try { node = editor.view.domAtPos(from).node; }
        catch { setData(null); return; }

        const el = node?.nodeType === 3 ? node.parentElement : node;
        const tableEl = el?.closest ? el.closest('table') : null;
        if (!tableEl) { setData(null); return; }

        const tr = tableEl.getBoundingClientRect();
        const rowEls = Array.from(tableEl.querySelectorAll('tr'));

        const rows = rowEls.map((rowEl, i) => {
          const r = rowEl.getBoundingClientRect();
          let pos = null;
          try {
            const firstCell = rowEl.querySelector('td, th');
            if (firstCell) pos = editor.view.posAtDOM(firstCell, 0);
          } catch (e) { /* ignore */ }
          return {
            index: i,
            top: r.top,
            bottom: r.bottom,
            height: r.height,
            pos,
          };
        });

        const firstRow = rowEls[0];
        const cellEls = firstRow ? Array.from(firstRow.children) : [];
        const cols = cellEls.map((cellEl, i) => {
          const c = cellEl.getBoundingClientRect();
          let pos = null;
          try { pos = editor.view.posAtDOM(cellEl, 0); } catch (e) { /* ignore */ }
          return {
            index: i,
            left: c.left,
            right: c.right,
            width: c.width,
            pos,
          };
        });

        setData({
          tableRect: {
            left: tr.left,
            top: tr.top,
            right: tr.right,
            bottom: tr.bottom,
            width: tr.width,
            height: tr.height,
          },
          rows,
          cols,
        });
      });
    };

    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    editor.on('focus', update);

    /* Scroll can originate from .editor-body OR the window —
       listen on both, capture-phase so we catch the inner scroll. */
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update, { passive: true });

    /* Also listen on the editor's own scroll container directly,
       in case it's not an ancestor of window in some layout. */
    const editorBody = document.querySelector('.editor-body');
    editorBody?.addEventListener('scroll', update, { passive: true });

    update();

    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
      editor.off('focus', update);
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
      editorBody?.removeEventListener('scroll', update);
    };
  }, [editor]);

  /* -------------------------------------------------------------- */
  /*  Global pointer listeners                                       */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!editor) return undefined;

    const computeHint = (clientX, clientY) => {
      const d = dataRef.current;
      const dg = dragRef.current;
      if (!d || !dg) return null;

      if (dg.type === 'row') {
        let insertBefore = d.rows.length;
        for (const r of d.rows) {
          if (clientY < r.top + r.height / 2) { insertBefore = r.index; break; }
        }
        let to = insertBefore;
        if (dg.index < to) to--;
        return { type: 'row', insertBefore, to, noop: dg.index === to };
      }

      let insertBefore = d.cols.length;
      for (const c of d.cols) {
        if (clientX < c.left + c.width / 2) { insertBefore = c.index; break; }
      }
      let to = insertBefore;
      if (dg.index < to) to--;
      return { type: 'col', insertBefore, to, noop: dg.index === to };
    };

    const onMove = (e) => {
      if (!dragRef.current && pendingRef.current) {
        const p = pendingRef.current;
        const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
        if (dist > DRAG_THRESHOLD) {
          const next = { ...p, x: e.clientX, y: e.clientY };
          dragRef.current = next;
          setDragState(next);
          setMenuState(null);
          pendingRef.current = null;
        } else {
          return;
        }
      }

      if (!dragRef.current) return;
      e.preventDefault();

      const next = { ...dragRef.current, x: e.clientX, y: e.clientY };
      dragRef.current = next;
      setDragState(next);

      const h = computeHint(e.clientX, e.clientY);
      const prev = hintRef.current;
      if (!prev || !h || prev.type !== h.type || prev.insertBefore !== h.insertBefore || prev.noop !== h.noop) {
        hintRef.current = h;
        setHintState(h);
      }
    };

    const onUp = () => {
      if (pendingRef.current) {
        const p = pendingRef.current;
        /* Open menu just to the right and below the click; flip is
           handled inside GripMenu via useLayoutEffect. */
        const menuX = p.type === 'row' ? p.absX + 12 : p.absX - 90;
        const menuY = p.type === 'row' ? p.absY - 6 : p.absY + 12;
        setMenuState({
          type: p.type,
          index: p.index,
          pos: p.pos,
          x: Math.max(MENU_MARGIN, menuX),
          y: Math.max(MENU_MARGIN, menuY),
        });
        pendingRef.current = null;
        return;
      }

      const dg = dragRef.current;
      const h = hintRef.current;
      if (dg && h && !h.noop) {
        if (dg.type === 'row' && editor.commands.moveRow) {
          editor.chain().focus().moveRow(dg.index, h.to).run();
        } else if (dg.type === 'col' && editor.commands.moveColumn) {
          editor.chain().focus().moveColumn(dg.index, h.to).run();
        } else {
          console.warn('moveRow / moveColumn commands are not registered in Tiptap.');
        }
      }
      dragRef.current = null;
      hintRef.current = null;
      setDragState(null);
      setHintState(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [editor]);

  useEffect(() => {
    if (!dragState) return undefined;
    document.body.classList.add('table-dragging');
    return () => document.body.classList.remove('table-dragging');
  }, [dragState]);

  useEffect(() => {
    if (!menuState) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuState(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuState(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuState]);

  const startPointer = (type, index) => (e) => {
    const pos = type === 'row' ? data.rows[index].pos : data.cols[index].pos;

    if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      setMenuState({ type, index, pos, x: e.clientX, y: e.clientY });
      return;
    }
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    setMenuState(null);

    pendingRef.current = {
      type, index, pos,
      absX: e.clientX,
      absY: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  if (!data || !editor) return null;

  /* -------------------------------------------------------------- */
  /*  Render — everything is position:fixed using viewport coords    */
  /* -------------------------------------------------------------- */
  return (
    <>
      {data.rows.map((r) => (
        <div
          key={`row-${r.index}`}
          className="table-drag-grip table-drag-grip--row"
          data-dragging={dragState?.type === 'row' && dragState.index === r.index ? 'true' : 'false'}
          style={{
            position: 'fixed',
            top: r.top + r.height / 2 - 12,
            left: data.tableRect.left - 14,
          }}
          onPointerDown={startPointer('row', r.index)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <RowGripIcon />
        </div>
      ))}

      {data.cols.map((c) => (
        <div
          key={`col-${c.index}`}
          className="table-drag-grip table-drag-grip--col"
          data-dragging={dragState?.type === 'col' && dragState.index === c.index ? 'true' : 'false'}
          style={{
            position: 'fixed',
            top: data.tableRect.top - 14,
            left: c.left + c.width / 2 - 12,
          }}
          onPointerDown={startPointer('col', c.index)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ColGripIcon />
        </div>
      ))}

      {dragState && hintState && !hintState.noop && (
        <div
          className={`table-drag-indicator table-drag-indicator--${hintState.type}`}
          style={{
            position: 'fixed',
            ...(hintState.type === 'row'
              ? {
                  top: hintState.insertBefore >= data.rows.length
                    ? data.rows[data.rows.length - 1].bottom - 1
                    : data.rows[hintState.insertBefore].top - 1,
                  left: data.tableRect.left,
                  width: data.tableRect.width,
                  height: 3,
                }
              : {
                  left: hintState.insertBefore >= data.cols.length
                    ? data.cols[data.cols.length - 1].right - 1
                    : data.cols[hintState.insertBefore].left - 1,
                  top: data.tableRect.top,
                  height: data.tableRect.height,
                  width: 3,
                }),
          }}
        />
      )}

      {dragState && (
        <div
          className="table-drag-chip"
          style={{
            position: 'fixed',
            top: dragState.y + 14,
            left: dragState.x + 14,
          }}
        >
          {dragState.type === 'row' ? `Row ${dragState.index + 1}` : `Column ${dragState.index + 1}`}
        </div>
      )}

      {menuState && (
        <GripMenu
          editor={editor}
          menu={menuState}
          onClose={() => setMenuState(null)}
          menuRef={menuRef}
        />
      )}
    </>
  );
}