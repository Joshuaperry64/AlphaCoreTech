import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { spawn } from 'child_process';
import PDFDocument from 'pdfkit';
import sanitizeHtml from 'sanitize-html';
import { buildMinimalApkBuffer } from './src/lib/apk_helper.js';


let _dirname = process.cwd();
try {
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.url) {
    _dirname = path.dirname(fileURLToPath(import.meta.url));
  } else if (typeof __dirname !== 'undefined') {
    _dirname = __dirname;
  }
} catch {
  _dirname = process.cwd();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DB_PATH = path.join(_dirname, 'data.json');

const DEFAULT_DB = {
  pins: [
    { pin: '672167566', type: 'permanent', label: 'Architect', roles: ['aimodals', 'generate', 'lora', 'upscaler', 'video', 'director', 'assets', 'voice', 'music', 'subroutines', 'vault', 'research', 'lore', 'diagnostics', 'admin'], createdAt: Date.now() },
    { pin: '20022005', type: 'permanent', label: 'J. P.', roles: ['aimodals', 'generate', 'upscaler', 'video', 'director', 'voice', 'music', 'vault', 'research', 'lore', 'diagnostics'], createdAt: Date.now() },
    { pin: '1990', type: 'permanent', label: 'Fisherman', roles: ['aimodals', 'generate', 'upscaler', 'video', 'director', 'assets', 'voice', 'music', 'subroutines', 'vault', 'research', 'lore', 'diagnostics'], createdAt: Date.now() },
    { pin: '67676767', type: 'permanent', label: 'john', roles: ['aimodals', 'generate', 'upscaler', 'video', 'voice', 'music', 'vault', 'research', 'lore', 'diagnostics'], createdAt: Date.now() }
  ],
  logs: [],
  pendingProfiles: [],
  sharedChat: [],
  settings: {
    txt2imgUrl: 'https://josh627764--alphacore-aio-backend-txt2img-web-txt2img.us-east.modal.run',
    img2imgUrl: 'https://josh627764--alphacore-aio-backend-img2img-web-img2img.us-east.modal.run',
    negativePrompt: 'worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts',
    stepsFastTxt: 10, stepsFocusedTxt: 50, stepsNormalTxt: 20,
    stepsFastImg: 8, stepsFocusedImg: 30, stepsNormalImg: 17,
    guidanceImg: 4.0
  }
};

// ... (Your DB logic functions like readDB and writeDB remain here) ...
import { getStore } from '@netlify/blobs';

let dbCache = null;

async function getNetlifyStore() {
  if (process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT) {
    try {
      return getStore('alphacore_db');
    } catch (e) {
      console.error("Netlify Blobs init failed:", e);
      return null;
    }
  }
  return null;
}

async function readDB() {
  if (dbCache) return dbCache;

  try {
    const store = await getNetlifyStore();
    if (store) {
      let data = await store.get('data.json', { type: 'json' });
      if (!data) {
        data = JSON.parse(JSON.stringify(DEFAULT_DB));
        try {
          await store.setJSON('data.json', data);
        } catch (err) {
          console.error("Error setting initial Netlify Blobs data", err);
        }
      }
      dbCache = data;
    } else {
      // Local FS fallback
      try {
        await fs.promises.access(DB_PATH);
      } catch {
        await fs.promises.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
      }
      dbCache = JSON.parse(await fs.promises.readFile(DB_PATH, 'utf-8'));
    }

    if (!dbCache.pins) dbCache.pins = DEFAULT_DB.pins;
    if (!dbCache.logs) dbCache.logs = [];
    if (!dbCache.settings) dbCache.settings = DEFAULT_DB.settings;
    if (!dbCache.pendingProfiles) dbCache.pendingProfiles = [];
    if (!dbCache.sharedChat) dbCache.sharedChat = [];

    // Ensure default profiles are always present
    DEFAULT_DB.pins.forEach(defaultPin => {
      if (!dbCache.pins.some(p => p.pin === defaultPin.pin)) {
        dbCache.pins.push(defaultPin);
      }
    });

    return dbCache;
  } catch (e) {
    console.error("Error reading DB", e);
    dbCache = JSON.parse(JSON.stringify(DEFAULT_DB));
    return dbCache;
  }
}

async function writeDB(data) {
  dbCache = data;
  try {
    const store = await getNetlifyStore();
    if (store) {
      await store.setJSON('data.json', data);
      return;
    }
  } catch (e) {
    console.error("Netlify Blobs write error:", e);
  }
  try {
    await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Local FS DB write error:", e);
  }
}


const authenticate = async (req, res, next) => {
    const userPin = req.headers['x-user-pin'];
    const db = await readDB();
    const pinObj = db.pins.find(p => p.pin === userPin);
    if (!pinObj) return res.status(401).json({ error: "Unauthorized" });
    req.user = pinObj;
    next();
};


// ==========================================================
// ADVANCED OSINT ENDPOINT
// ==========================================================
const targets = new Map();

app.post('/api/recon/scan', authenticate, async (req, res) => {
    const { target } = req.body;
    if (!target) {
        return res.status(400).json({ status: 'ERROR', message: 'Target identifier is required.' });
    }

    // Validate target to prevent command/argument injection
    if (!/^[a-zA-Z0-9][a-zA-Z0-9@._-]*$/.test(target)) {
        return res.status(400).json({ status: 'ERROR', message: 'Invalid target format.' });
    }

    let queryType;
    if (target.includes('@')) {
        queryType = 'email';
    } else if (target.includes('.') && !target.includes(' ') && target.length > 3) {
        queryType = 'domain';
    } else {
        queryType = 'username';
    }

    const scriptPath = path.join(_dirname, 'advanced_osint.py');
    const pythonProcess = spawn('python3', [scriptPath, queryType, target]);

    let rawData = '', errorData = '';
    pythonProcess.stdout.on('data', (data) => { rawData += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorData += data.toString(); });

    pythonProcess.on('close', (code) => {
        if (errorData) console.error(`[OSINT Script STDERR]: ${errorData}`);
        
        try {
            const result = JSON.parse(rawData);
            if (result.error) throw new Error(result.error);
            
            targets.set(target, { name: target, status: 'complete', data: result });
            res.json({ status: 'SUCCESS', message: 'OSINT scan complete.', data: result });
        } catch (e) {
            res.status(500).json({ status: 'ERROR', message: `Scan process failed: ${e.message || 'Could not parse script output.'}` });
        }
    });
});


// ==========================================================
// GAZETTE PROXY ENDPOINT
// ==========================================================
app.get('/api/gazette/:name', async (req, res) => {
    try {
        const name = req.params.name;
        // Node 18+ has global fetch
        const response = await fetch(`https://thegeorgiagazette.com/fannin/${name}/`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!response.ok) return res.status(response.status).send('Not found');
        let html = await response.text();
        const cleanHtml = sanitizeHtml(html, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'style', 'html', 'head', 'body', 'title', 'meta', 'link' ]),
            allowedAttributes: {
                '*': ['class', 'id', 'style'],
                'a': ['href', 'name', 'target'],
                'img': ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
                'link': ['href', 'rel', 'type']
            },
            allowVulnerableTags: true,
        });
        res.send(cleanHtml);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// ... (All your other existing API routes: /api/pins, /api/logs, /api/vault, etc.)
app.get('/api/pins', async (req, res) => {
  const db = await readDB();
  const userPin = req.headers['x-user-pin'];
  const isAuthenticated = userPin && db.pins.some(p => p.pin === userPin);

  if (isAuthenticated) {
    res.json(db.pins);
  } else {
    // Return safe pins (no actual pin value)
    res.json(db.pins.map(p => {
      const safePin = { ...p };
      delete safePin.pin;
      return safePin;
    }));
  }
});


// ==========================================================
// PENDING PROFILES ENDPOINTS
// ==========================================================

app.get('/api/pending-profiles', authenticate, async (req, res) => {
  const db = await readDB();
  res.json(db.pendingProfiles || []);
});

app.post('/api/pending-profiles/request', async (req, res) => {
  const { username, email, pin } = req.body;
  if (!username || !email || !pin) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = await readDB();

  // Check if PIN already exists in active pins
  if (db.pins.some(p => p.pin === pin)) {
    return res.status(400).json({ error: 'PIN already in use' });
  }

  // Check if PIN already exists in pending profiles
  if (db.pendingProfiles && db.pendingProfiles.some(p => p.pin === pin)) {
    return res.status(400).json({ error: 'PIN request already pending' });
  }

  const newRequest = {
    username,
    email,
    pin,
    createdAt: Date.now()
  };

  if (!db.pendingProfiles) db.pendingProfiles = [];
  db.pendingProfiles.push(newRequest);

  await writeDB(db);
  res.json({ success: true, message: 'Request submitted successfully' });
});

app.post('/api/pending-profiles/approve', authenticate, async (req, res) => {
  const { pin, roles } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });

  const db = await readDB();
  if (!db.pendingProfiles) db.pendingProfiles = [];

  const requestIndex = db.pendingProfiles.findIndex(p => p.pin === pin);
  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Pending request not found' });
  }

  const request = db.pendingProfiles[requestIndex];

  // Remove from pending
  db.pendingProfiles.splice(requestIndex, 1);

  // Add to active pins
  db.pins.push({
    pin: request.pin,
    type: 'permanent',
    label: request.username,
    roles: roles || [],
    createdAt: Date.now()
  });

  await writeDB(db);
  res.json({ success: true });
});

