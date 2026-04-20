/**
 * AlphaCore v4.0 — Main Entry Point
 * SPA bootstrap: matrix rain, sidebar, modal, router registration.
 */
import './style.css';
import { initMatrixRain } from './components/matrix-rain.js';
import { initSidebar } from './components/sidebar.js';
import { initModal } from './components/modal.js';
import { showInitialBoot } from './components/loading.js';
import { registerRoute, initRouter } from './router.js';
import Overview from './pages/overview.js';
import Lore from './pages/lore.js';
import Diagnostics from './pages/diagnostics.js';
import Subroutines from './pages/subroutines.js';
import CreatorProfile from './pages/creator.js';
import CognitiveUplink from './pages/cognitive.js';
import { createElement } from './components/utils.js';
import createIntro from './components/intro.js';
import AdminPanel from './pages/admin.js';

const routes = {
  '/': Overview,
  '/lore': Lore,
  '/diagnostics': Diagnostics,
  '/subroutines': Subroutines,
  '/creator': CreatorProfile,
  '/cognitive': CognitiveUplink,
  '/admin': AdminPanel,
};

function renderRoute() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const app = document.getElementById('app');
  app.innerHTML = '';
  const routeFn = routes[hash] || routes['/'];
  app.appendChild(routeFn());
}

function mountIntro(force) {
  if (!force && localStorage.getItem('alphacore_intro_complete')) return;
  document.body.appendChild(createIntro(() => {
    renderRoute();
  }));
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', () => {
  mountIntro(false);
  // Add replay intro to sidebar
  const nav = document.getElementById('sidebar-nav');
  if (nav) {
    const replay = document.createElement('a');
    replay.href = '#';
    replay.className = 'nav-item';
    replay.innerHTML = '<span class="nav-icon">↻</span><span class="nav-label">REPLAY INTRO</span><span class="nav-arrow">›</span>';
    replay.onclick = e => { e.preventDefault(); localStorage.removeItem('alphacore_intro_complete'); mountIntro(true); };
    nav.appendChild(replay);
  }
  // Add glitch pixel
  const pixel = document.createElement('div');
  pixel.className = 'glitch-pixel';
  pixel.style = 'position:fixed;bottom:18px;right:18px;width:8px;height:8px;background:#06b6d4;box-shadow:0 0 8px #06b6d4,0 0 2px #fff;z-index:9999;animation:glitch-pulse 0.7s infinite alternate;cursor:pointer;opacity:0.7;';
  let clicks = 0;
  pixel.onclick = () => {
    clicks++;
    if (clicks === 5) {
      // Overload sequence stub
      // alert('INTERFACE OVERLOAD: SYSTEM FAILURE. (Wolf/Red Pill/Blue Pill sequence placeholder)');
      clicks = 0;
    }
  };
  document.body.appendChild(pixel);
  // Glitch pixel logic (already present)
  const glitchPixel = document.getElementById('glitch-pixel');
  if (glitchPixel) {
    let clickCount = 0;
    glitchPixel.onclick = () => {
      clickCount++;
      if (clickCount === 5) {
        window.location.hash = '#/subroutines';
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('alphacore-overload'));
        }, 350);
        clickCount = 0;
      }
    };
  }
});
