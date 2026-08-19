const https = require('https');
https.get("https://ai-alphacore-tech--fannin-crime-fastapi-app.modal.run/api/mugshots", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
     let d = JSON.parse(data);
     console.log(`Source: ${d.source}`);
  });
}).on("error", console.error);
