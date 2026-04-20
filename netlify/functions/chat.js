// Netlify Serverless Function — Gemini API Chat Proxy
// Set GEMINI_API_KEY in Netlify → Site Settings → Environment Variables

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { message, history } = JSON.parse(event.body || '{}');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: 'Gemini API key not set' };
  }
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          ...(history || []),
          { role: 'user', parts: [{ text: message }] }
        ]
      })
    });
    const data = await res.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
