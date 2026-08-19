const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  try {
    const html = await fetchUrl('https://html.duckduckgo.com/html/?q=fannin+county+mugshots');
    const links = [...html.matchAll(/<a[^>]+class="result__url"[^>]+href="([^"]+)"/gi)].map(m => m[1]);
    console.log("Links found:\n" + links.slice(0, 5).join('\n'));
  } catch(e) { console.error(e); }
}
test();
