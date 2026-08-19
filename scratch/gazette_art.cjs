const https = require('https');
https.get('https://thegeorgiagazette.com/fannin/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const art = data.split('<article')[2].split('</article>')[0];
    console.log(art.substring(0, 1500));
  });
});
