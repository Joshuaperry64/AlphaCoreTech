if ('serviceWorker' in navigator) {
  let refreshing = false;
  const wasControlled = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (wasControlled && !refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  const registerWorker = () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {
      console.warn('Offline support is unavailable.');
    });
  };
  if (document.readyState === 'complete') {
    registerWorker();
  } else {
    window.addEventListener('load', registerWorker, { once: true });
  }
}

export async function startApplication() {
  const status = document.getElementById('startup-status');
  try {
    const { initialRoute } = await import('./main.js');
    status?.remove();
    await initialRoute;
  } catch {
    if (status) {
      status.setAttribute('role', 'alert');
      status.querySelector('#startup-title').textContent = 'ALPHACORE // CONNECTION INTERRUPTED';
      status.querySelector('#startup-message').textContent = 'The interface could not load. Check your connection and reload to try again.';
      if (!status.isConnected) document.body.appendChild(status);
    }
  }
}

startApplication();
