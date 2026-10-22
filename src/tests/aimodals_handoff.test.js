import { describe, it, expect, beforeEach } from 'vitest';
import AIModalsPage, { buildResult, getLoraOptions } from '../pages/aimodals.js';

describe('AI Modals Synthesis Chain Cross-Modal Handoff', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = '';
    window._pending_img2vid_image = null;
    window._pending_upscale_image = null;
    window._pending_omnigen_image = null;
    window._cn_global_img = null;
    window._cn_global_type = null;
  });

  it('renders all 4 synthesis chain handoff buttons on generated image outputs', () => {
    const dummyUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const resultPanel = buildResult([dummyUrl]);
    document.body.appendChild(resultPanel);

    const animateBtn = resultPanel.querySelector('#aim-animate-btn');
    const upscaleBtn = resultPanel.querySelector('#aim-upscale-btn');
    const cnetBtn = resultPanel.querySelector('#aim-cnet-btn');
    const omnigenBtn = resultPanel.querySelector('#aim-omnigen-btn');

    expect(animateBtn).toBeTruthy();
    expect(upscaleBtn).toBeTruthy();
    expect(cnetBtn).toBeTruthy();
    expect(omnigenBtn).toBeTruthy();
  });

  it('clicking ANIMATE stages image into window._pending_img2vid_image', () => {
    const dummyUrl = 'https://alphacore.local/test-generation.png';
    const resultPanel = buildResult([dummyUrl]);
    document.body.appendChild(resultPanel);

    const animateBtn = resultPanel.querySelector('#aim-animate-btn');
    animateBtn.click();

    expect(window._pending_img2vid_image).toBe(dummyUrl);
  });

  it('clicking UPSCALE 4K stages image into window._pending_upscale_image', () => {
    const dummyUrl = 'https://alphacore.local/test-generation.png';
    const resultPanel = buildResult([dummyUrl]);
    document.body.appendChild(resultPanel);

    const upscaleBtn = resultPanel.querySelector('#aim-upscale-btn');
    upscaleBtn.click();

    expect(window._pending_upscale_image).toBe(dummyUrl);
  });

  it('clicking EXTRACT POSE stages pose conditioning for ControlNet Forge', () => {
    const dummyUrl = 'https://alphacore.local/test-generation.png';
    const resultPanel = buildResult([dummyUrl]);
    document.body.appendChild(resultPanel);

    const cnetBtn = resultPanel.querySelector('#aim-cnet-btn');
    cnetBtn.click();

    expect(window._cn_global_img).toBe(dummyUrl);
    expect(window._cn_global_type).toBe('openpose');
  });

  it('clicking OMNIGEN REF stages image into window._pending_omnigen_image', () => {
    const dummyUrl = 'https://alphacore.local/test-generation.png';
    const resultPanel = buildResult([dummyUrl]);
    document.body.appendChild(resultPanel);

    const omnigenBtn = resultPanel.querySelector('#aim-omnigen-btn');
    omnigenBtn.click();

    expect(window._pending_omnigen_image).toBe(dummyUrl);
  });

  it('includes newly added LoRAs and checkpoints in aimodals selectors', () => {
    const loraOpts = getLoraOptions();
    expect(loraOpts).toContain('onOff_v326.safetensors');
    expect(loraOpts).toContain('ahxl_v1.safetensors');
    expect(loraOpts).toContain('youthful_faceV1.safetensors');
    expect(loraOpts).toContain('vanellope-20 (2).safetensors');

    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    sessionStorage.setItem('aimodals_authenticated', '1');
    sessionStorage.setItem('aim_disclaimer_accepted', '1');
    const page = AIModalsPage();
    const t2iModelSelect = page.querySelector('#t2i-model-select');
    expect(t2iModelSelect).toBeTruthy();
    expect(t2iModelSelect.innerHTML).toContain('fullyREALXL_v30TRINITY.safetensors');

    const i2iTab = page.querySelector('.aim-tab[data-tab="img2img"]');
    if (i2iTab) i2iTab.click();
    const i2iCheckpointSelect = page.querySelector('#i2i-checkpoint');
    expect(i2iCheckpointSelect).toBeTruthy();
    expect(i2iCheckpointSelect.innerHTML).toContain('fullyREALXL_v30TRINITY');
  });
});
