import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function testVectors() {
  console.log('--- VECTOR 1: CorsProxy FB Direct ---');
  try {
    const html1 = await fetchUrl('https://corsproxy.io/?' + encodeURIComponent('https://www.facebook.com/FanninCountyCrime'));
    console.log('CorsProxy len:', html1.length);
    const images1 = (html1.match(/scontent[^\s"'<>]+/gi) || []);
    console.log('CorsProxy scontent images found:', images1.length);
    if (images1.length > 0) console.log('Sample image:', images1[0].substring(0, 100));
  } catch(e) { console.error('V1 err:', e.message); }

  console.log('\n--- VECTOR 2: AllOrigins FB Direct ---');
  try {
    const html2 = await fetchUrl('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.facebook.com/FanninCountyCrime'));
    console.log('AllOrigins len:', html2.length);
    const images2 = (html2.match(/scontent[^\s"'<>]+/gi) || []);
    console.log('AllOrigins scontent images found:', images2.length);
  } catch(e) { console.error('V2 err:', e.message); }
}

testVectors();
