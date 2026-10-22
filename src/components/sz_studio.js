/**
 * Sector Zero studio pane (sz_studio). Mounted as a tab inside placeholder.js.
 * Every request goes through server.js `/api/sz/*`, which relays to the scripts/vgate.py gateway.
 * Text is pre-checked here with the same rules (src/components/sz_gate.js) for quick feedback only.
 */
import { escapeHTML } from './utils.js';
import { apiUrl } from './api.js';


const K_PROFILES = 'sz_profiles_v1';
const K_PREFS = 'sz_prefs_v1';
const K_ACK = 'sz_ack';

export const TAG_GROUPS = {
  pose: ['standing', 'sitting', 'kneeling', 'reclining', 'embracing', 'from behind', 'close-up'],
  setting: ['candlelit bedroom', 'penthouse suite', 'hot spring', 'rooftop at night', 'beach cabin', 'neon-lit club', 'private study'],
  style: ['cinematic', 'soft film grain', 'glamour photography', 'noir', 'warm golden hour', 'moody low-key'],
  body: ['athletic', 'curvy', 'toned', 'tall', 'freckled', 'tattooed', 'silver hair', 'dark hair', 'auburn hair'],
  light: ['rim light', 'soft window light', 'neon glow', 'firelight']
};

export const CHECKPOINTS = [
  ['epicrealismXL_pureFix.safetensors', 'epicrealismXL_pureFix'],
  ['0x7RealisticFreedom_omegaSDXL.safetensors', '0x7RealisticFreedom_omegaSDXL'],
  ['juggernautXL_ragnarok.safetensors', 'juggernautXL_ragnarok'],
  ['cyberrealisticXL_desireV30.safetensors', 'cyberrealisticXL_desireV30'],
  ['unholyDesireMixCrimson_v50.safetensors', 'unholyDesireMixCrimson_v50'],
  ['lustifyNSFWCheckpoint_zenithV9.safetensors', 'lustifyNSFWCheckpoint_zenithV9'],
  ['intorealism_sdxlV4.safetensors', 'intorealism_sdxlV4'],
  ['cyberrealisticPony_v180Coreshift.safetensors', 'cyberrealisticPony_v180Coreshift'],
  ['realvisxlV50_v50Bakedvae.safetensors', 'realvisxlV50_v50Bakedvae'],
  ['fullyREALXL_v30TRINITY.safetensors', 'fullyREALXL_v30TRINITY']
];

const LORAS = ['BJ', 'Cowgirl', 'Missionary', 'lezcunbkv2', 'onOff_v326', 'ahxl_v1', 'vanellope-20 (2)'];

export const PHASES = [
  { id: 'warmup', label: 'Warm-up', pct: 0.25, intensityScale: 0.4 },
  { id: 'build', label: 'Build', pct: 0.35, intensityScale: 0.7 },
  { id: 'peak', label: 'Peak', pct: 0.25, intensityScale: 1.0 },
  { id: 'cooldown', label: 'Cool-down', pct: 0.15, intensityScale: 0.35 }
];

/* ---------- storage ---------- */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (_) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

export function loadProfiles() { return load(K_PROFILES, []); }
export function saveProfile(p) {

  const list = loadProfiles();
  const i = list.findIndex(x => x.id === p.id);
  if (i >= 0) list[i] = p; else list.push(p);
  save(K_PROFILES, list);
  return p;
}
export function removeProfile(id) { save(K_PROFILES, loadProfiles().filter(p => p.id !== id)); }

export function loadPrefs() { return load(K_PREFS, { tags: {}, profiles: {}, checkpoints: {} }); }
export function bumpPref(kind, key, n = 1) {
  const prefs = loadPrefs();
  prefs[kind] = prefs[kind] || {};
  prefs[kind][key] = (prefs[kind][key] || 0) + n;
  save(K_PREFS, prefs);
}
export function topPrefs(kind, limit = 5) {
  const entries = Object.entries(loadPrefs()[kind] || {}).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit).map(([k]) => k);
}

/* ---------- scene composition (pure, testable) ---------- */
const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];

