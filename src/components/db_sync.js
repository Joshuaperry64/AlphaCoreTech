export async function syncFromServer() {
  try {
    const pinsRes = await fetch('/api/pins');
    if (pinsRes.ok) localStorage.setItem('alphacore_pins', JSON.stringify(await pinsRes.json()));

    const logsRes = await fetch('/api/logs');
    if (logsRes.ok) localStorage.setItem('alphacore_system_logs', JSON.stringify(await logsRes.json()));

    const settingsRes = await fetch('/api/settings');
    if (settingsRes.ok) localStorage.setItem('alphacore_modal_settings', JSON.stringify(await settingsRes.json()));
    
    console.log('[SYS] Database sync complete.');
  } catch (e) {
    console.warn('[SYS] Database offline. Running in local-only mode.', e);
  }
}

export function pushToServer(endpoint, data) {
  fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).catch(e => console.warn(`[SYS] Failed to push to /api/${endpoint}`, e));
}
