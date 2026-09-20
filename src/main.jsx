import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

document.addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Tab' && e.shiftKey && document.activeElement?.closest('.ProseMirror')) {
      e.preventDefault();
    }
  },
  { capture: true }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);