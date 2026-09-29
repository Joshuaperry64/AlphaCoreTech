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
import { toggleAudio, initGlobalAudio, getGlobalAudio, setAudioPlaying, playSFX, initAudioVisualizer } from './components/audio.js';
import { initThemeSwitcher } from './components/theme-switcher.js';
import { initCommandPalette } from './components/command-palette.js';
import { showToast } from './components/toast.js';

import Overview from './pages/overview.js';
import Lore from './pages/lore.js';
import Diagnostics from './pages/diagnostics.js';
import ArchitectProfile from './pages/creator.js';
import CognitiveUplink from './pages/cognitive.js';
import AdminPanel from './pages/admin.js';
import AiModals from './pages/aimodals.js';
import VaultPage from './pages/vault.js';
import Research from './pages/research.js';
import VisionProcessor from './pages/vision.js';
import LogsPage from './pages/logs.js';
import SubroutinesPage from './pages/subroutines.js';
import PromptLabPage from './pages/promptlab.js';
import MusicPage from './pages/music.js';
import AssetManagerPage from './pages/assets.js';
import ReconPage from './pages/recon.js';
import VoiceClonerPage from './pages/voicecloner.js';
import ChangelogPage from './pages/changelog.js';
import NetworkMatrixPage from './pages/network.js';
import MugshotsPage from './pages/mugshots.js';
import TheLabPage from './pages/thelab.js';
import TransferPage from './pages/transfer.js';

const routes = {
  '/': Overview,
  '/overview': Overview,
  '/thelab': TheLabPage,
  '/lab': TheLabPage,
  '/transfer': TransferPage,
  '/lore': Lore,
  '/diagnostics': Diagnostics,
  '/architect': ArchitectProfile,
  '/cognitive': CognitiveUplink,
  '/admin': AdminPanel,
  '/aimodals': AiModals,
  '/upscaler': AiModals,
  '/vault': VaultPage,
  '/research': Research,
  '/vision': VisionProcessor,
  '/logs': LogsPage,
  '/subroutines': SubroutinesPage,
  '/promptlab': PromptLabPage,
  '/recon': ReconPage,
  '/voice': VoiceClonerPage,
  '/music': MusicPage,
  '/assets': AssetManagerPage,
  '/changelog': ChangelogPage,
  '/network': NetworkMatrixPage,
  '/mugshots': MugshotsPage,
};

function updateActiveNav(hash) {
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(item => {
    const route = item.getAttribute('data-route');
    item.classList.toggle('active', route === hash);
  });
}

