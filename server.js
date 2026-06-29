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
    { pin: '672167566', type: 'permanent', label: 'Master Admin PIN', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() }
  ],
  logs: [],
  settings: {
    txt2imgUrl: 'https://ai-alphacore-tech--text-to-image-sdxl-merger-inference-web.modal.run/',
    img2imgUrl: 'https://ai-alphacore-tech--img2img-qwen-edit-plus-model-web.modal.run/',
    negativePrompt: 'worst quality, low quality, censorship, text, watermark, signature, blur, bad anatomy, ugly, deformed',
    stepsFastTxt: 2, stepsFocusedTxt: 4, stepsNormalTxt: 8,
    stepsFastImg: 20, stepsFocusedImg: 30, stepsNormalImg: 40,
    guidanceImg: 7.0
  }
};

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
    return DEFAULT_DB;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    if (!data.pins) data.pins = DEFAULT_DB.pins;
    if (!data.logs) data.logs = [];
    if (!data.settings) data.settings = DEFAULT_DB.settings;
    return data;
  } catch (e) {
    console.error("Error reading DB", e);
    return DEFAULT_DB;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/pins', (req, res) => res.json(readDB().pins));
app.post('/api/pins', (req, res) => {
  const db = readDB();
  db.pins = req.body;
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/logs', (req, res) => res.json(readDB().logs));
app.post('/api/logs', (req, res) => {
  const db = readDB();
  db.logs = req.body;
  writeDB(db);
  res.json({ success: true });
});

app.get('/api/settings', (req, res) => res.json(readDB().settings));
app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = req.body;
  writeDB(db);
  res.json({ success: true });
});

// Serve frontend build if exists
app.use(express.static(path.join(__dirname, 'dist')));

app.listen(3000, () => {
  console.log('[SYS] AlphaCore Database Server running on port 3000');
});