app.post('/api/pending-profiles/reject', authenticate, async (req, res) => {
  const { pin } = req.body;
  if (!pin) return res.status(400).json({ error: 'PIN required' });

  const db = await readDB();
  if (!db.pendingProfiles) db.pendingProfiles = [];

  const requestIndex = db.pendingProfiles.findIndex(p => p.pin === pin);
  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Pending request not found' });
  }

  // Remove from pending
  db.pendingProfiles.splice(requestIndex, 1);

  await writeDB(db);
  res.json({ success: true });
});


app.get('/api/pins', authenticate, async (req, res) => res.json((await readDB()).pins));
app.post('/api/pins', authenticate, async (req, res) => {
  const db = await readDB();
  db.pins = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/logs', authenticate, async (req, res) => res.json((await readDB()).logs));
app.post('/api/logs', authenticate, async (req, res) => {
  const db = await readDB();
  db.logs = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/settings', authenticate, async (req, res) => res.json((await readDB()).settings));
app.post('/api/settings', authenticate, async (req, res) => {
  const db = await readDB();
  db.settings = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.post('/api/auth', async (req, res) => {
  const db = await readDB();
  const { pin, requiredRole } = req.body || {};

  const found = db.pins.find(p => p.pin === pin);

  if (!found) {
    const isPending = db.pendingProfiles && db.pendingProfiles.some(p => p.pin === pin);
    if (isPending) {
      return res.json({ valid: false, reason: 'PROFILE PENDING APPROVAL', isPending: true });
    }
    return res.json({ valid: false, reason: 'ACCESS DENIED' });
  }

  if (requiredRole && (!found.roles || !found.roles.includes(requiredRole))) {
    return res.json({ valid: false, reason: `INSUFFICIENT CLEARANCE: REQUIRES [${requiredRole.toUpperCase()}]` });
  }

  if (found.mustChangePin) {
    return res.json({ valid: true, pinObj: found, requireNewPin: true });
  }

  if (found.type === 'one-time') {
    if (found.used) {
      return res.json({ valid: false, reason: 'ONE-TIME PIN EXPIRED' });
    }
    found.used = true;
    db.pins = db.pins.filter(p => p.pin !== pin);
    await writeDB(db);
    return res.json({ valid: true, pinObj: found, isOtp: true });
  }

  if (found.type === 'temporary') {
    if (Date.now() > found.expiresAt) {
      return res.json({ valid: false, reason: 'TEMPORARY PIN EXPIRED' });
    }
    return res.json({ valid: true, pinObj: found });
  }

  res.json({ valid: true, pinObj: found });
});


// ==========================================================
// ALPHA APP MANAGER ENDPOINTS (MODAL VOLUME & PROFILE LOCKED)
// ==========================================================

const TARGET_MODAL_PROFILE = 'josh627764';
const APPS_MODAL_VOLUME = 'alpha-apps';

function checkAppAccess(app, callerProfile, callerRoles = [], callerPin = '') {
  if (callerProfile.toLowerCase() === 'architect' || callerPin === '672167566') {
    return true;
  }

  const accessLevel = (app.accessLevel || 'RESTRICTED').toUpperCase();
  const allowedProfiles = (app.allowedProfiles || []).map(p => p.toLowerCase());
  const isPublic = allowedProfiles.includes('*') || allowedProfiles.includes('public') || accessLevel === 'PUBLIC_CLEARANCE';
  const profileMatches = allowedProfiles.includes(callerProfile.toLowerCase());

  if (accessLevel === 'RESTRICTED') {
    return profileMatches;
  }

  if (isPublic) {
    return callerProfile && callerProfile.toLowerCase() !== 'guest';
  }

  if (profileMatches) return true;

  const appRoles = (app.allowedRoles || []).map(r => r.toLowerCase());
  const userRoles = callerRoles.map(r => r.toLowerCase());
  return appRoles.some(r => userRoles.includes(r));
}

app.get('/api/apps', async (req, res) => {
  const db = await readDB();
  const userPin = req.headers['x-user-pin'] || req.query.pin;
  const pinObj = userPin ? db.pins.find(p => p.pin === userPin) : null;
  const callerProfile = pinObj ? pinObj.label : (req.query.profile || 'Guest');
  const callerRoles = pinObj ? (pinObj.roles || []) : [];

  const apps = (db.apps || []).map(app => {
    const canDownload = checkAppAccess(app, callerProfile, callerRoles, userPin);
    return {
      ...app,
      canDownload,
      targetModalProfile: TARGET_MODAL_PROFILE,
      modalVolume: APPS_MODAL_VOLUME
    };
  });

  res.json({
    callerProfile,
    callerRoles,
    lockedModalProfile: TARGET_MODAL_PROFILE,
    modalVolume: APPS_MODAL_VOLUME,
    apps
  });
});

app.get('/api/apps/:id', async (req, res) => {
  const db = await readDB();
  const app = (db.apps || []).find(a => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: 'App not found' });

  const userPin = req.headers['x-user-pin'] || req.query.pin;
  const pinObj = userPin ? db.pins.find(p => p.pin === userPin) : null;
  const callerProfile = pinObj ? pinObj.label : (req.query.profile || 'Guest');
  const callerRoles = pinObj ? (pinObj.roles || []) : [];
  const canDownload = checkAppAccess(app, callerProfile, callerRoles, userPin);

  res.json({
    ...app,
    canDownload,
    targetModalProfile: TARGET_MODAL_PROFILE,
    modalVolume: APPS_MODAL_VOLUME
  });
});

app.get('/api/apps/:id/download', async (req, res) => {
  const db = await readDB();
  const app = (db.apps || []).find(a => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: 'App not found' });

  const userPin = req.headers['x-user-pin'] || req.query.pin;
  const pinObj = userPin ? db.pins.find(p => p.pin === userPin) : null;
  const callerProfile = pinObj ? pinObj.label : (req.query.profile || 'Guest');
  const callerRoles = pinObj ? (pinObj.roles || []) : [];
  const canDownload = checkAppAccess(app, callerProfile, callerRoles, userPin);

  if (!canDownload) {
    return res.status(403).json({
      error: `ACCESS_DENIED: INSUFFICIENT CLEARANCE FOR APK [${app.name}]. REQUIRED: ${JSON.stringify(app.allowedProfiles)}`
    });
  }

  // Increment download count and audit log
  app.downloadsCount = (app.downloadsCount || 0) + 1;
  if (!db.logs) db.logs = [];
  db.logs.unshift({
    type: 'APK_DOWNLOAD',
    user: callerProfile,
    appId: app.id,
    appName: app.name,
    filename: app.filename,
    profileLock: TARGET_MODAL_PROFILE,
    timestamp: Date.now()
  });
  if (db.logs.length > 100) db.logs.pop();
  await writeDB(db);

  // Check if physical file exists in public/apks/
  const apksDir = path.join(_dirname, 'public', 'apks');
  const apkFilePath = path.join(apksDir, app.filename);

  let apkBuffer = null;
  try {
    if (fs.existsSync(apkFilePath)) {
      apkBuffer = await fs.promises.readFile(apkFilePath);
    }
  } catch (err) {
    console.warn('[APK] Local file read warning:', err);
  }

  if (!apkBuffer) {
    // Generate valid Android APK container
    apkBuffer = buildMinimalApkBuffer({
      packageName: app.packageName || 'com.alphacore.app',
      appName: app.name,
      version: app.version
    });
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${app.filename}"`);
  res.setHeader('X-Checksum-SHA256', app.sha256 || crypto.createHash('sha256').update(apkBuffer).digest('hex'));
  res.setHeader('X-Locked-Modal-Profile', TARGET_MODAL_PROFILE);
  res.setHeader('X-Modal-Volume', APPS_MODAL_VOLUME);
  res.setHeader('Content-Length', apkBuffer.length);
  res.send(apkBuffer);
});

app.post('/api/apps/upload', authenticate, async (req, res) => {
  const isArchitect = req.user.label === 'Architect' || req.user.pin === '672167566' || (req.user.roles && req.user.roles.includes('admin'));
  if (!isArchitect) {
    return res.status(403).json({ error: 'Architect clearance required to upload APKs' });
  }

  const {
    id, name, filename, packageName, version, versionCode,
    description, changelog, minAndroid, allowedProfiles, allowedRoles, accessLevel,
    apkBase64
  } = req.body;

  if (!id || !name || !filename) {
    return res.status(400).json({ error: 'Missing required app fields (id, name, filename)' });
  }

  const db = await readDB();
  if (!db.apps) db.apps = [];

  let finalFilename = filename.endsWith('.apk') ? filename : `${filename}.apk`;
  let fileBuffer = null;
  if (apkBase64) {
    fileBuffer = Buffer.from(apkBase64, 'base64');
  } else {
    fileBuffer = buildMinimalApkBuffer({ packageName: packageName || 'com.alphacore.custom', appName: name, version: version || 'v1.0.0' });
  }

  const apksDir = path.join(_dirname, 'public', 'apks');
  await fs.promises.mkdir(apksDir, { recursive: true });
  await fs.promises.writeFile(path.join(apksDir, finalFilename), fileBuffer);

  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const sizeMb = parseFloat((fileBuffer.length / (1024 * 1024)).toFixed(2));

  const newApp = {
    id,
    name,
    filename: finalFilename,
    packageName: packageName || `com.alphacore.${id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
    version: version || 'v1.0.0',
    versionCode: parseInt(versionCode) || 1,
    sizeMb,
    sizeBytes: fileBuffer.length,
    sha256,
    description: description || 'AlphaCore Android Application Module',
    changelog: changelog || '• Initial Release',
    minAndroid: minAndroid || 'Android 10+ (API 29)',
    targetModalProfile: TARGET_MODAL_PROFILE,
    modalVolume: APPS_MODAL_VOLUME,
    allowedProfiles: Array.isArray(allowedProfiles) ? allowedProfiles : ['Architect'],
    allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : ['admin'],
    accessLevel: accessLevel || 'RESTRICTED',
    downloadsCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const existingIdx = db.apps.findIndex(a => a.id === id);
  if (existingIdx >= 0) {
    db.apps[existingIdx] = { ...db.apps[existingIdx], ...newApp, downloadsCount: db.apps[existingIdx].downloadsCount || 0 };
  } else {
    db.apps.push(newApp);
  }

  await writeDB(db);
  res.json({ success: true, app: newApp });
});

app.post('/api/apps/:id/permissions', authenticate, async (req, res) => {
  const isArchitect = req.user.label === 'Architect' || req.user.pin === '672167566' || (req.user.roles && req.user.roles.includes('admin'));
  if (!isArchitect) {
    return res.status(403).json({ error: 'Architect clearance required' });
  }

  const db = await readDB();
  const app = (db.apps || []).find(a => a.id === req.params.id);
  if (!app) return res.status(404).json({ error: 'App not found' });

  const { allowedProfiles, allowedRoles, accessLevel } = req.body;
  if (Array.isArray(allowedProfiles)) app.allowedProfiles = allowedProfiles;
  if (Array.isArray(allowedRoles)) app.allowedRoles = allowedRoles;
  if (accessLevel) app.accessLevel = accessLevel;
  app.updatedAt = Date.now();

  await writeDB(db);
  res.json({ success: true, app });
});

app.delete('/api/apps/:id', authenticate, async (req, res) => {
  const isArchitect = req.user.label === 'Architect' || req.user.pin === '672167566' || (req.user.roles && req.user.roles.includes('admin'));
  if (!isArchitect) {
    return res.status(403).json({ error: 'Architect clearance required' });
  }

  const db = await readDB();
  const idx = (db.apps || []).findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'App not found' });

  const deleted = db.apps.splice(idx, 1)[0];
  try {
    const filePath = path.join(_dirname, 'public', 'apks', deleted.filename);
    if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
  } catch (e) {
    console.warn('[APK] File unlink note:', e);
  }

  await writeDB(db);
  res.json({ success: true, message: `App ${deleted.id} removed` });
});

app.get('/api/apps/status/telemetry', async (req, res) => {
  const db = await readDB();
  const apps = db.apps || [];
  const totalDownloads = apps.reduce((sum, a) => sum + (a.downloadsCount || 0), 0);
  res.json({
    service: 'AlphaCore App Manager',
    status: 'ONLINE',
    lockedModalProfile: TARGET_MODAL_PROFILE,
    modalVolume: APPS_MODAL_VOLUME,
    totalApps: apps.length,
    totalDownloads,
    timestamp: Date.now()
  });
});


// --- GLOBAL MEMORY SYSTEM (USER PROFILE SCOPED) ---
app.get('/api/memory', async (req, res) => {
  const db = await readDB();
  const profile = (req.query.profile || '').toUpperCase();
  if (profile) {
    const userMemory = (db.memory || []).filter(m => !m.profile || m.profile === profile || m.profile === 'GLOBAL');
    return res.json(userMemory);
  }
  res.json(db.memory || []);
});

app.post('/api/memory', async (req, res) => {
  const db = await readDB();
  if (!db.memory) db.memory = [];
  
  const { action, fact, query, profile } = req.body;
  const callerProfile = (profile || 'GLOBAL').toUpperCase();
  if (action === 'memorize' && fact) {
    db.memory.push({ fact, profile: callerProfile, timestamp: Date.now() });
    await writeDB(db);
    return res.json({ success: true, fact, profile: callerProfile });
  } else if (action === 'recall' && query) {
    // Basic text search recall scoped to caller profile or GLOBAL
    const results = db.memory.filter(m => {
      const matches = m.fact && m.fact.toLowerCase().includes(query.toLowerCase());
      if (!matches) return false;
      if (!profile) return true;
      const memProfile = (m.profile || 'GLOBAL').toUpperCase();
      return memProfile === callerProfile || memProfile === 'GLOBAL';
    });
    return res.json({ results });
  }
  res.status(400).json({ error: 'Invalid action or missing parameters' });
});

// --- SHARED CHAT SSE & POST ---
let chatClients = [];

app.get('/api/chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  chatClients.push(res);

  req.on('close', () => {
    chatClients = chatClients.filter(client => client !== res);
  });
});

app.post('/api/chat', async (req, res) => {
  const { author, text, role } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  const db = await readDB();
  const msgAuthor = author || 'USER';

  if (role === 'user' && db.blockedUsers && db.blockedUsers[msgAuthor]) {
    if (Date.now() < db.blockedUsers[msgAuthor]) {
      return res.status(403).json({ error: 'You are currently blocked from the shared chat.' });
    } else {
      delete db.blockedUsers[msgAuthor];
      await writeDB(db);
    }
  }

  const msgObj = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
    author: msgAuthor,
    text,
    role: role || 'user',
    timestamp: Date.now()
  };

  if (!db.sharedChat) db.sharedChat = [];
  db.sharedChat.push(msgObj);
  if (db.sharedChat.length > 100) db.sharedChat.shift();
  await writeDB(db);

  chatClients.forEach(client => client.write(`data: ${JSON.stringify(msgObj)}\n\n`));

  res.json({ success: true });
});

app.post('/api/chat/block', async (req, res) => {
  const { author, durationMinutes, reason } = req.body;
  if (!author || !durationMinutes) return res.status(400).json({ error: 'Author and durationMinutes required' });
  
  const db = await readDB();
  if (!db.blockedUsers) db.blockedUsers = {};
  db.blockedUsers[author] = Date.now() + (durationMinutes * 60 * 1000);
  await writeDB(db);
  
  const msgObj = { author: 'SYSTEM', text: `User [${author}] has been muted for ${durationMinutes} minutes. ${reason ? `Reason: ${reason}` : ''}`, role: 'system', timestamp: Date.now() };
  if (!db.sharedChat) db.sharedChat = [];
  db.sharedChat.push(msgObj);
  if (db.sharedChat.length > 100) db.sharedChat.shift();
  await writeDB(db);
  chatClients.forEach(client => client.write(`data: ${JSON.stringify(msgObj)}\n\n`));

  res.json({ success: true, message: `User ${author} blocked for ${durationMinutes} minutes.` });
});

app.get('/api/chat/history', async (req, res) => {
  const db = await readDB();
  res.json(db.sharedChat || []);
});

app.post('/api/vault', authenticate, async (req, res) => {
  try {
    const { action, text, password } = req.body;
    if (!text || !password) {
      return res.status(400).json({ error: 'Text and password are required' });
    }
    const key = crypto.scryptSync(password, 'forbidden-salt', 32);
    if (action === 'encrypt') {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      const payload = `${iv.toString('hex')}:${authTag}:${encrypted}`;
      return res.json({ result: payload });
    } else if (action === 'decrypt') {
      const parts = text.split(':');
      if (parts.length !== 3) return res.status(400).json({ error: 'Invalid encrypted payload' });
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(parts[2], 'hex', 'utf8') + decipher.final('utf8');
      return res.json({ result: decrypted });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Operation failed: Incorrect password or corrupted data' });
  }
});

// ==========================================================
// VAULT CLASSIFIED URL LINKS RBAC REGISTRY
// ==========================================================

function checkLinkAccess(link, callerProfile, callerRoles = [], callerPin = '') {
  if (callerProfile.toLowerCase() === 'architect' || callerPin === '672167566') {
    return true;
  }
  const accessLevel = (link.accessLevel || 'RESTRICTED').toUpperCase();
  const allowedProfiles = (link.allowedProfiles || []).map(p => p.toLowerCase());
  const isPublic = allowedProfiles.includes('*') || allowedProfiles.includes('public') || accessLevel === 'PUBLIC_CLEARANCE';
  const profileMatches = allowedProfiles.includes(callerProfile.toLowerCase());

  if (accessLevel === 'RESTRICTED') {
    return profileMatches;
  }

  if (isPublic) {
    return callerProfile && callerProfile.toLowerCase() !== 'guest';
  }

  if (profileMatches) return true;

  const linkRoles = (link.allowedRoles || []).map(r => r.toLowerCase());
  const userRoles = callerRoles.map(r => r.toLowerCase());
  return linkRoles.some(r => userRoles.includes(r));
}

app.get('/api/vault/links', async (req, res) => {
  const db = await readDB();
  const userPin = req.headers['x-user-pin'] || req.query.pin;
  const pinObj = userPin ? db.pins.find(p => p.pin === userPin) : null;
  const callerProfile = pinObj ? pinObj.label : (req.query.profile || 'Guest');
  const callerRoles = pinObj ? (pinObj.roles || []) : [];
  const isArchitect = callerProfile.toLowerCase() === 'architect' || userPin === '672167566';

  const links = (db.vaultLinks || []).map(link => {
    const canAccess = checkLinkAccess(link, callerProfile, callerRoles, userPin);
    return {
      ...link,
      canAccess,
      url: canAccess || isArchitect ? link.url : 'https://••••••••••••••••••••'
    };
  });

  res.json({
    callerProfile,
    callerRoles,
    isArchitect,
    links
  });
});

app.post('/api/vault/links', authenticate, async (req, res) => {
  const isArchitect = req.user.label === 'Architect' || req.user.pin === '672167566' || (req.user.roles && req.user.roles.includes('admin'));
  if (!isArchitect) {
    return res.status(403).json({ error: 'Architect clearance required to register links to the vault' });
  }

  const { title, url, category, description, allowedProfiles, allowedRoles, accessLevel } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  const db = await readDB();
  if (!db.vaultLinks) db.vaultLinks = [];

  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const newLink = {
    id: 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: title.trim(),
    url: normalizedUrl,
    category: (category || 'INFRASTRUCTURE').toUpperCase(),
    description: description ? description.trim() : 'Secure Vault Resource',
    allowedProfiles: Array.isArray(allowedProfiles) && allowedProfiles.length > 0 ? allowedProfiles : ['Architect'],
    allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : ['admin', 'vault'],
    accessLevel: accessLevel || (Array.isArray(allowedProfiles) && allowedProfiles.includes('*') ? 'PUBLIC_CLEARANCE' : 'RESTRICTED'),
    clicksCount: 0,
    createdBy: req.user.label || 'Architect',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  db.vaultLinks.unshift(newLink);

  if (!db.logs) db.logs = [];
  db.logs.unshift({
    type: 'VAULT_LINK_ADDED',
    user: req.user.label,
    linkId: newLink.id,
    title: newLink.title,
    timestamp: Date.now()
  });
  if (db.logs.length > 100) db.logs.pop();

  await writeDB(db);
  res.json({ success: true, link: newLink });
});

app.post('/api/vault/links/:id/permissions', authenticate, async (req, res) => {
  const isArchitect = req.user.label === 'Architect' || req.user.pin === '672167566' || (req.user.roles && req.user.roles.includes('admin'));
  if (!isArchitect) {
    return res.status(403).json({ error: 'Architect clearance required' });
  }

  const db = await readDB();
  const link = (db.vaultLinks || []).find(l => l.id === req.params.id);
  if (!link) return res.status(404).json({ error: 'Vault link not found' });

  const { allowedProfiles, allowedRoles, accessLevel } = req.body;
  if (Array.isArray(allowedProfiles)) link.allowedProfiles = allowedProfiles;
  if (Array.isArray(allowedRoles)) link.allowedRoles = allowedRoles;
  if (accessLevel) link.accessLevel = accessLevel;
  link.updatedAt = Date.now();

  await writeDB(db);
  res.json({ success: true, link });
});

app.delete('/api/vault/links/:id', authenticate, async (req, res) => {
  const isArchitect = req.user.label === 'Architect' || req.user.pin === '672167566' || (req.user.roles && req.user.roles.includes('admin'));
  if (!isArchitect) {
    return res.status(403).json({ error: 'Architect clearance required' });
  }

  const db = await readDB();
  const idx = (db.vaultLinks || []).findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Vault link not found' });

  const deleted = db.vaultLinks.splice(idx, 1)[0];
  await writeDB(db);
  res.json({ success: true, message: `Vault link ${deleted.id} deleted` });
});

app.post('/api/vault/links/:id/click', async (req, res) => {
  const db = await readDB();
  const link = (db.vaultLinks || []).find(l => l.id === req.params.id);
  if (!link) return res.status(404).json({ error: 'Vault link not found' });

  link.clicksCount = (link.clicksCount || 0) + 1;
  await writeDB(db);
  res.json({ success: true, clicksCount: link.clicksCount });
});


// Health check for Render uptime monitoring
app.get('/api/ping', (req, res) => res.json({ status: 'ONLINE', ts: Date.now() }));

// Gazette Profile Proxy — fetches a Georgia Gazette inmate page server-side to bypass CORS
app.get('/api/gazette-profile', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.includes('thegeorgiagazette.com')) {
    return res.status(400).json({ error: 'Invalid url parameter' });
  }
  try {
    const fetch = (await import('node-fetch')).default;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 12000
    });
    if (!r.ok) return res.status(r.status).json({ error: `Upstream ${r.status}` });
    const html = await r.text();

    // Basic HTML → text strip
    const stripTags = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const clean = stripTags(html);

    const charges = [];
    const name_match = clean.match(/Name[:\s]+([A-Z][a-zA-Z\s,]+?)(?=\s+Age|\s+Booking|\s+Arrest|$)/);
    const age_match = clean.match(/Age[:\s]+(\d+)/i);
    const bond_match = clean.match(/Bond[:\s]+([\$0-9,\.]+(?:\s+[a-zA-Z]+)*)/i);
    const date_match = clean.match(/(?:Booking|Arrest)\s+Date[:\s]+([A-Za-z0-9\s\/\-,]+?)(?=\s+[A-Z][a-z])/i);

    // Extract "Reason(s) For Booking" block
    const booking_match = html.match(/Reason(?:s)?\s*For\s*Booking[^<]*<\/[^>]+>\s*(.*?)(?=<\/(?:div|section|article)|<h\d)/is);
    if (booking_match) {
      const raw = stripTags(booking_match[1]);
      raw.split(/[\n;,]+/).forEach(c => {
        const t = c.trim();
        if (t.length > 4) charges.push(t);
      });
    }

    // Fallback: keyword scan
    if (charges.length === 0) {
      const chargeRx = /(felony|misdemeanor|assault|battery|theft|dui|drug|possession|warrant|burglary|trafficking|probation|murder|robbery|fraud|trespass|disorderly|resist|flee)/gi;
      const lines = clean.split(/[.!?]/);
      lines.forEach(line => {
        if (chargeRx.test(line) && line.length < 200) charges.push(line.trim());
      });
    }

    res.json({
      name: name_match ? name_match[1].trim() : '',
      age: age_match ? age_match[1] : '',
      bond: bond_match ? bond_match[1].trim() : '',
      booking_date: date_match ? date_match[1].trim() : '',
      charges: [...new Set(charges)].slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gazette listing proxy (legacy route)
app.get('/api/gazette/:name', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const searchUrl = `https://thegeorgiagazette.com/?s=${encodeURIComponent(req.params.name)}`;
    const r = await fetch(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    let html = await r.text();
    const cleanHtml = sanitizeHtml(html, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'style', 'html', 'head', 'body', 'title', 'meta', 'link' ]),
        allowedAttributes: {
            '*': ['class', 'id', 'style'],
            'a': ['href', 'name', 'target'],
            'img': ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
            'link': ['href', 'rel', 'type']
        },
        allowVulnerableTags: true,
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(cleanHtml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================
// ONLINE NOTARIZATION MULTI-AGENT SWARM ENDPOINTS
// ==========================================================
app.get('/api/notarize/slots', async (req, res) => {
  const baseMs = Date.now();
  const fiveMin = 5 * 60 * 1000;
  const nextMark = Math.ceil((baseMs + 8 * 60 * 1000) / fiveMin) * fiveMin;

  const slots = [
    {
      slotId: `SLOT-${Math.floor((nextMark / 1000) % 100000)}-A1`,
      isoTime: new Date(nextMark).toISOString(),
      displayTime: new Date(nextMark).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (IN ~10 MIN)',
      notaryAgent: 'COMMISSIONER V. KOVACS // RON-NODE-01',
      jurisdiction: 'US-GA // CYBER-JURISDICTION SEC-7',
      available: true,
      priority: 'SOONEST_IMMEDIATE'
    },
    {
      slotId: `SLOT-${Math.floor(((nextMark + 15 * 60000) / 1000) % 100000)}-B2`,
      isoTime: new Date(nextMark + 15 * 60000).toISOString(),
      displayTime: new Date(nextMark + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (+25 MIN)',
      notaryAgent: 'NOTARY SYNTH-UNIT // RON-NODE-04',
      jurisdiction: 'US-DE // CORPORATE ESCROW GRID',
      available: true,
      priority: 'STANDARD'
    }
  ];

  res.json({ status: 'ONLINE', selectedSlot: slots[0], slots });
});

app.get('/api/notarize/sessions', async (req, res) => {
  const db = await readDB();
  res.json(db.notarizations || []);
});

app.post('/api/notarize/swarm', async (req, res) => {
  try {
    const payload = req.body || {};
    const db = await readDB();
    if (!db.notarizations) db.notarizations = [];

    const sessionRecord = {
      sessionId: payload.sessionId || `RON-SWARM-${Date.now()}`,
      status: payload.status || 'COMPLETED_AND_BOOKED',
      executionMode: 'PARALLEL_MULTI_AGENT_SWARM',
      signerName: payload.signerName || 'Architect',
      createdAt: payload.createdAt || new Date().toISOString(),
      sealCertificateId: payload.sealCertificateId || `AC-SEAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      pdf: payload.pdf || null,
      funds: payload.funds || null,
      booking: payload.booking || null
    };

    db.notarizations.unshift(sessionRecord);
    if (db.notarizations.length > 50) db.notarizations = db.notarizations.slice(0, 50);
    await writeDB(db);

    res.json({ success: true, session: sessionRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notarize/seal-pdf', async (req, res) => {
  try {
    const {
      documentName = 'AlphaCore_Affidavit.pdf',
      documentType = 'AFFIDAVIT',
      signerName = 'Architect',
      sha256 = '',
      sealCertificateId = 'AC-SEAL-VERIFIED',
      bookingConfirmationCode = 'RON-BOOKED',
      slotDisplayTime = 'IMMEDIATE'
    } = req.body || {};

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.json({
        success: true,
        filename: `NOTARIZED_${documentName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        b64: pdfBuffer.toString('base64'),
        mimeType: 'application/pdf'
      });
    });

    doc.fontSize(16).text('ALPHACORE TECH // REMOTE ONLINE NOTARIZATION', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`SEAL CERTIFICATE ID: ${sealCertificateId}`, { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(11).text(`Document Name: ${documentName}`);
    doc.text(`Document Class: ${documentType}`);
    doc.text(`Principal Signer: ${signerName}`);
    doc.text(`Booking Reference: ${bookingConfirmationCode}`);
    doc.text(`Scheduled Slot: ${slotDisplayTime}`);
    doc.text(`SHA-256 Digest: ${sha256 || crypto.createHash('sha256').update(documentName + signerName).digest('hex')}`);
    doc.moveDown(1.5);
    doc.fontSize(10).text('CRYPTOGRAPHIC JURAT & DIGITAL NOTARY SEAL:', { underline: true });
    doc.moveDown(0.5);
    doc.text('State of Georgia, Cyber-Jurisdiction Sector 7. Subscribed and sworn before the AlphaCore Autonomous RON Swarm Engine via multi-agent verification.');
    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build if exists
app.use(express.static(path.join(_dirname, 'dist')));

if (!process.env.NETLIFY) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[SYS] AlphaCore Database Server running on port ${PORT}`);
  });
}

export default app;