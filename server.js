import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { spawn } from 'child_process';
import PDFDocument from 'pdfkit';
import sanitizeHtml from 'sanitize-html';

const _filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(_dirname, 'data.json');

const DEFAULT_DB = {
  pins: [
    { pin: '672167566', type: 'permanent', label: 'Architect', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() },
    { pin: '6969', type: 'permanent', label: 'DoeBoy', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() },
    { pin: '20022005', type: 'permanent', label: 'J. P.', roles: ['aimodals', 'generate'], createdAt: Date.now() },
    { pin: '1990', type: 'permanent', label: 'Fisherman', roles: ['aimodals', 'generate'], createdAt: Date.now() }
  ],
  logs: [],
  pendingProfiles: [],
  settings: {
    txt2imgUrl: 'https://alphacoreprogramming--alphacore-aio-backend-txt2img-web-txt2img.modal.run',
    img2imgUrl: 'https://alphacoreprogramming--alphacore-aio-backend-img2img-web-img2img.modal.run',
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

app.post('/api/chat', async (req, res) => {
  res.json({ reply: 'this feature is still in development.' });
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

// Serve frontend build if exists
app.use(express.static(path.join(_dirname, 'dist')));

if (!process.env.NETLIFY) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[SYS] AlphaCore Database Server running on port ${PORT}`);
  });
}

export default app;