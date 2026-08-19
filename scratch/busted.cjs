const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  try {
    const html = await fetchUrl('https://georgia.bustednewspaper.com/category/fannin-county/');
    console.log("HTML len:", html.length);
    
    // Extract titles/names and image URLs
    const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*class=["'][^"']*wp-post-image/gi)].map(m => m[1]);
    const names = [...html.matchAll(/<h3[^>]*class=["']title["'][^>]*><a[^>]+>([^<]+)<\/a>/gi)].map(m => m[1].replace(/&#\d+;/g, '').trim());
    
    console.log(`Found ${imgs.length} images and ${names.length} names`);
    for (let i=0; i<Math.min(imgs.length, 3); i++) {
       console.log(`- ${names[i]} : ${imgs[i]}`);
    }
  } catch(e) { console.error(e); }
}
test();
