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
    const html = await fetchUrl('https://thegeorgiagazette.com/fannin/');
    
    const posts = [];
    // The items are likely inside <article> or list items. Let's find images.
    const blocks = html.split('<div class="l-post-grid-wrap');
    if(blocks.length > 1) {
       const gridHtml = blocks[1];
       const regex = /<article.*?<img[^>]*src=["']([^"']+)["'][^>]*>.*?<a href=["']([^"']+)["'][^>]*>\s*(.*?)\s*<\/a>.*?<\/article>/gs;
       
       let match;
       while ((match = regex.exec(html)) !== null) {
          posts.push({
             img: match[1],
             link: match[2],
             name: match[3].trim()
          });
       }
    }
    console.log(`Found ${posts.length} records`);
    console.log(posts.slice(0, 3));
  } catch(e) { console.error(e); }
}
test();
