const https = require('https');

https.get("https://ai-alphacore-tech--fannin-crime-fastapi-app.modal.run/api/mugshots", (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => console.log(data.substring(0, 2000)));
}).on("error", console.error);
