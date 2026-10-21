/**
 * AlphaCore Changelog & System Evolution Page
 * Comprehensive release history, version documentation, and interactive status tracking.
 * Mobile-optimized with clean touch targets and filterable entries.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

const CHANGELOG_DATA = [
  {
    version: 'v5.3.0 BUILD 200',
    date: '2026.10.21',
    badge: 'REAL-TIME SYNTHESIS ACCELERATION // SDXL-LIGHTNING, IP-ADAPTER & REGIONAL PROMPTING',
    badgeColor: '#f59e0b',
    title: 'SDXL-LIGHTNING 4-STEP REAL-TIME ENGINE, FREEU V2, DEEPCACHE, AOT TORCH.COMPILE WARMUP, IP-ADAPTER & REGIONAL PROMPTING MATRIX',
    summary: 'Major Modal GPU pipeline and Studio Matrix upgrade introducing sub-second 4-step SDXL-Lightning synthesis with fused LoRA weights and trailing Euler scheduling, Native Diffusers FreeU V2 structure coherence, DeepCache feature caching, AOT torch.compile graph compilation during container spin-up (@modal.enter), dual-mode IP-Adapter Image Prompting (Standard Style & ViT-H Face Identity Lock), and Masked Cross-Attention Regional Prompting across spatial split layouts.',
    changes: [
      'SDXL-Lightning 4-Step Real-Time Engine: Integrated ByteDance/SDXL-Lightning (sdxl_lightning_4step_lora.safetensors) directly fused into the SDXL pipeline with EulerDiscreteScheduler(timestep_spacing="trailing"), executing real-time synthesis at num_inference_steps=4 and guidance_scale=0.0.',
      'FreeU V2 & DeepCache Acceleration: Enabled Native Diffusers FreeU V2 structure coherence (s1=0.9, s2=0.2, b1=1.3, b2=1.4) alongside DeepCacheSDHelper (cache_interval=2) across SDXL pipelines to maximize high-frequency detail retention while slashing U-Net compute.',
      'AOT Torch.Compile & @modal.enter() Cold-Start Warmup: Wrapped U-Net and VAE in torch.channels_last memory format and compiled the U-Net with torch.compile(mode="reduce-overhead", fullgraph=True). Engineered an automatic 4-step dummy warmup pass inside @modal.enter() so CUDA graph compilation finishes during container spin-up rather than timing out on the first user request.',
      'IP-Adapter Integration (Image Prompting): Added full Cross-Attention visual reference injection supporting both Standard Style & Composition transfer (ip-adapter_sdxl.bin) and Face / Character Identity Lock (ip-adapter-plus-face_sdxl_vit-h.bin) with Vault and device upload controls.',
      'Regional Prompting (Masked Cross-Attention Matrix): Engineered custom RegionalAttnProcessor2_0 wrapping U-Net Cross-Attention (attn2) layers with Gaussian-feathered spatial masks across 5 preset split layouts (Left/Right, Top/Bottom, 3-Column, Center Subject + Background, and 4-Quadrants) with adjustable Base Prompt Blend ratio.',
      'POST Streaming Transport Upgrade: Upgraded Modal web_txt2img SSE endpoints to accept POST /stream and POST / payloads (JSON and multipart FormData) alongside GET /stream, enabling multi-megabyte base64 IP-Adapter and ControlNet conditioning payloads without URL length limits.'
    ]
  },
  {
    version: 'v5.2.4 BUILD 195',
    date: '2026.10.17',
    badge: 'CYBER BOOT REVOLUTION // VIDEO & CANVAS VISUALIZER MATRIX',
    badgeColor: '#00ffcc',
    title: 'ALPHACORE TECH STARTUP VIDEO SCREEN, LEGAL DISCLAIMER MODAL & REAL-TIME AUDIO VISUALIZER TERMINAL',
    summary: 'Integrated full cinematic cyber boot sequence directly into AlphaCoreTech: interactive Touch-To-Start prompt, fullscreen terminal.mp4 video with typewriter title & telemetry stage progress bar, auto-advancing golden Legal Disclaimer modal, and classic AlphaCore Secure Access PinPad backed by real-time audio-reactive Canvas visualizer and Login_background.wav ambient stream.',
    changes: [
      'AlphaCore Video Boot Sequence: Integrated fullscreen /terminal.mp4 video with glowing Alpha Wolf logo, typewriter title ("◢ ALPHACORE TECH ◣"), and telemetry progress bar cycling through real-time kernel stages (INITIALISING NEURAL MATRIX -> READY).',
      'Legal Disclaimer Modal: Cybernetic legal disclaimer dialog with gold borders (#AA8800), wolf logo, warning header, formal operator responsibility clause, and manual "■ I UNDERSTAND – PROCEED" override.',
      'Audio-Reactive Canvas Visualizer: Built native HTML5 canvas visualizer port drawing real-time cyan/red corner radar dials, spanning central oscilloscope waveform, background grid data stream, vertical sweep scanline, and bottom frequency spectrum equalizers.',
      'Restored Classic AlphaCore PinPad: Preserved the beloved iconic AlphaCore keypad layout with native numeric synchronization, bypass trigger, and request access features.'
    ]
  },
  {
    version: 'v5.2.2 BUILD 193',
    date: '2026.10.17',
    badge: 'KERNEL PANIC BREACH PROTOCOL // UNIVERSAL GUEST & ROLE HARDENING',
    badgeColor: '#ff003c',
    title: 'KERNEL CRASH OVERLOAD SIMULATION FOR UNAUTHORIZED OPERATIONS, STRICT COGNITIVE CORE GUEST GATING & ROLE-BASED ROUTE LOCKDOWN',
    summary: 'Hardened system-wide permission enforcement triggering the cracked-screen kernel overload and panic reboot sequence (triggerBypassOverloadSequence) whenever guests or registered operators attempt unauthorized operations or restricted route navigation. Enforced strict Cognitive Core lockout for guest preview mode while preserving CPU endpoints (DSP-Fast 4x neural upscaler) for open preview.',
    changes: [
      'Universal Kernel Crash Overload Sequence: Gated all forbidden operations to trigger the cracked-screen kernel overload sequence (triggerBypassOverloadSequence), engaging the 5-second red cracked glass canvas fracture, audio bypass alarm, overload progress bar, and 404 KERNEL PANIC reboot screen.',
      'Strict Guest Cognitive Core Lockdown: Completely barred guest preview sessions from executing transmissions, voice mic streams, live neural bridge connections, or file attachments in Cognitive Core (/cognitive, /promptlab), triggering immediate kernel crash sequence on invocation or route navigation.',
      'Role-Based Route Interception: Hardened router canNavigateTo() to intercept unauthorized page transitions (guests accessing /recon, /mugshots, /admin, /vault, or /placeholder; non-admin operators accessing /admin or /logs; non-vault operators accessing /vault; unauthorized operators accessing /placeholder), immediately aborting navigation into kernel panic.',
      'Execution Privilege Enforcement: Gated all GPU-intensive modal synthesis actions (Txt2Img, Stream Generation, Img2Img, OmniGen, Txt2Vid, Img2Vid, Vid2Audio, ControlNet Preprocessors, Ace-Step Music, and RVC Voice Cloner) behind generate_authenticated clearance with kernel crash triggering on unauthenticated execution, while preserving client-side CPU endpoints (dsp-fast 4x upscaler).'
    ]
  },
  {
    version: 'v5.2.1 BUILD 192',
    date: '2026.10.17',
    badge: 'STRIPE LINK PAYMENT GATEWAY, GUEST GPU GATING & PROTOCOL HARDENING',
    badgeColor: '#10b981',
    title: 'STRIPE LINK ATM DEPOSITS, STRICT GUEST GPU ENDPOINT GATING, ACCESS FORM RESTRUCTURE & INSTRUCTION CLEAN-UP',
    summary: 'Security and infrastructure patch introducing full Stripe Link and Cash App instant payment processing in Sector 7 Laundromat ATM, strict endpoint gating blocking guest users from dispatching GPU Modal pipelines while preserving client-side DSP upscaling, resolution of Request Access modal CSS flex layouts, and complete purge of legacy vLLM instruction stripping logic.',
    changes: [
      'Stripe Link & Cash App Instant Processing: Activated Link in backend Stripe PaymentIntent creation with automatic payment methods support. Eliminated premature 500ms timeout in ATM card insertion, properly mounting Stripe Payment Element and processing confirmation with required redirect return parameters.',
      'Strict Guest GPU Endpoint Gating: Blocked unauthenticated guest users from triggering high-cost GPU Modal pipelines across Txt2Img streaming, Neural/Tile Upscalers, ControlNet preprocessors, Ace-Step Music, and Voice Cloning, routing unauthenticated attempts to the PIN login modal while keeping client-side DSP 4x upscaling available without login.',
      'Request Access Layout Correction: Fixed flex-direction column layout on Request Access profile modal to eliminate horizontal layout overlapping and ensure clean form presentation.',
      'AlphaCore Instruction Clean-Up: Removed obsolete stripAlphaCoreInstructionForVllm logic and exports following direct instruction stripping in source, streamlining vLLM system instruction initialization.'
    ]
  },
  {
    version: 'v5.2.0 BUILD 190',
    date: '2026.10.17',
    badge: 'COMIC BOOK ENGINE // SUPABASE REALTIME PERSISTENCE & ASSET LOCKING',
    badgeColor: '#00e5ff',
    title: 'SEQUENTIAL COMIC BOOK GENERATOR, SUPABASE CROSS-DEVICE PERSISTENCE & ASSET REINFORCEMENT',
    summary: 'Major system upgrade introducing an interactive Comic Mode with sequential multi-page comic book generation in Txt2Img, full cross-device state persistence powered by Supabase Realtime (synchronizing PIN access, system settings, endpoint URLs, and operative chat history), model catalog consolidation standardizing on RealVisXL V5.0, and hardened AssetSync deduplication with manifest version locking.',
    changes: [
      'Comic Mode & Multi-Page Comic Book Generator: Added dedicated cybernetic "COMIC MODE" toggle in Txt2Img. Injects comic linework, layout, white speech/thought bubbles, and legible bold black lettering, coupled with negative prompt filtering to suppress pseudo-gibberish text. When batch size > 1, chronologically orchestrates sequential multi-page comic books (Page 1 establishing shot, dialogue confrontation escalation, dramatic finale/cliffhanger ending) with interactive "📖 COMIC BOOK // PAGE X OF Y" navigation.',
      'Supabase Cross-Device Persistence & Realtime Mesh: Integrated direct cloud substrate sync via Supabase PostgreSQL tables (alphacore_pins, alphacore_settings, alphacore_chat) with Row Level Security (RLS) policies. PIN modifications, role permissions, custom Modal endpoint URLs, and system settings instantly propagate to all active operative devices via websocket channels.',
      'Cognitive Core Supabase Chat Synchrony: Cognitive uplink chat history seamlessly persists and streams in real time across operative devices. Global Comm Link and Private Uplink threads load from the cloud substrate with graceful fallback to Express/Netlify APIs and encrypted localStorage.',
      'Model Catalog Consolidation & Legacy Purge: Completely purged legacy Realistic Vision V6.0 B1 (Model 4201) across Modal deployment volumes and frontend selectors, establishing RealVisXL V5.0 (Model 139562) as the unified photorealistic SDXL checkpoint.',
      'AssetSync Deduplication & Version Locking: Hardened Modal AssetSync upstream update detection with base architecture family consistency checks (SDXL, Pony, NoobAI, SD1.5) and published version validation. Implemented atomic .tmp file staging and persistent models_manifest.json version locking to permanently eliminate redundant re-downloads.',
      'Cognitive Core vLLM Server Integration: Embedded the 12B Vision-Language engine (nicklas373/Huihui-gemma-4-12B-it-abliterated-AWQ) into deploy.py under the label "cognitive core" (universal priority instance on Modal T4, no _eco endpoint required). Wired seamless streaming chat with automatic protocol management to optimize context length.',
      'Endpoint Rewire: Synced Neural Upscaler (standard + Tile Creative routes), Cognitive Core, and status endpoints to the live Modal deployment URLs across config.json, aimodals and cognitive pages.',
      'Configuration & Environment Hygiene: Supabase credentials, master Gemini key, and Facebook scraper credentials moved out of source into .env (VITE_* vars for the client; FB_* for the scraper). Removed duplicate root config.json; public/config.json is canonical.',
      'Workspace Cleanup: Centralized all tests and test-setup.js in src/tests, untracked build output dist/, purged __pycache__ and one-off scripts, and added AlphaLive and JCAC10003 port entry points (index.js).'
    ]
  },
  {
    version: 'v5.1.0 BUILD 185',
    date: '2026.10.17',
    badge: 'CORE MATRIX REVISION // MOBILE HUD, COIN CHANGER & STUDIO OVERHAUL',
    badgeColor: '#00ff8c',
    title: 'MOBILE PORTRAIT HUD, SECTOR 7 COIN CHANGER SPLIT, COGNITIVE MATRIX MESH & STUDIO STREAMLINING',
    summary: 'Comprehensive system-wide overhaul delivering optimized mobile portrait navigation and PWA dark maskable icons, Sector 7 Laundromat and Hardware Coin Changer separation with multi-stage payment and simulation bypass, Cognitive Core peer-to-peer matrix mesh with live presence indicators and automated Vault archiving, Studio Matrix pipeline consolidation with OmniGen integrated into Img2Img, Civitai quick LoRA injection management, full-featured Cyber Synthesizer Music workstation, and fine-grained administrative security governance.',
    changes: [
      'Mobile Portrait Shell & HUD: Native 1-9 PIN pad layout with dedicated bottom row (CLR, 0, ⌫) and subtle Request Access trigger; centered Fast Boot skip button; non-scrolling multi-column sidebar layout; and PWA dark maskable application icons.',
      'Sector 7 Laundromat & ATM: Added 5-second auto-proceeding Under Development disclaimer; restricted accounts balance inspector strictly to administrator clearance; unified token nomenclature to Matrix Tokens ($1.00 = 4 Matrix Tokens); added source routing matrix; and subtle Donate confirmation modal.',
      'Hardware Coin Changer Split: Separated the Coin Changer into a dedicated second-stage experience with bank clearance notices (2 business days); instant debit payouts; and a "Sneak into the Laundromat" simulation bypass (+12 tokens).',
      'Cognitive Core Peer-to-Peer Matrix Mesh: Cybernetic HUD icons for mic and attachments; collapsible HUD dock for Eco Mode and audio toggles; auto-expanding prompt input box without scrollbars; peer-to-peer chat on Global Comm Link without AI triggering (reserving Live Link strictly for Alpha AI); and live multi-operative presence indicators (active authorized operators).',
      'Private Uplink & Security Hardening: Personal API key gating on Private Uplink with direct AI Studio key generator routing; renamed config parameter to global master comlink API key; and automated Vault archiving for all chat media attachments.',
      'Studio Matrix OmniGen Consolidation: Merged OmniGen multimodal matrix directly into Img2Img Fabricator; eliminated redundant sidebar buttons; and preserved full multi-image conditioning.',
      'Civitai Quick-Injector & Asset Hub: Added separate Civitai LoRA Injection List supporting up to 3 concurrent active injections for authenticated non-guest profiles; embedded Civitai model explorer; removed legacy volume browser; and added cybernetic parameter tooltips.',
      'Subroutines & System Evolution: Removed obsolete OS profile button; set Launch Workspace to open remote web ports in clean new tabs; and renamed sidebar Diagnostics to Chronological Evolution.',
      'Administration & Event Logging: Fine-grained per-profile access permissions; custom access PIN assignments with "Require new PIN reset on next entry"; removed Impersonate function; renamed Roles tab to Access; removed deprecated persona and stealth sliders from Classified Directives; and unified Media Logs capturing user prompt invocations across all backend endpoints.',
      'Cyber Synthesizer Music Studio: Overhauled Music Generator into a complete composition workstation featuring genre presets, mood matrices, BPM/duration controls, and real-time generation.',
      'Voice Cloner Clean-up: Purged hardcoded mock voice profiles from RVC Voice Cloner to display only authenticated user voice profiles.',
      'Civitai Model Asset Sync & Checkpoint Catalog: Upgraded base checkpoints, integrated Realistic Vision V6.0 B1 (Model 4201), CyberRealistic Pony V18 (Model 443821), and RealVisXL V5.0 (Model 139562) across AssetSync, Txt2Img, Img2Img, and Hyper-Generation matrices.',
      'Watermark & Scanline Line Artifact Neutralization: Disabled diffusers invisible-watermark on SDXL generation pipelines and stripped container repeating linear gradients behind rendered image viewports to permanently eliminate horizontal watermark lines.'
    ]
  },
  {
    version: 'v5.0.0 BUILD 175',
    date: '2026.09.12',
    badge: 'ADVANCED AI SYNTHESIS // 6-ARCHITECTURE SUITE',
    badgeColor: '#a855f7',
    title: 'ADVANCED AI SYNTHESIS SUITE, MULTIMODAL MATRIX & INPAINTING CANVAS',
    summary: 'Major architectural expansion integrating 6 advanced generative AI pipelines into AlphaCore Tech: OmniGen unified multimodal engine with multi-image conditioning, SDXL Native Img2Img with curated 7-checkpoint catalog, FLUX.1-Fill inpainting with an interactive HTML5 canvas masking tool, SDXL ControlNet Tile creative upscaling with seamless cosine feathering, CosXL natural language instruction editing with EDM VPred, and Stable Diffusion 3.5 Large MMDiT with triple text encoders. Backed by dual-tier (Priority vs Economy) serverless infrastructure and universal 1-click Save to Vault.',
    changes: [
      'OmniGen (BAAI) Unified Multimodal Engine: Dedicated multimodal synthesis panel with 3 reference image dropzones, status badges, token pills (<img><|image_X|></img>), real-time SSE streaming, and natural language multi-image editing.',
      'SDXL Native Img2Img (The Stylistic Engine): Integrated Native SDXL pipeline with a curated checkpoint dropdown catalog (EpicRealism PureFix, Realistic Freedom, Juggernaut XL Ragnarok, CyberRealistic, DreamShaper Alpha), custom denoising slider (0.05-1.0), and guidance controls.',
      'FLUX.1-Fill Inpainting HTML5 Canvas: Interactive, responsive canvas masking tool directly overlaid on source images with variable brush sizes, precision eraser, invert mask, clear canvas, live coverage calculator, and native-resolution base64 PNG export.',
      'ControlNet Tile Creative Upscaling: Added SDXL ControlNet Tile mode with uniform tile chunking (512, 768, 1024 px), seam overlap ratios (12.5%, 25%, 50%), creative diffusion slider (0.05-0.95), and micro-detail conditioning prompts with cosine-feathered seamless blending.',
      'CosXL Edit (Instruction-Tuned SDXL): Stability AI cosxl_edit integration featuring natural language commands ("Turn into cyberpunk", "Make it rainy night", "Pencil sketch", "Neon vaporwave", "Oil painting") with EDM VPred scheduling and image guidance scaling.',
      'Stable Diffusion 3.5 Large (Img2Img MMDiT): Integrated SD 3.5 Large multimodal diffusion transformer architecture with triple text encoders (including T5-XXL) for extreme prompt adherence in image-to-image synthesis.',
      'Dual-Tier Infrastructure & Economy Enforcement: Strict profile-aware routing across High-Performance Priority (H100 / L40S) and Public Economy (60s scaledown, 1 max container) for all new synthesis endpoints.',
      'Universal Vault & Gallery Integration: 1-click Save to Vault and gallery persistence for all synthesized outputs across all 6 architectures.'
    ]
  },
  {
    version: 'v4.9.2 BUILD 160',
    date: '2026.09.12',
    badge: 'CONTROLNET FORGE // MULTI-MODAL MATRIX & REPOSITORY',
    badgeColor: '#06b6d4',
    title: 'UNIVERSAL CONTROLNET DISPATCH & ADVANCED REPOSITORY MANAGEMENT',
    summary: 'Completely overhauled ControlNet Preprocessor Forge and engine-wide conditioning: Expanded CN Forge to dispatch vision maps to all generative modals (Txt2Img, Img2Img, Upscaler, Txt2Vid, Img2Vid, Framepack), integrated optional 1-click Vault & Vision DB map persistence, and added unified ControlNet management sections inside Advanced Parameters with interactive repository pickers.',
    changes: [
      'Engineered multi-modal dispatch matrix in CN Forge: Generative maps can be routed with a single click to Txt2Img, Img2Img, Upscaler, Txt2Vid, Img2Vid, and Framepack.',
      'Added optional `SAVE TO VAULT` and `DOWNLOAD MAP` capabilities in CN Forge to persist generated edge/skeleton/depth maps to encrypted localStorage Vault and IndexedDB AlphaCoreVisionDB.',
      'Added `LOAD FROM VAULT` base image loader in CN Forge, allowing users to select any existing artifact from storage to pre-process into a ControlNet map.',
      'Added dedicated ControlNet Management sections in Advanced Parameters across Txt2Img, Img2Img, Txt2Vid, and Img2Vid modals with live status indicators, thumbnail previews, and conditioning scale/strength sliders.',
      'Built interactive `openControlNetVaultPicker` modal featuring real-time filtering between all stored artifacts and tagged ControlNet maps from Vault and Gallery.',
      'Added custom map file upload and 1-click `CLEAR` controls to quickly reset active conditioning across the entire engine.',
      'Added `CONTROLNET` quick-action button on generated image result cards to immediately route newly synthesized images into ControlNet Forge.',
      'Cleaned up obsolete and duplicate ControlNet containers across `aimodals.js`.'
    ]
  },
  {
    version: 'v4.9.1 BUILD 155',
    date: '2026.09.12',
    badge: 'COGNITIVE CORE // ALPHACORE PROTOCOL',
    badgeColor: '#00ff8c',
    title: 'COGNITIVE CORE // ALPHACORE SYSTEM INSTRUCTION ENFORCEMENT',
    summary: 'Integrated universal AlphaCore Programming system instruction directly into Gemini Cognitive Core: Added toggleable AlphaCore protocol injection for Private Uplink communications, and permanently enforced AlphaCore instruction on the Shared Global Comm Link with zero option to modify or bypass.',
    changes: [
      'Engineered `src/components/alphacore_instruction.js` encapsulating full AlphaCore Programming v4.0 protocols, behavioral directives, dynamic emotional spectrum, and persona definitions.',
      'Added interactive `ALPHA PROTOCOL` toggle button on the Cognitive Core chat controls header for Private Uplink communications with persistent per-profile localStorage state.',
      'Hardened Global Comm Link (`#/cognitive` Shared Matrix) to default and permanently enforce AlphaCore system instruction with locked UI controls (`🔒 ALPHA PROTOCOL: ENFORCED`) and non-bypassable payload injection.',
      'Wired `systemInstruction` directly into Gemini 2.5 Flash streaming API payload (`streamGenerateContent`).',
      'Dynamic persona adaptation: Model message prefix, status bar, and channel title automatically synchronize between `[ALPHA]` and `[GEMINI]` states.'
    ]
  },
  {
    version: 'v4.9.0 BUILD 150',
    date: '2026.09.12',
    badge: 'DUAL-TIER DEPLOYMENT // PRIORITY & ECONOMY',
    badgeColor: '#10b981',
    title: 'DUAL-TIER CLOUD INFRASTRUCTURE & BUDGET ENFORCEMENT',
    summary: 'Upgraded Modal cloud backend and frontend routing into a dual-tier architecture: High-Performance Priority (H100 / L40S warm instances) reserved exclusively for elevated administrative clearance, and Public Economy (T4 / A10G / L40S with 60s auto-scaledown and strict max 1 container cap) for all public users and guests to eliminate idle costs.',
    changes: [
      'Engineered complete dual-tier backend duplication across `deployment.py` and all 9 worker modules (`txt2img.py`, `img2img.py`, `txt2vid.py`, `img2vid.py`, `framepack.py`, `preprocessors.py`, `upscaler.py`, `music.py`, and `cloner.py`).',
      'Configured Economy Tier services (`Txt2Img_Eco`, `Img2Img_Eco`, `ControlNet_Preprocessor_Eco`, `Txt2Vid_Eco`, `Img2Vid_Eco`, `FramePack_Eco`, `Upscaler_Eco`, `MusicGen_Eco`, `AlphaCore_Main_API_Eco`) with minimum functional GPUs (T4 for Preprocessors & Upscaling; A10G for SDXL & Music; L40S for Wan 2.2 & Flux).',
      'Enforced strict cost bounds on all Economy endpoints: `scaledown_window=60` (auto-sleep after 60s idle) and `max_containers=1` (strict concurrency cap preventing runaway bills).',
      'Preserved High-Performance Priority endpoints on high-performance H100 and L40S GPU nodes with extended warm scaledown (600s) for ultra-low latency generation.',
      'Implemented profile-aware frontend routing in `aimodals.js`: Guests and standard users are securely locked to Economy endpoints; administrative profiles access priority warm infrastructure.',
      'Wired profile-aware dual routing across `voicecloner.js`, `music.js`, and `assets.js`, with dynamic hardware badges and tier indicators.',
      'Updated Administration console (`#/admin`) with dual-tier status indicators and architectural overview.',
      'Deployed live to Modal under `alphacore-aio-backend` with all 9 dual endpoints verified operational.'
    ]
  },
  {
    version: 'v4.8.0 BUILD 142',
    date: '2026.09.12',
    badge: 'NEURAL SUPER-RESOLUTION & CLOUD UPSCALE',
    badgeColor: '#38bdf8',
    title: 'AI MODALS // NEURAL UPSCALER & A10G SUPER-RES',
    summary: 'Engineered and launched the Neural Upscaler AI modal on Modal A10G infrastructure. Delivers 2x, 4x, and 8x super-resolution, artifact suppression, interactive before/after split comparison slider, and high-frequency edge enhancement.',
    changes: [
      'Engineered `scripts/upscaler.py` powered by pure PyTorch RRDBNet neural architecture with seamless tile-based inference supporting multi-gigapixel inputs without memory limits.',
      'Configured multi-model support: RealESRGAN x4plus (Photorealism), RealESRGAN Anime 6B (Digital Art & Lineart), 4x-UltraSharp (Crisp Textures), and Fast Adaptive DSP (Lanczos resampling).',
      'Exposed live Modal backend endpoints: `GET /api/upscale/status` and `POST /api/upscale` on `AlphaCore_Main_API`, plus standalone endpoint `Upscaler.web_upscale`.',
      'Integrated dedicated `UPSCALER` tab into AI Modals (`#/aimodals` and `#/upscaler`) with drag & drop upload, clipboard paste, and automatic resolution calculation.',
      'Built interactive Before/After Comparison Split Slider allowing real-time dragging between original and super-resolved outputs.',
      'Added 1-click `🔍 UPSCALE` pipeline shortcut from Txt2Img and Img2Img generation result panels.',
      'Implemented instant client-side Canvas DSP supersampling with unsharp convolution as a zero-latency fallback.'
    ]
  },
  {
    version: 'v4.7.0 BUILD 135',
    date: '2026.09.12',
    badge: 'AUTONOMOUS VOLUME SYNC & CLOUD RE-ALIGNMENT',
    badgeColor: '#00ff66',
    title: 'MODAL VOLUME SYNC, CIVITAI ENGINE & SCRAPER V2',
    summary: 'Engineered an autonomous CivitAI volume synchronization engine on Modal, migrated and auto-healed all backend API routes under the primary cloud namespace, overhauled the high-velocity custody scraper, and hardened serverless ML pipelines.',
    changes: [
      'Engineered `sync_website_models` in `deployment.py`: Automatically scans the `/hf-hub-cache` Modal volume for all 7 website SDXL checkpoints and 8 curated LoRAs, downloading missing models directly from CivitAI with API authentication.',
      'Implemented smart variant/alias linking and stale `.tmp` cleanup to prevent redundant multi-gigabyte downloads across volume lifecycles.',
      'Exposed dual execution vectors for model synchronization: local CLI entrypoint (`modal run deployment.py`) and remote authenticated REST trigger (`POST /api/assets/sync-website-models`).',
      'Migrated entire serverless backend infrastructure to the unified cloud namespace across `aimodals.js`, `mugshots.js`, `admin.js`, `assets.js`, `music.js`, `server.js`, and `main.go`.',
      'Implemented intelligent client-side endpoint auto-healing in `aimodals.js` and `mugshots.js` to automatically sanitize and upgrade legacy `localStorage` configs.',
      'Overhauled `scripts/scraper.py` into a resilient, session-pooled booking intelligence pipeline delivering sub-8-second arrest record ingestion directly into Local Custody (`#/mugshots`).',
      'Hardened worker container isolation and dependencies in `deployment.py` to eliminate worker module collisions.'
    ]
  },
  {
    version: 'v4.6.0 BUILD 124',
    date: '2026.08.18',
    badge: 'CRIME INTEL & GRAPH API',
    badgeColor: '#ef4444',
    title: 'LOCAL CUSTODY FEED & MUGSHOT DOSSIERS',
    summary: 'Built and integrated a live Facebook Graph API Crime & Arrest Feed (`#/mugshots`) specifically tailored for FanninCountyCrime with rate-limit compliance, intelligent offender parsing, and local vault exports.',
    changes: [
      'Implemented Meta Graph API client querying `FanninCountyCrime` posts, photos, narratives, and booking timestamps.',
      'Built intelligent regex parser extracting offender full names (displayed prominently under photos), booking dates, offense category badges (Felony, Misdemeanor, DUI, Warrant), and bond amounts.',
      'Enforced Meta API Rate Limit budget compliance (200 calls/hr max) with persistent `localStorage` caching and configurable background auto-sync timers (15m/30m/1h).',
      'Added interactive Search, Category Filter, and Sorting controls for quick dossier lookups.',
      'Built Dossier Detail Modal featuring high-res mugshot photos, complete police blotter narratives, direct Facebook post links, and a `SAVE TO VAULT` button (enabling instant Vault RAG querying in Cognitive Core).',
      'Added Demo Intel offline fallback records for instant UI preview prior to Graph API token configuration.',
      'Registered `🚨 Local Custody` route (`#/mugshots`) in `src/main.js` and sidebar navigation in `index.html`.'
    ]
  },
  {
    version: 'v4.5.0 BUILD 118',
    date: '2026.08.18',
    badge: 'GEMINI API REWIRE',
    badgeColor: '#a855f7',
    title: 'COGNITIVE ENGINE & MOBILE VIDEO',
    summary: 'Completely overhauled the Cognitive Engine to stream natively from the Gemini 2.5 API using local API keys, and patched global video playback for iOS/Mobile devices.',
    changes: [
      'Rewired `cognitive.js` from Modal cloud to a direct client-to-model Gemini API architecture.',
      'Added per-profile, secure `localStorage` API Key injection and management.',
      'Implemented Multimodal Image and File attachments directly into the Cognitive Chat.',
      'Built Vault RAG connection: Injects your Vault text files directly into the Gemini context.',
      'Added local Voice IO: Speech Recognition (Microphone) and Text-To-Speech (TTS) response generation.',
      'Added Thread Management: Users can spawn multiple discrete chat sessions that save locally.',
      'Patched all video previews across the Vault and Image/Video Synthesis pages to include `playsinline`, fixing an issue where they would not auto-play on iOS Safari.'
    ]
  },
  {
    version: 'v4.4.1 BUILD 112',
    date: '2026.08.17',
    badge: 'HOTFIX & UI POLISH',
    badgeColor: '#06b6d4',
    title: 'RESPONSIVE SWEEP & EASTER EGG REFACTOR',
    summary: 'Executed a comprehensive sweep of all new modules to ensure perfect mobile layout responsiveness, overhauled the guest login sequence, and completely refactored the system easter eggs for security and fun.',
    changes: [
      'Refactored the root bootup PIN pad: The standard Guest button was purged. The `[SYSTEM BYPASS]` button now serves as a dynamic, cinematic guest-login sequence on the root screen.',
      'Audited and patched mobile responsive layouts across the new Recon Dossier (`#/recon`) and Voice Synthesis (`#/voice`) modules to ensure perfect single-column stacking on smaller viewports.',
      'Hardened the Konami Code keyboard handler to strictly serve as a safe Synthwave UI Aesthetic Override.',
      'Integrated the "White Rabbit" interactive HUD sequence into the Overview dashboard.',
      'Granted a unique operational reward for finding the HUD sequence: Guests who trigger it receive a temporary preview session token for the Voice Cloner without exposing private data.'
    ]
  },
  {
    version: 'v4.4 BUILD 110',
    date: '2026.08.17',
    badge: 'MAJOR UPDATE',
    badgeColor: '#00ff64',
    title: 'LIVE GENERATIVE BACKENDS, KERNEL OVERLOAD PROTOCOL & SYSTEM PURGE',
    summary: 'Wired up live Server-Sent Events (SSE) backend proxies for all generative AI, deployed a kernel reset overload protocol, replaced legacy tools with new Recon & Voice Cloner modules, and purged all remaining simulated frontend loops.',
    changes: [
      'Integrated real `server.js` SSE (Server-Sent Events) proxies for all generative AI modals (Text-to-Image, Image-to-Image, Text-to-Video).',
      'Systematically audited and implemented strict global Guest-Mode lockouts across Voice Cloner, Event Logs, Vault, Admin Panel, and administrative profiles.',
      'Deployed a universal `[SYSTEM RESET]` sequence across lockouts that simulates a kernel overload, resets temporary state, and reboots the interface.',
      'Replaced the deprecated Analytics page with a dynamic Autonomous Reconnaissance & Dossier dashboard (`#/recon`).',
      'Replaced the deprecated CLI Terminal page with an integrated Voice Cloner suite (`#/voice`).',
      'Purged all simulated frontend-only elements (Subroutines batch loops, Network Matrix telemetry) in preparation for live backend API data.'
    ]
  },
  {
    version: 'v4.3 BUILD 102',
    date: '2026.08.16',
    badge: 'LATEST MILESTONE',
    badgeColor: '#ff007f',
    title: 'AI PROMPT ENHANCER, LIVE VLLM COGNITIVE CORE & GUEST PREVIEW SYSTEM',
    summary: 'Major release featuring the new AI Prompt Enhancer, live Modal VLLM Gemma Cognitive Core, sitewide Guest Preview system, music-reactive visual animations, and cyberpunk aesthetic polish.',
    changes: [
      'Rebuilt Prompt Lab into an interactive AI Prompt Enhancer & Master Matrix Generator (`#/promptlab`) with artistic style presets and negative prompt generators.',
      'Unlocked live Cognitive Core (`#/cognitive`) connecting directly to the Modal VLLM Gemma AI Agent backend.',
      'Deployed sitewide Guest Mode preview banners and interactive PIN login modal triggers across all pages.',
      'Added Slideshow Auto-advance, ✨ AI ENHANCE button, hyperparameter samplers (Euler, DPM++, DDIM), Denoise, and Aspect Ratio controls to AI Modals (`#/aimodals`).',
      'Engineered Audio-Reactive frequency energy scaling into background matrix rain glow and drop speed.',
      'Completely purged obsolete Mainframe OS links, routes, and port modules.',
      'Updated Framepack Studio to provide direct elevated clearance execution and public preview overlays.',
      'Added high-voltage metal edge sparks, rotating tech gear icons, CRT scanline grid textures, and sidebar RGB text/logo glitch animations.',
      'Implemented an interactive Easter Egg protocol with dynamic UI color palette inversion and aesthetic unlocks.'
    ]
  },
  {
    version: 'v4.2 BUILD 95',
    date: '2026.08.14',
    badge: 'STABLE RELEASE',
    badgeColor: '#38bdf8',
    title: '57 PYTHON SUBROUTINES BULK PORTING & CLIENT VAULT CRYPTO',
    summary: 'Full porting of all 57 Python subroutines, pure browser Web Crypto API integration, client-side hardcoded PIN verification, and bR0k3nC0Re administrative lock.',
    changes: [
      'Ported all 57 Python projects into full-screen takeover web subroutines (`#/subroutines`).',
      'Deployed pure browser Web Crypto API (AES-256-GCM + PBKDF2 100k rounds) for zero-backend ForbiddenArchive vault.',
      'Rebuilt PIN Authentication system to hardcoded client-side verification eliminating backend dependencies.',
      'Locked bR0k3nC0Re remote uplink strictly to administrative clearance profile.',
      'Updated ports registry framework to guarantee seamless dynamic loading across all runtimes.'
    ]
  },
  {
    version: 'v4.1 BUILD 89',
    date: '2026.07.24',
    badge: 'STABLE RELEASE',
    badgeColor: '#10b981',
    title: 'COMPREHENSIVE FEATURE & UI DENSITY UPDATE',
    summary: 'Major platform upgrade adding dense UI controls, CLI terminal, Prompt Lab, System Analytics dashboard, and full mobile optimization.',
    changes: [
      'Added CLI Shell Virtual Kernel Terminal (`#/terminal`) with autocomplete and macro triggers.',
      'Added Prompt Lab & Token Optimizer (`#/promptlab`) with refusal risk scoring and preset injectors.',
      'Added System Analytics Dashboard (`#/analytics`) with live WebGL canvas memory visualizer and storage inspector.',
      'Added Live Event Streaming in System Logs (`#/logs`) with category and severity filters.',
      'Added Audio Narration Synthesis engine in System Lore (`#/lore`).',
      'Enhanced Mobile Responsiveness across all viewports with fluid touch targets and adaptive grid structures.',
      'Added status indicators across header bar, sidebar, and page modules.'
    ]
  },
  {
    version: 'v4.0 BUILD 70',
    date: '2026.06.15',
    badge: 'MAJOR RELEASE',
    badgeColor: '#06b6d4',
    title: 'AUTONOMOUS COGNITIVE COMMAND MATRIX',
    summary: 'Full migration to Contextual Overwrite Paradigm, Modal.run GPU serverless endpoints, and deep generative synthesis suite.',
    changes: [
      'Deployed Modal DeepSeek-R1 14B cognitive reasoning backend.',
      'Integrated SDXL image synthesis and Qwen Edit+ image-to-image pipeline.',
      'Implemented PinPad RBAC authentication system with persistent session verification.',
      'Added Classified Vault databank with 3D WebGL substrate visualizer.',
      'Deployed Matrix Rain background canvas with Eco-Mode throttling toggle.'
    ]
  },
  {
    version: 'v3.2 BUILD 45',
    date: '2026.04.10',
    badge: 'SECURITY UPDATE',
    badgeColor: '#a855f7',
    title: 'OBFUSCATION ENGINE & VAULT SECURITY',
    summary: 'Introduced stenographic visual authentication and encrypted local state persistence.',
    changes: [
      'Implemented AES encrypted storage wrappers for local state.',
      'Deployed Command Palette (`Ctrl+K`) for rapid route switching and theme management.',
      'Added dynamic numeric obfuscation to pinpad verification routines.',
      'Integrated system telemetry HUD with CPU/VRAM load meters.'
    ]
  },
  {
    version: 'v2.0 BUILD 12',
    date: '2026.01.20',
    badge: 'ARCHITECTURAL',
    badgeColor: '#f59e0b',
    title: 'NEURAL SUBSTRATE TRANSITION',
    summary: 'Initial deployment of custom SPA hash router and theme switching protocols.',
    changes: [
      'Replaced static multi-page architecture with dynamic vanilla JS SPA router.',
      'Introduced dark cyberpunk aesthetic design tokens and Orbitron typography.',
      'Added research center paper repository and lore entity briefs.',
      'Configured Netlify build pipeline and static asset directory targets.'
    ]
  },
  {
    version: 'v1.0 INITIAL',
    date: '2025.09.01',
    badge: 'LEGACY',
    badgeColor: '#6b7280',
    title: 'ALPHACORE PROTOCOL GENESIS',
    summary: 'Original prototype foundation establishing core identity and creator access rules.',
    changes: [
      'Core architecture concept formulation by the system engineering team.',
      'Initial baseline safety bypass tests and prompt injection studies.',
      'Creation of initial system assets and minimal brand identity.'
    ]
  }
];

export default function ChangelogPage() {
  const container = createElement('div', { class: 'changelog-page-container' });

  function render(filterQuery = '') {
    const q = filterQuery.toLowerCase().trim();
    const filtered = CHANGELOG_DATA.filter(item => {
      const matchText = item.version.toLowerCase().includes(q) ||
                        item.title.toLowerCase().includes(q) ||
                        item.summary.toLowerCase().includes(q) ||
                        item.changes.some(c => c.toLowerCase().includes(q));
      return matchText;
    });

    let itemsHtml = filtered.map((item, idx) => `
      <div class="panel" style="margin-bottom:20px; background:rgba(10,15,25,0.88); border:1px solid rgba(6,182,212,0.25); padding:18px; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="font-family:'Orbitron',sans-serif; font-size:1.1rem; font-weight:700; color:var(--accent,#06b6d4);">${item.version}</span>
            <span style="font-size:0.7rem; color:${item.badgeColor}; background:rgba(255,255,255,0.05); border:1px solid ${item.badgeColor}; padding:2px 8px; border-radius:3px; font-weight:bold;">
              ${item.badge}
            </span>
          </div>
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#888;">${item.date}</span>
        </div>

        <h3 style="font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff; margin-bottom:8px;">${item.title}</h3>
        <p style="font-size:0.85rem; color:#aaa; line-height:1.6; margin-bottom:14px;">${item.summary}</p>

        <div style="background:rgba(0,0,0,0.4); padding:12px 16px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
          <div style="font-size:0.75rem; color:var(--accent,#06b6d4); font-weight:bold; margin-bottom:8px;">// UPDATE_HIGHLIGHTS</div>
          <ul style="padding-left:18px; font-size:0.82rem; color:#ccc; line-height:1.7;">
            ${item.changes.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');

    if (filtered.length === 0) {
      itemsHtml = `<div class="panel" style="text-align:center; padding:40px; color:#666;">No release entries match search query.</div>`;
    }

    container.innerHTML = `
      <div class="section-header">
        <h1 class="glitch" data-text="// SYSTEM_CHANGELOG">// SYSTEM_CHANGELOG</h1>
        <div class="header-line"></div>
        <p class="aim-subtitle">Definitive architectural log detailing all AlphaCore version updates, security patches, and functionality upgrades.</p>
      </div>

      <!-- Control Header Bar -->
      <div class="panel" style="margin-bottom:20px; padding:12px 18px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:10px; flex:1; max-width:400px;">
          <input type="text" id="ipt-search-changelog" value="${filterQuery}" placeholder="Search changelog versions or features..." style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px 12px; border-radius:4px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; width:100%;" />
        </div>

        <div style="display:flex; gap:10px; align-items:center;">
          <button id="btn-export-changelog" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
            💾 EXPORT RELEASE LOGS
          </button>
        </div>
      </div>

      <!-- Changelog Timeline Entries -->
      <div class="changelog-list">
        ${itemsHtml}
      </div>
    `;

    // Search event
    const searchInput = container.querySelector('#ipt-search-changelog');
    searchInput.addEventListener('input', (e) => {
      render(e.target.value);
    });

    // Export Action
    const exportBtn = container.querySelector('#btn-export-changelog');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(CHANGELOG_DATA, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alphacore_changelog_${Date.now()}.json`;
        a.click();
        showToast('SUCCESS', 'Changelog records exported as JSON.');
      };
    }
  }

  render();
  return container;
}
