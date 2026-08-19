const https = require('https');
https.get("https://thegeorgiagazette.com/?s=joshua+perry", { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
     let matches = data.match(/<h2 class="title56[^>]*>.*?<a[^>]*>(.*?)<\/a>/gs);
     if (matches) {
         matches.forEach(m => {
             let text = m.replace(/<[^>]+>/g, '').trim();
             console.log(text);
         });
     } else {
         console.log("No matches found");
     }
  });
}).on("error", console.error);
