/**
 * Sidebar — Clock, uptime, hamburger menu
 * Initialized once globally.
 */

let clockInterval = null;
let uptimeInterval = null;
const sessionStart = Date.now();

export function initSidebar() {
  // Clock
  function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: '2-digit'
    }).toUpperCase();
  }
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  // Uptime
  function updateUptime() {
    const uptimeEl = document.getElementById('uptime-counter');
    if (!uptimeEl) return;
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    uptimeEl.textContent = `${h}:${m}:${s}`;
  }
  uptimeInterval = setInterval(updateUptime, 1000);

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const sidebarDim = document.getElementById('sidebar-dim');

  function openSidebar() {
    sidebar?.classList.add('open');
    hamburger?.classList.add('open');
    sidebarDim?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar?.classList.remove('open');
    hamburger?.classList.remove('open');
    sidebarDim?.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    if (sidebarDim) sidebarDim.addEventListener('click', closeSidebar);
  }
}
