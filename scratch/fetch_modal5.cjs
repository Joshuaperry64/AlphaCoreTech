const https = require('https');
const url = "https://ai-alphacore-tech--fannin-crime-fastapi-app.modal.run/api/mugshots";
https.get(url, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
     let d = JSON.parse(data);
     console.log(`Count: ${d.count}`);
     d.data.forEach(p => console.log(p.id));
  });
}).on("error", console.error);