async function renderRoute() {
  const currentProfile = sessionStorage.getItem('current_profile');
  const sidebar = document.getElementById('sidebar');
  const mobileTopbar = document.getElementById('mobile-topbar');

  // Trigger background sync to pull global settings from backend
  if (currentProfile) {
    syncFromServer();
  }

  // UNAUTHENTICATED: Intro & PIN Pad attached straight to root
  if (!currentProfile) {
    if (location.hash && location.hash !== '#') {
      window.history.replaceState(null, '', location.pathname);
    }
    
    document.body.classList.add('intro-mode');
    if (sidebar) sidebar.style.display = 'none';
    if (mobileTopbar) mobileTopbar.style.display = 'none';
    const brControls = document.querySelector('.bottom-right-controls');
    if (brControls) brControls.style.display = '';
    
    const app = document.getElementById('app');
    app.innerHTML = '';
    
    const { introContainer, cleanup } = await createIntro(app);
    
    const loginPanel = document.createElement('div');
    Object.assign(loginPanel.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'
    });
    
    const pinPad = buildPinPad({
      isLoginScreen: true,
      onSuccess: () => {
        cleanup();
        localStorage.setItem('alphacore_intro_complete', '1');
        document.body.classList.remove('intro-mode');
        if (sidebar) sidebar.style.display = '';
        if (mobileTopbar) mobileTopbar.style.display = '';
        const brControls = document.querySelector('.bottom-right-controls');
        if (brControls) brControls.style.display = '';
        window.location.hash = '#/overview';
        renderRoute();
      },
      title: '// ALPHACORE IDENTITY_VERIFICATION',
      subtitle: 'ENTER SECURE ACCESS PIN'
    });
    
    loginPanel.appendChild(pinPad);
    introContainer.appendChild(loginPanel);
    return;
  }

  // AUTHENTICATED: Root URL / or #/ redirects to #/overview
  if (!location.hash || location.hash === '#' || location.hash === '#/') {
    window.history.replaceState(null, '', '#/overview');
  }

  const rawHash = location.hash.replace(/^#/, '') || '/overview';
  const hash = rawHash === '/' ? '/overview' : rawHash;

  const app = document.getElementById('app');
  app.innerHTML = '';
  app.scrollTop = 0;
  
  // Apply a glitch/fade transition effect
  app.classList.remove('page-transition');
  void app.offsetWidth; // trigger reflow
  app.classList.add('page-transition');

  document.body.classList.remove('intro-mode');
  if (sidebar) sidebar.style.display = '';
  if (mobileTopbar) mobileTopbar.style.display = '';
  const brControls = document.querySelector('.bottom-right-controls');
  if (brControls) brControls.style.display = '';

  // Ensure sidebar profile label and tab visibility match active profile roles
  const authVal = document.getElementById('sidebar-auth-val');
  if (authVal) {
    authVal.textContent = currentProfile.toUpperCase();
    authVal.className = currentProfile === 'Guest' ? 's-val' : 's-val accent';
  }

  const adminTab = document.querySelector('a[data-route="/admin"]');
  if (adminTab) adminTab.style.display = 'flex';
  const vaultTab = document.querySelector('a[data-route="/vault"]');
  if (vaultTab) vaultTab.style.display = 'flex';

  const isGuest = currentProfile === 'Guest';

  const routeFn = routes[hash] || routes['/overview'] || routes['/'];
  
  if (isGuest && (hash === '/recon' || hash === '/mugshots')) {
      app.innerHTML = `
        <div style="display:flex; height:100vh; flex-direction:column; align-items:center; justify-content:center; color:#ff003c;">
          <h1 style="font-family:'Orbitron',sans-serif; margin-bottom:10px;">// ACCESS DENIED</h1>
          <p style="font-family:'Share Tech Mono',monospace;">RECON & CUSTODY MODULES ARE CLASSIFIED. PLEASE AUTHENTICATE.</p>
        </div>
      `;
      updateActiveNav(hash);
      return;
  }

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
      <div style="display: flex; gap: 8px;">
        <button id="guest-login-banner-btn" class="aim-btn aim-btn-sm" style="background: rgba(255,0,60,0.25); border-color: #ff003c; color: #fff; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px;">
          🔑 LOGIN / UNLOCK
        </button>
        <button id="guest-bypass-banner-btn" class="aim-btn aim-btn-sm" style="background: rgba(255,0,60,0.1); border-color: rgba(255,0,60,0.4); color: #ff003c; padding: 8px 16px; font-family: 'Orbitron', sans-serif; font-size: 0.75rem; letter-spacing: 1px;">
          ⚡ [SYSTEM BYPASS]
        </button>
      </div>
    `;

    banner.querySelector('#guest-login-banner-btn').onclick = () => {
      import('./components/pinpad.js').then(({ openLoginModal }) => {
        openLoginModal({ title: '// PROFILE_LOGIN', subtitle: 'ENTER ARCHITECT OR USER PIN TO UNLOCK' });
      });
    };

    banner.querySelector('#guest-bypass-banner-btn').onclick = () => {
      import('./components/pinpad.js').then(({ triggerBypassOverloadSequence }) => {
        triggerBypassOverloadSequence();
      });
    };

    app.appendChild(banner);
  }

  app.appendChild(pageElement);
  updateActiveNav(hash);
}

window.addEventListener('hashchange', () => {
  playSFX('navigate', 0.5);
  renderRoute();
});

function initApp() {
  // Init global systems
  initThemeSwitcher();
  initCommandPalette();
  initMatrixRain();
  initAudioVisualizer();
  
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
      playSFX('modal', 0.8);

      import('./components/modal.js').then(({ showModal }) => {
        showModal({
          title: '✦ SECRET PROTOCOL ACTIVATED',
          content: `
            <div style="text-align: center; font-family: 'Share Tech Mono', monospace; line-height: 1.6;">
              <div style="font-size: 2rem; margin-bottom: 15px; text-shadow: 0 0 20px #ff00ff;">SYSTEM OVERDRIVE ENGAGED</div>
              <div style="color: #06b6d4;">SYNTHWAVE THEME UNLOCKED.</div>
              <div style="color: #ff003c; margin-top: 15px; font-size: 0.85rem;">"Aesthetic Override Complete."</div>
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
    // 1. Konami Code Logic
    if (e.key === secretSeq[keyIndex]) {
      keyIndex++;
      if (keyIndex === secretSeq.length) {
        triggerSecretOverdrive();
        keyIndex = 0;
      }
    } else {
      keyIndex = 0;
    }

    // 2. Text-based cheat code fallback
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      typedString += e.key.toLowerCase();
      if (typedString.length > 20) typedString = typedString.slice(-20);
      if (typedString.includes('iddqd') || typedString.includes('alphacore')) {
        triggerSecretOverdrive();
        typedString = '';
      }
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

  // Add lock system / login to sidebar
  const nav = document.getElementById('sidebar-nav');
  if (nav) {
    const lockLink = document.createElement('a');
    lockLink.href = '#';
    lockLink.className = 'nav-item';
    lockLink.setAttribute('data-label', 'Lock System');
    lockLink.innerHTML = '<span class="nav-icon">🔒</span><span class="nav-label">LOCK SYSTEM</span><span class="nav-arrow">›</span>';
    lockLink.onclick = e => { e.preventDefault(); sessionStorage.removeItem('current_profile'); window.location.hash = '#'; renderRoute(); };
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
}

// Ensure the #/ hash exists on direct root load, then init
if (!window.location.hash) {
  window.history.replaceState(null, '', '#/');
}

// Call init functions and kickoff initial route render
initApp();
renderRoute();