/**
 * Compose the next scene. Favoured tags (from the taste profile) are weighted in
 * by giving them a second chance of being chosen.
 */
export function composeScene({ profile = null, intensity = 5, favourites = [], rnd = Math.random, fixed = {} } = {}) {
  const chosen = {};
  Object.entries(TAG_GROUPS).forEach(([group, list]) => {
    if (fixed[group]) { chosen[group] = fixed[group]; return; }
    const fav = list.filter(t => favourites.includes(t));
    chosen[group] = (fav.length && rnd() < 0.5) ? pick(fav, rnd) : pick(list, rnd);
  });
  const level = Math.max(1, Math.min(10, Math.round(intensity)));
  const mood = level <= 3 ? 'sensual, teasing, clothed' : level <= 6 ? 'intimate, partially undressed' : 'explicit, passionate, nude';
  const who = profile ? `${profile.basePrompt}, ` : '';
  const prompt = `${who}${chosen.pose}, ${chosen.setting}, ${chosen.body}, ${chosen.light}, ${chosen.style}, ${mood}`;
  return { prompt, tags: Object.values(chosen), mood, intensity: level };
}

export function phaseFor(elapsedMs, totalMs) {
  const f = Math.max(0, Math.min(0.9999, elapsedMs / Math.max(1, totalMs)));
  let acc = 0;
  for (const ph of PHASES) { acc += ph.pct; if (f < acc) return ph; }
  return PHASES[PHASES.length - 1];
}

/* ---------- network ---------- */
function headers() {
  return { 'Content-Type': 'application/json', 'x-user-pin': sessionStorage.getItem('current_pin') || '' };
}

async function relayJson(path, body) {
  const res = await fetch(apiUrl(path), { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || 'Request declined.');
  return data;
}

/** POST and read an SSE stream, invoking onMsg(parsedJson) for each data line. */
async function relayStream(path, body, onMsg, signal) {
  const res = await fetch(apiUrl(path), { method: 'POST', headers: headers(), body: JSON.stringify(body), signal });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Request declined.');
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data: ') || t === 'data: [DONE]') continue;
      try { onMsg(JSON.parse(t.slice(6))); } catch (_) {}
    }
  }
}

/* ---------- gallery (IndexedDB, separate from the normal Vault) ---------- */
function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('sz_gallery', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('items', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('items', mode);
    const out = fn(t.objectStore('items'));
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : undefined);
    t.onerror = () => reject(t.error);
  });
}
export const galleryAdd = item => tx('readwrite', s => s.put(item));
export const galleryDel = id => tx('readwrite', s => s.delete(id));
export const galleryAll = () => tx('readonly', s => s.getAll());

/* ---------- narration ---------- */
export function narrate(text, { rate = 0.95, pitch = 1 } = {}) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate; u.pitch = pitch;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

