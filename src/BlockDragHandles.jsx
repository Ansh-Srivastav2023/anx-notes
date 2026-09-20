import React, { useEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD = 5;
const GRIP_OFFSET_LEFT = 34;      // px left of a block's edge

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="3" r="1" /><circle cx="7" cy="3" r="1" />
      <circle cx="3" cy="7" r="1" /><circle cx="7" cy="7" r="1" />
      <circle cx="3" cy="11" r="1" /><circle cx="7" cy="11" r="1" />
    </svg>
  );
}

export default function BlockDragHandles({ editor }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [drag, setDrag] = useState(null);       // { fromIndex, x, y }
  const [targetIndex, setTargetIndex] = useState(null);
  const [blocks, setBlocks] = useState([]);

  const pendingRef = useRef(null);
  const dragRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => { dragRef.current = drag; }, [drag]);
  useEffect(() => { targetRef.current = targetIndex; }, [targetIndex]);

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
      if (dragRef.current) return;

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