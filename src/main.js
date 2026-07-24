/**
 * AlphaCore v4.0 — Main Entry Point
 * SPA bootstrap: matrix rain, sidebar, modal, router, intro sequence.
 */
import './style.css';
import { initMatrixRain, toggleEcoMode, getEcoMode } from './components/matrix-rain.js';
import { initSidebar } from './components/sidebar.js';
import { initModal } from './components/modal.js';
import { createElement } from './components/utils.js';
import createIntro from './components/intro.js';
import { syncFromServer } from './components/db_sync.js';
import { buildPinPad } from './components/pinpad.js';
import { toggleAudio, initGlobalAudio, getGlobalAudio, setAudioPlaying } from './components/audio.js';
import { initThemeSwitcher } from './components/theme-switcher.js';
import { initCommandPalette } from './components/command-palette.js';
import { showToast } from './components/toast.js';

import Overview from './pages/overview.js';
import Lore from './pages/lore.js';
import Diagnostics from './pages/diagnostics.js';
import CreatorProfile from './pages/creator.js';
import CognitiveUplink from './pages/cognitive.js';
import AdminPanel from './pages/admin.js';
import AiModals from './pages/aimodals.js';
import VaultPage from './pages/vault.js';
import Research from './pages/research.js';
import VisionProcessor from './pages/vision.js';
import LogsPage from './pages/logs.js';
import SubroutinesPage from './pages/subroutines.js';
import PromptLabPage from './pages/promptlab.js';
import AnalyticsPage from './pages/analytics.js';
import TerminalPage from './pages/terminal.js';
import ChangelogPage from './pages/changelog.js';
import NetworkMatrixPage from './pages/network.js';

const routes = {
  '/': Overview,
  '/lore': Lore,
  '/diagnostics': Diagnostics,
  '/creator': CreatorProfile,
  '/cognitive': CognitiveUplink,
  '/admin': AdminPanel,
  '/aimodals': AiModals,
  '/vault': VaultPage,
  '/research': Research,
  '/vision': VisionProcessor,
  '/logs': LogsPage,
  '/subroutines': SubroutinesPage,
  '/promptlab': PromptLabPage,
  '/analytics': AnalyticsPage,
  '/terminal': TerminalPage,
  '/changelog': ChangelogPage,
  '/network': NetworkMatrixPage,
};

function updateActiveNav(hash) {
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(item => {
    const route = item.getAttribute('data-route');
    item.classList.toggle('active', route === hash);
  });
}

function renderRoute() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.scrollTop = 0;
  
  // Apply a glitch/fade transition effect
  app.classList.remove('page-transition');
  void app.offsetWidth; // trigger reflow
  app.classList.add('page-transition');

  // GLOBAL LOGIN WALL
  const currentProfile = sessionStorage.getItem('current_profile');
  const sidebar = document.getElementById('sidebar');
  const mobileTopbar = document.getElementById('mobile-topbar');
  
  if (!currentProfile) {
    if (sidebar) sidebar.style.display = 'none';
    if (mobileTopbar) mobileTopbar.style.display = 'none';
    
    const loginContainer = createElement('div', { class: 'global-login-page' });
    loginContainer.style.cssText = 'display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px;';
    
    loginContainer.appendChild(buildPinPad({
      authKey: 'global_authenticated',
      onSuccess: () => {
        if (sidebar) sidebar.style.display = '';
        if (mobileTopbar) mobileTopbar.style.display = '';
        
        // Update sidebar visual profile text immediately
        const authVal = document.getElementById('sidebar-auth-val');
        if (authVal) {
          const profile = sessionStorage.getItem('current_profile');
          if (profile) authVal.textContent = profile.toUpperCase();
        }
        
        // Ensure role visibility on tabs applies immediately
        import('./components/sidebar.js').then(module => {
          const pins = JSON.parse(localStorage.getItem('alphacore_pins') || '[]');
          const userPin = pins.find(p => p.label === sessionStorage.getItem('current_profile'));
          const hasAdmin = userPin && userPin.roles && userPin.roles.includes('admin');
          const adminTab = document.querySelector('a[data-route="/admin"]');
          if (adminTab) adminTab.style.display = hasAdmin ? 'flex' : 'none';
          
          const hasVault = userPin && userPin.roles && userPin.roles.includes('vault');
          const vaultTab = document.querySelector('a[data-route="/vault"]');
          if (vaultTab) vaultTab.style.display = hasVault ? 'flex' : 'none';
        });

        showToast('SUCCESS', 'Handshake verified. Welcome back.');
        renderRoute();
      },
      title: 'ALPHACORE // IDENTITY_VERIFICATION',
      subtitle: 'ESTABLISH SECURE HANDSHAKE',
      icon: '⟁'
    }));
    
    app.appendChild(loginContainer);
    return;
  } else {
    if (sidebar) sidebar.style.display = '';
    if (mobileTopbar) mobileTopbar.style.display = '';
  }

  const routeFn = routes[hash] || routes['/'];
  app.appendChild(routeFn());
  updateActiveNav(hash);
}

