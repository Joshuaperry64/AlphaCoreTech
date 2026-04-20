/**
 * AlphaCore Hash Router
 * Handles #/route navigation with cinematic loading transitions.
 */

import { showLoading, hideLoading } from './components/loading.js';

const routes = {};
let currentCleanup = null;
let currentRoute = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigateTo(path) {
  window.location.hash = '#' + path;
}

function updateActiveNav(path) {
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(item => {
    const route = item.getAttribute('data-route');
    item.classList.toggle('active', route === path);
  });
}

async function handleRoute() {
  const hash = window.location.hash.slice(1) || '/';
  if (hash === currentRoute) return;

  const app = document.getElementById('app');
  const handler = routes[hash] || routes['/'];
  if (!handler) return;

  // Show loading transition
  await showLoading();

  // Cleanup previous page
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
  }

  // Clear mount point
  app.innerHTML = '';
  app.scrollTop = 0;

  // Update nav
  updateActiveNav(hash);
  currentRoute = hash;

  // Mount new page
  try {
    currentCleanup = await handler(app);
  } catch (err) {
    console.error('[ROUTER] Mount error:', err);
    app.innerHTML = `<div class="section-header"><h1 class="glitch" data-text="// SYSTEM_ERROR">// SYSTEM_ERROR</h1><div class="header-line"></div></div><div class="panel"><div class="panel-title">// FAULT_REPORT</div><p style="color:var(--accent);font-size:0.85rem;">${err.message}</p></div>`;
    currentCleanup = null;
  }

  // Hide loading
  await hideLoading();
}

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);

  // Intercept nav clicks for sidebar close on mobile
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('hamburger')?.classList.remove('open');
        document.getElementById('sidebar-dim')?.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Initial route
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '#/';
  } else {
    handleRoute();
  }
}
