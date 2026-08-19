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
    console.log("HTML len:", html.length);
    
    const posts = [];
    const articles = html.split('<article');
    for (let i=1; i<articles.length; i++) {
        const art = articles[i];
        const imgMatch = art.match(/src=["']([^"']+)["']/);
        const titleMatch = art.match(/<h3[^>]*>.*?<a[^>]*>(.*?)<\/a>/s);
        const linkMatch = art.match(/<h3[^>]*>.*?<a[^>]*href=["']([^"']+)["']/s);
        
        if (titleMatch) {
            posts.push({
                img: imgMatch ? imgMatch[1] : '',
                title: titleMatch[1].replace(/&#\d+;/g, '').trim(),
                link: linkMatch ? linkMatch[1] : ''
            });
        }
    }
    
    console.log(`Found ${posts.length} records`);
    console.log(posts.slice(0, 3));
  } catch(e) { console.error(e); }
}
test();
