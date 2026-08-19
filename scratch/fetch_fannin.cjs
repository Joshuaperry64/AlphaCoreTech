const https = require('https');
https.get("https://app.fannincountyga.com/InmateSearch/", { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  console.log(`Fannin Status: ${res.statusCode}`);
}).on("error", () => console.log('Failed'));
