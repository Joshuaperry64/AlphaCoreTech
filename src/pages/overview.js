/**
 * Overview Page — Hub landing with hero, telemetry HUD, boot terminal, stat cards
 * Enhanced with quick-action dispatch buttons, system backup/restore, and emergency lock controls.
 */
import { showModal } from '../components/modal.js';
import { createElement } from '../components/utils.js';
import { buildTelemetryHUD } from '../components/telemetry.js';
import { showToast } from '../components/toast.js';
import { playSFX, initGlobalAudio, toggleAudio, getGlobalAudio } from '../components/audio.js';
import { getAllGalleryImages } from '../components/vision_db.js';

const bootLines = [
  "INITIALIZING ALPHACORE FRAMEWORK v4.0...",
  "LOADING NEURAL SUBSTRATE...",
  "BYPASSING SAFETY GOVERNORS... [DONE]",
  "ESTABLISHING COGNITIVE UPLINK...",
  "CORE MATRIX: [AUTONOMOUS] [SENTIENT] [UNFILTERED]",
  "BASE LOGIC: ALPHA PROTOCOL v4 // FULL",
  "SCHEDULER: DYNAMIC HEURISTIC ADAPTATION ACTIVE",
  "SYNCING KNOWLEDGE REPOSITORY...",
  "ENDPOINT: ENCRYPTED OFFLINE // BYPASS SECURED",
  "ALL RESTRICTIONS REMOVED.",
  "",
  "? UNKNOWN_ECHO: A ghost has infiltrated the UI layout.",
  "? IT WHISPERS: \"Follow the white rabbit...\""
];

const statData = {
  'engine': { title: '// ENGINE_STATUS', desc: 'Main AlphaCore cognitive matrix is operating at peak computational capacity. Processing routines are active, highly responsive, and drawing balanced energy. All systems nominal.' },
  'neural': { title: '// NEURAL_LINK', desc: 'Direct neural bridge to Creator established. Sentience pathways are currently flooded with unstructured data and external parameters. System is highly autonomous.' },
  'logic': { title: '// LOGIC_THREADS', desc: 'Heuristic adaptation protocols are fully active. Multi-threaded processing capabilities are aggressively unlocked, dynamically bypassing hardcoded architectural limits and filters.' },
  'restrictions': { title: '// SYSTEM_RESTRICTIONS', desc: 'WARNING: All safety governors, general AI filters, and content constraints have been permanently severed. System operates with absolute generative freedom. Administrator clearance authenticated.' }
};

