import { triggerBypassOverloadSequence } from '../components/pinpad.js';

export default function VoiceClonerPage() {
  const container = document.createElement('div');
  container.className = 'page-content slide-up';
  
  const currentProfile = (sessionStorage.getItem('current_profile') || 'Guest').toLowerCase();
  const isGuest = currentProfile === 'guest' && sessionStorage.getItem('rabbit_hole_unlocked') !== 'true';

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">RVC VOICE SYNTHESIS</h1>
      <p class="page-subtitle">AUDIO CLONING AND MANIPULATION MATRIX</p>
    </div>
    <div class="aim-panel" style="display: flex; flex-direction: column; flex: 1; height: 800px; max-height: 85vh; padding: 0; border: none; overflow: hidden; border-radius: 8px;">
      <div class="aim-panel-header" style="background: rgba(0,184,255,0.05); padding: 15px; display: flex; flex-wrap: wrap; gap: 10px;">
        <span class="aim-panel-icon">🎙️</span>
        <span class="aim-panel-title" style="flex: 1; min-width: 150px;">RVC INFERENCE ENGINE</span>
        <span class="aim-panel-badge" style="background: rgba(255,0,60,0.1); color: #ff003c; border-color: #ff003c; white-space: nowrap;">OFFLINE</span>
      </div>
      <div style="flex: 1; background: #000; position: relative;" id="vc-iframe-container">
        <!-- V2 Modal Deployment URL - Currently Offline -->
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #050a0f;">
          <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
          <h2 style="color: #ff003c; font-family: 'Orbitron', sans-serif; letter-spacing: 2px;">NODE OFFLINE</h2>
          <p style="color: #a0b0c0; text-align: center; max-width: 400px; font-family: 'Share Tech Mono', monospace;">The Voice Synthesis H100 node is currently offline for calibration and maintenance. Please try again later.</p>
        </div>
        
        ${isGuest ? `
        <!-- Guest Preview Blocker Overlay -->
        <div id="vc-guest-blocker" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); z-index: 10; cursor: not-allowed; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(1px); padding: 20px;">
          <div style="background: rgba(0,0,0,0.85); border: 1px solid #ff003c; padding: 20px 30px; border-radius: 8px; text-align: center; width: 100%; max-width: 400px; box-shadow: 0 0 30px rgba(255,0,60,0.2);">
            <div style="font-size: 2rem; margin-bottom: 10px;">🔒</div>
            <h3 style="color: #ff003c; margin: 0 0 10px 0; font-family: 'Orbitron', sans-serif;">GUEST PREVIEW MODE</h3>
            <p style="color: #ccc; font-size: 0.85rem; margin: 0 0 15px 0;">Voice cloning execution is locked. Authenticate with a registered profile to unlock.</p>
            <button id="vc-login-btn" class="aim-btn" style="width: 100%; margin-bottom: 10px; background: rgba(6,182,212,0.15); border-color: var(--accent);">🔑 LOGIN TO UNLOCK</button>
            <button id="vc-bypass-btn" class="aim-btn" style="width: 100%; background: rgba(255,0,60,0.1); border-color: rgba(255,0,60,0.4); color: #ff003c; font-size: 0.75rem;">⚡ [SYSTEM BYPASS]</button>
          </div>
        </div>
        ` : ''}
      </div>
    </div>
  `;

  if (isGuest) {
    setTimeout(() => {
      const loginBtn = container.querySelector('#vc-login-btn');
      const bypassBtn = container.querySelector('#vc-bypass-btn');
      
      if (loginBtn) {
        loginBtn.onclick = (e) => {
          e.stopPropagation();
          import('../components/pinpad.js').then(({ openLoginModal }) => {
            openLoginModal({ title: '// PROFILE_LOGIN', subtitle: 'ENTER ACCESS PIN TO UNLOCK VOICE CLONING' });
          });
        };
      }
      
      if (bypassBtn) {
        bypassBtn.onclick = (e) => {
          e.stopPropagation();
          triggerBypassOverloadSequence();
        };
      }
      
      // Catch clicks on the blocker background
      const blocker = container.querySelector('#vc-guest-blocker');
      if (blocker) {
        blocker.onclick = () => {
          import('../components/toast.js').then(({ showToast }) => {
            showToast('ERROR', 'GUEST PREVIEW MODE: Please log in to interact with the Voice Cloner.');
          });
        };
      }
    }, 0);
  }

  return container;
}
