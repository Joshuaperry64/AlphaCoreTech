const https = require('https');

https.get("https://thegeorgiagazette.com/fannin/james-parks-19/", { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
     // Extract text from the post body
     const bodyMatch = data.match(/<div class="post56__content.*?>(.*?)<\/div>/s);
     if(bodyMatch) {
         console.log(bodyMatch[1].replace(/<[^>]+>/g, '\n').substring(0, 1000));
     } else {
         console.log(data.substring(0, 1000));
     }
  });
}).on("error", console.error);
