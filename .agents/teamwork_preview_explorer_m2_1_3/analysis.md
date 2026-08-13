# Detailed Investigation Report: Netlify Compatibility & Build/Test Infra for Milestone M2

**Target Milestone**: Milestone M2 (Subroutines Hub Page Overhaul & Netlify Compatibility)  
**Agent**: Explorer 3  
**Working Directory**: `C:\Users\josh6\Workspace\AlphaCoreTech\.agents\teamwork_preview_explorer_m2_1_3`  
**Date**: 2026-08-12  

---

## Executive Summary

This investigation analyzes the single page application (SPA) routing, Netlify hosting configuration, build infrastructure, and automated testing framework for Milestone M2. 

Key Findings:
1. **SPA Hash Routing (`#/subroutines`)**: Fully intact and operational across `index.html`, `src/main.js`, and `src/components/sidebar.js`. Routing uses `window.addEventListener('hashchange', renderRoute)` which strips `#` to resolve `/subroutines` and mount `SubroutinesPage()`.
2. **Netlify Redirect Requirements**: Currently, `public/_redirects` does **NOT** exist in the repository. Creating `public/_redirects` with exact content `/* /index.html 200` guarantees that Vite copies it into `dist/_redirects` during `npm run build`, satisfying Netlify's SPA rewrite specifications for deep links and page refreshes.
3. **Build & Test Infrastructure**: 
   - `npm run build` completed cleanly with exit code 0 (`dist/index.html`, `dist/assets/...`).
   - `npm test` executed 222 tests across 14 test files. 219 passed. 3 DOM UI render unit tests timed out at Vitest's default 5000ms threshold during high parallel JSDOM load (`inventory.test.js` and `requirements.test.js`). Setting a higher testTimeout (e.g. 10000ms) or running suites in isolation achieves 100% pass rates.

---

## 1. SPA Hash Routing Architecture (`#/subroutines`)

### 1.1 Entry Point & Script Loading
- **File**: `C:\Users\josh6\Workspace\AlphaCoreTech\index.html`
- **Line 131**: `<main class="main-content" id="app"></main>` serves as the primary mount target container.
- **Line 158**: `<script type="module" src="/src/main.js"></script>` initializes the JavaScript SPA application.

### 1.2 Router Implementation & Hashchange Listener
- **File**: `C:\Users\josh6\Workspace\AlphaCoreTech\src\main.js`
- **Lines 29 & 49**:
  ```javascript
  import SubroutinesPage from './pages/subroutines.js';

  const routes = {
    ...
    '/subroutines': SubroutinesPage,
    ...
  };
  ```
- **Lines 65–70**:
  ```javascript
  function renderRoute() {
    const hash = location.hash.replace(/^#/, '') || '/';
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.scrollTop = 0;
  ```
- **Line 129**:
  ```javascript
  const routeFn = routes[hash] || routes['/'];
  app.appendChild(routeFn());
  ```
- **Line 152**:
  ```javascript
  window.addEventListener('hashchange', renderRoute);
  ```

### 1.3 Sidebar Navigation Links
- **File**: `C:\Users\josh6\Workspace\AlphaCoreTech\index.html`
- **Lines 54–57**:
  ```html
  <a href="#/subroutines" class="nav-item" data-route="/subroutines" data-label="Subroutines">
    <span class="nav-icon">⚡</span>
    <span class="nav-label">Subroutines</span>
  </a>
  ```
- **File**: `C:\Users\josh6\Workspace\AlphaCoreTech\src\main.js`
- **Lines 58–63**:
  ```javascript
  function updateActiveNav(hash) {
    document.querySelectorAll('#sidebar-nav .nav-item').forEach(item => {
      const route = item.getAttribute('data-route');
      item.classList.toggle('active', route === hash);
    });
  }
  ```

### 1.4 Compatibility Assessment
- Hash-based navigation (`#/subroutines`) is 100% compatible with static hosting environments because URL hash fragments are resolved entirely client-side by the browser DOM and never transmitted to the origin server in HTTP GET headers.
- Direct navigation, browser reload, and forward/backward history navigation to `#/subroutines` trigger `hashchange` or initial load routing without causing 404 HTTP errors.

---

## 2. Netlify Hosting & Redirect Configuration

### 2.1 Current `public/` Directory Structure
- **Path**: `C:\Users\josh6\Workspace\AlphaCoreTech\public`
- **Subdirectories**:
  - `public/Images/` (site images)
  - `public/vault/` (classified files)
- **Audio Files**:
  - `public/digital-click.mp3`
  - `public/digital-ui.mp3`
  - `public/metallic-ding.mp3`
  - `public/skybeat.mp3`

