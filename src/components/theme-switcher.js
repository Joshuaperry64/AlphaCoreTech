/**
 * AlphaCore Cyber Color Matrix Theme Switcher
 * Dynamically switches theme accent color palettes and persists selection.
 */

const THEMES = {
  cyan: {
    name: 'Cyan Protocol',
    accent: '#06b6d4',
    accentGlow: 'rgba(6, 182, 212, 0.4)',
    accentDim: '#0284c7',
    border: 'rgba(6, 182, 212, 0.3)',
    bgGlow: 'rgba(6, 182, 212, 0.05)'
  },
  amber: {
    name: 'Amber Matrix',
    accent: '#f59e0b',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    accentDim: '#d97706',
    border: 'rgba(245, 158, 11, 0.3)',
    bgGlow: 'rgba(245, 158, 11, 0.05)'
  },
  emerald: {
    name: 'Emerald Terminal',
    accent: '#10b981',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    accentDim: '#059669',
    border: 'rgba(16, 185, 129, 0.3)',
    bgGlow: 'rgba(16, 185, 129, 0.05)'
  },
  violet: {
    name: 'Plasma Violet',
    accent: '#a855f7',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    accentDim: '#9333ea',
    border: 'rgba(168, 85, 247, 0.3)',
    bgGlow: 'rgba(168, 85, 247, 0.05)'
  },
  crimson: {
    name: 'Overdrive Crimson',
    accent: '#ef4444',
    accentGlow: 'rgba(239, 68, 68, 0.4)',
    accentDim: '#dc2626',
    border: 'rgba(239, 68, 68, 0.3)',
    bgGlow: 'rgba(239, 68, 68, 0.05)'
  }
};

export function applyTheme(themeKey) {
  const theme = THEMES[themeKey] || THEMES.cyan;
  const root = document.documentElement;
  
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  root.style.setProperty('--accent-dim', theme.accentDim);
  root.style.setProperty('--border-accent', theme.border);
  root.style.setProperty('--bg-glow', theme.bgGlow);
  
  localStorage.setItem('alphacore_theme', themeKey);
}

export function getCurrentTheme() {
  return localStorage.getItem('alphacore_theme') || 'cyan';
}

export function initThemeSwitcher() {
  const saved = getCurrentTheme();
  applyTheme(saved);
}

export { THEMES };
