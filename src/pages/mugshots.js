import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';
import { apiUrl } from '../components/api.js';

export default function MugshotsPage() {
  const container = createElement('div', { class: 'mugshots-page' });
  
  container.innerHTML = `
    <div class="page-header">
      <h1 class="glitch" data-text="// LOCAL_CUSTODY">// LOCAL_CUSTODY</h1>
      <p class="page-subtitle">AUTOMATED ARREST INTEL &amp; MUGSHOT DOSSIER MATRIX</p>
    </div>

    <!-- Main Dossier Feed View -->
    <div class="mug-view active" id="mug-database">
      
      <!-- Top Control & Filter HUD -->
      <div class="panel" style="margin-bottom: 20px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; border-bottom: 1px solid rgba(0,184,255,0.1); padding-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1;">
            <!-- Target URL removed as requested -->
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <span id="sync-status" style="font-size: 0.8rem; color: var(--text-muted); font-family: 'Share Tech Mono', monospace;">CACHE LOADED</span>
            <button id="sync-btn" class="aim-btn aim-btn-accept" style="font-size: 0.8rem; padding: 8px 16px;">↻ SYNC FEED</button>
            <button id="export-json-btn" class="aim-btn" style="font-size: 0.8rem; padding: 8px 14px; opacity: 0.8;">EXPORT JSON</button>
          </div>
        </div>

        <!-- Telemetry & Search Row -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <div style="flex: 2; min-width: 240px; position: relative;">
            <input type="text" id="mug-search-input" class="aim-input" placeholder="Search by offender name, charges, or booking date..." style="width: 100%; padding-left: 36px;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem;">&#x1F50D;</span>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <select id="mug-filter-charge" class="aim-input" style="background: #030712; color: #fff;">
              <option value="ALL">All Offense Types</option>
              <option value="BOOKMARKED">⭐ Bookmarked</option>
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
          <div>SCRAPER STATUS: <span id="stat-scraper-status" style="color: #00ff8c;">ONLINE</span></div>
        </div>
      </div>

      <!-- Mugshots Grid Container -->
      <div id="mugshot-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px;">
        <!-- Mugshots will render here -->
      </div>
      
      <!-- Pagination Controls -->
      <div id="mugshot-pagination" style="display: flex; justify-content: center; gap: 10px; margin-top: 25px; padding-bottom: 20px;"></div>
    </div>
  `;

  setTimeout(() => {
    const profile = sessionStorage.getItem('current_profile') || 'Guest';
    
    // Elements
    const syncBtn = container.querySelector('#sync-btn');
    const exportJsonBtn = container.querySelector('#export-json-btn');
    const syncStatus = container.querySelector('#sync-status');
    const mugshotGrid = container.querySelector('#mugshot-grid');
    
    const searchInput = container.querySelector('#mug-search-input');
    const filterChargeSelect = container.querySelector('#mug-filter-charge');
    const sortOrderSelect = container.querySelector('#mug-sort-order');
    
    const statTotalRecords = container.querySelector('#stat-total-records');
    const statLastSync = container.querySelector('#stat-last-sync');
    const statScraperStatus = container.querySelector('#stat-scraper-status');

    let allMugshots = [];

    function extractCharges(message) {
      if (!message) return 'PENDING REVIEW';
      
      // Quick regex to grab anything after "Charge:", "Charges:", "Offense:", "Arrested for:"
      const match = message.match(/(?:Charge|Charges|Offense|Arrested for|Warrant)s?:?\s*([^<\n]+)/i);
      if (match) {
        return match[1].trim();
      }
      
      // If no explicit labels, try to find a line that looks like a charge list
      const lines = message.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 5 && !line.startsWith('Name:') && !line.startsWith('Age:') && !line.startsWith('Source:')) {
          return line;
        }
      }
      
      return 'PENDING REVIEW';
    }

    function determineSeverity(chargesString) {
      const text = chargesString.toUpperCase();
      if (text.includes('PENDING REVIEW')) {
          return 'UNCLASSIFIED';
      }
      if (text.includes('MURDER') || text.includes('FELONY') || text.includes('ASSAULT') || text.includes('DRUG') || text.includes('POSSESSION') || text.includes('BATTERY') || text.includes('THEFT')) {
          return 'FELONY';
      }
      return 'MISDEMEANOR';
    }

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
        charges: charges.length > 0 ? charges : ['PENDING REVIEW'],
        bond: bond || 'Not Specified',
        age: age || 'N/A',
        category,
        fbUrl: post.permalink_url || `https://www.facebook.com/FanninCountyCrime`
      };
    }

    let currentPage = 1;
    const itemsPerPage = 20;

    // Render Cards
    function renderCards() {
      const search = (searchInput.value || '').trim().toLowerCase();
      const chargeFilter = filterChargeSelect.value;
      const sortOrder = sortOrderSelect.value;
      
      const bookmarksKey = `alphacore_bookmarks_${profile}`;
      let bookmarks = JSON.parse(localStorage.getItem(bookmarksKey)) || [];

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
        } else if (chargeFilter === 'BOOKMARKED') {
          filtered = filtered.filter(m => bookmarks.includes(m.id));
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
      const paginationContainer = container.querySelector('#mugshot-pagination');
      if (paginationContainer) paginationContainer.innerHTML = '';

      if (filtered.length === 0) {
        mugshotGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: rgba(0,0,0,0.3); border: 1px dashed var(--border-dim); border-radius: 6px;">
            <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;">🚨</div>
            <div style="color: var(--text-muted); font-size: 0.95rem; font-family: 'Orbitron', sans-serif;">NO CUSTODY DOSSIERS CACHED</div>
            <div style="color: #64748b; font-size: 0.8rem; margin-top: 6px;">Click "SYNC FEED" above to fetch real arrest records from the target page.</div>
          </div>
        `;
        return;
      }
      
      const totalPages = Math.ceil(filtered.length / itemsPerPage);
      if (currentPage > totalPages) currentPage = totalPages;
      const startIdx = (currentPage - 1) * itemsPerPage;
      const pageItems = filtered.slice(startIdx, startIdx + itemsPerPage);

      pageItems.forEach(m => {
        const isBookmarked = bookmarks.includes(m.id);
        const card = document.createElement('div');
        
        let catColor = '#06b6d4';
        let cardBg = 'rgba(10,15,25,0.9)';
        
        if (m.category === 'FELONY') {
          catColor = '#ff003c';
          cardBg = 'rgba(255, 0, 60, 0.15)';
        } else if (m.category === 'WARRANT') {
          catColor = '#a855f7';
        } else if (m.category === 'DUI') {
          catColor = '#eab308';
        }

        card.style.cssText = `background: ${cardBg}; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s ease, border-color 0.2s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.4); position: relative;`;
        card.onmouseover = () => {
          card.style.borderColor = 'var(--accent)';
          card.style.transform = 'translateY(-3px)';
        };
        card.onmouseout = () => {
          card.style.borderColor = 'var(--border)';
          card.style.transform = 'translateY(0)';
        };
        
        const bookmarkBtn = document.createElement('div');
        bookmarkBtn.innerHTML = isBookmarked ? '⭐' : '☆';
        bookmarkBtn.style.cssText = `position: absolute; top: 10px; left: 10px; z-index: 10; font-size: 1.2rem; cursor: pointer; text-shadow: 0 0 5px rgba(0,0,0,0.8); color: ${isBookmarked ? '#fbbf24' : '#fff'};`;
        bookmarkBtn.onclick = (e) => {
          e.stopPropagation();
          let bm = JSON.parse(localStorage.getItem(bookmarksKey)) || [];
          if (bm.includes(m.id)) {
            bm = bm.filter(id => id !== m.id);
            bookmarkBtn.innerHTML = '☆';
            bookmarkBtn.style.color = '#fff';
          } else {
            bm.push(m.id);
            bookmarkBtn.innerHTML = '⭐';
            bookmarkBtn.style.color = '#fbbf24';
          }
          localStorage.setItem(bookmarksKey, JSON.stringify(bm));
          if (filterChargeSelect.value === 'BOOKMARKED') renderCards(); // Refresh if in bookmark view
        };
        card.appendChild(bookmarkBtn);

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
        metaEl.innerHTML = `<span>📅 ${new Date(m.createdTime).toLocaleDateString()}</span>`;

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

      // Render Pagination Buttons
      if (totalPages > 1 && paginationContainer) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'aim-btn aim-btn-sm';
        prevBtn.textContent = '◀ PREV';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => { currentPage--; renderCards(); };

        const pageInfo = document.createElement('div');
        pageInfo.style.cssText = 'color: var(--blue); font-family: "Orbitron", sans-serif; font-size: 0.9rem; display: flex; align-items: center; padding: 0 10px;';
        pageInfo.textContent = `PAGE ${currentPage} // ${totalPages}`;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'aim-btn aim-btn-sm';
        nextBtn.textContent = 'NEXT ▶';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => { currentPage++; renderCards(); };

        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextBtn);
      }
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

    // Fetch from Automated Token-less Scraper & Bridges
    async function syncFromFacebook() {
      const pageTarget = 'FanninCountyCrime';

      syncBtn.disabled = true;
      syncBtn.textContent = 'CONNECTING...';
      syncStatus.textContent = 'QUERYING REAL INTEL SCRAPER...';
      syncStatus.style.color = 'var(--accent)';

      try {
        let rawPosts = [];

        // VECTOR 1: Token-less Scraper Microservice
        let scraperEndpoint;
        try {
          const customStr = localStorage.getItem('alphacore_modal_settings');
          if (customStr) {
            const custom = JSON.parse(customStr);
            if (custom.fanninCrimeUrl) {
                scraperEndpoint = custom.fanninCrimeUrl;
            } else {
                scraperEndpoint = 'https://alphacoreprogramming-ai--alphacore-aio-backend-fastapi-a-314381.modal.run/api/mugshots';
            }
          } else {
            scraperEndpoint = 'https://alphacoreprogramming-ai--alphacore-aio-backend-fastapi-a-314381.modal.run/api/mugshots';
          }
        } catch(e) {
          scraperEndpoint = 'https://alphacoreprogramming-ai--alphacore-aio-backend-fastapi-a-314381.modal.run/api/mugshots';
        }

        try {
          syncStatus.textContent = 'QUERYING ENDPOINT...';
          const res = await fetch(scraperEndpoint, { signal: AbortSignal.timeout(60000) });
          if (res.ok) {
            const data = await res.json();
            rawPosts = Array.isArray(data) ? data : (data.data || []);
            const src = data.source || 'endpoint';
            syncStatus.textContent = `FEED RECEIVED [${src.toUpperCase()}] — ${rawPosts.length} RECORDS`;
          } else {
            syncStatus.textContent = `ENDPOINT ERROR: HTTP ${res.status}`;
            statScraperStatus.textContent = 'DEGRADED';
            statScraperStatus.style.color = '#ff003c';
          }
        } catch(e) {
          console.warn('Scraper microservice unavailable:', e.message);
          syncStatus.textContent = 'SCRAPER UNREACHABLE — FALLBACK MODE';
          statScraperStatus.textContent = 'DEGRADED';
          statScraperStatus.style.color = '#ffaa00';
        }

        // ── GAZETTE PROFILE AUGMENTATION ──
        // For each post that came back with a gazette permalink but no charges,
        // follow the individual profile link to extract structured charge data.
        if (rawPosts.length > 0) {
          syncStatus.textContent = `PARSING ${rawPosts.length} PROFILES...`;
          const CONCURRENCY = 5;
          const augmented = [...rawPosts];

          for (let batch = 0; batch < augmented.length; batch += CONCURRENCY) {
            const chunk = augmented.slice(batch, batch + CONCURRENCY);
            await Promise.all(chunk.map(async (post, offset) => {
              // Only hit gazette profile links, skip FB posts that already have charges
              const link = post.permalink_url || '';
              const hasCharges = post.charges && post.charges.length > 0 && !post.charges.includes('PENDING REVIEW');
              if (!hasCharges && link.includes('thegeorgiagazette.com')) {
                try {
                  const profileRes = await fetch(apiUrl(`/api/gazette-profile?url=${encodeURIComponent(link)}`), { signal: AbortSignal.timeout(12000) });
                  if (profileRes.ok) {
                    const pd = await profileRes.json();
                    if (pd.charges && pd.charges.length > 0) {
                      augmented[batch + offset].charges = pd.charges;
                      augmented[batch + offset].name = pd.name || augmented[batch + offset].name;
                      augmented[batch + offset].age = pd.age || augmented[batch + offset].age;
                      augmented[batch + offset].bond = pd.bond || augmented[batch + offset].bond;
                      augmented[batch + offset].createdTime = pd.booking_date || augmented[batch + offset].createdTime;
                    }
                  }
                } catch(e) {
                  // profile fetch failed, move on silently
                }
              }
            }));
            syncStatus.textContent = `PROFILING... ${Math.min(batch + CONCURRENCY, augmented.length)} / ${augmented.length}`;
          }
          rawPosts = augmented;
        }

        let parsed = rawPosts.map(post => {
          // If the backend already returned structured fields, use them directly
          if (post.charges && Array.isArray(post.charges) && post.charges.length > 0) {
            return {
              id: post.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
              name: (post.name || 'UNKNOWN SUBJECT').toUpperCase(),
              photoUrl: post.full_picture || post.photoUrl || '/Images/ALPHA-LOGO.png',
              createdTime: post.created_time || post.createdTime || new Date().toISOString(),
              rawMessage: post.message || post.rawMessage || '',
              charges: post.charges,
              bond: post.bond || 'Not Specified',
              age: post.age || 'N/A',
              category: determineSeverity(post.charges.join(' ')),
              fbUrl: post.permalink_url || 'https://www.facebook.com/FanninCountyCrime'
            };
          }
          // Fall back to intelligent parser for raw FB-style posts
          return parseArrestPost(post);
        });

        // --- GAZETTE AUGMENTATION PROTOCOL ---
        syncStatus.textContent = 'CROSS-REFERENCING THE GEORGIA GAZETTE...';
        for (let i = 0; i < parsed.length; i++) {
          if (parsed[i].charges.includes('PENDING REVIEW')) {
            try {
              const fName = parsed[i].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
              const res = await fetch(apiUrl(`/api/gazette/${fName}`));
              if (res.ok) {
                const html = await res.text();
                const match = html.match(/Reason\(s\)\s*For\s*Booking:.*?<\/strong>\s*(?:<br>)?\s*(.*?)\s*(?:<\/p>|<br>|<h)/si);
                if (match && match[1]) {
                  const scrapedCharge = match[1].replace(/<[^>]+>/g, '').trim();
                  parsed[i].charges = [scrapedCharge];
                  parsed[i].category = determineSeverity(scrapedCharge);
                }
              }
            } catch (e) {
              console.warn("Gazette augmentation failed for", parsed[i].name, e);
            }
          }
        }

        const existingIds = new Set(allMugshots.map(m => m.id));
        const newRecords = parsed.filter(p => !existingIds.has(p.id));
        
        allMugshots = [...newRecords, ...allMugshots];
        localStorage.setItem('fannin_mugshots_cache', JSON.stringify(allMugshots));
        localStorage.setItem('fannin_last_sync_time', Date.now().toString());

        syncStatus.textContent = `SYNC SUCCESS (+${newRecords.length} NEW / ${allMugshots.length} TOTAL)`;
        syncStatus.style.color = '#00ff8c';
        statScraperStatus.textContent = 'ONLINE';
        statScraperStatus.style.color = '#00ff8c';
        if (typeof showToast === 'function') showToast(`Synced ${newRecords.length} new mugshot dossiers`, 'success');

        renderCards();

      } catch (err) {
        console.error('Mugshots Sync Error:', err);
        syncStatus.textContent = 'SYNC STANDBY';
        syncStatus.style.color = '#ffaa00';
        renderCards();
      } finally {
        syncBtn.disabled = false;
        syncBtn.textContent = '↻ SYNC FEED';
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

    syncBtn.addEventListener('click', () => { currentPage = 1; syncFromFacebook(); });
    searchInput.addEventListener('input', () => { currentPage = 1; renderCards(); });
    filterChargeSelect.addEventListener('change', () => { currentPage = 1; renderCards(); });
    sortOrderSelect.addEventListener('change', () => { currentPage = 1; renderCards(); });

    try {
      const cached = JSON.parse(localStorage.getItem('fannin_mugshots_cache')) || [];
      // Filter out any previously cached demo/fake entries
      const realCached = cached.filter(m => m && m.id && !m.id.startsWith('demo_') && !m.photoUrl?.includes('unsplash'));
      
      if (realCached.length > 0) {
        allMugshots = realCached;
        localStorage.setItem('fannin_mugshots_cache', JSON.stringify(realCached));
        renderCards();
      } else {
        localStorage.removeItem('fannin_mugshots_cache');
        allMugshots = [];
        renderCards();
      }
      
      // Auto-sync feed on load
      setTimeout(() => {
          const syncBtnElement = document.getElementById('sync-btn');
          if (syncBtnElement && !syncBtnElement.disabled) {
              syncBtnElement.click();
          }
      }, 500);

    } catch(e) {
      allMugshots = [];
      localStorage.removeItem('fannin_mugshots_cache');
      renderCards();
    }

  }, 50);

  return container;
}
