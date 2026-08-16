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
import { toggleAudio, initGlobalAudio, getGlobalAudio, setAudioPlaying, playSFX } from './components/audio.js';
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

  // CHECK SESSION AUTHORIZATION
  const currentProfile = sessionStorage.getItem('current_profile');
  const sidebar = document.getElementById('sidebar');
  const mobileTopbar = document.getElementById('mobile-topbar');

  if (!currentProfile) {
    mountIntro(false);
    return;
  }

  document.body.classList.remove('intro-mode');
  if (sidebar) sidebar.style.display = '';
  if (mobileTopbar) mobileTopbar.style.display = '';

  // Ensure sidebar profile label and tab visibility match active profile roles
  const authVal = document.getElementById('sidebar-auth-val');
  if (authVal) {
    authVal.textContent = currentProfile.toUpperCase();
    authVal.className = currentProfile === 'Guest' ? 's-val' : 's-val accent';
  }

  const isAdmin = sessionStorage.getItem('admin_authenticated') === '1';
  const isVault = sessionStorage.getItem('vault_authenticated') === '1';

  const adminTab = document.querySelector('a[data-route="/admin"]');
  if (adminTab) adminTab.style.display = isAdmin ? 'flex' : 'none';
  const vaultTab = document.querySelector('a[data-route="/vault"]');
  if (vaultTab) vaultTab.style.display = isVault ? 'flex' : 'none';

  const isGuest = currentProfile === 'Guest' || !currentProfile;

  const routeFn = routes[hash] || routes['/'];
  const pageElement = routeFn();

  if (isGuest) {
    const banner = document.createElement('div');
    banner.className = 'guest-preview-banner';
    banner.style.cssText = `
      background: rgba(255, 0, 60, 0.12);
      border: 1px solid #ff003c;
      border-radius: 6px;
      padding: 12px 18px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      font-family: 'Share Tech Mono', monospace;
      box-shadow: 0 0 20px rgba(255,0,60,0.15);
    `;
    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 1.3rem;">🔒</span>
        <div>
          <div style="font-family: 'Orbitron', sans-serif; font-weight: bold; color: #ff003c; font-size: 0.85rem; letter-spacing: 1px;">
            GUEST PREVIEW MODE // FULL EXECUTION LOCKED
          </div>
          <div style="font-size: 0.78rem; color: #ccc; margin-top: 2px;">
            System features & active execution pipelines are strictly preview only. Login with your profile PIN to unlock full access.
          </div>
        </div>
      </div>
      <button id="guest-login-banner-btn" class="aim-btn aim-btn-sm" style="background: rgba(255,0,60,0.25); border-color: #ff003c; color: #fff; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px;">
        🔑 LOGIN / UNLOCK
      </button>
    `;

    banner.querySelector('#guest-login-banner-btn').onclick = () => {
      import('./components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// PROFILE_LOGIN', subtitle: 'ENTER ARCHITECT OR USER PIN TO UNLOCK' });
      });
    };

    app.appendChild(banner);
  }

  app.appendChild(pageElement);
  updateActiveNav(hash);
}

function mountIntro(force) {
  document.body.classList.add('intro-mode');
  const sidebar = document.getElementById('sidebar');
  const mobileTopbar = document.getElementById('mobile-topbar');
  if (sidebar) sidebar.style.display = 'none';
  if (mobileTopbar) mobileTopbar.style.display = 'none';

  const app = document.getElementById('app');
  app.innerHTML = '';
  
  const introEl = createIntro(() => {
    document.body.classList.remove('intro-mode');
    if (sidebar) sidebar.style.display = '';
    if (mobileTopbar) mobileTopbar.style.display = '';
    renderRoute();
  });
  
  app.appendChild(introEl);
}

window.addEventListener('hashchange', () => {
  playSFX('navigate', 0.5);
  renderRoute();
});
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
      const isNowPlaying = toggleAudio();
      showToast('INFO', isNowPlaying ? 'Audio Stream Playing' : 'Audio Stream Paused');
    });
  }

  initSidebar();
  initModal();

  // Restore Synthwave Overdrive Theme if previously unlocked
  if (localStorage.getItem('alphacore_synthwave_active') === '1') {
    document.body.classList.add('synthwave-overdrive');
  }

  // ─── Secret Easter Egg Listener ──────────────────────────────────────
  const secretSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let keyIndex = 0;
  let typedString = '';

  function triggerSecretOverdrive() {
    const isActive = document.body.classList.toggle('synthwave-overdrive');
    if (isActive) {
      localStorage.setItem('alphacore_synthwave_active', '1');
      sessionStorage.setItem('generate_authenticated', '1');
      sessionStorage.setItem('admin_authenticated', '1');
      playSFX('modal', 0.8);

      import('./components/modal.js').then(({ showModal }) => {
        showModal({
          title: '✦ SECRET PROTOCOL ACTIVATED',
          content: `
            <div style="text-align: center; padding: 20px; font-family: 'Share Tech Mono', monospace;">
              <div style="font-size: 3.5rem; margin-bottom: 10px; animation: pulse 0.6s infinite alternate;">🌆</div>
              <h2 class="glitch" data-text="SYNTHWAVE OVERDRIVE" style="font-family: 'Orbitron', sans-serif; color: #ff007f; font-size: 1.6rem; letter-spacing: 2px; text-shadow: 0 0 20px rgba(255,0,127,0.8);">
                SYNTHWAVE OVERDRIVE UNLOCKED
              </h2>
              <div style="background: rgba(255,0,127,0.15); border: 1px solid #ff007f; color: #00f0ff; padding: 12px; border-radius: 4px; font-size: 0.9rem; margin: 15px 0; font-weight: bold;">
                ✨ REWARD GRANTED: Full Neon Palette Inversion & Permanent Session Override Unlocked!
              </div>
              <p style="color: #aaa; font-size: 0.85rem; line-height: 1.5;">
                You have discovered the secret Vaporwave Overdrive Protocol! Cyberpunk UI color tokens updated to high-octane Hot Magenta & Neon Cyan.
              </p>
            </div>
          `
        });
      });
    } else {
      localStorage.removeItem('alphacore_synthwave_active');
      showToast('INFO', 'Synthwave Overdrive Theme Deactivated');
    }
  }

  window.addEventListener('keydown', (e) => {
    // Secret Konami Code Check
    if (e.key.toLowerCase() === secretSeq[keyIndex].toLowerCase()) {
      keyIndex++;
      if (keyIndex === secretSeq.length) {
        triggerSecretOverdrive();
        keyIndex = 0;
      }
    } else {
      keyIndex = 0;
    }

    // Secret Word Typing Check ("synthwave" or "overdrive")
    typedString += e.key.toLowerCase();
    if (typedString.length > 20) typedString = typedString.slice(-20);
    if (typedString.includes('synthwave') || typedString.includes('overdrive')) {
      typedString = '';
      triggerSecretOverdrive();
    }
  });

  // Triple click brand version badge trigger
  const brandVer = document.querySelector('.brand-version');
  if (brandVer) {
    let verClicks = 0;
    brandVer.style.cursor = 'pointer';
    brandVer.addEventListener('click', () => {
      verClicks++;
      if (verClicks >= 3) {
        verClicks = 0;
        triggerSecretOverdrive();
      }
    });
  }

  // Initial route render (triggers intro + pinpad login if not authenticated)
  renderRoute();

  // Add lock system / login to sidebar
  const nav = document.getElementById('sidebar-nav');
  if (nav) {
    const lockLink = document.createElement('a');
    lockLink.href = '#';
    lockLink.className = 'nav-item';
    lockLink.setAttribute('data-label', 'Lock System');
    lockLink.innerHTML = '<span class="nav-icon">🔒</span><span class="nav-label">LOCK SYSTEM</span><span class="nav-arrow">›</span>';
    lockLink.onclick = e => { e.preventDefault(); sessionStorage.removeItem('current_profile'); mountIntro(true); };
    nav.appendChild(lockLink);
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
