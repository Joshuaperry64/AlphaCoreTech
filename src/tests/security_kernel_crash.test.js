import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canNavigateTo } from '../main.js';
import * as pinpadModule from '../components/pinpad.js';
import CognitiveUplink from '../pages/cognitive.js';
import AiModals from '../pages/aimodals.js';
import MusicPage from '../pages/music.js';
import VoiceClonerPage from '../pages/voicecloner.js';

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    live: { connect: vi.fn() }
  })),
  Type: {}
}));

describe('Security Governance & Kernel Crash Overload Protocol', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('Route Navigation Clearance (canNavigateTo)', () => {
    it('blocks Guest preview mode from navigating to restricted modules', () => {
      sessionStorage.setItem('current_profile', 'Guest');

      expect(canNavigateTo('/cognitive')).toBe(false);
      expect(canNavigateTo('/promptlab')).toBe(false);
      expect(canNavigateTo('/recon')).toBe(false);
      expect(canNavigateTo('/mugshots')).toBe(false);
      expect(canNavigateTo('/admin')).toBe(false);
      expect(canNavigateTo('/logs')).toBe(false);
      expect(canNavigateTo('/vault')).toBe(false);
      expect(canNavigateTo('/placeholder')).toBe(false);

      // Open preview routes remain accessible
      expect(canNavigateTo('/overview')).toBe(true);
      expect(canNavigateTo('/transfer')).toBe(true);
      expect(canNavigateTo('/laundry')).toBe(true);
      expect(canNavigateTo('/aimodals')).toBe(true);
      expect(canNavigateTo('/aimodals?tab=upscaler')).toBe(true);
      expect(canNavigateTo('/music')).toBe(true);
      expect(canNavigateTo('/voice')).toBe(true);
      expect(canNavigateTo('/changelog')).toBe(true);
    });

    it('blocks non-admin registered users (e.g. J. P.) from administrative and vault routes', () => {
      sessionStorage.setItem('current_profile', 'J. P.');
      sessionStorage.setItem('aimodals_authenticated', '1');
      sessionStorage.setItem('generate_authenticated', '1');

      expect(canNavigateTo('/admin')).toBe(false);
      expect(canNavigateTo('/logs')).toBe(false);
      expect(canNavigateTo('/vault')).toBe(false);
      expect(canNavigateTo('/placeholder')).toBe(false);

      // Allowed registered routes
      expect(canNavigateTo('/cognitive')).toBe(true);
      expect(canNavigateTo('/recon')).toBe(true);
      expect(canNavigateTo('/mugshots')).toBe(true);
      expect(canNavigateTo('/aimodals')).toBe(true);
    });

    it('allows vault-authorized profiles to access /vault but restricts /admin without admin role', () => {
      sessionStorage.setItem('current_profile', 'guest1');
      sessionStorage.setItem('vault_authenticated', '1');

      expect(canNavigateTo('/vault')).toBe(true);
      expect(canNavigateTo('/admin')).toBe(false);
      expect(canNavigateTo('/logs')).toBe(false);
    });

    it('allows admin profiles (e.g. DoeBoy) to access /admin and /vault but restricts /placeholder', () => {
      sessionStorage.setItem('current_profile', 'DoeBoy');
      sessionStorage.setItem('admin_authenticated', '1');
      sessionStorage.setItem('vault_authenticated', '1');

      expect(canNavigateTo('/admin')).toBe(true);
      expect(canNavigateTo('/logs')).toBe(true);
      expect(canNavigateTo('/vault')).toBe(true);
      expect(canNavigateTo('/placeholder')).toBe(false); // strictly Architect
    });

    it('allows Architect to access /placeholder only when Darkened State is active', () => {
      sessionStorage.setItem('current_profile', 'Architect');
      sessionStorage.setItem('current_pin', '672167566');
      sessionStorage.setItem('admin_authenticated', '1');

      // Without darkness mode
      sessionStorage.setItem('darkness_mode_active', 'false');
      expect(canNavigateTo('/placeholder')).toBe(false);

      // With darkness mode active
      sessionStorage.setItem('darkness_mode_active', 'true');
      expect(canNavigateTo('/placeholder')).toBe(true);
      expect(canNavigateTo('/admin/placeholder')).toBe(true);
    });
  });

  describe('Cognitive Core Guest Transmission & Link Interception', () => {
    it('triggers kernel crash overload when Guest attempts to transmit messages', () => {
      sessionStorage.setItem('current_profile', 'Guest');
      const crashSpy = vi.spyOn(pinpadModule, 'triggerBypassOverloadSequence').mockImplementation(() => {});

      const el = CognitiveUplink();
      const sendBtn = el.querySelector('#chat-send-btn');
      const chatInput = el.querySelector('#chat-input');
      chatInput.value = 'Hello matrix';

      sendBtn.click();
      expect(crashSpy).toHaveBeenCalled();
    });

    it('triggers kernel crash overload when Guest attempts to connect Live Link or Mic', () => {
      sessionStorage.setItem('current_profile', 'Guest');
      const crashSpy = vi.spyOn(pinpadModule, 'triggerBypassOverloadSequence').mockImplementation(() => {});

      const el = CognitiveUplink();
      const connectBtn = el.querySelector('#connect-live-btn');
      const micBtn = el.querySelector('#chat-mic-btn');

      connectBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(1);

      micBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('GPU Pipeline Gating & CPU Exemption in Studio Matrix', () => {
    it('triggers kernel crash overload when unauthenticated users trigger GPU generation', () => {
      sessionStorage.setItem('current_profile', 'Guest');
      sessionStorage.setItem('aimodals_authenticated', '1');
      sessionStorage.setItem('aim_disclaimer_accepted', '1');
      const crashSpy = vi.spyOn(pinpadModule, 'triggerBypassOverloadSequence').mockImplementation(() => {});

      const el = AiModals();

      // 1. Txt2Img
      const t2iBtn = el.querySelector('#t2i-gen-btn');
      t2iBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(1);

      // 2. Img2Img
      el.querySelector('.aim-tab[data-tab="img2img"]')?.click();
      const i2iBtn = el.querySelector('#i2i-gen-btn');
      if (i2iBtn) i2iBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(2);

      // 3. Txt2Vid
      el.querySelector('.aim-tab[data-tab="txt2vid"]')?.click();
      const t2vBtn = el.querySelector('#t2v-gen-btn');
      if (t2vBtn) t2vBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(3);

      // 4. Img2Vid
      el.querySelector('.aim-tab[data-tab="img2vid"]')?.click();
      const i2vBtn = el.querySelector('#i2v-gen-btn');
      if (i2vBtn) i2vBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(4);

      // 5. Vid2Audio
      el.querySelector('.aim-tab[data-tab="vid2audio"]')?.click();
      const v2aBtn = el.querySelector('#v2a-gen-btn');
      if (v2aBtn) v2aBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(5);

      // 6. ControlNet
      el.querySelector('.aim-tab[data-tab="controlnet"]')?.click();
      const cnBtn = el.querySelector('#cn-generate-btn');
      if (cnBtn) cnBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(6);
    });

    it('permits client-side CPU upscaler (dsp-fast) for guests but blocks GPU neural upscaler', () => {
      sessionStorage.setItem('current_profile', 'Guest');
      sessionStorage.setItem('aimodals_authenticated', '1');
      sessionStorage.setItem('aim_disclaimer_accepted', '1');
      const crashSpy = vi.spyOn(pinpadModule, 'triggerBypassOverloadSequence').mockImplementation(() => {});

      const el = AiModals();
      el.querySelector('.aim-tab[data-tab="upscaler"]')?.click();

      const upscaleBtn = el.querySelector('#upscale-exec-btn');
      const modelSelect = el.querySelector('#upscale-model-select');

      // 1. Try with non-CPU model (e.g. real-esrgan)
      modelSelect.value = 'real-esrgan';
      upscaleBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(1);

      // 2. Select CPU model dsp-fast -> does NOT trigger crash animation
      modelSelect.value = 'dsp-fast';
      upscaleBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(1); // Call count remains 1
    });

    it('triggers kernel crash overload when unauthenticated users attempt Music & Voice execution', () => {
      sessionStorage.setItem('current_profile', 'Guest');
      const crashSpy = vi.spyOn(pinpadModule, 'triggerBypassOverloadSequence').mockImplementation(() => {});

      const musicEl = MusicPage();
      const musicBtn = musicEl.querySelector('#music-btn');
      musicBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(1);

      const voiceEl = VoiceClonerPage();
      const voiceBtn = voiceEl.querySelector('#btn-execute-pipeline');
      voiceBtn.click();
      expect(crashSpy).toHaveBeenCalledTimes(2);
    });
  });
});
