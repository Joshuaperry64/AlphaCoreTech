import { createElement } from '../components/utils.js';
import { getAllGalleryImages } from '../components/vision_db.js';

export default function VisionProcessor() {
  const container = createElement('div', { class: 'vision-page' });
  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// VISION_PROCESSOR">// VISION_PROCESSOR</h1>
      <p>Global Artifact Gallery. Access restricted to Administrator privileges.</p>
    </div>
    
    <div class="vision-controls">
      <label class="aim-label" style="display:inline-block; margin-right:10px;">FILTER BY PROFILE:</label>
      <select id="vision-filter" class="aim-input" style="width: 200px; display:inline-block; margin-bottom: 20px;">
        <option value="ALL">ALL PROFILES</option>
      </select>
    </div>

    <div class="vision-gallery" id="vision-gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; align-items: start;">
      <p style="color:var(--dim); grid-column:1/-1;">SCANNING LOCAL VISION DATABASE...</p>
    </div>
    
    <div id="vision-modal" class="vision-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; justify-content:center; align-items:center; flex-direction:column;">
      <div style="width:100%; max-width:800px; text-align:right; padding:20px;">
        <button id="vision-modal-close" class="aim-btn" style="width:auto; padding:5px 15px; border-color:var(--error); color:var(--error);">CLOSE [X]</button>
      </div>
      <img id="vision-modal-img" src="" style="max-width:90%; max-height:75vh; border:2px solid var(--accent); box-shadow:0 0 20px rgba(0, 184, 255, 0.5);" />
      <div id="vision-modal-meta" style="margin-top:20px; text-align:center; color:var(--text); font-family:var(--font-mono); font-size:12px; padding: 0 20px; max-width: 800px;"></div>
    </div>
  `;

  setTimeout(async () => {
    const galleryEl = container.querySelector('#vision-gallery');
    const filterEl = container.querySelector('#vision-filter');
    const vModal = container.querySelector('#vision-modal');
    const vModalClose = container.querySelector('#vision-modal-close');
    const vModalImg = container.querySelector('#vision-modal-img');
    const vModalMeta = container.querySelector('#vision-modal-meta');

    try {
      const images = await getAllGalleryImages();
      
      if (images.length === 0) {
        galleryEl.innerHTML = '<p style="color:var(--dim); grid-column:1/-1;">NO ARTIFACTS DETECTED IN GLOBAL INDEX.</p>';
        return;
      }

      const profiles = [...new Set(images.map(img => img.profile))];
      profiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p.toUpperCase();
        filterEl.appendChild(opt);
      });

      const renderGallery = (filterProfile) => {
        galleryEl.innerHTML = '';
        const filtered = filterProfile === 'ALL' ? images : images.filter(img => img.profile === filterProfile);
        
        if (filtered.length === 0) {
          galleryEl.innerHTML = '<p style="color:var(--dim); grid-column:1/-1;">NO ARTIFACTS FOR THIS PROFILE.</p>';
          return;
        }

        filtered.forEach(img => {
          const card = document.createElement('div');
          card.style.cssText = 'background: rgba(0,0,0,0.4); border: 1px solid var(--dim); border-radius: 4px; overflow: hidden; cursor: pointer; transition: all 0.3s;';
          card.onmouseover = () => { card.style.borderColor = 'var(--accent)'; card.style.boxShadow = '0 0 10px rgba(0, 184, 255, 0.2)'; };
          card.onmouseout = () => { card.style.borderColor = 'var(--dim)'; card.style.boxShadow = 'none'; };
          
          const date = new Date(img.timestamp).toLocaleString();
          
          const imgEl = document.createElement('img');
          imgEl.src = img.data;
          imgEl.style.cssText = 'width:100%; height:200px; object-fit:cover; border-bottom: 1px solid var(--dim);';
          
          const meta = document.createElement('div');
          meta.style.cssText = 'padding: 10px; font-size: 10px; font-family: var(--font-mono); color: var(--dim);';
          
          const profileLabel = document.createElement('div');
          profileLabel.style.cssText = 'color: var(--accent); margin-bottom:5px;';
          profileLabel.textContent = '[ ' + img.profile.toUpperCase() + ' ]';
          
          const promptLabel = document.createElement('div');
          promptLabel.style.cssText = 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px;';
          promptLabel.title = img.prompt;
          promptLabel.textContent = img.prompt;
          
          const row = document.createElement('div');
          row.style.cssText = 'display:flex; justify-content:space-between;';
          
          const sourceSpan = document.createElement('span');
          sourceSpan.textContent = img.source;
          const dateSpan = document.createElement('span');
          dateSpan.textContent = date;
          
          row.appendChild(sourceSpan);
          row.appendChild(dateSpan);
          meta.appendChild(profileLabel);
          meta.appendChild(promptLabel);
          meta.appendChild(row);
          card.appendChild(imgEl);
          card.appendChild(meta);
          
          card.onclick = () => {
            vModalImg.src = img.data;
            vModalMeta.innerHTML = '<span style="color:var(--accent);">PROFILE:</span> ' + img.profile.toUpperCase() + 
              ' &nbsp;|&nbsp; <span style="color:var(--accent);">SOURCE:</span> ' + img.source + 
              ' &nbsp;|&nbsp; <span style="color:var(--accent);">TIME:</span> ' + date + 
              '<br/><br/><span style="color:var(--accent);">PROMPT:</span> ' + img.prompt;
            vModal.style.display = 'flex';
          };
          
          galleryEl.appendChild(card);
        });
      };

      filterEl.addEventListener('change', (e) => renderGallery(e.target.value));
      vModalClose.addEventListener('click', () => { vModal.style.display = 'none'; });
      vModal.addEventListener('click', (e) => { if (e.target === vModal) vModal.style.display = 'none'; });
      
      renderGallery('ALL');
      
    } catch(e) {
      console.error(e);
      galleryEl.innerHTML = '<p style="color:var(--error); grid-column:1/-1;">ERROR MOUNTING INDEXED_DB GALLERY.</p>';
    }
  }, 50);

  return container;
}
