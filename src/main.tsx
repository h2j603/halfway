import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles.css';

function mount() {
  const el = document.getElementById('root');
  if (el) createRoot(el).render(<StrictMode><App /></StrictMode>);
}

// Wait for #root to exist. The normal (module) build is deferred anyway, but the
// single-file build runs as a classic script that may execute before <body> is
// parsed — so guard on readyState.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
