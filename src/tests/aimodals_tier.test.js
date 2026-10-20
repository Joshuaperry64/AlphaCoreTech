import { describe, it, expect, beforeEach } from 'vitest';
import { getModalSettings } from '../pages/aimodals.js';

describe('AI Modals Profile Endpoint Routing', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('Guest profile strictly points to economy endpoints', () => {
    sessionStorage.setItem('current_profile', 'Guest');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(false);
    expect(settings.tierName).toBe('PUBLIC ECONOMY');
    expect(settings.txt2imgUrl).toContain('txt2img-eco');
    expect(settings.img2imgUrl).toContain('img2img-eco');
    expect(settings.txt2vidUrl).toContain('txt2vid-eco');
    expect(settings.img2vidUrl).toContain('img2vid-eco');
    expect(settings.preprocessorUrl).toContain('controlnet-eco');
    expect(settings.framepackUrl).toContain('framepack-eco');
    expect(settings.upscalerUrl).toContain('upscaler-eco');
    expect(settings.vid2audioUrl).toContain('vid2audio-eco');
    expect(settings.music_url).toContain('/eco');
    expect(settings.vllmUrl).toContain('cognitive-core');
  });

  it('DoeBoy profile (even with admin_authenticated) strictly points to economy endpoints', () => {
    sessionStorage.setItem('current_profile', 'DoeBoy');
    sessionStorage.setItem('current_pin', '6969');
    sessionStorage.setItem('admin_authenticated', '1');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(false);
    expect(settings.tierName).toBe('PUBLIC ECONOMY');
    expect(settings.txt2imgUrl).toContain('txt2img-eco');
    expect(settings.img2imgUrl).toContain('img2img-eco');
    expect(settings.txt2vidUrl).toContain('txt2vid-eco');
    expect(settings.img2vidUrl).toContain('img2vid-eco');
    expect(settings.preprocessorUrl).toContain('controlnet-eco');
    expect(settings.framepackUrl).toContain('framepack-eco');
    expect(settings.upscalerUrl).toContain('upscaler-eco');
    expect(settings.vid2audioUrl).toContain('vid2audio-eco');
    expect(settings.music_url).toContain('/eco');
    expect(settings.vllmUrl).toContain('cognitive-core');
  });

  it('Fisherman profile strictly points to economy endpoints', () => {
    sessionStorage.setItem('current_profile', 'Fisherman');
    sessionStorage.setItem('current_pin', '1990');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(false);
    expect(settings.tierName).toBe('PUBLIC ECONOMY');
    expect(settings.txt2imgUrl).toContain('txt2img-eco');
    expect(settings.img2imgUrl).toContain('img2img-eco');
  });

  it('J. P. profile strictly points to economy endpoints', () => {
    sessionStorage.setItem('current_profile', 'J. P.');
    sessionStorage.setItem('current_pin', '20022005');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(false);
    expect(settings.tierName).toBe('PUBLIC ECONOMY');
    expect(settings.txt2imgUrl).toContain('txt2img-eco');
    expect(settings.img2imgUrl).toContain('img2img-eco');
  });

  it('Architect profile points to primary high-performance endpoints', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(true);
    expect(settings.tierName).toBe('ARCHITECT PRIORITY');
    expect(settings.txt2imgUrl).not.toContain('txt2img-eco');
    expect(settings.img2imgUrl).not.toContain('img2img-eco');
    expect(settings.txt2vidUrl).not.toContain('txt2vid-eco');
    expect(settings.img2vidUrl).not.toContain('img2vid-eco');
    expect(settings.preprocessorUrl).toContain('controlnet-web-process');
    expect(settings.framepackUrl).toContain('framepack-ui-framepack');
    expect(settings.upscalerUrl).toContain('upscaler-web-upscale');
    expect(settings.upscalerUrl).not.toContain('upscaler-eco');
    expect(settings.vid2audioUrl).not.toContain('vid2audio-eco');
    expect(settings.music_url).toContain('/architect');
    expect(settings.vllmUrl).toContain('cognitive-core');
  });
});
