const { getStore } = require("@netlify/blobs");

const DEFAULT_DB = {
  pins: [
    { pin: '672167566', type: 'permanent', label: 'Architect', roles: ['admin', 'vault', 'aimodals', 'generate', 'lora', 'diagnostics'], createdAt: Date.now() }
  ],
  logs: [],
  settings: {
    txt2imgUrl: 'https://josh627764--text-to-image-sdxl-merger-inference-web.modal.run/',
    img2imgUrl: 'https://josh627764--img2img-qwen-edit-plus-model-web.modal.run/',
    negativePrompt: 'worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts',
    stepsFastTxt: 10, stepsFocusedTxt: 50, stepsNormalTxt: 20,
    stepsFastImg: 8, stepsFocusedImg: 30, stepsNormalImg: 17,
    guidanceImg: 4.0
  }
};

exports.handler = async (event) => {
  // Extract path, e.g., from "/api/pins" get "pins"
  let path = event.path;
  if (path.startsWith('/api/')) {
    path = path.slice(5).replace(/\/$/, '');
  } else if (path.startsWith('/.netlify/functions/api/')) {
    path = path.slice(24).replace(/\/$/, '');
  }

  const method = event.httpMethod;
  const store = getStore("alphacore_db");

  try {
    let data = await store.get("db", { type: "json" });
    if (!data) {
      data = DEFAULT_DB;
      await store.setJSON("db", data);
    }

    // Ensure all keys exist
    if (!data.pins) data.pins = DEFAULT_DB.pins;
    if (!data.logs) data.logs = [];
    if (!data.settings) data.settings = DEFAULT_DB.settings;

    if (method === 'GET') {
      if (path === 'pins') {
        const headers = event.headers || {};
        const userPin = headers['x-user-pin'] || headers['X-User-Pin'];
        const isAuthenticated = userPin && data.pins.some(p => p.pin === userPin);

        if (isAuthenticated) {
          return { statusCode: 200, body: JSON.stringify(data.pins) };
        } else {
          const safePins = data.pins.map(p => {
            const safePin = { ...p };
            delete safePin.pin;
            return safePin;
          });
          return { statusCode: 200, body: JSON.stringify(safePins) };
        }
      }

      const headers = event.headers || {};
      const userPin = headers['x-user-pin'] || headers['X-User-Pin'];
      const pinObj = data.pins.find(p => p.pin === userPin);

      if (!pinObj) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
      }

      if (path === 'logs') return { statusCode: 200, body: JSON.stringify(data.logs) };
      if (path === 'settings') return { statusCode: 200, body: JSON.stringify(data.settings) };
      return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
    }

    if (method === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
      }

      if (path === 'auth') {
        const { pin, requiredRole } = body || {};
        const found = data.pins.find(p => p.pin === pin);

        if (!found) {
          return { statusCode: 200, body: JSON.stringify({ valid: false, reason: 'ACCESS DENIED' }) };
        }

        if (requiredRole && (!found.roles || !found.roles.includes(requiredRole))) {
          return { statusCode: 200, body: JSON.stringify({ valid: false, reason: `INSUFFICIENT CLEARANCE: REQUIRES [${requiredRole.toUpperCase()}]` }) };
        }

        if (found.type === 'one-time') {
          if (found.used) {
            return { statusCode: 200, body: JSON.stringify({ valid: false, reason: 'ONE-TIME PIN EXPIRED' }) };
          }
          found.used = true;
          data.pins = data.pins.filter(p => p.pin !== pin);
          await store.setJSON("db", data);
          return { statusCode: 200, body: JSON.stringify({ valid: true, pinObj: found, isOtp: true }) };
        }

        if (found.type === 'temporary') {
          if (Date.now() > found.expiresAt) {
            return { statusCode: 200, body: JSON.stringify({ valid: false, reason: 'TEMPORARY PIN EXPIRED' }) };
          }
          return { statusCode: 200, body: JSON.stringify({ valid: true, pinObj: found }) };
        }

        return { statusCode: 200, body: JSON.stringify({ valid: true, pinObj: found }) };
      }

      // Ensure authentication for other POST routes
      const headers = event.headers || {};
      const userPin = headers['x-user-pin'] || headers['X-User-Pin'];
      const pinObj = data.pins.find(p => p.pin === userPin);

      if (!pinObj) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
      }

      if (path === 'pins') {
        data.pins = body;
      } else if (path === 'logs') {
        data.logs = body;
      } else if (path === 'settings') {
        data.settings = body;
      } else {
        return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };
      }

      await store.setJSON("db", data);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (error) {
    console.error("API error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