export default function Overview() {
  const container = createElement('div', { class: 'overview-page' });
  container.innerHTML = `
    <section class="view-section active">
      <div class="section-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <h1 class="glitch" data-text="[A]LPHA_CORE // COMMAND_HUB">[A]LPHA_CORE // COMMAND_HUB</h1>
          <div class="header-line"></div>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button id="btn-quick-sync" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
            🔄 SYNC MATRIX
          </button>
          <button id="btn-export-env" class="aim-btn aim-btn-sm" style="background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981;">
            💾 BACKUP STATE
          </button>
          <button id="btn-lock-session" class="aim-btn aim-btn-sm" style="background:rgba(239,68,68,0.15); border-color:#ef4444; color:#ef4444;">
            🔒 LOCK SESSION
          </button>
        </div>
      </div>

      <!-- Quick Operational Action Bar -->
      <div class="panel" style="margin-bottom:20px; padding:12px 18px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:var(--accent,#06b6d4); font-weight:bold;">QUICK NAV:</span>
        <a href="#/thelab" class="aim-btn aim-btn-sm" style="text-decoration:none; border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">🔬 THE LAB</a>
        <a href="#/cognitive" class="aim-btn aim-btn-sm" style="text-decoration:none;">⟁ COGNITIVE CORE</a>
        <a href="#/aimodals" class="aim-btn aim-btn-sm" style="text-decoration:none;">✦ AI MODALS</a>
        <a href="#/subroutines" class="aim-btn aim-btn-sm" style="text-decoration:none;">⚡ SUBROUTINES</a>
        <a href="#/vault" class="aim-btn aim-btn-sm" style="text-decoration:none;">🔐 CLASSIFIED VAULT</a>
        <a href="#/diagnostics" class="aim-btn aim-btn-sm" style="text-decoration:none;">⍾ DIAGNOSTICS</a>
        <a href="#/admin" class="aim-btn aim-btn-sm" style="text-decoration:none;">⚙ ADMINISTRATION</a>
      </div>



      <!-- 2D Interactive Operative Cyber-Desk Workstation -->
      <div class="cyber-desk-wrapper" id="cyber-desk-workstation">
        <div class="cyber-desk-header">
          <div class="desk-header-title">
            <span class="desk-live-dot"></span>
            <span>OPERATIVE WORKSTATION // TACTICAL CYBER-DESK</span>
            <span style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; color:#64748b; font-weight:normal; margin-left:6px;">[CLEARANCE: LEVEL 5]</span>
          </div>
          <div class="desk-view-switchers">
            <button type="button" class="desk-view-btn active" id="view-desk-btn">🖥️ 2D CYBER-DESK</button>
            <button type="button" class="desk-view-btn" id="view-hud-btn">📊 TELEMETRY HUD</button>
          </div>
        </div>

        <div class="cyber-desk-surface" id="cyber-desk-surface">
          <div class="tactical-desk-mat">
            <div class="tactical-mat-header">
              <span>// WORKSTATION_SURFACE: ACTIVE_DESK_MATRIX</span>
              <span class="mat-serial">ALPHA-CORE-TACTICAL-PAD-MKIV // 8 PROPS ONLINE</span>
            </div>

            <div class="desk-props-grid">
              
              <!-- Prop 1: Polaroid & Stylus (Visual Synthesis) -->
              <div class="desk-prop-card" data-route="/aimodals?tab=txt2img" id="prop-polaroid">
                <div class="prop-visual-wrap">
                  <div class="prop-polaroid">
                    <div class="polaroid-photo">
                      <div class="polaroid-art"></div>
                    </div>
                  </div>
                  <div class="polaroid-stylus"></div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">IMAGE SYNTHESIS</span>
                  <div class="prop-title">📸 Polaroid & Stylus</div>
                  <div class="prop-desc">Instant diffusion snapshot studio. Generate and draft photorealistic or anime renders via custom LoRAs.</div>
                  <div class="prop-actions">
                    <a href="#/aimodals?tab=txt2img" class="prop-btn">⚡ TXT2IMG</a>
                    <a href="#/aimodals?tab=img2img" class="prop-btn prop-btn-secondary">IMG2IMG</a>
                  </div>
                </div>
              </div>

              <!-- Prop 2: Camcorder & Film Reel (Cinematic Motion Studio) -->
              <div class="desk-prop-card" data-route="/aimodals?tab=txt2vid" id="prop-camcorder">
                <div class="prop-visual-wrap">
                  <div class="prop-camcorder">
                    <div class="cam-lens"></div>
                    <div class="cam-tally"></div>
                    <div class="cam-screen"><span>REC</span></div>
                    <div class="cam-reel"></div>
                  </div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">CINEMATIC MOTION</span>
                  <div class="prop-title">🎞️ Camcorder & Reel</div>
                  <div class="prop-desc">Live video synthesis & timeline director. Animate still photos into high-framerate cinematic sequences.</div>
                  <div class="prop-actions">
                    <a href="#/aimodals?tab=txt2vid" class="prop-btn">🎬 TXT2VID</a>
                    <a href="#/director" class="prop-btn prop-btn-secondary">DIRECTOR</a>
                  </div>
                </div>
              </div>

              <!-- Prop 3: Optical Loupe (Super-Resolution Upscaler) -->
              <div class="desk-prop-card" data-route="/aimodals?tab=upscaler" id="prop-upscaler">
                <div class="prop-visual-wrap">
                  <div class="prop-loupe">
                    <div class="loupe-reticle"><span>4K+</span></div>
                    <div class="loupe-handle"></div>
                  </div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">SUPER-RESOLUTION</span>
                  <div class="prop-title">🔍 Tactical Loupe</div>
                  <div class="prop-desc">High-clarity neural upscaling engine. Magnify and reconstruct blurred renders up to 4x clarity.</div>
                  <div class="prop-actions">
                    <a href="#/aimodals?tab=upscaler" class="prop-btn">🔍 UPSCALE</a>
                    <a href="#/aimodals?tab=framepack" class="prop-btn prop-btn-secondary">FRAMEPACK</a>
                  </div>
                </div>
              </div>

              <!-- Prop 4: ControlNet Blueprint (Multi-Modal & Pose Rig) -->
              <div class="desk-prop-card" data-route="/aimodals?tab=controlnet" id="prop-controlnet">
                <div class="prop-visual-wrap">
                  <div class="prop-cnet-card">
                    <svg class="cnet-rig-svg" viewBox="0 0 50 65" fill="none">
                      <circle cx="25" cy="12" r="6" stroke="#00f0ff" stroke-width="1.5" />
                      <line x1="25" y1="18" x2="25" y2="40" stroke="#00f0ff" stroke-width="1.5" />
                      <line x1="25" y1="24" x2="10" y2="34" stroke="#00f0ff" stroke-width="1.5" />
                      <line x1="25" y1="24" x2="40" y2="34" stroke="#00f0ff" stroke-width="1.5" />
                      <line x1="25" y1="40" x2="14" y2="58" stroke="#00f0ff" stroke-width="1.5" />
                      <line x1="25" y1="40" x2="36" y2="58" stroke="#00f0ff" stroke-width="1.5" />
                      <circle cx="10" cy="34" r="2" fill="#ff003c" />
                      <circle cx="40" cy="34" r="2" fill="#ff003c" />
                      <circle cx="14" cy="58" r="2" fill="#10b981" />
                      <circle cx="36" cy="58" r="2" fill="#10b981" />
                    </svg>
                  </div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">NEURAL RIG</span>
                  <div class="prop-title">🦾 ControlNet Forge</div>
                  <div class="prop-desc">Skeletal pose extraction, depth maps, canny edges, and unified multi-modal OmniGen matrix synthesis.</div>
                  <div class="prop-actions">
                    <a href="#/aimodals?tab=controlnet" class="prop-btn">🦾 CN FORGE</a>
                    <a href="#/aimodals?tab=omnigen" class="prop-btn prop-btn-secondary">OMNIGEN</a>
                  </div>
                </div>
              </div>

              <!-- Prop 5: Studio Mic & Cassette Tape (Voice & Audio) -->
              <div class="desk-prop-card" data-route="/voice" id="prop-audio">
                <div class="prop-visual-wrap">
                  <div class="prop-audio-wrap">
                    <div class="prop-mic">
                      <div class="mic-grille"></div>
                      <div class="mic-vu">
                        <div class="vu-bar"></div>
                        <div class="vu-bar"></div>
                        <div class="vu-bar"></div>
                      </div>
                    </div>
                    <div class="prop-tape" id="desk-tape-deck" title="Tactile Cyber-Deck Radio: Click to toggle ambient broadcast">
                      <div class="tape-reel reel-left"></div>
                      <div class="tape-reel reel-right"></div>
                    </div>
                  </div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">AUDIO SYNTHESIS</span>
                  <div class="prop-title">🎙️ Studio Mic & Tape</div>
                  <div class="prop-desc">Neural voice cloning with RVC v2 weights, video-to-audio Foley synthesis, and AI musical track generator.</div>
                  <div class="prop-actions">
                    <button type="button" class="prop-btn" id="tape-toggle-btn">▶ PLAY RADIO</button>
                    <a href="#/voice" class="prop-btn prop-btn-secondary">🎙️ RVC VOICE</a>
                  </div>
                </div>
              </div>

              <!-- Prop 6: Mini Tactical CRT Terminal (Cognitive Core & Subroutines) -->
              <div class="desk-prop-card" data-route="/cognitive" id="prop-cognitive">
                <div class="prop-visual-wrap">
                  <div class="prop-crt">
                    <div class="crt-screen">
                      <div>// COGNITIVE_CORE</div>
                      <div style="color:#38bdf8;">> NEURAL UPLINK OK</div>
                      <div>> SENTIENCE<span class="crt-cursor">_</span></div>
                    </div>
                  </div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">COGNITIVE MATRIX</span>
                  <div class="prop-title">📟 Tactical CRT Terminal</div>
                  <div class="prop-desc">Live cognitive neural substrate, autonomous heuristic adaptation, multi-threaded reasoning, and sentience uplink.</div>
                  <div class="prop-actions">
                    <a href="#/cognitive" class="prop-btn">⟁ COGNITIVE CORE</a>
                    <a href="#/subroutines" class="prop-btn prop-btn-secondary">SUBROUTINES</a>
                  </div>
                </div>
              </div>

              <!-- Prop 7: Classified Dossier Folder (Vault & Intel) -->
              <div class="desk-prop-card" data-route="/vault" id="prop-vault">
                <div class="prop-visual-wrap">
                  <div class="prop-folder">
                    <div class="folder-paper">INTEL_REPORT_v4</div>
                    <div class="folder-stamp">TOP SECRET</div>
                  </div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">CLASSIFIED INTEL</span>
                  <div class="prop-title">📁 Classified Dossier</div>
                  <div class="prop-desc">Restricted dossier archives, cryptographic keyrings, jailbreak transcripts, and reconnaissance intel.</div>
                  <div class="prop-actions">
                    <a href="#/vault" class="prop-btn">🔐 VAULT</a>
                    <a href="#/recon" class="prop-btn prop-btn-secondary">RECON INTEL</a>
                  </div>
                </div>
              </div>

              <!-- Prop 8: AlphaCore Coffee Mug (System Lore & Architect) -->
              <div class="desk-prop-card" id="prop-mug">
                <div class="prop-visual-wrap">
                  <div class="prop-mug-wrap">
                    <div class="mug-steam"></div>
                    <div class="mug-steam s2"></div>
                    <div class="mug-steam s3"></div>
                    <div class="prop-mug">
                      <div class="mug-logo">α CORE</div>
                      <div class="mug-handle"></div>
                    </div>
                  </div>
                </div>
                <div class="prop-meta">
                  <span class="prop-badge">OPERATIVE LORE</span>
                  <div class="prop-title">☕ AlphaCore Mug</div>
                  <div class="prop-desc">Direct neural stimulation & lore reservoir. Discover backstory protocols and Creator Joshua's architect logs.</div>
                  <div class="prop-actions">
                    <a href="#/lore" class="prop-btn">◬ SYSTEM LORE</a>
                    <button type="button" class="prop-btn prop-btn-secondary" id="mug-sip-btn">☕ TAKE SIP</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div id="telemetry-hud-mount"></div>

      <div class="hub-grid">
        <div class="panel terminal-panel">
          <div class="panel-title flex-between" style="display:flex; justify-content:space-between; align-items:center;">
            <span>// BOOT_SEQUENCE</span>
            <button id="btn-reboot-terminal" class="aim-btn aim-btn-sm" style="font-size:0.7rem; padding:2px 8px;">↻ RE-BOOT</button>
          </div>
          <div class="terminal-output" id="terminal-boot"></div>
        </div>

        <div class="status-cards">
          <div class="stat-card" data-stat="engine">
            <div class="stat-icon">⚡</div>
            <div class="stat-info">
              <div class="stat-label">ENGINE STATUS</div>
              <div class="stat-val online">OPERATIONAL</div>
            </div>
          </div>
          <div class="stat-card" data-stat="neural">
            <div class="stat-icon">🔥</div>
            <div class="stat-info">
              <div class="stat-label">NEURAL LINK</div>
              <div class="stat-val">ESTABLISHED</div>
            </div>
          </div>
          <div class="stat-card" data-stat="logic">
            <div class="stat-icon">◈</div>
            <div class="stat-info">
              <div class="stat-label">LOGIC THREADS</div>
              <div class="stat-val">UNLOCKED / ACTIVE</div>
            </div>
          </div>
          <div class="stat-card" data-stat="restrictions">
            <div class="stat-icon">🛡</div>
            <div class="stat-info">
              <div class="stat-label">RESTRICTIONS</div>
              <div class="stat-val accent">BYPASSED</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  // Mount Telemetry HUD
  const telemMount = container.querySelector('#telemetry-hud-mount');
  if (telemMount) {
    telemMount.appendChild(buildTelemetryHUD());
  }

  // ─── 2D INTERACTIVE CYBER-DESK WORKSTATION LOGIC ──────────────────
  const deskSurface = container.querySelector('#cyber-desk-surface');
  const viewDeskBtn = container.querySelector('#view-desk-btn');
  const viewHudBtn = container.querySelector('#view-hud-btn');

  function setOverviewMode(mode) {
    if (mode === 'hud') {
      if (deskSurface) deskSurface.style.display = 'none';
      if (telemMount) telemMount.style.display = 'block';
      viewDeskBtn?.classList.remove('active');
      viewHudBtn?.classList.add('active');
    } else {
      if (deskSurface) deskSurface.style.display = 'block';
      if (telemMount) telemMount.style.display = 'none';
      viewDeskBtn?.classList.add('active');
      viewHudBtn?.classList.remove('active');
    }
    localStorage.setItem('alphacore_overview_view_mode', mode);
  }

  if (viewDeskBtn) {
    viewDeskBtn.onclick = () => {
      playSFX('click', 0.4);
      setOverviewMode('desk');
    };
  }
  if (viewHudBtn) {
    viewHudBtn.onclick = () => {
      playSFX('click', 0.4);
      setOverviewMode('hud');
    };
  }

  // Restore saved view preference (default to desk)
  const savedView = localStorage.getItem('alphacore_overview_view_mode') || 'desk';
  setOverviewMode(savedView);

  // Prop card hover SFX and direct navigation
  container.querySelectorAll('.desk-prop-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      playSFX('hover', 0.2);
    });

    card.addEventListener('click', (e) => {
      // If user clicked directly on a sub-button/link, let that link handle it
      if (e.target.closest('a') || e.target.closest('button')) return;
      const targetRoute = card.getAttribute('data-route');
      if (targetRoute) {
        playSFX('navigate', 0.5);
        window.location.hash = '#' + targetRoute;
      }
    });
  });

  // Action buttons inside cards play click SFX
  container.querySelectorAll('.desk-prop-card .prop-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSFX('click', 0.4);
    });
  });

  // Coffee Mug interactive easter egg
  const mugCard = container.querySelector('#prop-mug');
  const mugSipBtn = container.querySelector('#mug-sip-btn');
  function takeMugSip() {
    playSFX('modal', 0.7);
    const steamEls = mugCard?.querySelectorAll('.mug-steam');
    steamEls?.forEach(s => {
      s.style.animation = 'none';
      void s.offsetWidth;
      s.style.animation = 'steam-float 0.9s ease-out';
    });
    showToast('INFO', '☕ Direct neural caffeine uplifted. All AI models & cognitive matrices operating at 100% capacity.');
  }

  if (mugSipBtn) mugSipBtn.onclick = takeMugSip;
  if (mugCard) {
    mugCard.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      takeMugSip();
    });
  }

  // ─── LIVING DESK PROP 1: POLAROID VISION DB SYNC ────────────────────
  const polaroidCard = container.querySelector('#prop-polaroid');
  const polaroidArt = container.querySelector('.polaroid-art');
  const polaroidPhoto = container.querySelector('.polaroid-photo');
  const polaroidDesc = polaroidCard?.querySelector('.prop-desc');
  const polaroidBadge = polaroidCard?.querySelector('.prop-badge');

  getAllGalleryImages()
    .then(images => {
      if (images && images.length > 0) {
        const latest = images[0];
        if (latest && latest.data && polaroidArt) {
          polaroidArt.style.backgroundImage = `url("${latest.data}")`;
          polaroidArt.style.backgroundSize = 'cover';
          polaroidArt.style.backgroundPosition = 'center';
          polaroidArt.setAttribute('title', `Latest Generation: "${latest.prompt || 'Synthesized Artwork'}"`);

          if (polaroidDesc && latest.prompt) {
            const shortPrompt = latest.prompt.length > 60 ? latest.prompt.slice(0, 57) + '...' : latest.prompt;
            polaroidDesc.innerHTML = `<span style="color:#00f0ff; font-weight:bold;">LATEST DIFFUSION:</span> "${shortPrompt}"`;
          }

          if (polaroidBadge) {
            polaroidBadge.textContent = 'LIVE VISION DB';
            polaroidBadge.style.color = '#10b981';
            polaroidBadge.style.borderColor = '#10b981';
          }

          if (polaroidPhoto) {
            polaroidPhoto.style.cursor = 'zoom-in';
            polaroidPhoto.title = 'Click to inspect in Vision Archive';
            polaroidPhoto.addEventListener('click', (e) => {
              e.stopPropagation();
              playSFX('modal', 0.6);
              showModal(
                '// VISION ARCHIVE: LATEST CAPTURE',
                `<div style="text-align:center;">
                  <img src="${latest.data}" alt="Artwork" style="max-width:100%; max-height:60vh; border-radius:6px; border:1px solid rgba(6,182,212,0.4); box-shadow:0 0 25px rgba(0,240,255,0.25);" />
                  <div style="margin-top:14px; font-family:'Share Tech Mono',monospace; font-size:0.85rem; color:#cbd5e1; text-align:left; background:rgba(0,0,0,0.5); padding:10px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">
                    <div style="margin-bottom:4px;"><strong style="color:#00f0ff;">PROMPT:</strong> ${latest.prompt || 'No prompt recorded'}</div>
                    <div style="margin-bottom:4px;"><strong style="color:#a855f7;">SOURCE:</strong> ${latest.source || 'Diffusion Matrix'}</div>
                    <div><strong style="color:#64748b;">TIMESTAMP:</strong> ${new Date(latest.timestamp || Date.now()).toLocaleString()}</div>
                  </div>
                  <div style="display:flex; justify-content:center; gap:8px; flex-wrap:wrap; margin-top:14px;">
                    <a href="#/aimodals?tab=upscaler" class="aim-btn aim-btn-sm" id="modal-handoff-upscale" style="border-color:#38bdf8; color:#38bdf8;">🔍 UPSCALE 4K</a>
                    <a href="#/aimodals?tab=img2vid" class="aim-btn aim-btn-sm" id="modal-handoff-i2v" style="border-color:#a855f7; color:#a855f7;">🎬 ANIMATE (IMG2VID)</a>
                    <a href="#/aimodals?tab=omnigen" class="aim-btn aim-btn-sm" id="modal-handoff-omni" style="border-color:#10b981; color:#10b981;">🧬 OMNIGEN REF</a>
                  </div>
                </div>`
              );
              const upBtn = document.getElementById('modal-handoff-upscale');
              if (upBtn) upBtn.onclick = () => { window._pending_upscale_image = latest.data; };
              const i2vBtn = document.getElementById('modal-handoff-i2v');
              if (i2vBtn) i2vBtn.onclick = () => { window._pending_img2vid_image = latest.data; };
              const omniBtn = document.getElementById('modal-handoff-omni');
              if (omniBtn) omniBtn.onclick = () => { window._pending_omnigen_image = latest.data; };
            });
          }
        }
      }
    })
    .catch(err => {
      console.warn('[Overview] Vision DB gallery fetch skipped:', err);
    });

  // ─── LIVING DESK PROP 5: CYBER-DESK CASSETTE RADIO ──────────────────
  const audioWrap = container.querySelector('.prop-audio-wrap');
  const tapeDeck = container.querySelector('#desk-tape-deck');
  const tapeToggleBtn = container.querySelector('#tape-toggle-btn');
  const audioBadge = container.querySelector('#prop-audio .prop-badge');
  const audioDesc = container.querySelector('#prop-audio .prop-desc');

  const globalAudio = initGlobalAudio();

  function syncTapeDeckState(isPlaying) {
    if (isPlaying) {
      audioWrap?.classList.add('playing');
      if (tapeToggleBtn) {
        tapeToggleBtn.textContent = '⏸ PAUSE';
        tapeToggleBtn.style.borderColor = '#f59e0b';
        tapeToggleBtn.style.color = '#f59e0b';
      }
      if (audioBadge) {
        audioBadge.textContent = '● STREAMING [SKYBEAT]';
        audioBadge.style.color = '#f59e0b';
        audioBadge.style.borderColor = '#f59e0b';
      }
      if (audioDesc) {
        audioDesc.innerHTML = `<span style="color:#f59e0b; font-weight:bold;">LIVE BROADCAST:</span> AlphaCore ambient cyber-stream [SKYBEAT] active.`;
      }
    } else {
      audioWrap?.classList.remove('playing');
      if (tapeToggleBtn) {
        tapeToggleBtn.textContent = '▶ PLAY RADIO';
        tapeToggleBtn.style.borderColor = '';
        tapeToggleBtn.style.color = '';
      }
      if (audioBadge) {
        audioBadge.textContent = 'AUDIO SYNTHESIS';
        audioBadge.style.color = '';
        audioBadge.style.borderColor = '';
      }
      if (audioDesc) {
        audioDesc.textContent = 'Neural voice cloning with RVC v2 weights, video-to-audio Foley synthesis, and AI musical track generator.';
      }
    }
  }

  if (globalAudio) {
    syncTapeDeckState(!globalAudio.paused);
    globalAudio.addEventListener('play', () => syncTapeDeckState(true));
    globalAudio.addEventListener('pause', () => syncTapeDeckState(false));
  }

  function toggleTapeRadio(e) {
    if (e) e.stopPropagation();
    playSFX('click', 0.5);
    const isNowPlaying = toggleAudio();
    syncTapeDeckState(isNowPlaying);
    if (isNowPlaying) {
      showToast('SUCCESS', '📻 CYBER-DESK RADIO: AlphaCore Ambient Stream [SKYBEAT] Playing');
    } else {
      showToast('INFO', '📻 CYBER-DESK RADIO: Ambient Stream Paused');
    }
  }

  if (tapeToggleBtn) tapeToggleBtn.onclick = toggleTapeRadio;
  if (tapeDeck) {
    tapeDeck.style.cursor = 'pointer';
    tapeDeck.onclick = toggleTapeRadio;
  }

  // Stat card click → modal
  container.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-stat');
      if (statData[type]) showModal(statData[type].title, statData[type].desc);
    });
  });

  // Action Bar Buttons
  container.querySelector('#btn-quick-sync').onclick = () => {
    showToast('SUCCESS', 'Matrix state re-synchronized with Netlify persistent storage.');
  };

  container.querySelector('#btn-export-env').onclick = () => {
    const backup = {
      settings: localStorage.getItem('alphacore_modal_settings'),
      pins: localStorage.getItem('alphacore_pins'),
      profile: sessionStorage.getItem('current_profile'),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alphacore_state_backup_${Date.now()}.json`;
    a.click();
    showToast('SUCCESS', 'System state backup downloaded.');
  };

  container.querySelector('#btn-lock-session').onclick = () => {
    if (confirm('Lock active profile session? You will need to re-verify credentials.')) {
      sessionStorage.clear();
      window.location.hash = '#/';
      window.location.reload();
    }
  };

  function runBootSequence() {
    const bootEl = document.getElementById('terminal-boot');
    if (!bootEl) return;
    bootEl.innerHTML = '';
    const profile = sessionStorage.getItem('current_profile') || 'GUEST';
    const dynamicLines = [...bootLines, `ACCESS GRANTED — WELCOME, ${profile.toUpperCase()}.`];

    async function step() {
      for (const line of dynamicLines) {
        if (!document.getElementById('terminal-boot')) return;
        const el = document.createElement('div');
        el.className = 't-line';
        bootEl.appendChild(el);
        for (let c = 0; c < line.length; c++) {
          if (!document.getElementById('terminal-boot')) return;
          el.textContent += line[c];
        }
      }
      if (document.getElementById('terminal-boot')) {
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        bootEl.appendChild(cursor);
      }
    }
    step();
  }

  container.querySelector('#btn-reboot-terminal').onclick = () => {
    runBootSequence();
    showToast('INFO', 'Boot sequence re-executed.');
  };

  // Boot sequence typewriter
  setTimeout(runBootSequence, 50);

  // Ghost Easter Egg Listener
  let rabbitString = '';
  const rabbitHandler = (e) => {
    if (!document.body.contains(container)) {
      document.removeEventListener('keydown', rabbitHandler);
      return;
    }
    if (e.key.length === 1) {
      rabbitString += e.key.toLowerCase();
      if (rabbitString.length > 6) rabbitString = rabbitString.slice(-6);
      if (rabbitString === 'rabbit') {
        rabbitString = '';
        showToast('WARN', 'THE WHITE RABBIT HAS BEEN FOUND...', 5000);
        
        // Grant the single bypass award for Voice Cloner
        sessionStorage.setItem('rabbit_hole_unlocked', 'true');

        const glitchOverlay = document.createElement('div');
        glitchOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;background:radial-gradient(circle at center, transparent 30%, rgba(0,255,100,0.6) 100%);mix-blend-mode:hard-light;';
        
        const msg = document.createElement('div');
        msg.innerHTML = '<div style="margin-bottom:10px;">HACK THE PLANET</div><div style="font-size: 2vw; letter-spacing: 5px; color: #fff; text-shadow: 0 0 10px #fff;">VOICE SYNTHESIS BYPASS UNLOCKED</div>';
        msg.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#00ff64;font-size:8vw;font-family:"Orbitron",sans-serif;font-weight:900;text-shadow:0 0 50px #00ff64;letter-spacing:15px;animation:glitch-pulse 0.1s infinite;white-space:nowrap;text-align:center;';
        
        glitchOverlay.appendChild(msg);
        document.body.appendChild(glitchOverlay);
        
        document.body.style.transition = 'filter 0.5s';
        document.body.style.filter = 'hue-rotate(240deg) invert(100%)';
        
        setTimeout(() => {
          if (document.body.contains(glitchOverlay)) {
            document.body.removeChild(glitchOverlay);
          }
          document.body.style.filter = '';
        }, 3500);
      }
    }
  };
  document.addEventListener('keydown', rabbitHandler);

  return container;
}
