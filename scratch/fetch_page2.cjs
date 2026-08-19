const https = require('https');
https.get("https://thegeorgiagazette.com/fannin/page/2/", { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  console.log(`Status: ${res.statusCode}`);
}).on("error", console.error);
