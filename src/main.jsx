// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// HashRouter keeps every route working on static hosts (GitHub Pages, a plain file server)
// where a refresh on /sim/chip would otherwise be a 404.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
