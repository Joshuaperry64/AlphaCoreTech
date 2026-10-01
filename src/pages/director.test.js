import { describe, it, expect, beforeEach, vi } from 'vitest';
import CyberDirectorPage, { DIRECTOR_PRESETS, deconstructPremise } from './director.js';

describe('CyberDirectorPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('contains predefined director presets', () => {
    expect(DIRECTOR_PRESETS.length).toBeGreaterThanOrEqual(4);
    const presetIds = DIRECTOR_PRESETS.map(p => p.id);
    expect(presetIds).toContain('cyber-infiltration');
    expect(presetIds).toContain('neon-pursuit');
    expect(presetIds).toContain('eden-awakening');
    expect(presetIds).toContain('orbital-dawn');
  });

  it('deconstructs premises into multi-track scene parameters', () => {
    const chaseResult = deconstructPremise('A high speed car chase in neo tokyo');
    expect(chaseResult.visualPrompt).toContain('vehicle chase');
    expect(chaseResult.voiceProfile).toBe('Architect-Lead');
    expect(chaseResult.foleyPrompt).toContain('engine');

    const spaceResult = deconstructPremise('An orbital space station near Jupiter');
    expect(spaceResult.visualPrompt).toContain('deep space');
    expect(spaceResult.foleyPrompt).toContain('space hum');

    const hackResult = deconstructPremise('An elite cyber operative infiltrating a databank');
    expect(hackResult.visualPrompt).toContain('cybernetic operative');
    expect(hackResult.voiceProfile).toBe('AlphaCore-EDEN11');

    const androidResult = deconstructPremise('Alpha Eden female android awaken in lab');
    expect(androidResult.visualPrompt).toContain('sentient cybernetic android');
    expect(androidResult.voiceProfile).toBe('AlphaCore-EDEN11');
  });

  it('renders the cyber-director studio interface with 5 tracks', () => {
    const el = CyberDirectorPage();
    document.body.appendChild(el);

    expect(el.querySelector('.page-title').textContent).toContain('CYBER-DIRECTOR');
    expect(el.querySelector('#dir-premise')).not.toBeNull();
    expect(el.querySelector('#btn-deconstruct')).not.toBeNull();
    expect(el.querySelector('#btn-ignite-all')).not.toBeNull();

    // 5 Track cards
    expect(el.querySelector('#card-stage-1')).not.toBeNull();
    expect(el.querySelector('#card-stage-2')).not.toBeNull();
    expect(el.querySelector('#card-stage-3')).not.toBeNull();
    expect(el.querySelector('#card-stage-4')).not.toBeNull();
    expect(el.querySelector('#card-stage-5')).not.toBeNull();

    // Mixer & Cinema Deck
    expect(el.querySelector('#dir-cinema-deck')).not.toBeNull();
    expect(el.querySelector('#cinema-video')).not.toBeNull();
    expect(el.querySelector('#vol-foley')).not.toBeNull();
    expect(el.querySelector('#vol-voice')).not.toBeNull();
    expect(el.querySelector('#vol-music')).not.toBeNull();
  });

  it('switches presets on click and updates track prompts', () => {
    const el = CyberDirectorPage();
    document.body.appendChild(el);

    const pursuitBtn = el.querySelector('[data-preset-id="neon-pursuit"]');
    expect(pursuitBtn).not.toBeNull();
    pursuitBtn.click();

    const premiseInput = el.querySelector('#dir-premise');
    expect(premiseInput.value).toContain('hyper-car');

    const visualPrompt = el.querySelector('#dir-visual-prompt');
    expect(visualPrompt.value).toContain('hyper-car');
  });

  it('triggers AI deconstruct on button click', () => {
    const el = CyberDirectorPage();
    document.body.appendChild(el);

    const premiseInput = el.querySelector('#dir-premise');
    premiseInput.value = 'Rogue hacker breaching quantum satellite network';

    const deconstructBtn = el.querySelector('#btn-deconstruct');
    deconstructBtn.click();

    const visualPrompt = el.querySelector('#dir-visual-prompt');
    expect(visualPrompt.value).toContain('cybernetic operative');
  });

  it('stages cross-modal injected video into Track 2 on mount', () => {
    window._pending_director_video = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJtcDQx';
    const el = CyberDirectorPage();
    document.body.appendChild(el);

    const badge2 = el.querySelector('#badge-stage-2');
    const badge3 = el.querySelector('#badge-stage-3');
    const preview2 = el.querySelector('#preview-stage-2');

    expect(badge2.textContent).toBe('INJECTED');
    expect(badge3.textContent).toBe('READY');
    expect(preview2.querySelector('video')).not.toBeNull();
    expect(window._pending_director_video).toBeNull();
  });
});
