import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// ─── Prevent browser pinch-to-zoom ──────────────────────────────────────────
// Safari fires proprietary gesture* events for pinch — this is the real hook.
// standard touchmove prevention alone doesn't stop iOS Safari.
window.addEventListener('gesturestart',  (e) => e.preventDefault(), { passive: false });
window.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
window.addEventListener('gestureend',    (e) => e.preventDefault(), { passive: false });

// Also block multi-touch on window (not just document) for Chrome mobile etc.
window.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
window.addEventListener('touchmove',  (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
// ────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
