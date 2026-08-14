# Project: AlphaCoreTech Bulk Project Porting

## Architecture
- **Web-Porting Framework (`src/ports/`)**: Modular JavaScript framework for rendering interactive subroutines.
- **Auto-Registry (`src/ports/index.js`)**: Uses Vite eager glob discovery (`import.meta.glob('./*/index.js', { eager: true })`) to automatically discover, validate, and register all web-ported subroutines in `src/ports/`.
- **Port Component Contract (`src/ports/port-contract.js`)**: Enforces required metadata (`id`, `name`, `category`, `version`, `description`, `pythonSourcePath`) and lifecycle methods (`render`, `execute`, `destroy`).
- **Subroutines Page Directory (`src/pages/subroutines.js` / `subroutines.html`)**: Cyberpunk CRT terminal UI displaying all 57 cataloged projects with:
  1. Category/Domain filter tabs (Hardware, AI/ML, Security, Mobile, Audio, System, Network, Simulation, Data, Utilities, Crypto, Reverse Engineering).
  2. Search bar with real-time text matching and alphabetical sorting (A-Z, Z-A).
  3. Timeline / Recent view toggle showing newest ports at top.
  4. Basic Authentication integration with pincode/profile selection.
  5. Fullscreen takeover workspace transition when launching a subroutine, with a prominent `✕ CLOSE WORKSPACE` return button.
- **Build & Hosting Target**: Netlify static site with SPA routing rewrites (`public/_redirects`). Strictly local development and testing (zero `git push`).
- **Programmatic Audit Script (`scripts/audit_subroutines_coverage.js`)**: Automated Node.js script cross-referencing all 57 workspace project directories in `C:\Users\josh6\workspace` against registered components in `src/ports/` to verify 100% catalog coverage.

## Feature Inventory

### Infrastructure Features
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Eager Glob Registry | Vite `import.meta.glob` auto-discovery in `src/ports/index.js` | M1 | Survey / Explorer 3 |
| 2 | Component Contract Validator | Enforce `PortComponentContract` on all 57 components | M1 | Survey / Explorer 3 |
| 3 | Cyberpunk Subroutines UI | Neon/monospace design, scanlines, typing animations, card grid | M2 | Survey / Explorer 2 |
| 4 | Search & Alphabetical Sorting | Real-time text search and A-Z / Z-A sorting | M2 | Requirement R2/R5 |
| 5 | Domain & Topic Filter Tabs | Filter by Hardware, AI/ML, Security, Mobile, Audio, System, Network, etc. | M2 | Requirement R2/R5 |
| 6 | Timeline / Recent View | Sort subroutines by recent addition | M2 | Requirement R2/R5 |
| 7 | Fullscreen Takeover & Return Button | Smooth workspace takeover and clear `✕ CLOSE WORKSPACE` return button | M2 | Requirement R2/R5 |
| 8 | Auth & Security Protection | Protect subroutines page and components via pincode/profile integration | M2 | Requirement R6 |
| 9 | Coverage Audit Script | Node.js script verifying 100% coverage of workspace Python projects | M3 | Acceptance Criteria |
| 10 | Local Build Verification | Programmatic verification that `npm run build` succeeds cleanly | M3 | Acceptance Criteria |

