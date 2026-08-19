const https = require('https');
https.get("https://bustednewspaper.com/georgia/fannin/", { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
     let count = (data.match(/<article/g) || []).length;
     console.log(`BustedNewspaper articles: ${count}`);
  });
}).on("error", console.error);
