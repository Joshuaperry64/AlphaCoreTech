/**
 * RECON & DOSSIER — AlphaCore v4.0
 * All-client-side OSINT engine using free public APIs (no key required).
 *
 * Modules:
 *  1. Smart target detection (IP / email / domain / username)
 *  2. IP Geolocation   — ip-api.com (free, no key)
 *  3. WHOIS            — RDAP.org  (free, no key)
 *  4. DNS / MX lookup  — Cloudflare DNS-over-HTTPS (free)
 *  5. GitHub profile   — api.github.com (free, 60 req/hr anon)
 *  6. Reddit profile   — www.reddit.com/user/{u}/about.json
 *  7. Gravatar detect  — gravatar.com MD5 hash probe
 *  8. Breach check     — xposedornot.com (free, no key)
 *  9. Social footprint — Constructed direct-link matrix (always available)
 * 10. HackerNews       — hacker-news.firebaseio.com (free, no key)
 */

export default function ReconPage() {
  const container = document.createElement('div');
  container.className = 'page-content slide-up';

  container.innerHTML = 
    <div class="page-header">
      <h1 class="page-title">RECON &amp; DOSSIER</h1>
      <p class="page-subtitle">ADVANCED OSINT GATHERING AND PROFILING ENGINE</p>
    </div>
    <div class="aim-row" style="margin-bottom:16px; gap:8px; flex-wrap:wrap;">
      <button class="aim-btn aim-btn-sm recon-mode-btn active" data-mode="auto" style="border-color:#06b6d4; color:#06b6d4;">AUTO-DETECT</button>
      <button class="aim-btn aim-btn-sm recon-mode-btn" data-mode="ip">IP ADDRESS</button>
      <button class="aim-btn aim-btn-sm recon-mode-btn" data-mode="domain">DOMAIN</button>
      <button class="aim-btn aim-btn-sm recon-mode-btn" data-mode="email">EMAIL</button>
      <button class="aim-btn aim-btn-sm recon-mode-btn" data-mode="username">USERNAME</button>
    </div>
    <div class="aim-row" style="margin-bottom: 24px;">
      <div class="aim-field" style="width: 100%;">
        <label class="aim-label">TARGET IDENTIFIER</label>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <input type="text" id="recon-target" class="aim-input" placeholder="IP, domain, email, or @username..." style="flex: 1; min-width: 200px;" />
          <button id="recon-btn" class="aim-btn-generate" style="flex: 1; min-width: 180px; max-width: 260px;">
            <span class="aim-btn-icon">&#x1F441;</span> INITIATE SCAN
          </button>
          <button id="recon-clear-btn" class="aim-btn aim-btn-sm" style="align-self:center; opacity:0.6;">CLEAR</button>
        </div>
      </div>
    </div>
    <div id="recon-progress-wrap" style="display:none; margin-bottom:16px; width:100%; height:4px; background:rgba(255,255,255,0.07); border-radius:2px; overflow:hidden;">
      <div id="recon-progress-bar" style="height:100%; width:0%; background:linear-gradient(90deg,#06b6d4,#a855f7); transition:width 0.3s ease; box-shadow:0 0 8px #06b6d4;"></div>
    </div>
    <div class="aim-row" style="gap: 20px; align-items: flex-start; flex-wrap: wrap;">
      <div class="aim-panel" style="flex: 1; min-width: 280px; min-height: 450px; display: flex; flex-direction: column;">
        <div class="aim-panel-header"><span class="aim-panel-icon">&#x1F4E1;</span><span class="aim-panel-title">TELEMETRY STREAM</span></div>
        <div id="recon-terminal" style="flex:1; background:#030712; border:1px solid rgba(0,184,255,0.2); padding:15px; font-family:monospace; font-size:12px; color:#00b8ff; overflow-y:auto; text-shadow:0 0 5px rgba(0,184,255,0.3); white-space:pre-line; max-height:600px;">[SYS] WAITING FOR TARGET...</div>
      </div>
      <div class="aim-panel" style="flex:2; min-width:280px; display:flex; flex-direction:column; opacity:0.5; transition:opacity 0.4s;" id="recon-dossier-wrap">
        <div class="aim-panel-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div><span class="aim-panel-icon">&#x1F4C1;</span><span class="aim-panel-title">COMPILED DOSSIER</span></div>
          <button id="recon-export-btn" class="aim-btn aim-btn-sm" style="font-size:0.7rem; opacity:0.7; display:none;">EXPORT JSON</button>
        </div>
        <div id="recon-dossier" style="flex:1; padding:20px; overflow-y:auto; max-height:600px;">
          <div id="dossier-placeholder" style="text-align:center; margin:auto; padding-top:60px;">
            <div style="font-size:14px; letter-spacing:2px; color:#fff; opacity:0.3; margin-top:12px;">NO DATA</div>
          </div>
        </div>
      </div>
    </div>
  ;

  const btn = container.querySelector('#recon-btn');
  const clearBtn = container.querySelector('#recon-clear-btn');
  const input = container.querySelector('#recon-target');
  const terminal = container.querySelector('#recon-terminal');
  const dossierWrap = container.querySelector('#recon-dossier-wrap');
  const dossier = container.querySelector('#recon-dossier');
  const progressWrap = container.querySelector('#recon-progress-wrap');
  const progressBar = container.querySelector('#recon-progress-bar');
  const exportBtn = container.querySelector('#recon-export-btn');

  let currentMode = 'auto';
  let lastResult = null;

  container.querySelectorAll('.recon-mode-btn').forEach(b => {
    b.addEventListener('click', () => {
      container.querySelectorAll('.recon-mode-btn').forEach(x => { x.classList.remove('active'); x.style.borderColor = ''; x.style.color = ''; });
      b.classList.add('active'); b.style.borderColor = '#06b6d4'; b.style.color = '#06b6d4';
      currentMode = b.dataset.mode;
    });
  });

  function log(msg, type = 'SYS') {
    const ts = new Date().toTimeString().slice(0, 8);
    const colors = { SYS: '#00b8ff', SUCCESS: '#00ff8c', ERROR: '#ff003c', WARN: '#ffaa00', DATA: '#a855f7' };
    const safe = String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    terminal.innerHTML += '\n<span style="color:' + (colors[type]||'#00b8ff') + '">[' + type + '] ' + ts + '</span>: ' + safe;
    terminal.scrollTop = terminal.scrollHeight;
  }

  function setProgress(pct) { progressWrap.style.display = 'block'; progressBar.style.width = pct + '%'; }

  function detectType(t) {
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t)) return 'ip';
    if (t.includes('@')) return 'email';
    if (/^[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}/.test(t)) return 'domain';
    return 'username';
  }

  function md5hex(str) {
    function safeAdd(x,y){const l=(x&0xffff)+(y&0xffff);return((x>>16)+(y>>16)+(l>>16))<<16|l&0xffff;}
    function brl(n,c){return n<<c|n>>>(32-c);}
    function cmn(q,a,b,x,s,t){return safeAdd(brl(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t){return cmn(b&c|~b&d,a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn(b&d|c&~d,a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
    function blks(s){const n=(s.length+8>>6)+1,b=new Array(n*16).fill(0);for(let i=0;i<s.length;i++)b[i>>2]|=s.charCodeAt(i)<<(i%4)*8;b[s.length>>2]|=0x80<<(s.length%4)*8;b[n*16-2]=s.length*8;return b;}
    const x=blks(str);let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for(let i=0;i<x.length;i+=16){const[oa,ob,oc,od]=[a,b,c,d];
      a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
      a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=safeAdd(a,oa);b=safeAdd(b,ob);c=safeAdd(c,oc);d=safeAdd(d,od);
    }
    return [a,b,c,d].map(n=>{let h='';for(let j=0;j<4;j++)h+=('0'+((n>>j*8)&0xFF).toString(16)).slice(-2);return h;}).join('');
  }

  async function fetchIPGeo(ip) {
    log('Querying geolocation for ' + ip + '...');
    try {
      const r = await fetch('https://ip-api.com/json/' + ip + '?fields=status,message,country,regionName,city,zip,lat,lon,isp,org,as,reverse,mobile,proxy,hosting,query');
      const d = await r.json();
      if (d.status === 'success') { log('Geolocation resolved: ' + d.city + ', ' + d.regionName + ', ' + d.country, 'SUCCESS'); return d; }
      throw new Error(d.message || 'Geo lookup failed');
    } catch(e) { log('Geolocation error: ' + e.message, 'WARN'); return null; }
  }

  async function fetchDNS(domain, type) {
    try {
      const r = await fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=' + type, { headers: { 'Accept': 'application/dns-json' } });
      const d = await r.json(); return d.Answer || [];
    } catch { return []; }
  }

  async function fetchWHOIS(domain) {
    log('Querying RDAP for ' + domain + '...');
    try {
      const rdap = await fetch('https://rdap.org/domain/' + encodeURIComponent(domain));
      if (!rdap.ok) throw new Error('RDAP unavailable');
      const d = await rdap.json(); log('RDAP record fetched for ' + domain, 'SUCCESS'); return d;
    } catch(e) { log('WHOIS/RDAP: ' + e.message, 'WARN'); return null; }
  }

  async function fetchGitHub(username) {
    log('Probing GitHub for @' + username + '...');
    try {
      const r = await fetch('https://api.github.com/users/' + encodeURIComponent(username));
      if (!r.ok) { log('GitHub: user not found', 'WARN'); return null; }
      const d = await r.json(); log('GitHub profile found: ' + (d.name||d.login) + ' — ' + d.public_repos + ' repos', 'SUCCESS'); return d;
    } catch(e) { log('GitHub error: ' + e.message, 'WARN'); return null; }
  }

  async function fetchGitHubRepos(username) {
    try { const r = await fetch('https://api.github.com/users/' + encodeURIComponent(username) + '/repos?sort=pushed&per_page=5'); if (!r.ok) return []; return await r.json(); } catch { return []; }
  }

  async function fetchReddit(username) {
    log('Probing Reddit for u/' + username + '...');
    try {
      const r = await fetch('https://www.reddit.com/user/' + encodeURIComponent(username) + '/about.json');
      if (!r.ok) { log('Reddit: user not found or suspended', 'WARN'); return null; }
      const d = await r.json(); if (d.error) { log('Reddit: ' + d.message, 'WARN'); return null; }
      log('Reddit profile found: u/' + d.data.name + ' — ' + d.data.link_karma + ' link karma', 'SUCCESS'); return d.data;
    } catch(e) { log('Reddit error: ' + e.message, 'WARN'); return null; }
  }

  async function fetchHackerNews(username) {
    log('Probing HackerNews for ' + username + '...');
    try {
      const r = await fetch('https://hacker-news.firebaseio.com/v0/user/' + encodeURIComponent(username) + '.json');
      const d = await r.json(); if (!d) { log('HackerNews: user not found', 'WARN'); return null; }
      log('HackerNews: ' + username + ' — karma ' + d.karma, 'SUCCESS'); return d;
    } catch(e) { log('HackerNews error: ' + e.message, 'WARN'); return null; }
  }

  async function checkGravatar(email) {
    log('Checking Gravatar for ' + email + '...');
    try {
      const hash = md5hex(email.trim().toLowerCase());
      const r = await fetch('https://www.gravatar.com/' + hash + '.json');
      if (!r.ok) { log('Gravatar: no profile linked', 'WARN'); return null; }
      const d = await r.json(); log('Gravatar profile found: ' + (d.entry?.[0]?.displayName||'unknown'), 'SUCCESS');
      return { hash, entry: d.entry?.[0] };
    } catch(e) { log('Gravatar error: ' + e.message, 'WARN'); return null; }
  }

  async function checkBreaches(email) {
    log('Checking breach databases for ' + email + '...');
    try {
      const r = await fetch('https://api.xposedornot.com/v1/check-email/' + encodeURIComponent(email));
      if (r.status === 404) { log('Breach check: no breaches found', 'SUCCESS'); return { found: false }; }
      const d = await r.json(); const count = d.breaches_details?.length || 0;
      log('Breach check: ' + count + ' breach(es) found', count > 0 ? 'WARN' : 'SUCCESS');
      return { found: count > 0, breaches: d.breaches_details || [], count };
    } catch(e) { log('Breach check error: ' + e.message, 'WARN'); return null; }
  }

  function buildSocialLinks(username) {
    return [
      { site:'GitHub',     url:'https://github.com/'+username,                      icon:'&#x1F419;' },
      { site:'Reddit',     url:'https://reddit.com/user/'+username,                  icon:'&#x1F47D;' },
      { site:'Twitter/X',  url:'https://twitter.com/'+username,                      icon:'&#x1F426;' },
      { site:'Instagram',  url:'https://instagram.com/'+username,                    icon:'&#x1F4F7;' },
      { site:'TikTok',     url:'https://tiktok.com/@'+username,                      icon:'&#x1F3B5;' },
      { site:'LinkedIn',   url:'https://linkedin.com/in/'+username,                  icon:'&#x1F4BC;' },
      { site:'HackerNews', url:'https://news.ycombinator.com/user?id='+username,     icon:'&#x1F536;' },
      { site:'Steam',      url:'https://steamcommunity.com/id/'+username,            icon:'&#x1F3AE;' },
      { site:'Twitch',     url:'https://twitch.tv/'+username,                        icon:'&#x1F7E3;' },
      { site:'YouTube',    url:'https://youtube.com/@'+username,                     icon:'&#x1F4FA;' },
      { site:'Medium',     url:'https://medium.com/@'+username,                      icon:'&#x270D;' },
      { site:'Dev.to',     url:'https://dev.to/'+username,                           icon:'&#x1F4BB;' },
    ];
  }

  function section(title, icon, content) {
    return '<div style="margin-bottom:20px;border:1px solid rgba(0,184,255,0.12);border-radius:4px;overflow:hidden;">'
      + '<div style="background:rgba(0,184,255,0.06);padding:10px 14px;font-size:12px;font-weight:bold;color:#06b6d4;letter-spacing:1px;">' + icon + ' ' + title + '</div>'
      + '<div style="padding:14px;font-size:13px;color:#a0b0c8;line-height:1.7;">' + content + '</div></div>';
  }

  function kv(label, value, color) {
    const style = color ? 'color:' + color + ';font-weight:bold;' : 'color:#e2e8f0;';
    return '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="opacity:0.6;">' + label + '</span><span style="' + style + '">' + (value ?? 'N/A') + '</span></div>';
  }

  async function handleScan() {
    const target = input.value.trim();
    if (!target) return log('Target identifier cannot be empty.', 'ERROR');
    btn.disabled = true; input.disabled = true;
    btn.innerHTML = '<span class="aim-btn-icon">&#x23F3;</span> SCANNING...';
    terminal.innerHTML = '';
    progressWrap.style.display = 'block'; setProgress(5); exportBtn.style.display = 'none';
    log('TARGET ACQUIRED: ' + target);
    dossierWrap.style.opacity = '0.5';
    dossier.innerHTML = '<div style="text-align:center;padding-top:60px;"><div style="margin-top:16px;color:#06b6d4;letter-spacing:2px;">COMPILING DOSSIER...</div></div>';

    const mode = currentMode === 'auto' ? detectType(target) : currentMode;
    log('Mode detected: ' + mode.toUpperCase());
    setProgress(10);
    const result = { target, mode, timestamp: new Date().toISOString(), data: {} };

    try {
      if (mode === 'ip') {
        log('--- IP GEOLOCATION MODULE ---');
        result.data.geo = await fetchIPGeo(target);
        setProgress(70);
        log('--- REVERSE DNS ---');
        result.data.reverseDNS = await fetchDNS(target.split('.').reverse().join('.')+'.in-addr.arpa', 'PTR');
        setProgress(90);
      }
      else if (mode === 'domain') {
        log('--- DNS LOOKUP MODULE ---');
        const [A,MX,TXT,NS] = await Promise.all([fetchDNS(target,'A'),fetchDNS(target,'MX'),fetchDNS(target,'TXT'),fetchDNS(target,'NS')]);
        result.data.dns = {A,MX,TXT,NS};
        log('DNS: ' + A.length + ' A, ' + MX.length + ' MX records', A.length>0?'SUCCESS':'WARN');
        setProgress(40);
        if (A.length > 0) { log('--- IP GEOLOCATION FOR HOST ---'); result.data.geo = await fetchIPGeo(A[0].data); }
        setProgress(65);
        log('--- WHOIS/RDAP MODULE ---');
        result.data.whois = await fetchWHOIS(target);
        setProgress(90);
      }
      else if (mode === 'email') {
        const [localPart, domain] = target.split('@');
        log('Decomposing email: local=' + localPart + ', domain=' + domain);
        setProgress(15);
        log('--- MX RECORD VALIDATION ---');
        const mx = await fetchDNS(domain, 'MX');
        result.data.dns = {MX: mx};
        log('MX records: ' + (mx.length>0 ? mx.map(r=>r.data).join(', ') : 'NONE'), mx.length>0?'SUCCESS':'WARN');
        setProgress(35);
        log('--- GRAVATAR PROBE ---');
        result.data.gravatar = await checkGravatar(target);
        setProgress(55);
        log('--- BREACH DATABASE SCAN ---');
        result.data.breaches = await checkBreaches(target);
        setProgress(75);
        log('--- SOCIAL FOOTPRINT ---');
        result.data.socialLinks = buildSocialLinks(localPart);
        setProgress(90);
      }
      else if (mode === 'username') {
        const uname = target.replace(/^@/,'');
        log('Resolved username: ' + uname);
        setProgress(10);
        log('--- SOCIAL FOOTPRINT MATRIX ---');
        result.data.socialLinks = buildSocialLinks(uname);
        setProgress(20);
        log('--- GITHUB INTELLIGENCE ---');
        const [ghProfile, ghRepos] = await Promise.all([fetchGitHub(uname), fetchGitHubRepos(uname)]);
        result.data.github = ghProfile; result.data.githubRepos = ghRepos;
        setProgress(50);
        log('--- REDDIT INTELLIGENCE ---');
        result.data.reddit = await fetchReddit(uname);
        setProgress(70);
        log('--- HACKERNEWS INTELLIGENCE ---');
        result.data.hackerNews = await fetchHackerNews(uname);
        setProgress(90);
      }

      setProgress(100);
      log('DOSSIER COMPILATION COMPLETE.', 'SUCCESS');
      lastResult = result;
      renderDossier(result);
      exportBtn.style.display = '';
    } catch(err) {
      log('CRITICAL ERROR: ' + err.message, 'ERROR');
    } finally {
      btn.disabled = false; input.disabled = false;
      btn.innerHTML = '<span class="aim-btn-icon">&#x1F441;</span> INITIATE SCAN';
      setTimeout(() => { progressWrap.style.display='none'; progressBar.style.width='0%'; }, 2000);
    }
  }

  function renderDossier(result) {
    dossierWrap.style.opacity = '1';
    const {target, mode, timestamp, data} = result;
    let html = '<div style="font-size:18px;font-weight:bold;color:#fff;margin-bottom:4px;letter-spacing:1px;">DOSSIER: <span style="color:#06b6d4;">' + target + '</span></div>'
             + '<div style="font-size:11px;color:#475569;margin-bottom:20px;">Mode: ' + mode.toUpperCase() + ' &nbsp;|&nbsp; Compiled: ' + new Date(timestamp).toLocaleString() + '</div>';

    if (data.geo) {
      const g = data.geo;
      html += section('GEOLOCATION', '&#x1F30D;',
        kv('IP Address', g.query) + kv('Location', g.city + ', ' + g.regionName + ', ' + g.country) +
        kv('ISP', g.isp) + kv('Org', g.org) + kv('ASN', g.as) +
        kv('Coordinates', g.lat + ', ' + g.lon) +
        kv('Reverse DNS', g.reverse || (data.reverseDNS?.[0]?.data) || 'N/A') +
        kv('VPN / Proxy', g.proxy ? 'YES' : 'NO', g.proxy ? '#ff003c' : '#00ff8c') +
        kv('Hosting / DC', g.hosting ? 'YES' : 'NO', g.hosting ? '#ffaa00' : '#a0b0c8') +
        kv('Mobile Network', g.mobile ? 'YES' : 'NO') +
        '<div style="margin-top:12px;"><a href="https://maps.google.com/?q=' + g.lat + ',' + g.lon + '" target="_blank" rel="noopener" style="color:#06b6d4;font-size:12px;text-decoration:none;">Open on Google Maps &rarr;</a></div>'
      );
    }

    if (data.dns) {
      const {A,MX,TXT,NS} = data.dns;
      let c = '';
      if (A?.length)  c += '<div style="margin-bottom:6px;"><span style="color:#06b6d4;">A Records:</span> ' + A.map(r=>r.data).join(', ') + '</div>';
      if (NS?.length) c += '<div style="margin-bottom:6px;"><span style="color:#06b6d4;">NS Records:</span> ' + NS.map(r=>r.data).join(', ') + '</div>';
      if (MX?.length) c += '<div style="margin-bottom:6px;"><span style="color:#06b6d4;">MX Records:</span><br>' + MX.map(r=>'&nbsp;&nbsp;'+r.data).join('<br>') + '</div>';
      else c += '<div style="color:#ffaa00;">&#x26A0; No MX records — domain may not accept email</div>';
      if (TXT?.length) c += '<div><span style="color:#06b6d4;">TXT Records:</span><br>' + TXT.map(r=>'<span style="font-size:11px;color:#64748b;">&nbsp;&nbsp;'+r.data.substring(0,120)+'</span>').join('<br>') + '</div>';
      html += section('DNS RECORDS', '&#x1F4CB;', c || '<span style="color:#475569;">No records resolved</span>');
    }

    if (data.whois) {
      const w = data.whois;
      const evts = w.events || [];
      const reg  = evts.find(e=>e.eventAction==='registration')?.eventDate;
      const exp  = evts.find(e=>e.eventAction==='expiration')?.eventDate;
      const upd  = evts.find(e=>e.eventAction==='last changed')?.eventDate;
      html += section('WHOIS / RDAP', '&#x1F3DB;',
        kv('Handle', w.handle) + kv('LDH Name', w.ldhName) +
        kv('Registered', reg ? new Date(reg).toLocaleDateString() : 'N/A') +
        kv('Updated', upd ? new Date(upd).toLocaleDateString() : 'N/A') +
        kv('Expires', exp ? new Date(exp).toLocaleDateString() : 'N/A') +
        kv('Status', (w.status||[]).join(', ')||'N/A') +
        '<div style="margin-top:10px;"><a href="https://rdap.org/domain/' + (w.ldhName||'') + '" target="_blank" rel="noopener" style="color:#06b6d4;font-size:12px;text-decoration:none;">Full RDAP Record &rarr;</a></div>'
      );
    }

    if (data.gravatar) {
      const g = data.gravatar, e = g.entry || {};
      html += section('GRAVATAR PROFILE', '&#x1F5BC;',
        '<div style="display:flex;gap:14px;align-items:center;margin-bottom:12px;">'
        + '<img src="https://www.gravatar.com/avatar/' + g.hash + '?s=80&d=404" style="border-radius:50%;border:2px solid #06b6d4;width:64px;height:64px;" onerror="this.style.display=\'none\'" />'
        + '<div><div style="color:#e2e8f0;font-weight:bold;">' + (e.displayName||'No display name') + '</div>'
        + '<div style="font-size:11px;opacity:0.6;">' + (e.aboutMe||'') + '</div></div></div>'
        + kv('Username', e.preferredUsername) + kv('Location', e.currentLocation)
        + (e.urls?.length ? '<div style="margin-top:8px;">Links: ' + e.urls.map(u=>'<a href="'+u.value+'" target="_blank" rel="noopener" style="color:#06b6d4;margin-right:10px;font-size:12px;">'+(u.title||u.value)+'</a>').join('') + '</div>' : '')
      );
    } else if (data.gravatar === null && data.dns?.MX) {
      html += section('GRAVATAR PROFILE', '&#x1F5BC;', '<span style="color:#475569;">No Gravatar profile linked to this email.</span>');
    }

    if (data.breaches !== undefined && data.breaches !== null) {
      const b = data.breaches;
      let bc = b.found
        ? '<div style="color:#ff003c;font-weight:bold;margin-bottom:10px;">&#x26A0; FOUND IN ' + b.count + ' BREACH(ES)</div>'
          + (b.breaches?.map(br=>'<div style="margin-bottom:8px;padding:8px;background:rgba(255,0,60,0.05);border-left:2px solid #ff003c;"><div style="color:#e2e8f0;font-weight:bold;">'+(br.breach||br.source||'Unknown')+'</div><div style="font-size:11px;opacity:0.6;">'+(br.domain||'')+' — '+(br.xposed_date||'')+'</div><div style="font-size:11px;">'+(br.xposed_data||[]).join(', ')+'</div></div>').join('')||'')
        : '<div style="color:#00ff8c;font-weight:bold;">&#x2713; No breaches found in XposedOrNot database</div>';
      html += section('BREACH DATABASE SCAN', '&#x1F513;', bc);
    }

    if (data.github) {
      const g = data.github;
      let gc = '<div style="display:flex;gap:14px;align-items:center;margin-bottom:14px;">'
        + '<img src="' + g.avatar_url + '" style="border-radius:50%;border:2px solid #06b6d4;width:56px;height:56px;" />'
        + '<div><div style="color:#e2e8f0;font-weight:bold;">' + (g.name||g.login) + '</div>'
        + '<div style="font-size:11px;opacity:0.6;">' + (g.bio||'No bio') + '</div></div></div>'
        + kv('Username', '@'+g.login) + kv('Location', g.location) + kv('Company', g.company)
        + kv('Public Repos', g.public_repos) + kv('Followers', g.followers) + kv('Following', g.following)
        + kv('Created', new Date(g.created_at).toLocaleDateString())
        + kv('Website', g.blog ? '<a href="'+g.blog+'" target="_blank" rel="noopener" style="color:#06b6d4;">'+g.blog+'</a>' : 'N/A')
        + '<div style="margin-top:10px;"><a href="' + g.html_url + '" target="_blank" rel="noopener" style="color:#06b6d4;font-size:12px;text-decoration:none;">View GitHub Profile &rarr;</a></div>';
      if (data.githubRepos?.length) {
        gc += '<div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;font-size:12px;color:#64748b;letter-spacing:1px;margin-bottom:8px;">RECENT REPOSITORIES</div>';
        gc += data.githubRepos.map(repo=>'<div style="margin-bottom:8px;padding:8px;background:rgba(6,182,212,0.04);border-left:2px solid rgba(6,182,212,0.3);border-radius:2px;">'
          +'<a href="'+repo.html_url+'" target="_blank" rel="noopener" style="color:#06b6d4;font-weight:bold;text-decoration:none;">'+repo.name+'</a>'
          +'<span style="float:right;font-size:11px;color:#475569;">&#x2B50; '+repo.stargazers_count+'</span>'
          +'<div style="font-size:11px;opacity:0.6;margin-top:2px;">'+(repo.description||'No description')+'</div>'
          +'<div style="font-size:10px;margin-top:4px;color:#475569;">'+(repo.language||'Unknown')+' &nbsp;&middot;&nbsp; Updated: '+new Date(repo.pushed_at).toLocaleDateString()+'</div></div>').join('');
      }
      html += section('GITHUB INTELLIGENCE', '&#x1F419;', gc);
    }

    if (data.reddit) {
      const r = data.reddit;
      const age = Math.floor((Date.now()/1000 - r.created_utc) / 86400);
      html += section('REDDIT INTELLIGENCE', '&#x1F47D;',
        kv('Username', 'u/' + r.name) + kv('Link Karma', r.link_karma?.toLocaleString())
        + kv('Comment Karma', r.comment_karma?.toLocaleString()) + kv('Account Age', age + ' days')
        + kv('Verified Email', r.has_verified_email ? 'YES' : 'NO')
        + kv('Reddit Gold', r.is_gold ? 'YES' : 'NO') + kv('Moderator', r.is_mod ? 'YES' : 'NO')
        + '<div style="margin-top:10px;"><a href="https://reddit.com/user/'+r.name+'" target="_blank" rel="noopener" style="color:#FF4500;font-size:12px;text-decoration:none;">View Reddit Profile &rarr;</a></div>'
      );
    }

    if (data.hackerNews) {
      const h = data.hackerNews;
      html += section('HACKERNEWS INTELLIGENCE', '&#x1F536;',
        kv('Username', h.id) + kv('Karma', h.karma?.toLocaleString())
        + kv('About', h.about?.replace(/<[^>]*>/g,'') || 'N/A')
        + kv('Created', new Date(h.created*1000).toLocaleDateString())
        + kv('Submissions', h.submitted?.length || 0)
        + '<div style="margin-top:10px;"><a href="https://news.ycombinator.com/user?id='+h.id+'" target="_blank" rel="noopener" style="color:#FF6600;font-size:12px;text-decoration:none;">View HN Profile &rarr;</a></div>'
      );
    }

    if (data.socialLinks?.length) {
      const lh = '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
        + data.socialLinks.map(l=>'<a href="'+l.url+'" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(6,182,212,0.07);border:1px solid rgba(6,182,212,0.2);border-radius:4px;color:#a0b0c8;text-decoration:none;font-size:12px;" onmouseover="this.style.borderColor=\'#06b6d4\';this.style.color=\'#06b6d4\';" onmouseout="this.style.borderColor=\'rgba(6,182,212,0.2)\';this.style.color=\'#a0b0c8\';">'+l.icon+' '+l.site+'</a>').join('')
        + '</div>';
      html += section('SOCIAL FOOTPRINT MATRIX', '&#x1F578;', lh);
    }

    dossier.innerHTML = html;
  }

  exportBtn.addEventListener('click', () => {
    if (!lastResult) return;
    const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'dossier_' + lastResult.target.replace(/[^a-z0-9]/gi,'_') + '_' + Date.now() + '.json';
    a.click(); URL.revokeObjectURL(a.href);
  });

  clearBtn.addEventListener('click', () => {
    input.value = ''; terminal.innerHTML = '[SYS] WAITING FOR TARGET...';
    dossier.innerHTML = '<div style="text-align:center;padding-top:60px;"><div style="font-size:14px;letter-spacing:2px;color:#fff;opacity:0.3;">NO DATA</div></div>';
    dossierWrap.style.opacity = '0.5'; progressWrap.style.display='none'; progressBar.style.width='0%';
    exportBtn.style.display = 'none'; lastResult = null;
  });

  btn.addEventListener('click', handleScan);
  input.addEventListener('keydown', e => { if (e.key==='Enter') handleScan(); });

  return container;
}