### Cataloged Workspace Projects (57 Total)
| # | Feature / Project | Description | Type | Assigned Milestone |
|---|-------------------|-------------|------|--------------------|
| 1 | `AlphaAgency` | Agent swarm orchestration GUI | Interactive Port | M1 |
| 2 | `AlphaAPK` | APK reverse engineering & manifest inspector | Placeholder | M1 |
| 3 | `AlphaAssistant` | Multi-modal AI assistant suite | Placeholder | M1 |
| 4 | `AlphaBrowser` | Automated browser controller & scraper | Placeholder | M1 |
| 5 | `AlphaComfy` | ComfyUI workflow bridge | Placeholder | M1 |
| 6 | `AlphaComms` | Encrypted P2P comms node | Placeholder | M1 |
| 7 | `AlphaConcepts` | AI concept design explorer | Interactive Port | M1 |
| 8 | `AlphaController` | Neural interface & desktop symbiote client/server UI | Placeholder | M1 |
| 9 | `AlphaDiagnostics` | Hardware telemetry monitor & diagnostic dashboard | Placeholder | M1 |
| 10 | `AlphaDPMS` | Data Protection & Memory System (MCP) | Interactive Port | M1 |
| 11 | `AlphaDrive` | Cloud/local drive synchronizer | Placeholder | M1 |
| 12 | `AlphaExploit` | Cybersecurity vulnerability scanner | Placeholder | M1 |
| 13 | `AlphaEye` | Computer vision pipeline & object tracker | Placeholder | M1 |
| 14 | `AlphaGemini` | Google Gemini API wrapper & prompt optimizer | Interactive Port | M1 |
| 15 | `AlphaGhidra` | Ghidra headless binary analysis bridge | Placeholder | M1 |
| 16 | `AlphaGirl` | Voice synthesis suite (ElevenLabs/Silero/Whisper) | Placeholder | M1 |
| 17 | `AlphaHATS` | Hardware-Assisted Telemetry & Security auditor | Placeholder | M1 |
| 18 | `AlphaIgnition` | RasPi boot ignition sequence manager | Interactive Port | M1 |
| 19 | `AlphaInventory` | Hardware asset inventory tracker & GPIO engine | Interactive Port (Existing) | M1 |
| 20 | `AlphaIOS` | iOS IPA analysis & plist inspector | Placeholder | M1 |
| 21 | `AlphaJail` | LLM jailbreak safety tester | Interactive Port | M1 |
| 22 | `alphalimiter` | Bandwidth throttling daemon & speed limiter | Placeholder | M1 |
| 23 | `AlphaLink` | High-speed WebSocket bridge & tunnel manager | Placeholder | M1 |
| 24 | `AlphaLLM` | Local LLM model downloader & inference server | Placeholder | M1 |
| 25 | `AlphaMainframe` | Terminal mainframe interface & command hub | Interactive Port | M1 |
| 26 | `AlphaModal` | Modal serverless cloud function runner | Placeholder | M1 |
| 27 | `AlphaMP3` | Audio processing & MP3 tag editor | Placeholder | M1 |
| 28 | `AlphaMTK` | MediaTek chipset flasher & exploit toolkit | Placeholder | M1 |
| 29 | `AlphaNexus` | Distributed microservices gateway | Placeholder | M1 |
| 30 | `AlphaObfuscate` | Code obfuscator & string encryptor | Interactive Port | M1 |
| 31 | `AlphaPocket` | Offline audio note transcriber & micro logger | Interactive Port | M1 |
| 32 | `AlphaPrompt` | Interactive prompt engineering studio | Interactive Port | M1 |
| 33 | `AlphaRequirements` | Python package dependency audit & scanner | Interactive Port (Existing) | M1 |
| 34 | `AlphaScraper` | Web scraping rules engine & HTML parser | Interactive Port | M1 |
| 35 | `AlphaSims` | Text-based life simulator & sandbox | Interactive Port | M1 |
| 36 | `AlphaSkills` | Antigravity skill package builder | Interactive Port | M1 |
| 37 | `AlphaSync` | Real-time filesystem watcher & sync | Placeholder | M1 |
| 38 | `AlphaTMOHS1` | T-Mobile High-Speed Internet Gateway tool | Placeholder | M1 |
| 39 | `AlphaTWRP` | TWRP recovery device tree generator | Placeholder | M1 |
| 40 | `AlphaVoice` | Low-latency voice activity detector | Placeholder | M1 |
| 41 | `AlphaWallet` | Cryptocurrency wallet tracker simulation | Interactive Port | M1 |
| 42 | `AlphaWeapon` | Adversarial payload generator simulation | Interactive Port | M1 |
| 43 | `AndroidAlpha` | Android device management suite | Placeholder | M1 |
| 44 | `ApocalypticAlpha` | Survival RPG game core & narrative engine | Placeholder | M1 |
| 45 | `AudioAlpha` | Audio processing engine & signal filter | Placeholder | M1 |
| 46 | `bR0k3nC0Re` | System crash analyzer & core dump inspector | Placeholder | M1 |
| 47 | `DiniVapePro` | Smart vaping hardware firmware flasher | Placeholder | M1 |
| 48 | `Fentanyl Research` | Research document database & safety protocol | Interactive Port | M1 |
| 49 | `ForbiddenArchive` | Encrypted document archive & stealth vault | Placeholder | M1 |
| 50 | `JCAC10003` | Custom Android build script & TWRP packager | Placeholder | M1 |
| 51 | `LiveAPI` | Real-time streaming API gateway & Gemini Live | Placeholder | M1 |
| 52 | `OGAD` | Stable Diffusion GGUF model quantization tool | Interactive Port | M1 |
| 53 | `OpenWebUI` | Self-hosted web UI frontend for local LLMs | Placeholder | M1 |
| 54 | `ReelDeep` | Deepfake detection benchmark dataset tool | Interactive Port | M1 |
| 55 | `RoleplayAlpha` | SillyTavern/Roleplay backend plugin | Placeholder | M1 |
| 56 | `SillyTavern` | LLM roleplay character card creator | Interactive Port | M1 |
| 57 | `TripleAlpha` | Triple-redundant AI reasoning engine | Interactive Port | M1 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Bulk Web Component Generation | Implement 55 remaining web components in `src/ports/` (20 new interactive ports + 35 styled Cyberpunk placeholders) adhering to `PortComponentContract` & configure eager glob auto-registry in `src/ports/index.js` | Rescan complete | IN_PROGRESS |
| M2 | Subroutines Page Cyberpunk UX & Auth | Update Subroutines directory UI with Cyberpunk aesthetic, search, alpha sorting, domain filters, timeline view, auth/pincode protection, and workspace takeover return transition | M1 | PLANNED |
| M3 | Verification & Audit | Programmatic Node.js audit script (`scripts/audit_subroutines_coverage.js`) checking 100% catalog coverage, `npm run build` local verification, and finalized fallback summary report | M1, M2 | PLANNED |

## Interface Contracts
### `PortComponentContract` (`src/ports/port-contract.js`)
- `id`: string (starts with `port-`)
- `name`: string
- `category`: string (Hardware, AI/ML, Security, Mobile, Audio, System, Network, Simulation, Data, Utilities, Crypto, Reverse Engineering)
- `version`: string
- `description`: string
- `pythonSourcePath`: string
- `render(container, options)`: returns `{ destroy: Function, update?: Function }`
- `execute(params)`: returns `Promise<{ success: boolean, output: string, details?: Object }>`
- `destroy()`: returns `void`

## Code Layout
`src/ports/`
- `index.js` (Eager Glob Auto-Registry using `import.meta.glob('./*/index.js', { eager: true })`)
- `port-contract.js` (Contract validation engine)
- `<projectname>/index.js` (Component exports for each of the 57 projects)
`src/pages/subroutines.js` (or `subroutines.html` / subroutines UI module)
`scripts/audit_subroutines_coverage.js` (Coverage & build audit script)
