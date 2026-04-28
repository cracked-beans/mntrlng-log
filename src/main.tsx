import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import 'leaflet/dist/leaflet.css';

const initialTheme = localStorage.getItem('mtlog.theme') ?? 'system';
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const dark = initialTheme === 'dark' || (initialTheme === 'system' && prefersDark);
document.documentElement.classList.toggle('dark', dark);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
