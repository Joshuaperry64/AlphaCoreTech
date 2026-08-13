# Scope: Milestone M2 — Subroutines Hub Page Overhaul & Netlify Compatibility

## Architecture
- `src/pages/subroutines.js`: Primary SPA page for subroutines hub.
- `src/ports/index.js`: Exposes `getAllPorts()`, `getPortById()`, etc.
- `public/_redirects`: Netlify SPA rewrite configuration file (`/* /index.html 200`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Subroutines Page Import Ports | Import `getAllPorts` from `../ports/index.js` | M2 | ORIGINAL_REQUEST |
| 2 | Top Bar Controls | Category filter, search input, batch buttons, autoscroll toggle | M2 | ORIGINAL_REQUEST |
| 3 | Section A Core Kernel Subroutines | Display existing 8 core kernel subroutines with filter/search | M2 | ORIGINAL_REQUEST |
| 4 | Section B Web-Ported Python Projects | Cards for AlphaInventory and AlphaRequirements loaded from `getAllPorts()` | M2 | ORIGINAL_REQUEST |
| 5 | Interactive Workspace View | Launch Interactive Workspace mounts `port.render(workspaceContainer)` into workspace panel | M2 | ORIGINAL_REQUEST |
| 6 | Quick Execute & Execution Logs | Quick Execute calls `port.execute({})`, logs streamed to `// EXECUTION_LOG` | M2 | ORIGINAL_REQUEST |
| 7 | Encapsulation & Lifecycle | `port.destroy()` cleanup on tab change or workspace switch | M2 | ORIGINAL_REQUEST |
| 8 | Netlify Redirects | Create `public/_redirects` with `/* /index.html 200` | M2 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M2 | Subroutines Hub Page Overhaul & Netlify Compatibility | Overhaul `src/pages/subroutines.js`, integration with `getAllPorts()`, interactive workspace modal/container, lifecycle management, and create `public/_redirects` | M1 | DONE |

## Interface Contracts
### `src/ports/index.js` ↔ `src/pages/subroutines.js`
- `getAllPorts()` returns an array of Port objects: `{ id, name, category, description, version, execute(args), render(container), destroy() }`.
- `port.render(container)` attaches interactive DOM interface to container.
- `port.destroy()` cleans up event listeners, timers, and DOM elements attached by `render()`.
- `port.execute(args)` runs execution headlessly returning result object with status and output.
