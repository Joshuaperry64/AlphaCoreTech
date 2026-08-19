const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function testFbApi() {
  const appId = '1342941991353756';
  const appSecret = 'a6ca1b29c5b8cff96e725df2564e807f';
  
  try {
    console.log('1. Getting App Access Token...');
    const tokenRes = await fetchUrl(`https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`);
    console.log('Token Res:', tokenRes);
    
    if (tokenRes.access_token) {
      console.log('\n2. Fetching FanninCountyCrime posts...');
      const target = 'FanninCountyCrime';
      const postsRes = await fetchUrl(`https://graph.facebook.com/v19.0/${target}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=5&access_token=${tokenRes.access_token}`);
      console.log('Posts Res:', JSON.stringify(postsRes, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testFbApi();
