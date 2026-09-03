/**
 * AlphaCore API Base — resolves the backend URL regardless of host environment.
 * In production (Netlify), VITE_API_BASE points to the Render backend.
 * In local dev, falls back to relative paths (same-origin Express server).
 */
export const API_BASE = import.meta.env.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE.replace(/\/$/, '')  // strip trailing slash
  : '';

/**
 * Constructs a full backend API URL.
 * @param {string} path - e.g. '/api/settings'
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
