// Netlify Serverless Function — RunPod Proxy
// API key lives in Netlify dashboard env vars, never in source.
// Set: RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID in Netlify → Site Settings → Environment Variables

const API_KEY     = process.env.RUNPOD_API_KEY;
const ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID;
const BASE_URL    = `https://api.runpod.ai/v2/${ENDPOINT_ID}`;

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!API_KEY || !ENDPOINT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server misconfiguration: env vars not set.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  const { action, jobId, payload } = body;

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    let runpodRes;

    if (action === 'run') {
      // Submit a new job
      runpodRes = await fetch(`${BASE_URL}/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } else if (action === 'status') {
      // Poll existing job
      if (!jobId) return { statusCode: 400, body: JSON.stringify({ error: 'jobId required for status.' }) };
      runpodRes = await fetch(`${BASE_URL}/status/${jobId}`, {
        method: 'GET',
        headers
      });
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }

    const data = await runpodRes.json();
    return {
      statusCode: runpodRes.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `Proxy error: ${err.message}` })
    };
  }
};
