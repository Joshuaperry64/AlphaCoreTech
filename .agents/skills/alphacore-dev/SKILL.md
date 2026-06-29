---
name: alphacore-dev
description: Guidelines, architecture, and design rules for developing the AlphaCore Tech HUD application.
---

# AlphaCore Tech Development Guidelines

## 1. Architecture & Stack
- **Frontend:** Vanilla JavaScript, HTML5 Canvas, and CSS3. Bundled using **Vite**. 
- **Backend:** A lightweight Express.js server (`server.js`) running on port 3000. It serves the REST API and the built static assets from `/dist`.
- **Database:** Local JSON file (`data.json`). The frontend synchronizes via `src/components/db_sync.js` calling `/api/pins`, `/api/logs`, and `/api/settings`.
- **Execution:** Always build frontend changes using `npm run build`. The full application is served via `npm start`.

## 2. Aesthetics & UI/UX (Cyberpunk HUD)
- **Theme:** Strict cyberpunk/terminal interface. 
- **Colors:** Primary UI color is cyan (`#00b8ff`, `var(--blue)`). The "Darkened State / Luci" mode uses neon red (`#ff003c`, `var(--accent)`).
- **Styling Rules:** 
  - ALWAYS use standard CSS in `src/style.css` (NO Tailwind).
  - Use `text-shadow` for glowing effects.
  - Rely heavily on CSS Grid and Flexbox.
  - Buttons (`.aim-btn`) and inputs (`.aim-input`) have predefined, stylized borders and hover states. Do NOT use default browser styling.
  - Include `.glitch` classes on primary headers for the chromatic aberration effect.

## 3. Security & Authentication Model
- **No Traditional Passwords:** Authentication is entirely PIN-based.
- **Roles:** The `data.json` stores PINs which grant specific roles (e.g., `admin`, `vault`, `generate`, `lora`). 
- **Session:** The frontend tracks authorization using `sessionStorage` (e.g., `admin_authenticated = true`, `current_profile = "Guest"`). 
- **Admin Panel:** The Admin panel manages PIN generation, revocation, and system logs.

## 4. Mobile & Responsive Design
- Use `100svh` for full-height containers to prevent mobile browser UI shifting.
- Ensure `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">` to prevent zooming.
- Use `@media (max-width: 768px)` to apply specific mobile layouts and background images (e.g., `Roar.png` for mobile, `Banner.png` for desktop).

## 5. Performance Constraints
- When using HTML Canvas (e.g., `matrix-rain.js`), ALWAYS use `requestAnimationFrame` throttled by time, NEVER use unthrottled `setInterval(..., 50)`.
- Skip rendering heavy background effects when `document.hidden` is true to save CPU/battery.
