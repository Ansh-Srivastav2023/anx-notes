import React, { useEffect, useState } from 'react';

export default function StatusBar({ editor }) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;
    const update = () => forceRender((n) => n + 1);
    editor.on('transaction', update);
    return () => {
      editor.off('transaction', update);
    };
  }, [editor]);

  if (!editor) return null;

  const text = editor.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  return (
    <div className="status-bar">
      <span>
        {words} {words === 1 ? 'word' : 'words'} · {chars}{' '}
        {chars === 1 ? 'character' : 'characters'}
      </span>
      <span className="status-hint">
        Shortcuts: <code>--&gt;</code> <code>&lt;--</code> <code>=&gt;</code>{' '}
        <code>...</code> <code>!=</code> <code>1/2</code> · <kbd>Ctrl</kbd>+<kbd>/</kbd> for all
      </span>
    </div>
  );
}