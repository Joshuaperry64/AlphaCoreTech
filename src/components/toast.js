/**
 * AlphaCore Floating Toast Notification System
 * Displays cyber-styled status alerts and action confirmations.
 */

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'alphacore-toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 10000;
      pointer-events: none;
      font-family: 'Share Tech Mono', monospace;
    `;
    document.body.appendChild(toastContainer);
  }
}

export function showToast(type = 'INFO', message = '') {
  ensureContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    pointer-events: auto;
    background: rgba(10, 15, 25, 0.95);
    border-left: 4px solid var(--accent, #06b6d4);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
    border-radius: 4px;
    padding: 10px 16px;
    color: #fff;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 250px;
    max-width: 380px;
    transform: translateX(-120%);
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
    opacity: 0;
  `;

  let icon = 'ℹ';
  let borderColor = 'var(--accent, #06b6d4)';

  if (type === 'SUCCESS') {
    icon = '✓';
    borderColor = '#10b981';
  } else if (type === 'WARN') {
    icon = '⚠';
    borderColor = '#f59e0b';
  } else if (type === 'ERROR') {
    icon = '✖';
    borderColor = '#ef4444';
  }

  toast.style.borderLeftColor = borderColor;

  toast.innerHTML = `
    <span style="color: ${borderColor}; font-size: 1.1rem; font-weight: bold;">${icon}</span>
    <span style="flex: 1; color: #eee;">${message}</span>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(-120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
