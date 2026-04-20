/**
 * Shared Modal component
 * Used by stat cards, lore rows, and any future info panels.
 */

let initialized = false;

export function initModal() {
  if (initialized) return;
  initialized = true;

  const modal = document.getElementById('stat-modal');
  const closeBtn = document.getElementById('close-modal');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal) modal.classList.remove('active');
  });
}

export function showModal(title, description) {
  const modal = document.getElementById('stat-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  if (modalTitle) modalTitle.textContent = title;
  if (modalDesc) modalDesc.textContent = `> ${description}`;
  if (modal) modal.classList.add('active');
}