/* ---------- UI ---------- */
export function buildStudioHTML() {
  const ckpt = CHECKPOINTS.map(([v, l], i) => `<option value="${v}" ${i === 0 ? 'selected' : ''}>${l}</option>`).join('');
  const lora = LORAS.map(l => `<option value="${l}">${l}</option>`).join('');
  const chips = Object.entries(TAG_GROUPS).map(([g, list]) => `
    <div style="margin-top:8px;"><div class="panel-subtitle">// ${g.toUpperCase()}</div>
      <div class="szs-chips" data-group="${g}" style="display:flex;flex-wrap:wrap;gap:6px;">
        ${list.map(t => `<button type="button" class="aim-btn aim-btn-sm szs-chip" data-tag="${t}">${t}</button>`).join('')}
      </div></div>`).join('');
  return `
  <div class="panel" style="border-color: rgba(255,0,60,0.5); background: rgba(20,5,14,0.9);">
    <div class="panel-title" style="color:#ff003c;">STUDIO</div>
    <div id="szs-gate" style="display:none; padding:14px; border:1px solid #ff003c; margin-bottom:12px;">
      <div style="margin-bottom:8px;">Confirm you are 18 or older to continue.</div>
      <button id="szs-ack" class="aim-btn">I AM 18+</button>
    </div>
    <div id="szs-body">
      <div class="aim-tabs" style="margin-bottom:12px;">
        <button class="aim-tab szs-sub active" data-sub="make">Create</button>
        <button class="aim-tab szs-sub" data-sub="flow">Continuous</button>
        <button class="aim-tab szs-sub" data-sub="tale">Narrative</button>
        <button class="aim-tab szs-sub" data-sub="sess">Session</button>
        <button class="aim-tab szs-sub" data-sub="gal">Gallery</button>
        <button class="aim-tab szs-sub" data-sub="taste">Taste</button>
      </div>

      <div class="szs-pane" data-pane="make">
        <div class="panel-subtitle">// CHARACTER</div>
        <select id="szs-profile" class="aim-input"><option value="">(none)</option></select>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
          <input id="szs-p-name" class="aim-input" placeholder="Name" style="flex:1;min-width:120px;">
          <input id="szs-p-age" class="aim-input" type="number" min="18" placeholder="Age (18+)" style="width:110px;">
          <input id="szs-p-seed" class="aim-input" type="number" placeholder="Seed" style="width:110px;">
        </div>
        <textarea id="szs-p-desc" class="aim-input" rows="2" placeholder="Appearance description" style="margin-top:6px;"></textarea>
        <div style="display:flex;gap:6px;margin-top:6px;">
          <button id="szs-p-save" class="aim-btn aim-btn-sm">SAVE CHARACTER</button>
          <button id="szs-p-del" class="aim-btn aim-btn-sm">DELETE</button>
        </div>
        <div class="panel-subtitle" style="margin-top:12px;">// CHECKPOINTS (multi-select, rotates per image)</div>
        <select id="szs-ckpt" class="aim-input" multiple size="5">${ckpt}</select>
        <div class="panel-subtitle" style="margin-top:12px;">// LORA</div>
        <select id="szs-lora" class="aim-input" multiple size="4">${lora}</select>
        ${chips}
        <textarea id="szs-free" class="aim-input" rows="2" placeholder="Extra detail (optional)" style="margin-top:10px;"></textarea>
        <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap;">
          <label>Batch <input id="szs-batch" class="aim-input" type="number" min="1" max="4" value="2" style="width:70px;"></label>
          <button id="szs-go" class="aim-btn sz-action-btn" style="flex:1;">GENERATE</button>
          <button id="szs-auto" class="aim-btn aim-btn-sm">AUTO-SEQUENCE</button>
        </div>
        <label style="display:block;margin-top:6px;"><input type="checkbox" id="szs-auto-vid"> include short video in auto-sequence</label>
        <div id="szs-progress" style="margin-top:10px;font-family:'Share Tech Mono',monospace;color:#fda4af;"></div>
        <div id="szs-out" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:10px;"></div>
      </div>

      <div class="szs-pane" data-pane="flow" style="display:none;">
        <p style="color:#fda4af;font-size:0.8rem;">Hands-free: scenes are generated and displayed continuously until you stop.</p>
        <label>Intensity <input id="szs-flow-int" type="range" min="1" max="10" value="5"></label>
        <label style="margin-left:10px;">Seconds per scene <input id="szs-flow-dwell" type="number" min="3" max="120" value="12" class="aim-input" style="width:80px;"></label>
        <label style="display:block;margin-top:6px;"><input type="checkbox" id="szs-flow-story" checked> stream a story line per scene</label>
        <label style="display:block;"><input type="checkbox" id="szs-flow-voice"> narrate aloud</label>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button id="szs-flow-start" class="aim-btn">START</button>
          <button id="szs-flow-stop" class="aim-btn aim-btn-sm">STOP</button>
        </div>
        <div id="szs-flow-status" style="margin-top:8px;color:#fda4af;"></div>
        <img id="szs-flow-img" style="max-width:100%;margin-top:10px;display:none;filter:blur(18px);cursor:pointer;" title="Click to reveal">
        <div id="szs-flow-text" style="margin-top:10px;white-space:pre-wrap;font-family:'Share Tech Mono',monospace;"></div>
      </div>

      <div class="szs-pane" data-pane="tale" style="display:none;">
        <div id="szs-tale-log" style="height:280px;overflow-y:auto;background:rgba(0,0,0,0.5);padding:10px;white-space:pre-wrap;font-family:'Share Tech Mono',monospace;"></div>
        <input id="szs-tale-in" class="aim-input" placeholder="What happens next? (leave empty to continue)" style="margin-top:8px;">
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button id="szs-tale-send" class="aim-btn">CONTINUE</button>
          <label><input type="checkbox" id="szs-tale-voice"> read aloud</label>
        </div>
      </div>

      <div class="szs-pane" data-pane="sess" style="display:none;">
        <p style="color:#fda4af;font-size:0.8rem;">Guided session: Warm-up, Build, Peak, Cool-down. The intensity slider scales every phase.</p>
        <label>Length (min) <input id="szs-sess-min" type="number" min="5" max="120" value="20" class="aim-input" style="width:80px;"></label>
        <label style="margin-left:10px;">Intensity <input id="szs-sess-int" type="range" min="1" max="10" value="6"></label>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button id="szs-sess-start" class="aim-btn">BEGIN</button>
          <button id="szs-sess-stop" class="aim-btn aim-btn-sm">END</button>
        </div>
        <div id="szs-sess-status" style="margin-top:8px;color:#fda4af;"></div>
      </div>

      <div class="szs-pane" data-pane="gal" style="display:none;">
        <button id="szs-gal-refresh" class="aim-btn aim-btn-sm">REFRESH</button>
        <button id="szs-gal-fav" class="aim-btn aim-btn-sm">FAVORITES ONLY</button>
        <div id="szs-gal" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-top:10px;"></div>
      </div>

      <div class="szs-pane" data-pane="taste" style="display:none;">
        <div id="szs-taste"></div>
        <button id="szs-taste-reset" class="aim-btn aim-btn-sm" style="margin-top:8px;">CLEAR TASTE DATA</button>
      </div>
    </div>
  </div>`;
}

