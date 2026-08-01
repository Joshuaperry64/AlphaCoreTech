import { createElement } from '../components/utils.js';
import { buildPinPad } from '../components/pinpad.js';

export default function MainframePage() {
  const container = createElement('div', { class: 'page-section', id: 'mainframe-page' });
  
  const header = createElement('div', { class: 'section-header' });
  header.innerHTML = `
    <h1 class="glitch" data-text="// MAINFRAME_UPLINK">// MAINFRAME_UPLINK</h1>
    <div class="header-line"></div>
    <p class="section-desc">Direct uplink to the edge operating system and proxy interception layer.</p>
  `;
  container.appendChild(header);

  const contentArea = createElement('div', { class: 'mainframe-content-area', style: 'position:relative; width:100%; height:80vh; min-height: 600px; border:1px solid var(--accent); border-radius:4px; overflow:hidden; background:#020617;' });
  
  const pinContainer = createElement('div', { style: 'display:flex; justify-content:center; align-items:center; height:100%; width:100%;' });
  
  const pinpad = buildPinPad({
    authKey: null, // Forces pin entry every time the tab is opened for maximum security
    requiredRole: 'admin', // Enforces Architect-level clearance
    title: 'ALPHACORE // MAINFRAME_OS',
    subtitle: 'RESTRICTED ARCHITECT CLEARANCE REQUIRED',
    icon: '🕸',
    onSuccess: (result) => {
      // Clear the pin pad
      contentArea.innerHTML = '';
      
      // Load the AlphaMainframe UI via Iframe
      const iframe = createElement('iframe', {
        // This connects directly to the Cloudflare Zero Trust tunnel or local proxy layer
        src: 'https://system.alpha-core.tech', 
        style: 'width:100%; height:100%; border:none; background:#000;'
      });
      contentArea.appendChild(iframe);
    }
  });
  
  pinContainer.appendChild(pinpad);
  contentArea.appendChild(pinContainer);
  container.appendChild(contentArea);
  
  return () => {
    // cleanup logic if needed
  };
}
