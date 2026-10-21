import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { spawn } from 'child_process';
import PDFDocument from 'pdfkit';
import sanitizeHtml from 'sanitize-html';
import { Readable } from 'stream';

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
app.use(express.json());

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

app.get('/api/pins', async (req, res) => {
  const db = await readDB();
  const userPin = req.headers['x-user-pin'];
  const isAuthenticated = userPin && db.pins.some(p => p.pin === userPin);

  if (isAuthenticated) {
    res.json(db.pins);
  } else {
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

  if (db.pins.some(p => p.pin === pin)) {
    return res.status(400).json({ error: 'PIN already in use' });
  }

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
  
