import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'data.json');

const DEFAULT_DB = {
  pins: [
    { pin: '672167566', type: 'permanent', label: 'Architect', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() },
    { pin: '6969', type: 'permanent', label: 'DoeBoy', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() }
  ],
  logs: [],
  settings: {
    txt2imgUrl: 'https://ai-alphacore-tech--text-to-image-sdxl-merger-inference-web.modal.run/',
    img2imgUrl: 'https://ai-alphacore-tech--img2img-qwen-edit-plus-model-web.modal.run/',
    negativePrompt: 'worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts',
    stepsFastTxt: 10, stepsFocusedTxt: 50, stepsNormalTxt: 20,
    stepsFastImg: 8, stepsFocusedImg: 30, stepsNormalImg: 17,
    guidanceImg: 4.0
  }
};

let dbCache = null;

async function readDB() {
  if (dbCache) return dbCache;

  try {
    try {
      await fs.promises.access(DB_PATH);
    } catch {
      await fs.promises.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
      dbCache = JSON.parse(JSON.stringify(DEFAULT_DB));
      return dbCache;
    }
    const data = JSON.parse(await fs.promises.readFile(DB_PATH, 'utf-8'));
    if (!data.pins) data.pins = DEFAULT_DB.pins;
    if (!data.logs) data.logs = [];
    if (!data.settings) data.settings = DEFAULT_DB.settings;
    dbCache = data;
    return dbCache;
  } catch (e) {
    console.error("Error reading DB", e);
    dbCache = JSON.parse(JSON.stringify(DEFAULT_DB));
    return dbCache;
  }
}

async function writeDB(data) {
  dbCache = data;
  await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/pins', async (req, res) => res.json((await readDB()).pins));
app.post('/api/pins', async (req, res) => {
  const db = await readDB();
  db.pins = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/logs', async (req, res) => res.json((await readDB()).logs));
app.post('/api/logs', async (req, res) => {
  const db = await readDB();
  db.logs = req.body;
  await writeDB(db);
  res.json({ success: true });
});

app.get('/api/settings', async (req, res) => res.json((await readDB()).settings));
app.post('/api/settings', async (req, res) => {
  const db = await readDB();
  db.settings = req.body;
  await writeDB(db);
  res.json({ success: true });
});

// Serve frontend build if exists
app.use(express.static(path.join(__dirname, 'dist')));

app.listen(3000, () => {
  console.log('[SYS] AlphaCore Database Server running on port 3000');
});
