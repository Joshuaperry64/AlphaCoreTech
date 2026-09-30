import { describe, it, expect, beforeEach } from 'vitest';
import { getModalSettings } from './aimodals.js';

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
    expect(settings.txt2imgUrl).toContain('eco');
    expect(settings.img2imgUrl).toContain('eco');
    expect(settings.txt2vidUrl).toContain('eco');
    expect(settings.img2vidUrl).toContain('eco');
    expect(settings.preprocessorUrl).toContain('730e5f');
    expect(settings.framepackUrl).toContain('framepack-ec-32daed');
    expect(settings.upscalerUrl).toContain('eco');
    expect(settings.vid2audioUrl).toContain('eco');
    expect(settings.music_url).toContain('alphacore-ma-9b0731');
  });

  it('DoeBoy profile (even with admin_authenticated) strictly points to economy endpoints', () => {
    sessionStorage.setItem('current_profile', 'DoeBoy');
    sessionStorage.setItem('current_pin', '6969');
    sessionStorage.setItem('admin_authenticated', '1');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(false);
    expect(settings.tierName).toBe('PUBLIC ECONOMY');
    expect(settings.txt2imgUrl).toContain('eco');
    expect(settings.img2imgUrl).toContain('eco');
    expect(settings.txt2vidUrl).toContain('eco');
    expect(settings.img2vidUrl).toContain('eco');
    expect(settings.preprocessorUrl).toContain('730e5f');
    expect(settings.framepackUrl).toContain('framepack-ec-32daed');
    expect(settings.upscalerUrl).toContain('eco');
    expect(settings.vid2audioUrl).toContain('eco');
    expect(settings.music_url).toContain('alphacore-ma-9b0731');
  });

  it('Fisherman profile strictly points to economy endpoints', () => {
    sessionStorage.setItem('current_profile', 'Fisherman');
    sessionStorage.setItem('current_pin', '1990');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(false);
    expect(settings.tierName).toBe('PUBLIC ECONOMY');
    expect(settings.txt2imgUrl).toContain('eco');
    expect(settings.img2imgUrl).toContain('eco');
  });

  it('J. P. profile strictly points to economy endpoints', () => {
    sessionStorage.setItem('current_profile', 'J. P.');
    sessionStorage.setItem('current_pin', '20022005');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(false);
    expect(settings.tierName).toBe('PUBLIC ECONOMY');
    expect(settings.txt2imgUrl).toContain('eco');
    expect(settings.img2imgUrl).toContain('eco');
  });

  it('Architect profile points to primary high-performance endpoints', () => {
    sessionStorage.setItem('current_profile', 'Architect');
    sessionStorage.setItem('current_pin', '672167566');
    const settings = getModalSettings();

    expect(settings.isArchitect).toBe(true);
    expect(settings.tierName).toBe('ARCHITECT PRIORITY');
    expect(settings.txt2imgUrl).not.toContain('eco');
    expect(settings.img2imgUrl).not.toContain('eco');
    expect(settings.txt2vidUrl).not.toContain('eco');
    expect(settings.img2vidUrl).not.toContain('eco');
    expect(settings.preprocessorUrl).toContain('11dd7a');
    expect(settings.framepackUrl).not.toContain('eco');
    expect(settings.upscalerUrl).not.toContain('eco');
    expect(settings.vid2audioUrl).not.toContain('eco');
    expect(settings.music_url).toBe('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run');
  });
});
