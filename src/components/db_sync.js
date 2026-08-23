/**
 * AlphaCore State Sync Component — Client-Side Local Mode
 */

export async function syncFromServer() {
  const pin = sessionStorage.getItem('current_pin');
  if (!pin) return Promise.resolve();
  
  try {
    const [setRes, pinRes] = await Promise.all([
      fetch('/api/settings', { headers: { 'x-user-pin': pin } }),
      fetch('/api/pins', { headers: { 'x-user-pin': pin } })
    ]);
    
    if (setRes.ok) {
      const settings = await setRes.json();
      localStorage.setItem('alphacore_modal_settings', JSON.stringify(settings));
    }
    
    if (pinRes.ok) {
      const pins = await pinRes.json();
      localStorage.setItem('alphacore_pins', JSON.stringify(pins));
    }
  } catch (err) {
    console.error('Failed to sync from server:', err);
  }
}

export function pushToServer(endpoint, data, authPinOverride = null) {
  const pin = authPinOverride || sessionStorage.getItem('current_pin');
  if (!pin) return;
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/api/${endpoint}`;

  fetch(cleanEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-pin': pin
    },
    body: JSON.stringify(data)
  }).catch(err => console.error(`Failed to push ${cleanEndpoint} to server:`, err));
}