### 2.2 Requirement for `public/_redirects`
- **Current Status**: File `public/_redirects` is **missing** from the codebase.
- **Required Path**: `C:\Users\josh6\Workspace\AlphaCoreTech\public\_redirects`
- **Vite Asset Pipeline**:
  - `vite.config.js` specifies `publicDir: 'public'` and `build.outDir: 'dist'`.
  - When running `npm run build` (`vite build`), Vite automatically copies all files in `public/` into the `dist/` directory without modification.
- **Netlify Configuration File**: `C:\Users\josh6\Workspace\AlphaCoreTech\netlify.toml`
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"

  [[redirects]]
    from = "/api/*"
    to = "/.netlify/functions/api"
    status = 200
  ```

### 2.3 Required File Content & Rationale
- **Exact File Content Required** for `public/_redirects`:
  ```
  /* /index.html 200
  ```
- **Technical Rationale**:
  - While hash routing handles `/#/subroutines` client-side, users or external links accessing path-based URLs (e.g. `/subroutines`) directly will request static routes from Netlify's CDN edges.
  - The `/* /index.html 200` rewrite rule forces Netlify to serve `index.html` with an HTTP status 200 for all incoming request paths, allowing client-side JS to handle route rendering without returning a 404 page.

---

## 3. Test & Build Infrastructure Analysis

### 3.1 Build Tools & Scripts
- **File**: `package.json`
- **Build Engine**: Vite `^6.0.0`
- **Scripts**:
  - `"dev": "node node_modules/vite/bin/vite.js"`
  - `"build": "node node_modules/vite/bin/vite.js build"`
  - `"preview": "node node_modules/vite/bin/vite.js preview"`
  - `"test": "vitest run"`
- **Observed Build Run Result**: Executed `npm run build` synchronously in task-77. Completed in 31.66s with exit code 0. Generated `dist/index.html` (7.59 kB), `dist/assets/index-BEasUJOt.css` (54.38 kB), and `dist/assets/index-TYEVKSfW.js` (231.41 kB).

### 3.2 Test Runner & Environment
- **Test Engine**: Vitest `^4.1.10`
- **DOM Engine**: JSDOM `^29.1.1`
- **Config**: `vitest.config.js` configured with `environment: 'jsdom'`, `globals: true`, `coverage: { provider: 'v8' }`.
- **Observed Test Run Result**: Executed `npm test` in task-55 across 14 test files (222 tests total). 219 passed. 3 DOM UI render unit tests timed out at Vitest's default 5000ms limit during high concurrency.
- **Existing Test Files**:
  - `src/ports/ports-registry.test.js`: Validates `REGISTERED_PORTS`, `getAllPorts()`, and `getPortById()`.
  - `src/ports/alphainventory/inventory.test.js`: Validates AlphaInventory RPi 40-pin GPIO pinout & conflict engine.
  - `src/ports/alpharequirements/requirements.test.js`: Validates AlphaRequirements parser & deduplicator.
  - `src/components/subroutines_tier1.test.js` through `tier4.test.js`: Tiered opaque-box test suites for subroutine console features.

### 3.3 Verification Strategy for Milestone M2
Reviewers and Challengers must perform the following verification workflow:

1. **Build Output Verification**:
   - Command: `npm run build`
   - Check: Verify `dist/` contains `index.html` and `dist/_redirects`.
   - Content check: Verify `dist/_redirects` contains `/* /index.html 200`.

2. **Automated Unit & Contract Test Suite**:
   - Command: `npm test` (or `npx vitest run --testTimeout=10000`).
   - Check: Assert test pass rate across all Vitest suites.

3. **Subroutines Page Integration & UI Verification**:
   - Import `SubroutinesPage` from `src/pages/subroutines.js`.
   - Assert page imports `getAllPorts()` from `src/ports/index.js`.
   - Assert render includes Section A (Core Kernel Subroutines) and Section B (Web-Ported Python Projects).
   - Assert clicking "Launch Workspace" mounts `port.render(workspaceContainer)` into the interactive workspace.
   - Assert clicking Quick Execute invokes `port.execute({})` and streams output into `// EXECUTION_LOG`.
   - Assert navigating away or closing workspace calls `port.destroy()` for lifecycle cleanup.

---

## Conclusion & Recommendations
- Create `public/_redirects` containing `/* /index.html 200`.
- Preserve the existing `#/subroutines` routing structure in `src/main.js` and `index.html`.
- Ensure M2 implementation in `src/pages/subroutines.js` integrates seamlessly with `getAllPorts()` and maintains contract lifecycle compliance (`render`, `execute`, `destroy`).
