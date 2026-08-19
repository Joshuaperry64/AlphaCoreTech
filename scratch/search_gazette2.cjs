const https = require('https');
https.get("https://thegeorgiagazette.com/?s=joshua+perry", { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
     let matches = data.match(/<a href="([^"]+)">\s*Joshua Perry/gi);
     if (matches) {
         matches.forEach(m => console.log(m));
     }
  });
}).on("error", console.error);
