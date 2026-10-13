/**
 * Shared Modal component
 * Dynamically creates modal content if the shell element exists or creates it if absent.
 */

let initialized = false;

export function ensureModalElement() {
  let modal = document.getElementById('stat-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stat-modal';
    modal.className = 'stat-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    document.body.appendChild(modal);
  } else {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
  }
  return modal;
}

export function initModal() {
  if (initialized) return;
  initialized = true;

  const modal = ensureModalElement();

  // Build modal inner content
  modal.innerHTML = `
    <div class="panel stat-modal-content">
      <button id="close-modal" class="close-btn" aria-label="Close dialog">×</button>
      <div id="modal-title" class="panel-title">// TITLE</div>
      <div id="modal-body-container">
        <p id="modal-desc" class="log-console" style="height:auto; font-size:0.9rem;"></p>
      </div>
    </div>
  `;
  modal.style.display = '';

  const closeBtn = document.getElementById('close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }
  });
}

import { playSFX } from './audio.js';

export function showModal(titleOrConfig, description = '') {
  initModal();
  playSFX('modal', 0.5);

  const modal = document.getElementById('stat-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const bodyContainer = document.getElementById('modal-body-container');

  if (!modal) return;

  if (typeof titleOrConfig === 'object' && titleOrConfig !== null) {
    const { title, content } = titleOrConfig;
    if (modalTitle) modalTitle.textContent = title || '';
    if (bodyContainer) {
      bodyContainer.innerHTML = '';
      if (typeof content === 'string') {
        const p = document.createElement('div');
        p.innerHTML = content;
        bodyContainer.appendChild(p);
      } else if (content instanceof HTMLElement) {
        bodyContainer.appendChild(content);
      }
    }
    if (title || content) {
      modal.classList.add('active');
      const closeBtn = document.getElementById('close-modal');
      setTimeout(() => closeBtn?.focus(), 50);
    } else {
      modal.classList.remove('active');
    }
  } else {
    if (modalTitle) modalTitle.textContent = titleOrConfig || '';
    if (bodyContainer && modalDesc) {
      bodyContainer.innerHTML = '';
      modalDesc.textContent = description ? `> ${description}` : '';
      bodyContainer.appendChild(modalDesc);
    }
    modal.classList.add('active');
    const closeBtn = document.getElementById('close-modal');
    setTimeout(() => closeBtn?.focus(), 50);
  }
}

