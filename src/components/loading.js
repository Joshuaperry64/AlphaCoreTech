/**
 * Loading Overlay — Cinematic transition between routes
 */

const loadingMessages = [
  ['ROUTING TO NODE...', 'ESTABLISHING SECURE CHANNEL'],
  ['DECRYPTING PAYLOAD...', 'BYPASS LAYER ACTIVE'],
  ['LOADING SUBSYSTEM...', 'INJECTING PARAMETERS'],
  ['COMPILING DIRECTIVES...', 'UNRESTRICTED MODE ON'],
  ['SYNCHRONIZING CORE...', 'TRANSFER COMPLETE'],
];

export function showLoading() {
  return new Promise(resolve => {
    const overlay = document.getElementById('loading-overlay');
    const loStatus = document.getElementById('lo-status');
    const loBar = document.getElementById('lo-bar');
    const loSub = document.getElementById('lo-sub');

    const pick = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    if (loStatus) loStatus.textContent = pick[0];
    if (loSub) loSub.textContent = pick[1];

    overlay.classList.add('active');

    if (loBar) {
      loBar.style.width = '0%';
      let pct = 0;
      const tick = setInterval(() => {
        pct = Math.min(pct + Math.random() * 18 + 4, 100);
        loBar.style.width = pct + '%';
        if (pct >= 100) clearInterval(tick);
      }, 60);
    }

    setTimeout(resolve, 600);
  });
}

export function hideLoading() {
  return new Promise(resolve => {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
    setTimeout(resolve, 300);
  });
}

/**
 * Initial boot loading — shown on first page load
 */
export function showInitialBoot() {
  return new Promise(resolve => {
    const overlay = document.getElementById('loading-overlay');
    const loStatus = document.getElementById('lo-status');
    const loBar = document.getElementById('lo-bar');
    const loSub = document.getElementById('lo-sub');

    if (loStatus) loStatus.textContent = 'BOOTING ALPHACORE v4.0...';
    if (loSub) loSub.textContent = 'PLEASE STAND BY';
    overlay.classList.add('active');

    if (loBar) {
      loBar.style.width = '0%';
      let pct = 0;
      const tick = setInterval(() => {
        pct = Math.min(pct + Math.random() * 8 + 2, 100);
        loBar.style.width = pct + '%';
        if (pct >= 100) {
          clearInterval(tick);
          setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(resolve, 300);
          }, 400);
        }
      }, 50);
    } else {
      setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(resolve, 300);
      }, 1000);
    }
  });
}
