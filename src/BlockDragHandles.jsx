import React, { useEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD = 5;
const GRIP_OFFSET_LEFT = 34;      // px left of a block's edge

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function makeBlockId() {
  return globalThis.crypto?.randomUUID?.() || `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1" /><circle cx="7" cy="3" r="1" />
      <circle cx="3" cy="7" r="1" /><circle cx="7" cy="7" r="1" />
      <circle cx="3" cy="11" r="1" /><circle cx="7" cy="11" r="1" />
    </svg>
  );
}

function MenuIcon({ type }) {
  const paths = {
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" /></>,
    callout: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    section: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /></>,
    remove: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m7 7 1 13h8l1-13" /></>,
  };
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

export default function BlockDragHandles({ editor, docId }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [drag, setDrag] = useState(null);       // { fromIndex, x, y }
  const [targetIndex, setTargetIndex] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [menu, setMenu] = useState(null);
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);

  const pendingRef = useRef(null);
  const dragRef = useRef(null);
  const targetRef = useRef(null);
  const menuRef = useRef(null);
  const menuStateRef = useRef(null);

  useEffect(() => { dragRef.current = drag; }, [drag]);
  useEffect(() => { targetRef.current = targetIndex; }, [targetIndex]);
  useEffect(() => { menuStateRef.current = menu; }, [menu]);

  useEffect(() => {
    if (!menu) return undefined;
    const close = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenu(null);
        setSectionMenuOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMenu(null);
        setSectionMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  /* ------------------------------------------------------------------ */
  /*  Cache geometry of every top-level block                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor) return undefined;

    const update = () => {
      requestAnimationFrame(() => {
        const list = [];
        let offset = 0;
        editor.state.doc.forEach((node, _nodeOffset, index) => {
          const dom = editor.view.nodeDOM(offset);
          if (dom && dom.nodeType === 1) {
            const rect = dom.getBoundingClientRect();
            list.push({
              index,
              offset,
              node,
              type: node.type.name,
              top: rect.top,
              bottom: rect.bottom,
              height: rect.height,
              left: rect.left,
              right: rect.right,
              width: rect.width,
            });
          }
          offset += node.nodeSize;
        });
        setBlocks(list);
      });
    };

    editor.on('transaction', update);
    editor.on('selectionUpdate', update);
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('scroll', update, { capture: true, passive: true });
    update();

    return () => {
      editor.off('transaction', update);
      editor.off('selectionUpdate', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, { capture: true });
    };
  }, [editor]);

  /* ------------------------------------------------------------------ */
  /*  Hover detection — proximity-based, not position-based              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor) return undefined;

    // How far left/right of a block still counts as hovering it.
    // Must exceed the grip offset (34px) so the mouse can reach the grip.
    const HOVER_PAD_X = 60;
    const HOVER_PAD_Y = 4;
    const GRIP_HOLD_RADIUS = 8;

    const onMove = (e) => {
      if (dragRef.current || menuStateRef.current) return;

      // Keep the grip visible while the cursor is over the grip itself —
      // otherwise moving toward it makes it disappear before you can grab it.
      const gripEl = document.querySelector('.block-drag-grip');
      if (gripEl) {
        const gr = gripEl.getBoundingClientRect();
        if (
          e.clientX >= gr.left - GRIP_HOLD_RADIUS &&
          e.clientX <= gr.right + GRIP_HOLD_RADIUS &&
          e.clientY >= gr.top - GRIP_HOLD_RADIUS &&
          e.clientY <= gr.bottom + GRIP_HOLD_RADIUS
        ) {
          return;
        }
      }

      // Find the block whose hit-region contains the cursor.
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const inX = e.clientX >= b.left - HOVER_PAD_X && e.clientX <= b.right + HOVER_PAD_X;
        const inY = e.clientY >= b.top - HOVER_PAD_Y && e.clientY <= b.bottom + HOVER_PAD_Y;
        if (inX && inY) {
          setHoverIndex(i);
          return;
        }
      }

      setHoverIndex(null);
    };

    document.addEventListener('mousemove', onMove);
    return () => {
      document.removeEventListener('mousemove', onMove);
    };
  }, [editor, blocks]);

  /* ------------------------------------------------------------------ */
  /*  Global pointer listeners for the drag                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!editor) return undefined;

    const computeTarget = (clientY) => {
      if (!blocks.length) return null;
      for (let i = 0; i < blocks.length; i++) {
        if (clientY < blocks[i].top + blocks[i].height / 2) return i;
      }
      return blocks.length;
    };

    const onMove = (e) => {
      if (!dragRef.current && pendingRef.current) {
        const dist = Math.hypot(
          e.clientX - pendingRef.current.startX,
          e.clientY - pendingRef.current.startY
        );
        if (dist < DRAG_THRESHOLD) return;
        const next = {
          fromIndex: pendingRef.current.blockIndex,
          x: e.clientX,
          y: e.clientY,
        };
        dragRef.current = next;
        setDrag(next);
        pendingRef.current = null;
        setHoverIndex(null);
      }

      if (!dragRef.current) return;
      e.preventDefault();
      dragRef.current = { ...dragRef.current, x: e.clientX, y: e.clientY };
      setDrag(dragRef.current);

      const insertBefore = computeTarget(e.clientY);
      if (insertBefore === null) return;
      let to = insertBefore;
      if (dragRef.current.fromIndex < to) to--;
      targetRef.current = to;
      setTargetIndex(to);
    };

    const onUp = () => {
      const dg = dragRef.current;
      const tgt = targetRef.current;
      if (dg && tgt !== null && dg.fromIndex !== tgt) {
        editor.chain().focus().moveBlock(dg.fromIndex, tgt).run();
      } else if (!dg && pendingRef.current) {
        const block = blocks[pendingRef.current.blockIndex];
        if (block) {
          setMenu({
            blockIndex: pendingRef.current.blockIndex,
            x: block.left - 4,
            y: block.top,
          });
          setSectionMenuOpen(false);
        }
      }
      pendingRef.current = null;
      dragRef.current = null;
      targetRef.current = null;
      setDrag(null);
      setTargetIndex(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [editor, blocks]);

  /* Cursor lock while dragging */
  useEffect(() => {
    if (!drag) return undefined;
    document.body.classList.add('block-dragging');
    return () => document.body.classList.remove('block-dragging');
  }, [drag]);

  /* ------------------------------------------------------------------ */
  /*  Start a drag from the grip                                         */
  /* ------------------------------------------------------------------ */
  const startPointer = (blockIndex) => (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    pendingRef.current = {
      blockIndex,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  const closeMenu = () => {
    setMenu(null);
    setSectionMenuOpen(false);
  };

  const selectedBlock = menu ? blocks[menu.blockIndex] : null;

  const handleCopyLink = async () => {
    if (!selectedBlock) return;
    const blockId = selectedBlock.node.attrs.blockId || makeBlockId();
    editor.commands.ensureBlockIdAt(selectedBlock.offset, blockId);
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set('doc', docId);
    params.set('block', blockId);
    params.set('index', String(menu.blockIndex));
    url.hash = params.toString();
    await copyText(url.toString());
    closeMenu();
  };

  const handleCopyBlock = async () => {
    if (!selectedBlock) return;
    await copyText(selectedBlock.node.textContent || '');
    closeMenu();
  };

  const handleCallout = () => {
    if (!selectedBlock) return;
    editor.chain().focus().toggleCalloutAt(selectedBlock.offset).run();
    closeMenu();
  };

  const handleAddSection = (side) => {
    if (!selectedBlock) return;
    editor.chain().focus().addSectionAt(selectedBlock.offset, side).run();
    closeMenu();
  };

  const handleRemove = () => {
    if (!selectedBlock) return;
    editor.chain().focus().removeBlockAt(selectedBlock.offset).run();
    closeMenu();
  };

  /* ------------------------------------------------------------------ */
  /*  Grip geometry — same position for every block type                 */
  /* ------------------------------------------------------------------ */
  const hoverBlock = hoverIndex !== null ? blocks[hoverIndex] : null;
  let gripStyle = null;
  if (hoverBlock && !drag) {
    gripStyle = {
      top: hoverBlock.top + 2,
      left: hoverBlock.left - GRIP_OFFSET_LEFT,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Insertion indicator                                                */
  /* ------------------------------------------------------------------ */
  let indicator = null;
  if (drag && targetIndex !== null && blocks.length) {
    const firstBlock = blocks[0];
    const insertY =
      targetIndex >= blocks.length
        ? blocks[blocks.length - 1].bottom
        : blocks[targetIndex].top;
    indicator = (
      <div
        className="block-drag-indicator"
        style={{
          position: 'fixed',
          top: insertY - 1,
          left: firstBlock.left,
          width: firstBlock.width,
          height: 3,
        }}
      />
    );
  }

  return (
    <>
      {gripStyle && (
        <div
          className="block-drag-grip"
          style={{ position: 'fixed', ...gripStyle }}
          onPointerDown={startPointer(hoverIndex)}
          title="Drag to reorder block"
        >
          <GripIcon />
        </div>
      )}

      {indicator}

      {menu && selectedBlock && (
        <div
          ref={menuRef}
          className="block-action-menu"
          role="menu"
          style={{
            position: 'fixed',
            left: Math.max(8, Math.min(menu.x, window.innerWidth - 264)),
            top: Math.max(8, Math.min(menu.y, window.innerHeight - 330)),
          }}
        >
          <button type="button" className="block-action-item" role="menuitem" onClick={handleCopyLink}>
            <MenuIcon type="link" /><span>Copy link to section</span>
          </button>
          <div className="block-action-separator" />
          <button type="button" className="block-action-item" role="menuitem" onClick={handleCallout}>
            <MenuIcon type="callout" /><span>{selectedBlock.type === 'callout' ? 'Remove callout' : 'Add callout'}</span>
          </button>
          <button type="button" className="block-action-item" role="menuitem" onClick={handleCopyBlock}>
            <MenuIcon type="copy" /><span>Copy section</span>
          </button>
          <div className="block-action-submenu-wrap">
            <button
              type="button"
              className="block-action-item"
              role="menuitem"
              aria-expanded={sectionMenuOpen}
              onClick={() => setSectionMenuOpen((open) => !open)}
            >
              <MenuIcon type="section" /><span>Add section</span><span className="block-action-chevron">›</span>
            </button>
            {sectionMenuOpen && (
              <div className="block-action-submenu" role="menu">
                <button type="button" className="block-action-item" role="menuitem" onClick={() => handleAddSection('left')}>Add to left</button>
                <button type="button" className="block-action-item" role="menuitem" onClick={() => handleAddSection('right')}>Add to right</button>
              </div>
            )}
          </div>
          <div className="block-action-separator" />
          <button type="button" className="block-action-item block-action-item--danger" role="menuitem" onClick={handleRemove}>
            <MenuIcon type="remove" /><span>Remove</span>
          </button>
          <div className="block-action-footer">Click and drag the grip to reorder</div>
        </div>
      )}

      {drag && (
        <div
          className="block-drag-chip"
          style={{ position: 'fixed', top: drag.y + 14, left: drag.x + 14 }}
        >
          Moving block
        </div>
      )}
    </>
  );
}
