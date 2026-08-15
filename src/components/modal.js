/**
 * Shared Modal component
 * Dynamically creates modal content if the shell element exists.
 */

let initialized = false;

export function initModal() {
  if (initialized) return;
  initialized = true;

  const modal = document.getElementById('stat-modal');
  if (!modal) return;

  // Build modal inner content
  modal.innerHTML = `
    <div class="panel stat-modal-content">
      <button id="close-modal" class="close-btn">×</button>
      <div id="modal-title" class="panel-title">// TITLE</div>
      <p id="modal-desc" class="log-console" style="height:auto; font-size:0.9rem;"></p>
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
    if (e.key === 'Escape') modal.classList.remove('active');
  });
}

import { playSFX } from './audio.js';

export function showModal(title, description) {
  playSFX('modal', 0.5);
  const modal = document.getElementById('stat-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  if (modalTitle) modalTitle.textContent = title;
  if (modalDesc) modalDesc.textContent = `> ${description}`;
  if (modal) modal.classList.add('active');
}
