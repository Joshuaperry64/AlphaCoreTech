/**
 * AlphaCore State Sync Component — Client-Side Local Mode
 */

export async function syncFromServer() {
  // Client-side local execution mode - resolves immediately
  return Promise.resolve();
}

export function pushToServer(endpoint, data, authPinOverride = null) {
  // No-op for client-side local execution mode
}
