import React, { useEffect, useRef, useState } from 'react';

const MAX = 10;

export default function TablePicker({ onSelect, onClose }) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 });
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="table-picker" ref={ref}>
      <div className="table-picker-label">
        {hover.rows > 0 ? `${hover.cols} × ${hover.rows}` : 'Insert table'}
      </div>

      <div
        className="table-picker-grid"
        style={{ gridTemplateColumns: `repeat(${MAX}, 1fr)` }}
        onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
      >
        {Array.from({ length: MAX * MAX }).map((_, i) => {
          const col = i % MAX;
          const row = Math.floor(i / MAX);
          const active = row < hover.rows && col < hover.cols;
          return (
            <button
              key={i}
              type="button"
              className="table-picker-cell"
              data-active={active ? 'true' : 'false'}
              onMouseEnter={() => setHover({ rows: row + 1, cols: col + 1 })}
              onClick={() => onSelect(row + 1, col + 1)}
              aria-label={`Insert ${col + 1} by ${row + 1} table`}
            />
          );
        })}
      </div>

      <div className="table-picker-hint">
        {hover.rows > 0
          ? `Click to insert ${hover.cols} × ${hover.rows}`
          : 'Hover to choose size'}
      </div>
    </div>
  );
}