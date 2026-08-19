import { createElement } from '../components/utils.js';

export default function MugshotsPage() {
  const container = createElement('div', { class: 'mugshots-page' });
  
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// FANNIN_COUNTY_CRIME">// FANNIN_COUNTY_CRIME</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle" style="color: var(--text-muted); font-size: 0.85rem; font-family: 'Share Tech Mono', monospace;">
        LIVE FACEBOOK GRAPH API FEED // ARREST DOSSIER &amp; MUGSHOT INTELLIGENCE
      </p>
    </div>

    <div class="aim-row" style="margin-bottom: 20px; margin-top: 15px;">
      <div class="aim-seg aim-seg-2" id="mug-tabs">
        <button class="aim-seg-btn active" data-target="mug-database">MUGSHOT DOSSIER FEED</button>
        <button class="aim-seg-btn" data-target="mug-api-config">GRAPH API CONFIG &amp; LIMITS</button>
      </div>
    </div>

    <!-- API CONFIG VIEW -->
    <div class="panel mug-view" id="mug-api-config" style="display: none;">
      <div class="panel-title">// FACEBOOK GRAPH API CONFIGURATION</div>
      
      <div style="background:rgba(0,184,255,0.05); border:1px solid var(--border); padding:20px; border-radius:4px; margin-bottom:20px;">
        <label class="aim-label">FACEBOOK ACCESS TOKEN (USER / PAGE TOKEN)</label>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
          <input type="password" id="fb-api-key-input" class="aim-input" placeholder="EAAG... (Graph API Access Token)" style="flex: 1; min-width: 250px;">
          <button id="toggle-token-vis" class="aim-btn" style="min-width: 90px;" type="button">SHOW</button>
          <button id="save-fb-key-btn" class="aim-btn aim-btn-accept" style="min-width: 130px;">💾 SAVE KEY</button>
          <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" class="aim-btn" style="min-width: 160px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 6px;">🔑 GET TOKEN &nearr;</a>
        </div>

        <div style="display: flex; gap: 15px; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 220px;">
            <label class="aim-label">TARGET FACEBOOK PAGE ID / USERNAME</label>
            <input type="text" id="fb-page-target-input" class="aim-input" value="FanninCountyCrime" placeholder="FanninCountyCrime">
          </div>
          <div style="flex: 1; min-width: 220px;">
            <label class="aim-label">AUTO-SYNC INTERVAL (WITHIN RATE LIMITS)</label>
            <select id="fb-auto-sync-select" class="aim-input" style="background: #030712; color: #fff;">
              <option value="0">Manual Sync Only</option>
              <option value="15">Every 15 Minutes</option>
              <option value="30" selected>Every 30 Minutes (Recommended)</option>
              <option value="60">Every 1 Hour</option>
            </select>
          </div>
        </div>

        <div id="fb-api-key-status" style="margin-top: 15px; font-size: 0.85rem; color: var(--blue-dim);"></div>
      </div>

      <div class="panel-title" style="margin-top:30px;">// GRAPH API RATE LIMITS &amp; HOW-TO</div>
      <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-dim); padding: 18px; color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; font-family: 'Share Tech Mono', monospace; border-radius: 4px;">
        <div style="color: var(--accent); font-weight: bold; margin-bottom: 8px;">RATE LIMIT BUDGET COMPLIANCE:</div>
        <p style="margin: 0 0 10px 0;">Meta Graph API enforces a sliding 60-minute window limit of approximately <strong>200 calls/hour per user token</strong>. AlphaCore automatically caches all downloaded photos, names, and booking details to your local browser storage ('localStorage') so subsequent loads require zero API calls.</p>
        
        <div style="color: var(--accent); font-weight: bold; margin-bottom: 6px; margin-top: 14px;">QUICK SETUP GUIDE:</div>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Visit the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline;">Meta Graph API Explorer</a>.</li>
          <li>Log into your Meta account and select or create an App.</li>
          <li>Under <em>Permissions</em>, add <code>pages_read_engagement</code> and <code>pages_read_user_content</code> (or generate a standard User Token).</li>
          <li>Click <strong>Generate Access Token</strong> and paste it above.</li>
        </ol>
      </div>
    </div>

    <!-- DATABASE VIEW -->
    <div class="mug-view active" id="mug-database">
      
      <!-- Top Control & Filter HUD -->
      <div class="panel" style="margin-bottom: 20px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid rgba(0,184,255,0.1); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span style="background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #ef4444; padding: 4px 10px; border-radius: 3px; font-size: 0.75rem; font-weight: bold; letter-spacing: 1px;">LIVE TARGET</span>
            <a href="https://www.facebook.com/FanninCountyCrime" target="_blank" rel="noopener noreferrer" style="color: var(--accent); font-family: 'Orbitron', sans-serif; font-size: 0.95rem; text-decoration: none; font-weight: bold;">facebook.com/FanninCountyCrime &nearr;</a>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <span id="sync-status" style="font-size: 0.8rem; color: var(--text-muted); font-family: 'Share Tech Mono', monospace;">CACHE LOADED</span>
            <button id="sync-btn" class="aim-btn aim-btn-accept" style="font-size: 0.8rem; padding: 8px 16px;">↻ SYNC FEED</button>
            <button id="load-demo-btn" class="aim-btn" style="font-size: 0.8rem; padding: 8px 14px; opacity: 0.8;" title="Populate with sample intel records">DEMO INTEL</button>
            <button id="export-json-btn" class="aim-btn" style="font-size: 0.8rem; padding: 8px 14px; opacity: 0.8;">EXPORT JSON</button>
          </div>
        </div>

        <!-- Telemetry & Search Row -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <div style="flex: 2; min-width: 240px; position: relative;">
            <input type="text" id="mug-search-input" class="aim-input" placeholder="Search by person name, charges, or booking date..." style="width: 100%; padding-left: 36px;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;">🔍</span>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <select id="mug-filter-charge" class="aim-input" style="background: #030712; color: #fff;">
              <option value="ALL">All Offense Types</option>
              <option value="FELONY">Felonies</option>
              <option value="MISDEMEANOR">Misdemeanors</option>
              <option value="DUI">DUI / Narcotics</option>
              <option value="WARRANT">Warrants / Holds</option>
              <option value="RECENT">Past 7 Days</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <select id="mug-sort-order" class="aim-input" style="background: #030712; color: #fff;">
              <option value="NEWEST">Date: Newest First</option>
              <option value="OLDEST">Date: Oldest First</option>
              <option value="NAME_AZ">Name: A &rarr; Z</option>
              <option value="NAME_ZA">Name: Z &rarr; A</option>
            </select>
          </div>
        </div>

        <!-- Telemetry Stats Bar -->
        <div style="display: flex; gap: 20px; margin-top: 14px; font-size: 0.75rem; color: var(--text-muted); font-family: 'Share Tech Mono', monospace; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
          <div>RECORDS CACHED: <span id="stat-total-records" style="color: #fff; font-weight: bold;">0</span></div>
          <div>LAST SYNCED: <span id="stat-last-sync" style="color: var(--accent);">NEVER</span></div>
          <div>EST. API RATE BUDGET: <span id="stat-rate-budget" style="color: #00ff8c;">200/200 OK</span></div>
        </div>
      </div>

      <!-- Mugshots Grid Container -->
      <div id="mugshot-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px;">
        <!-- Mugshots will render here -->
      </div>
    </div>
  `;

  setTimeout(() => {
    const profile = sessionStorage.getItem('current_profile') || 'Guest';
    
    // Elements
    const tabs = container.querySelectorAll('.aim-seg-btn');
    const apiConfigView = container.querySelector('#mug-api-config');
    const dbView = container.querySelector('#mug-database');
    
    const apiKeyInput = container.querySelector('#fb-api-key-input');
    const toggleTokenBtn = container.querySelector('#toggle-token-vis');
    const saveKeyBtn = container.querySelector('#save-fb-key-btn');
    const apiKeyStatus = container.querySelector('#fb-api-key-status');
    const pageTargetInput = container.querySelector('#fb-page-target-input');
    const autoSyncSelect = container.querySelector('#fb-auto-sync-select');
    
    const syncBtn = container.querySelector('#sync-btn');
    const loadDemoBtn = container.querySelector('#load-demo-btn');
    const exportJsonBtn = container.querySelector('#export-json-btn');
    const syncStatus = container.querySelector('#sync-status');
    const mugshotGrid = container.querySelector('#mugshot-grid');
    
    const searchInput = container.querySelector('#mug-search-input');
    const filterChargeSelect = container.querySelector('#mug-filter-charge');
    const sortOrderSelect = container.querySelector('#mug-sort-order');
    
    const statTotalRecords = container.querySelector('#stat-total-records');
    const statLastSync = container.querySelector('#stat-last-sync');
    const statRateBudget = container.querySelector('#stat-rate-budget');

    let allMugshots = [];
    let autoSyncTimer = null;

    // Load saved settings
    const savedToken = localStorage.getItem(`fb_api_key_${profile}`) || '';
    if (savedToken) {
      apiKeyInput.value = savedToken;
      apiKeyStatus.textContent = '✓ Facebook Graph API Token loaded from local profile storage.';
      apiKeyStatus.style.color = 'var(--accent)';
    }

    const savedPage = localStorage.getItem('fb_page_target') || 'FanninCountyCrime';
    if (pageTargetInput) pageTargetInput.value = savedPage;

    const savedAutoSync = localStorage.getItem('fb_auto_sync_interval') || '30';
    if (autoSyncSelect) autoSyncSelect.value = savedAutoSync;

    // Show/Hide Token
    toggleTokenBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleTokenBtn.textContent = 'HIDE';
      } else {
        apiKeyInput.type = 'password';
        toggleTokenBtn.textContent = 'SHOW';
      }
    });

    // Save Key & Settings
    saveKeyBtn.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      const page = pageTargetInput.value.trim() || 'FanninCountyCrime';
      const syncInterval = autoSyncSelect.value;

      if (key) {
        localStorage.setItem(`fb_api_key_${profile}`, key);
        apiKeyStatus.textContent = '✓ Token and settings successfully saved.';
        apiKeyStatus.style.color = '#00ff8c';
      } else {
        localStorage.removeItem(`fb_api_key_${profile}`);
        apiKeyStatus.textContent = 'Token cleared.';
        apiKeyStatus.style.color = 'var(--text-muted)';
      }

      localStorage.setItem('fb_page_target', page);
      localStorage.setItem('fb_auto_sync_interval', syncInterval);
      setupAutoSync();
      if (typeof showToast === 'function') showToast('Settings Saved', 'success');
    });

    // Tab Switching
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.target === 'mug-api-config') {
          dbView.style.display = 'none';
          apiConfigView.style.display = 'block';
        } else {
          apiConfigView.style.display = 'none';
          dbView.style.display = 'block';
        }
      });
    });

    // Intelligent Name & Charge Parser
    function parseArrestPost(post) {
      const rawText = post.message || post.description || post.name || '';
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      let personName = 'UNKNOWN SUBJECT';
      let charges = [];
      let bond = '';
      let age = '';
      let category = 'MISDEMEANOR';

      if (lines.length > 0) {
        const namePrefixRegex = /^(name|arrested|inmate|suspect|subject|defendant|booking)\s*[:\-]\s*(.+)$/i;
        const firstLineMatch = lines[0].match(namePrefixRegex);
        
        if (firstLineMatch) {
          personName = firstLineMatch[2].trim();
        } else {
          const firstLine = lines[0].replace(/[#*]/g, '').trim();
          if (firstLine.length < 50 && !firstLine.toLowerCase().includes('charges') && !firstLine.toLowerCase().includes('press release')) {
            personName = firstLine;
          }
        }

        personName = personName.replace(/,\s*\d{2}(\s*of.*)?$/i, '').trim();

        lines.forEach(line => {
          const lower = line.toLowerCase();
          
          if (lower.startsWith('charge') || lower.startsWith('charges:') || lower.startsWith('booked for:') || lower.startsWith('hold:')) {
            const chargeContent = line.replace(/^(charges?|booked for|hold)\s*[:\-]\s*/i, '');
            if (chargeContent) charges.push(...chargeContent.split(';').map(c => c.trim()));
          } else if (lower.includes('battery') || lower.includes('theft') || lower.includes('dui') || lower.includes('meth') || lower.includes('possession') || lower.includes('burglary') || lower.includes('warrant') || lower.includes('probation') || lower.includes('assault') || lower.includes('trafficking')) {
            if (!charges.includes(line) && line !== lines[0]) {
              charges.push(line);
            }
          }

          if (lower.includes('bond:') || lower.includes('bond amount:')) {
            bond = line.replace(/.*bond\s*[:\-]?\s*/i, '').trim();
          }

          if (lower.match(/age\s*[:\-]\s*\d+/i)) {
            const m = lower.match(/age\s*[:\-]\s*(\d+)/i);
            if (m) age = m[1];
          }
        });
      }

      const fullTextLower = rawText.toLowerCase();
      if (fullTextLower.includes('felony') || fullTextLower.includes('burglary') || fullTextLower.includes('trafficking') || fullTextLower.includes('aggravated')) {
        category = 'FELONY';
      } else if (fullTextLower.includes('warrant') || fullTextLower.includes('hold for') || fullTextLower.includes('probation violation')) {
        category = 'WARRANT';
      } else if (fullTextLower.includes('dui') || fullTextLower.includes('drugs') || fullTextLower.includes('possession') || fullTextLower.includes('controlled substance')) {
        category = 'DUI';
      }

      let photoUrl = post.full_picture || '';
      if (!photoUrl && post.attachments?.data?.[0]?.media?.image?.src) {
        photoUrl = post.attachments.data[0].media.image.src;
      }
      if (!photoUrl && post.images && post.images.length > 0) {
        photoUrl = post.images[0].source;
      }

      return {
        id: post.id || `fannin_${Date.now()}_${Math.random().toString(36).substring(4)}`,
        name: personName.toUpperCase(),
        photoUrl: photoUrl || '/Images/ALPHA-LOGO.png',
        createdTime: post.created_time || new Date().toISOString(),
        rawMessage: rawText,
        charges: charges.length > 0 ? charges : ['Arrest details recorded on file'],
        bond: bond || 'Not Specified',
        age: age || 'N/A',
        category,
        fbUrl: post.permalink_url || `https://www.facebook.com/FanninCountyCrime`
      };
    }

    // Render Cards
    function renderCards() {
      const search = (searchInput.value || '').trim().toLowerCase();
      const chargeFilter = filterChargeSelect.value;
      const sortOrder = sortOrderSelect.value;

      let filtered = [...allMugshots];

      if (search) {
        filtered = filtered.filter(m => 
          m.name.toLowerCase().includes(search) || 
          m.rawMessage.toLowerCase().includes(search) ||
          m.charges.some(c => c.toLowerCase().includes(search)) ||
          new Date(m.createdTime).toLocaleDateString().includes(search)
        );
      }

      if (chargeFilter !== 'ALL') {
        if (chargeFilter === 'RECENT') {
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(m => new Date(m.createdTime).getTime() >= sevenDaysAgo);
        } else {
          filtered = filtered.filter(m => m.category === chargeFilter);
        }
      }

      if (sortOrder === 'NEWEST') {
        filtered.sort((a,b) => new Date(b.createdTime) - new Date(a.createdTime));
      } else if (sortOrder === 'OLDEST') {
        filtered.sort((a,b) => new Date(a.createdTime) - new Date(b.createdTime));
      } else if (sortOrder === 'NAME_AZ') {
        filtered.sort((a,b) => a.name.localeCompare(b.name));
      } else if (sortOrder === 'NAME_ZA') {
        filtered.sort((a,b) => b.name.localeCompare(a.name));
      }

      statTotalRecords.textContent = allMugshots.length;
      const lastSyncTime = localStorage.getItem('fannin_last_sync_time');
      statLastSync.textContent = lastSyncTime ? new Date(parseInt(lastSyncTime, 10)).toLocaleTimeString() : 'CACHED';

      mugshotGrid.innerHTML = '';

      if (filtered.length === 0) {
        mugshotGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: rgba(0,0,0,0.3); border: 1px dashed var(--border-dim); border-radius: 6px;">
            <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;">🚨</div>
            <div style="color: var(--text-muted); font-size: 0.95rem; font-family: 'Orbitron', sans-serif;">NO MATCHING MUGSHOT DOSSIERS FOUND</div>
            <div style="color: #64748b; font-size: 0.8rem; margin-top: 6px;">Try adjusting your search filters or click "SYNC FEED" above.</div>
          </div>
        `;
        return;
      }

      filtered.forEach(m => {
        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(10,15,25,0.9); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s ease, border-color 0.2s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.4);';
        card.onmouseover = () => {
          card.style.borderColor = 'var(--accent)';
          card.style.transform = 'translateY(-3px)';
        };
        card.onmouseout = () => {
          card.style.borderColor = 'var(--border)';
          card.style.transform = 'translateY(0)';
        };

        let catColor = '#06b6d4';
        if (m.category === 'FELONY') catColor = '#ff003c';
        else if (m.category === 'WARRANT') catColor = '#a855f7';
        else if (m.category === 'DUI') catColor = '#eab308';

        const photoFrame = document.createElement('div');
        photoFrame.style.cssText = 'width: 100%; aspect-ratio: 4/5; background: #030712; position: relative; overflow: hidden; border-bottom: 1px solid var(--border);';
        
        const img = document.createElement('img');
        img.src = m.photoUrl;
        img.alt = m.name;
        img.loading = 'lazy';
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;';
        img.onerror = () => {
          img.src = '/Images/ALPHA-LOGO.png';
          img.style.objectFit = 'contain';
          img.style.padding = '20px';
          img.style.opacity = '0.3';
        };

        const badge = document.createElement('span');
        badge.style.cssText = `position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.85); color: ${catColor}; border: 1px solid ${catColor}; padding: 3px 8px; font-size: 0.65rem; font-weight: bold; border-radius: 3px; letter-spacing: 1px; backdrop-filter: blur(4px);`;
        badge.textContent = m.category;

        photoFrame.appendChild(img);
        photoFrame.appendChild(badge);

        const body = document.createElement('div');
        body.style.cssText = 'padding: 14px; display: flex; flex-direction: column; flex: 1; justify-content: space-between; gap: 10px;';

        const nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-family: "Orbitron", sans-serif; font-size: 0.95rem; font-weight: 700; color: #fff; line-height: 1.3; letter-spacing: 0.5px;';
        nameEl.textContent = m.name;

        const metaEl = document.createElement('div');
        metaEl.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--accent); font-family: "Share Tech Mono", monospace;';
        metaEl.innerHTML = `<span>📅 ${new Date(m.createdTime).toLocaleDateString()}</span><span>BOND: ${m.bond}</span>`;

        const chargesEl = document.createElement('div');
        chargesEl.style.cssText = 'font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 4px; border-left: 2px solid ' + catColor + ';';
        chargesEl.textContent = m.charges.join(', ');

        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 8px; margin-top: 4px;';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'aim-btn aim-btn-sm';
        viewBtn.style.cssText = 'flex: 1; font-size: 0.75rem; padding: 6px;';
        viewBtn.textContent = 'DOSSIER DETAILS';
        viewBtn.onclick = () => openDossierModal(m);

        const fbBtn = document.createElement('a');
        fbBtn.href = m.fbUrl;
        fbBtn.target = '_blank';
        fbBtn.rel = 'noopener noreferrer';
        fbBtn.className = 'aim-btn aim-btn-sm';
        fbBtn.style.cssText = 'font-size: 0.75rem; padding: 6px 10px; text-decoration: none; display: flex; align-items: center; justify-content: center;';
        fbBtn.title = 'View original Facebook post';
        fbBtn.innerHTML = '&nearr;';

        actions.appendChild(viewBtn);
        actions.appendChild(fbBtn);

        body.appendChild(nameEl);
        body.appendChild(metaEl);
        body.appendChild(chargesEl);
        body.appendChild(actions);

        card.appendChild(photoFrame);
        card.appendChild(body);

        mugshotGrid.appendChild(card);
      });
    }

    function openDossierModal(m) {
      import('../components/modal.js').then(({ showModal }) => {
        const modalWrap = document.createElement('div');
        modalWrap.style.cssText = 'display: flex; flex-direction: column; gap: 16px; max-width: 600px; width: 100%;';

        modalWrap.innerHTML = `
          <div style="display: flex; gap: 18px; flex-wrap: wrap; align-items: flex-start;">
            <div style="width: 180px; aspect-ratio: 4/5; background: #000; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; flex-shrink: 0;">
              <img src="${m.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/Images/ALPHA-LOGO.png'; this.style.objectFit='contain';">
            </div>
            <div style="flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 8px;">
              <div style="font-family: 'Orbitron', sans-serif; font-size: 1.2rem; font-weight: bold; color: #fff;">${m.name}</div>
              <div style="font-size: 0.8rem; color: var(--accent); font-family: 'Share Tech Mono', monospace;">RECORD ID: ${m.id}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">BOOKING DATE: <span style="color:#fff;">${new Date(m.createdTime).toLocaleString()}</span></div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">CATEGORY: <span style="color:#06b6d4; font-weight:bold;">${m.category}</span></div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">BOND AMOUNT: <span style="color:#00ff8c;">${m.bond}</span></div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">AGE: <span style="color:#fff;">${m.age}</span></div>
            </div>
          </div>

          <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-dim); border-radius: 4px; padding: 14px;">
            <div style="font-size: 0.75rem; color: var(--accent); font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">// CHARGES &amp; OFFENSES:</div>
            <ul style="margin: 0; padding-left: 20px; color: #fff; font-size: 0.85rem; line-height: 1.6;">
              ${m.charges.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>

          <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-dim); border-radius: 4px; padding: 14px;">
            <div style="font-size: 0.75rem; color: var(--accent); font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">// FULL POLICE BLOTTER NARRATIVE:</div>
            <pre style="margin: 0; white-space: pre-wrap; font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; max-height: 160px; overflow-y: auto;">${m.rawMessage || 'No additional narrative text on file.'}</pre>
          </div>

          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <a href="${m.fbUrl}" target="_blank" rel="noopener noreferrer" class="aim-btn" style="flex: 1; text-align: center; text-decoration: none; padding: 10px;">OPEN ON FACEBOOK &nearr;</a>
            <button id="modal-vault-save-btn" class="aim-btn aim-btn-accept" style="flex: 1; padding: 10px;">SAVE TO VAULT</button>
          </div>
        `;

        modalWrap.querySelector('#modal-vault-save-btn').onclick = () => {
          try {
            let vaultFiles = JSON.parse(localStorage.getItem('alphacore_vault_files')) || [];
            const filename = `Dossier_${m.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
            const content = `// ALPHACORE CLASSIFIED CRIME DOSSIER\nNAME: ${m.name}\nDATE: ${new Date(m.createdTime).toLocaleString()}\nCATEGORY: ${m.category}\nBOND: ${m.bond}\nCHARGES:\n${m.charges.map(c => '- ' + c).join('\n')}\n\nNARRATIVE:\n${m.rawMessage}\n\nORIGINAL SOURCE: ${m.fbUrl}`;
            
            vaultFiles.push({
              id: Date.now(),
              filename,
              type: 'text/plain',
              content,
              owner: profile,
              timestamp: Date.now()
            });

            localStorage.setItem('alphacore_vault_files', JSON.stringify(vaultFiles));
            if (typeof showToast === 'function') showToast('Saved to Classified Vault', 'success');
          } catch(e) {
            alert('Failed to save to vault: ' + e.message);
          }
        };

        showModal({
          title: `// ARREST DOSSIER: ${m.name}`,
          content: modalWrap
        });
      });
    }

    // Fetch from Facebook Graph API
    async function syncFromFacebook() {
      const fbToken = localStorage.getItem(`fb_api_key_${profile}`) || apiKeyInput.value.trim();
      const pageTarget = localStorage.getItem('fb_page_target') || pageTargetInput.value.trim() || 'FanninCountyCrime';

      if (!fbToken) {
        alert('ERROR: Missing Facebook Graph API Token.\n\nPlease navigate to the "GRAPH API CONFIG & LIMITS" tab, enter your token, and click Save Key.');
        return;
      }

      syncBtn.disabled = true;
      syncBtn.textContent = 'CONNECTING...';
      syncStatus.textContent = 'QUERYING META GRAPH API...';
      syncStatus.style.color = 'var(--accent)';

      try {
        const endpoint = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageTarget)}/posts?fields=id,message,created_time,full_picture,permalink_url,attachments{media,subattachments,title,description}&limit=100&access_token=${encodeURIComponent(fbToken)}`;

        const res = await fetch(endpoint);
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Facebook Graph API responded with status ${res.status}`);
        }

        const data = await res.json();
        const rawPosts = data.data || [];

        if (rawPosts.length === 0) {
          syncStatus.textContent = 'NO POSTS RETURNED';
          syncStatus.style.color = '#ffaa00';
          return;
        }

        const parsed = rawPosts.map(parseArrestPost);
        
        const existingIds = new Set(allMugshots.map(m => m.id));
        const newRecords = parsed.filter(p => !existingIds.has(p.id));
        
        allMugshots = [...newRecords, ...allMugshots];
        localStorage.setItem('fannin_mugshots_cache', JSON.stringify(allMugshots));
        localStorage.setItem('fannin_last_sync_time', Date.now().toString());

        syncStatus.textContent = `SYNC SUCCESS (+${newRecords.length} NEW / ${allMugshots.length} TOTAL)`;
        syncStatus.style.color = '#00ff8c';
        if (typeof showToast === 'function') showToast(`Synced ${newRecords.length} new mugshots`, 'success');

        renderCards();

      } catch (err) {
        console.error('FB API Error:', err);
        syncStatus.textContent = 'SYNC FAILED (CHECK TOKEN)';
        syncStatus.style.color = '#ff003c';
        alert(`FACEBOOK GRAPH API ERROR:\n\n${err.message}\n\nEnsure your token has 'Page Public Content Access' permissions or test with Demo Intel.`);
      } finally {
        syncBtn.disabled = false;
        syncBtn.textContent = '↻ SYNC FEED';
      }
    }

    function loadDemoRecords() {
      const demoData = [
        {
          id: 'demo_101',
          name: 'HOOPER, CHRISTOPHER WAYNE',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          createdTime: new Date(Date.now() - 3600000 * 4).toISOString(),
          rawMessage: 'ARRESTED: HOOPER, CHRISTOPHER WAYNE\nAge: 38 of Blue Ridge, GA\nCharges: Burglary in the 1st Degree (Felony), Theft by Taking (Felony), Possession of Methamphetamine.\nBond: $15,000\nArresting Agency: Fannin County Sheriff\'s Office.',
          charges: ['Burglary in the 1st Degree (Felony)', 'Theft by Taking (Felony)', 'Possession of Methamphetamine'],
          bond: '$15,000',
          age: '38',
          category: 'FELONY',
          fbUrl: 'https://www.facebook.com/FanninCountyCrime'
        },
        {
          id: 'demo_102',
          name: 'PATTERSON, MEGAN NICOLE',
          photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
          createdTime: new Date(Date.now() - 3600000 * 18).toISOString(),
          rawMessage: 'NAME: PATTERSON, MEGAN NICOLE\nAge: 29 of McCaysville, GA\nCharges: Driving Under the Influence of Alcohol (DUI), Failure to Maintain Lane, Open Container.\nBond: $2,500\nBooked into Fannin County Detention Center.',
          charges: ['DUI - Driving Under the Influence (Alcohol)', 'Failure to Maintain Lane', 'Open Container'],
          bond: '$2,500',
          age: '29',
          category: 'DUI',
          fbUrl: 'https://www.facebook.com/FanninCountyCrime'
        },
        {
          id: 'demo_103',
          name: 'STANLEY, DUSTIN RAY',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          createdTime: new Date(Date.now() - 3600000 * 36).toISOString(),
          rawMessage: 'NAME: STANLEY, DUSTIN RAY\nAge: 42 of Epworth, GA\nCharges: Probation Violation (Superior Court Warrant - No Bond), Simple Battery - Family Violence.\nBond: NO BOND\nArrested by FCSO Patrol Division.',
          charges: ['Probation Violation (Superior Court Warrant)', 'Simple Battery - Family Violence'],
          bond: 'NO BOND',
          age: '42',
          category: 'WARRANT',
          fbUrl: 'https://www.facebook.com/FanninCountyCrime'
        },
        {
          id: 'demo_104',
          name: 'CHASTAIN, BRANDON LEE',
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
          createdTime: new Date(Date.now() - 3600000 * 60).toISOString(),
          rawMessage: 'NAME: CHASTAIN, BRANDON LEE\nAge: 34 of Morganton, GA\nCharges: Criminal Trespass (Misdemeanor), Obstruction of Law Enforcement Officers.\nBond: $3,000\nBooked on 08/16/2026.',
          charges: ['Criminal Trespass', 'Obstruction of Law Enforcement'],
          bond: '$3,000',
          age: '34',
          category: 'MISDEMEANOR',
          fbUrl: 'https://www.facebook.com/FanninCountyCrime'
        }
      ];

      const existingIds = new Set(allMugshots.map(m => m.id));
      demoData.forEach(d => {
        if (!existingIds.has(d.id)) allMugshots.unshift(d);
      });

      localStorage.setItem('fannin_mugshots_cache', JSON.stringify(allMugshots));
      localStorage.setItem('fannin_last_sync_time', Date.now().toString());
      syncStatus.textContent = 'DEMO DOSSIERS LOADED';
      syncStatus.style.color = '#00ff8c';
      if (typeof showToast === 'function') showToast('Loaded Demo Mugshot Records', 'info');
      renderCards();
    }

    function setupAutoSync() {
      if (autoSyncTimer) clearInterval(autoSyncTimer);
      const minutes = parseInt(localStorage.getItem('fb_auto_sync_interval') || '30', 10);
      if (minutes > 0) {
        autoSyncTimer = setInterval(() => {
          const token = localStorage.getItem(`fb_api_key_${profile}`);
          if (token) {
            console.log(`[FanninFeed] Auto-syncing feed (${minutes}m interval)...`);
            syncFromFacebook();
          }
        }, minutes * 60 * 1000);
      }
    }

    exportJsonBtn.addEventListener('click', () => {
      if (allMugshots.length === 0) return alert('No cached records to export.');
      const blob = new Blob([JSON.stringify(allMugshots, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `FanninCountyCrime_Dossiers_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

    syncBtn.addEventListener('click', syncFromFacebook);
    loadDemoBtn.addEventListener('click', loadDemoRecords);
    searchInput.addEventListener('input', renderCards);
    filterChargeSelect.addEventListener('change', renderCards);
    sortOrderSelect.addEventListener('change', renderCards);

    try {
      const cached = JSON.parse(localStorage.getItem('fannin_mugshots_cache')) || [];
      if (cached.length > 0) {
        allMugshots = cached;
        renderCards();
      } else {
        loadDemoRecords();
      }
    } catch(e) {
      allMugshots = [];
      loadDemoRecords();
    }

    setupAutoSync();

  }, 50);

  return container;
}