function mountIntro(force) {
  syncFromServer().then(() => {
    if (!force && localStorage.getItem('alphacore_intro_complete')) {
      renderRoute();
      return;
    }
    
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    const introEl = createIntro(() => {
      renderRoute();
    });
    
    app.appendChild(introEl);
  });
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', () => {
  // Init global systems
  initThemeSwitcher();
  initCommandPalette();
  initMatrixRain();
  
  // Setup Eco Mode Button
  const ecoBtn = document.getElementById('eco-mode-btn');
  if (ecoBtn) {
    if (getEcoMode()) {
      ecoBtn.classList.add('active');
      document.body.classList.add('eco-mode');
    }
    ecoBtn.addEventListener('click', () => {
      const isEco = toggleEcoMode();
      if (isEco) {
        ecoBtn.classList.add('active');
        document.body.classList.add('eco-mode');
        showToast('WARN', 'Eco Mode Activated (Low Power)');
      } else {
        ecoBtn.classList.remove('active');
        document.body.classList.remove('eco-mode');
        showToast('INFO', 'Full Performance Mode Activated');
      }
    });
  }

  // Setup Audio Play/Pause Button
  const playAudioBtn = document.getElementById('play-audio-btn');
  if (playAudioBtn) {
    playAudioBtn.addEventListener('click', () => {
      const isPlaying = toggleAudio();
      if (isPlaying) {
        playAudioBtn.innerHTML = '&#10074;&#10074;';
        playAudioBtn.title = "Pause Music";
        showToast('INFO', 'Audio Stream Playing');
      } else {
        playAudioBtn.innerHTML = '&#9658;';
        playAudioBtn.title = "Play Music";
        showToast('INFO', 'Audio Stream Paused');
      }
    });

    let firstInteraction = false;
    document.body.addEventListener('click', () => {
      if (!firstInteraction) {
        firstInteraction = true;
        const audio = getGlobalAudio() || initGlobalAudio();
        if (audio.paused) {
           audio.play().then(() => {
             setAudioPlaying(true);
             playAudioBtn.innerHTML = '&#10074;&#10074;';
             playAudioBtn.title = "Pause Music";
           }).catch(()=>{});
        }
      }
    }, { once: true });
  }

  initSidebar();
  initModal();

  // Mount intro or render route directly
  mountIntro(false);

  // Add replay intro to sidebar
  const nav = document.getElementById('sidebar-nav');
  if (nav) {
    const replay = document.createElement('a');
    replay.href = '#';
    replay.className = 'nav-item';
    replay.setAttribute('data-label', 'Replay Intro');
    replay.innerHTML = '<span class="nav-icon">↻</span><span class="nav-label">REPLAY INTRO</span><span class="nav-arrow">›</span>';
    replay.onclick = e => { e.preventDefault(); localStorage.removeItem('alphacore_intro_complete'); mountIntro(true); };
    nav.appendChild(replay);
  }

  // Close sidebar on nav click (mobile)
  document.querySelectorAll('#sidebar-nav .nav-item[data-route]').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('hamburger')?.classList.remove('open');
        document.getElementById('sidebar-dim')?.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Glitch pixel easter egg
  const pixel = document.createElement('div');
  pixel.className = 'glitch-pixel';
  pixel.id = 'glitch-pixel';
  pixel.style = 'position:fixed;bottom:18px;right:18px;width:8px;height:8px;background:var(--accent, #06b6d4);box-shadow:0 0 8px var(--accent, #06b6d4),0 0 2px #fff;z-index:9999;animation:glitch-pulse 0.7s infinite alternate;cursor:pointer;opacity:0.7;';
  let clicks = 0;
  pixel.onclick = () => {
    clicks++;
    if (clicks === 5) {
      window.location.hash = '#/cognitive';
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('alphacore-overload'));
      }, 350);
      clicks = 0;
    }
  };
  document.body.appendChild(pixel);
});
