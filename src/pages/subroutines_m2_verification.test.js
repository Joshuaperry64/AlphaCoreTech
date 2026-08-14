import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SubroutinesPage from './subroutines.js';
import { getAllPorts, getPortById } from '../ports/index.js';
import fs from 'fs';
import path from 'path';

describe('Milestone M2 Empirical Challenger Verification Suite', () => {
  let container;

  beforeEach(() => {
    container = SubroutinesPage();
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('1. DOM Construction & Layout Integrity', () => {
    expect(container.querySelector('.glitch').textContent).toContain('SUBROUTINE_CONSOLE');
    expect(container.querySelector('#sub-search-ipt')).not.toBeNull();
    expect(container.querySelector('#sub-filter-cat')).not.toBeNull();
    expect(container.querySelector('#btn-run-all')).not.toBeNull();
    expect(container.querySelector('#btn-benchmark')).not.toBeNull();
    expect(container.querySelector('#btn-clear-sub-log')).not.toBeNull();
    expect(container.querySelector('#chk-autoscroll')).not.toBeNull();
    expect(container.querySelector('#workspace-panel')).not.toBeNull();
    expect(container.querySelector('#subroutine-list')).not.toBeNull();
    expect(container.querySelector('#ported-projects-list')).not.toBeNull();
    expect(container.querySelector('#sub-console-output')).not.toBeNull();

    // Section A Subroutines count (default 8)
    const kernelCards = container.querySelectorAll('#subroutine-list > div');
    expect(kernelCards.length).toBe(8);

    // Section B Ported Projects count (getAllPorts length: 2)
    const portedCards = container.querySelectorAll('#ported-projects-list > div');
    const ports = getAllPorts();
    expect(portedCards.length).toBe(ports.length);
    expect(ports.length).toBeGreaterThanOrEqual(2);
  });

  it('2. Search Filtering across Synthetic Subroutines & Ported Projects', () => {
    const searchInput = container.querySelector('#sub-search-ipt');

    // Search for "SYNAPSE"
    searchInput.value = 'SYNAPSE';
    searchInput.dispatchEvent(new Event('input'));

    let kernelCards = container.querySelectorAll('#subroutine-list > div');
    let portedText = container.querySelector('#ported-projects-list').textContent;
    expect(kernelCards.length).toBe(1);
    expect(kernelCards[0].textContent).toContain('SYNAPSE_PRUNING_V4');
    expect(portedText).toContain('No web-ported Python projects match');

    // Search for "AlphaInventory"
    searchInput.value = 'AlphaInventory';
    searchInput.dispatchEvent(new Event('input'));

    kernelCards = container.querySelectorAll('#subroutine-list > div');
    let portedCards = container.querySelectorAll('#ported-projects-list > div');
    let kernelText = container.querySelector('#subroutine-list').textContent;
    expect(kernelText).toContain('No core kernel subroutines match');
    expect(portedCards.length).toBe(1);
    expect(portedCards[0].textContent).toContain('AlphaInventory');

    // Search for "Pinout" (matching description)
    searchInput.value = 'Pinout';
    searchInput.dispatchEvent(new Event('input'));
    portedCards = container.querySelectorAll('#ported-projects-list > div');
    expect(portedCards.length).toBe(1);
    expect(portedCards[0].textContent).toContain('AlphaInventory');

    // Search for "deduplicator" (matching AlphaRequirements description)
    searchInput.value = 'deduplicator';
    searchInput.dispatchEvent(new Event('input'));
    portedCards = container.querySelectorAll('#ported-projects-list > div');
    expect(portedCards.length).toBe(1);
    expect(portedCards[0].textContent).toContain('AlphaRequirements');
  });

  it('3. Category Filtering Mechanics', () => {
    const catSelect = container.querySelector('#sub-filter-cat');

    // Select CORE KERNEL
    catSelect.value = 'CORE KERNEL';
    catSelect.dispatchEvent(new Event('change'));

    let kernelCards = container.querySelectorAll('#subroutine-list > div');
    let portedText = container.querySelector('#ported-projects-list').textContent;
    expect(kernelCards.length).toBe(8);
    expect(portedText).toContain('No web-ported Python projects match');

    // Select PORTED PYTHON PROJECTS
    catSelect.value = 'PORTED PYTHON PROJECTS';
    catSelect.dispatchEvent(new Event('change'));

    let kernelText = container.querySelector('#subroutine-list').textContent;
    let portedCards = container.querySelectorAll('#ported-projects-list > div');
    expect(kernelText).toContain('No core kernel subroutines match');
    expect(portedCards.length).toBe(57);

    // Select HARDWARE (matches AlphaInventory)
    catSelect.value = 'HARDWARE';
    catSelect.dispatchEvent(new Event('change'));

    portedCards = container.querySelectorAll('#ported-projects-list > div');
    expect(portedCards.length).toBe(1);
    expect(portedCards[0].textContent).toContain('AlphaInventory');

    // Select UTILITIES (matches AlphaRequirements)
    catSelect.value = 'UTILITIES';
    catSelect.dispatchEvent(new Event('change'));

    portedCards = container.querySelectorAll('#ported-projects-list > div');
    expect(portedCards.length).toBe(1);
    expect(portedCards[0].textContent).toContain('AlphaRequirements');
  });

  it('4. Interactive Workspace Mounting & Lifecycle (port.destroy cleanup on switch and close)', () => {
    const invPort = getPortById('alphainventory');
    const reqPort = getPortById('alpharequirements');

    expect(invPort).not.toBeNull();
    expect(reqPort).not.toBeNull();

    const invDestroySpy = vi.spyOn(invPort, 'destroy');
    const reqDestroySpy = vi.spyOn(reqPort, 'destroy');

    const workspacePanel = container.querySelector('#workspace-panel');
    const workspaceTitle = container.querySelector('#workspace-title');
    const closeBtn = container.querySelector('#btn-close-workspace');

    expect(workspacePanel.style.display).toBe('none');

    // Find Launch Workspace button for AlphaInventory
    const portedCards = container.querySelectorAll('#ported-projects-list > div');
    let invCard, reqCard;
    portedCards.forEach(card => {
      if (card.textContent.includes('AlphaInventory')) invCard = card;
      if (card.textContent.includes('AlphaRequirements')) reqCard = card;
    });

    expect(invCard).not.toBeUndefined();
    expect(reqCard).not.toBeUndefined();

    // Launch AlphaInventory workspace
    invCard.querySelector('.launch-port-btn').click();
    expect(workspacePanel.style.display).toBe('block');
    expect(workspaceTitle.textContent).toContain('ALPHAINVENTORY');
    expect(container.querySelector('#ai-pinout-grid')).not.toBeNull();

    // Switch workspace to AlphaRequirements
    reqCard.querySelector('.launch-port-btn').click();
    expect(invDestroySpy).toHaveBeenCalledTimes(1);
    expect(workspaceTitle.textContent).toContain('ALPHAREQUIREMENTS');
    expect(container.querySelector('#ar-raw-input')).not.toBeNull();

    // Close workspace
    closeBtn.click();
    expect(reqDestroySpy).toHaveBeenCalledTimes(1);
    expect(workspacePanel.style.display).toBe('none');
  });

  it('5. Quick Execution & Console Logging', async () => {
    const consoleEl = container.querySelector('#sub-console-output');
    const portedCards = container.querySelectorAll('#ported-projects-list > div');
    
    let invCard;
    portedCards.forEach(card => {
      if (card.textContent.includes('AlphaInventory')) invCard = card;
    });

    const execBtn = invCard.querySelector('.exec-port-btn');
    execBtn.click();

    // Wait for execution promise
    await new Promise(r => setTimeout(r, 100));
    expect(consoleEl.textContent).toContain('AlphaInventory');
    expect(consoleEl.textContent).toContain('Scan complete');
  });

  it('6. Verify public/_redirects and dist/_redirects for Netlify SPA compatibility', () => {
    const publicRedirects = path.join(process.cwd(), 'public', '_redirects');
    const distRedirects = path.join(process.cwd(), 'dist', '_redirects');

    expect(fs.existsSync(publicRedirects)).toBe(true);
    const content = fs.readFileSync(publicRedirects, 'utf-8').trim();
    expect(content).toBe('/* /index.html 200');

    if (fs.existsSync(distRedirects)) {
      const distContent = fs.readFileSync(distRedirects, 'utf-8').trim();
      expect(distContent).toBe('/* /index.html 200');
    }
  });
});
