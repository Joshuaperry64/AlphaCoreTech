/**
 * Sidebar — Clock, uptime, hamburger menu
 * Initialized once globally.
 */
import { getPins } from './pinpad.js';

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

  // Auth profile display & profile switcher trigger
  const authVal = document.getElementById('sidebar-auth-val');
  if (authVal) {
    const profile = sessionStorage.getItem('current_profile') || 'Guest';
    authVal.textContent = profile.toUpperCase();
    authVal.className = profile === 'Guest' ? 's-val' : 's-val accent';
    authVal.style.cursor = 'pointer';
    authVal.title = profile === 'Guest' ? 'Click to authenticate profile via PIN' : `Active: ${profile}. Click to switch/logout.`;

    const adminTab = document.querySelector('a[data-route="/admin"]');
    if (adminTab) adminTab.style.display = 'flex';
    const vaultTab = document.querySelector('a[data-route="/vault"]');
    if (vaultTab) vaultTab.style.display = 'flex';

    authVal.onclick = () => {
      import('./modal.js').then(({ showModal }) => {
        import('./pinpad.js').then(({ buildPinPad }) => {
          const pinPadEl = buildPinPad({
            onSuccess: (res) => {
              showModal({ title: '', content: '' }); // close modal
              window.location.reload();
            },
            title: '// SWITCH_PROFILE_SESSION',
            subtitle: 'ENTER ARCHITECT OR USER PIN',
            icon: '🔑'
          });

          const modalWrap = document.createElement('div');
          modalWrap.appendChild(pinPadEl);

          if (sessionStorage.getItem('current_profile') !== 'Guest') {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'aim-btn';
            logoutBtn.style.cssText = 'width: 100%; margin-top: 12px; background: rgba(239,68,68,0.15); border-color: #ef4444; color: #ef4444;';
            logoutBtn.textContent = 'LOGOUT TO GUEST PROFILE';
            logoutBtn.onclick = () => {
              sessionStorage.clear();
              sessionStorage.setItem('current_profile', 'Guest');
              window.location.reload();
            };
            modalWrap.appendChild(logoutBtn);
          }

          showModal({
            title: 'PROFILE SECURITY AUTHENTICATION',
            content: modalWrap
          });
        });
      });
    };
  }

  // Uptime
  function updateUptime() {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    const timeStr = `${h}:${m}:${s}`;

    const uptimeEl = document.getElementById('uptime-counter');
    if (uptimeEl) uptimeEl.textContent = timeStr;

    const uptimeBottomEl = document.getElementById('uptime-counter-bottom');
    if (uptimeBottomEl) uptimeBottomEl.textContent = timeStr;
  }
  updateUptime();
  if (uptimeInterval) clearInterval(uptimeInterval);
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

  // Sidebar collapse (desktop)
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  if (collapseBtn && sidebar) {
    if (localStorage.getItem('alphacore_sidebar_collapsed') === '1') {
      sidebar.classList.add('sidebar--collapsed');
      document.body.classList.add('sidebar-collapsed');
    }
    collapseBtn.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('sidebar--collapsed');
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      localStorage.setItem('alphacore_sidebar_collapsed', collapsed ? '1' : '0');
    });
  }
}
