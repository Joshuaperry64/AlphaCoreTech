const https = require('https');
https.get("https://thegeorgiagazette.com/fannin/page/2/", { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
     let count = (data.match(/<article/g) || []).length;
     console.log(`Articles on page 2: ${count}`);
  });
}).on("error", console.error);