export function mountStudio(root) {
  const $ = s => root.querySelector(s);
  const $$ = s => Array.from(root.querySelectorAll(s));
  const state = { tags: {}, abort: null, flowOn: false, sessOn: false, story: [], lastImage: null };

  // 18+ confirmation, once per session
  const gate = $('#szs-gate'), body = $('#szs-body');
  if (sessionStorage.getItem(K_ACK) !== '1') {
    gate.style.display = 'block'; body.style.display = 'none';
    $('#szs-ack').onclick = () => { sessionStorage.setItem(K_ACK, '1'); gate.style.display = 'none'; body.style.display = 'block'; };
  }

  $$('.szs-sub').forEach(b => b.onclick = () => {
    $$('.szs-sub').forEach(x => x.classList.toggle('active', x === b));
    $$('.szs-pane').forEach(p => { p.style.display = p.dataset.pane === b.dataset.sub ? 'block' : 'none'; });
    if (b.dataset.sub === 'gal') renderGallery();
    if (b.dataset.sub === 'taste') renderTaste();
  });

  /* characters */
  const profSel = $('#szs-profile');
  const refreshProfiles = () => {
    const cur = profSel.value;
    profSel.innerHTML = '<option value="">(none)</option>' + loadProfiles().map(p => `<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)} (${escapeHTML(String(p.age))})</option>`).join('');
    profSel.value = cur;
  };
  refreshProfiles();
  const currentProfile = () => loadProfiles().find(p => p.id === profSel.value) || null;
  profSel.onchange = () => {
    const p = currentProfile();
    if (!p) return;
    $('#szs-p-name').value = p.name; $('#szs-p-age').value = p.age; $('#szs-p-seed').value = p.seed ?? ''; $('#szs-p-desc').value = p.basePrompt;
  };
  $('#szs-p-save').onclick = () => {
    try {
      const existing = currentProfile();
      saveProfile({
        id: existing ? existing.id : 'p_' + Date.now().toString(36),
        name: $('#szs-p-name').value.trim(), age: parseInt($('#szs-p-age').value, 10),
        seed: $('#szs-p-seed').value === '' ? -1 : parseInt($('#szs-p-seed').value, 10),
        basePrompt: $('#szs-p-desc').value.trim(), loraTags: []
      });
      refreshProfiles(); status('Saved.');
    } catch (e) { status(e.message); }
  };
  $('#szs-p-del').onclick = () => { if (profSel.value) { removeProfile(profSel.value); refreshProfiles(); } };

  /* tag chips */
  $$('.szs-chip').forEach(c => c.onclick = () => {
    const g = c.parentElement.dataset.group;
    const on = state.tags[g] === c.dataset.tag;
    state.tags[g] = on ? undefined : c.dataset.tag;
    c.parentElement.querySelectorAll('.szs-chip').forEach(x => { x.style.borderColor = (state.tags[g] === x.dataset.tag) ? '#ff003c' : ''; });
  });

  const status = t => { $('#szs-progress').textContent = t; };
  const selected = sel => Array.from($(sel).selectedOptions || []).map(o => o.value);
  const checkpoints = () => { const s = selected('#szs-ckpt'); return s.length ? s : [CHECKPOINTS[0][0]]; };

  function currentScene(intensity = 7) {
    const fixed = {}; Object.entries(state.tags).forEach(([g, v]) => { if (v) fixed[g] = v; });
    const scene = composeScene({ profile: currentProfile(), intensity, favourites: topPrefs('tags', 8), fixed });
    const free = $('#szs-free').value.trim();
    if (free) scene.prompt += ', ' + free;
    return scene;
  }

  /* gallery */
  async function saveImage(img, meta) {
    const item = { id: 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), b64: img.b64, token: img.token, fav: false, t: Date.now(), ...meta };
    try { await galleryAdd(item); } catch (_) {}
    return item;
  }
  function card(item, { blur = true } = {}) {
    const d = document.createElement('div');
    d.style.cssText = 'position:relative;';
    d.innerHTML = `<img src="data:image/png;base64,${item.b64}" style="width:100%;filter:${blur ? 'blur(18px)' : 'none'};cursor:pointer;" title="Click to reveal / hide">
      <div style="display:flex;gap:4px;margin-top:4px;"><button class="aim-btn aim-btn-sm szs-fav">${item.fav ? '★' : '☆'}</button><button class="aim-btn aim-btn-sm szs-del">✕</button></div>`;
    const im = d.querySelector('img');
    im.onclick = () => { im.style.filter = im.style.filter.includes('blur') ? 'none' : 'blur(18px)'; };
    d.querySelector('.szs-fav').onclick = async e => {
      item.fav = !item.fav; e.target.textContent = item.fav ? '★' : '☆';
      try { await galleryAdd(item); } catch (_) {}
      (item.tags || []).forEach(t => bumpPref('tags', t, item.fav ? 2 : -2));
      if (item.profileId) bumpPref('profiles', item.profileId, item.fav ? 2 : -2);
      if (item.checkpoint) bumpPref('checkpoints', item.checkpoint, item.fav ? 2 : -2);
    };
    d.querySelector('.szs-del').onclick = async () => { try { await galleryDel(item.id); } catch (_) {} d.remove(); };
    return d;
  }
  let favOnly = false;
  async function renderGallery() {
    const host = $('#szs-gal'); host.innerHTML = '';
    let items = []; try { items = await galleryAll(); } catch (_) {}
    items.sort((a, b) => b.t - a.t).filter(i => !favOnly || i.fav).forEach(i => host.appendChild(card(i)));
  }
  $('#szs-gal-refresh').onclick = renderGallery;
  $('#szs-gal-fav').onclick = () => { favOnly = !favOnly; renderGallery(); };
  function renderTaste() {
    const tags = topPrefs('tags', 8), chars = topPrefs('profiles', 3), cks = topPrefs('checkpoints', 3);
    const names = chars.map(id => (loadProfiles().find(p => p.id === id) || {}).name).filter(Boolean);
    $('#szs-taste').innerHTML = `<div>Top tags: ${tags.map(escapeHTML).join(', ') || 'none yet'}</div>
      <div>Top characters: ${names.map(escapeHTML).join(', ') || 'none yet'}</div>
      <div>Top checkpoints: ${cks.map(escapeHTML).join(', ') || 'none yet'}</div>
      <div style="margin-top:6px;color:#fda4af;">Favoriting images teaches the Continuous and Session modes what to show more of.</div>`;
  }
  $('#szs-taste-reset').onclick = () => { save(K_PREFS, { tags: {}, profiles: {}, checkpoints: {} }); renderTaste(); };

  /* streamed generation */
  async function generate({ scene, batch = 1, ckptIndex = 0, signal, onImage }) {
    const ckpt = checkpoints()[ckptIndex % checkpoints().length];
    const p = currentProfile();
    const lora = selected('#szs-lora').join(',') || 'none';
    gateTags(lora); vetText(scene.prompt);
    await relayStream('/api/sz/txt2img/stream', {
      prompt: scene.prompt, model_name: ckpt, lora, batch_size: batch, seed: p && p.seed >= 0 ? p.seed : -1
    }, async msg => {
      if (msg.error) throw new Error('Request declined.');
      if (msg.step !== undefined) status(`Generating... step ${msg.step}/${msg.max_steps || '?'}`);
      if (msg.images) {
        for (const img of msg.images) {
          const item = await saveImage(img, { tags: scene.tags, profileId: p && p.id, checkpoint: ckpt, prompt: scene.prompt });
          onImage && onImage(item);
        }
      }
    }, signal);
  }

  $('#szs-go').onclick = async () => {
    try {
      const batch = Math.max(1, Math.min(4, parseInt($('#szs-batch').value, 10) || 1));
      const host = $('#szs-out'); host.innerHTML = '';
      status('Starting...');
      await generate({ scene: currentScene(), batch, onImage: it => { state.lastImage = it; host.appendChild(card(it)); } });
      status('Done.');
    } catch (e) { status(e instanceof GateError ? 'Request declined.' : e.message); }
  };

  $('#szs-auto').onclick = async () => {
    try {
      const host = $('#szs-out'); host.innerHTML = '';
      const made = [];
      status('Auto-sequence: generating...');
      await generate({ scene: currentScene(), batch: 2, onImage: it => { made.push(it); host.appendChild(card(it)); } });
      for (const it of made) {
        status('Auto-sequence: refining...');
        const r = await relayJson('/api/sz/img2img', { init_image_b64: it.b64, token: it.token, prompt: it.prompt, checkpoint: it.checkpoint, strength: 0.3 });
        for (const img of (r.images || [])) host.appendChild(card(await saveImage(img, { tags: it.tags, profileId: it.profileId, checkpoint: it.checkpoint, prompt: it.prompt })));
      }
      if ($('#szs-auto-vid').checked && made[0]) {
        status('Auto-sequence: video...');
        const v = await relayJson('/api/sz/img2vid', { init_image_b64: made[0].b64, token: made[0].token, prompt: made[0].prompt });
        if (v.video_b64) {
          const vid = document.createElement('video');
          vid.src = 'data:video/mp4;base64,' + v.video_b64; vid.controls = true; vid.loop = true; vid.style.cssText = 'width:100%;filter:blur(18px);';
          vid.onclick = () => { vid.style.filter = vid.style.filter.includes('blur') ? 'none' : 'blur(18px)'; };
          host.appendChild(vid);
        }
      }
      status('Auto-sequence done.');
    } catch (e) { status(e instanceof GateError ? 'Request declined.' : e.message); }
  };

  /* streamed story */
  async function streamStory({ userText, sink, signal }) {
    if (userText) { vetText(userText, 'story text'); state.story.push({ role: 'user', content: userText }); }
    else state.story.push({ role: 'user', content: 'Continue the scene.' });
    let full = '';
    await relayStream('/api/sz/story', { messages: state.story, character: currentProfile() }, msg => {
      const delta = msg.choices && msg.choices[0] && msg.choices[0].delta && msg.choices[0].delta.content;
      if (delta) { full += delta; sink(delta); }
    }, signal);
    state.story.push({ role: 'assistant', content: full });
    state.story = state.story.slice(-12);
    return full;
  }
  $('#szs-tale-send').onclick = async () => {
    const log = $('#szs-tale-log'); const input = $('#szs-tale-in');
    const text = input.value.trim(); input.value = '';
    if (text) log.textContent += `\n> ${text}\n`;
    try {
      const full = await streamStory({ userText: text, sink: d => { log.textContent += d; log.scrollTop = log.scrollHeight; } });
      if ($('#szs-tale-voice').checked) narrate(full);
    } catch (e) { log.textContent += '\n[declined]\n'; }
  };

  /* continuous mode (hands-free), also drives guided sessions */
  async function runFlow({ intensityFn, dwellMs, withStory, voice, endAt = Infinity, onTick }) {
    const ctl = new AbortController(); state.abort = ctl;
    const img = $('#szs-flow-img'), txt = $('#szs-flow-text');
    img.onclick = () => { img.style.filter = img.style.filter.includes('blur') ? 'none' : 'blur(18px)'; };
    let n = 0;
    while (state.flowOn && Date.now() < endAt && !ctl.signal.aborted) {
      const level = intensityFn();
      onTick && onTick(level, n);
      try {
        const scene = composeScene({ profile: currentProfile(), intensity: level, favourites: topPrefs('tags', 8) });
        await generate({ scene, batch: 1, ckptIndex: n++, signal: ctl.signal, onImage: it => { img.src = 'data:image/png;base64,' + it.b64; img.style.display = 'block'; } });
        if (withStory) {
          txt.textContent = '';
          const full = await streamStory({ userText: `Scene: ${scene.prompt}. Write the next short passage (about 80 words).`, sink: d => { txt.textContent += d; }, signal: ctl.signal });
          if (voice) narrate(full);
        }
      } catch (e) {
        if (ctl.signal.aborted) break;
        $('#szs-flow-status').textContent = e.message; break;
      }
      const wake = Date.now() + dwellMs;
      while (Date.now() < wake && state.flowOn && !ctl.signal.aborted) await new Promise(r => setTimeout(r, 250));
    }
    state.flowOn = false; state.sessOn = false;
  }
  const stopAll = () => { state.flowOn = false; state.sessOn = false; if (state.abort) state.abort.abort(); try { window.speechSynthesis.cancel(); } catch (_) {} };
  $('#szs-flow-start').onclick = () => {
    if (state.flowOn) return; state.flowOn = true;
    $('#szs-flow-status').textContent = 'Running...';
    runFlow({ intensityFn: () => parseInt($('#szs-flow-int').value, 10), dwellMs: (parseInt($('#szs-flow-dwell').value, 10) || 12) * 1000,
      withStory: $('#szs-flow-story').checked, voice: $('#szs-flow-voice').checked,
      onTick: (l, n) => { $('#szs-flow-status').textContent = `Scene ${n + 1} // intensity ${l}`; } });
  };
  $('#szs-flow-stop').onclick = () => { stopAll(); $('#szs-flow-status').textContent = 'Stopped.'; };

  $('#szs-sess-start').onclick = () => {
    if (state.flowOn) return; state.flowOn = true; state.sessOn = true;
    const totalMs = (parseInt($('#szs-sess-min').value, 10) || 20) * 60000, start = Date.now();
    $('.szs-sub[data-sub="flow"]').click();
    runFlow({ intensityFn: () => Math.max(1, Math.round(parseInt($('#szs-sess-int').value, 10) * phaseFor(Date.now() - start, totalMs).intensityScale)),
      dwellMs: 15000, withStory: true, voice: $('#szs-flow-voice').checked, endAt: start + totalMs,
      onTick: l => { const ph = phaseFor(Date.now() - start, totalMs); $('#szs-sess-status').textContent = `${ph.label} // intensity ${l}`; $('#szs-flow-status').textContent = `${ph.label} // intensity ${l}`; } })
      .then(() => { $('#szs-sess-status').textContent = 'Session complete.'; });
  };
  $('#szs-sess-stop').onclick = () => { stopAll(); $('#szs-sess-status').textContent = 'Ended.'; };

  return { stopAll };
}
