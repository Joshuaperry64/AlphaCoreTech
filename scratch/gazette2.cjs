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
    const html = await fetchUrl('https://thegeorgiagazette.com/fannin/');
    console.log("HTML len:", html.length);
    const titleMatch = html.match(/<a[^>]+href="https:\/\/thegeorgiagazette\.com\/fannin\/[^"]+"[^>]*>([^<]+)<\/a>/g);
    console.log(titleMatch.slice(0, 10));
  } catch(e) { console.error(e); }
}
test();
