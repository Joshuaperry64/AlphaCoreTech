export async function syncFromServer() {
  try {
    const pin = sessionStorage.getItem('current_pin') || '';
    const fetchOptions = {
      headers: {
        'X-User-Pin': pin
      }
    };

    const [pinsRes, logsRes, settingsRes] = await Promise.all([
      fetch('/api/pins', fetchOptions),
      fetch('/api/logs', fetchOptions),
      fetch('/api/settings', fetchOptions)
    ]);

    if (pinsRes.ok) localStorage.setItem('alphacore_pins', JSON.stringify(await pinsRes.json()));
    if (logsRes.ok) localStorage.setItem('alphacore_system_logs', JSON.stringify(await logsRes.json()));
    if (settingsRes.ok) localStorage.setItem('alphacore_modal_settings', JSON.stringify(await settingsRes.json()));
    
    console.log('[SYS] Database sync complete.');
  } catch (e) {
    console.warn('[SYS] Database offline. Running in local-only mode.', e);
  }
}

export function pushToServer(endpoint, data, authPinOverride = null) {
  const pin = authPinOverride || sessionStorage.getItem('current_pin') || '';
  fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Pin': pin
    },
    body: JSON.stringify(data)
  }).catch(e => console.warn(`[SYS] Failed to push to /api/${endpoint}`, e));
}
