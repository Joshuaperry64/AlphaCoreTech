import pathlib
f = pathlib.Path('src/pages/aimodals.js')
d = f.read_text('utf-8')

d = d.replace("txt2vidUrl: 'https://alphacoreprogramming", "preprocessorUrl: 'https://alphacoreprogramming-ai--alphacore-aio-backend-preproces-d30863.modal.run/',\n    txt2vidUrl: 'https://alphacoreprogramming")

tab_html = '''        <button class="aim-tab" data-tab="controlnet" id="aim-tab-cnet" style="color: #60a5fa; border-color: #60a5fa;">
          <span class="aim-tab-icon">?</span> CN FORGE
        </button>
'''
d = d.replace('<button class="aim-tab" data-tab="framepack"', tab_html + '        <button class="aim-tab" data-tab="framepack"')

d = d.replace("} else if (tab.dataset.tab === 'img2vid') {", "} else if (tab.dataset.tab === 'controlnet') {\n        currentPanel = buildControlNetForge();\n      } else if (tab.dataset.tab === 'img2vid') {")

cn_func = '''
/* --- CONTROLNET FORGE PANEL ---------------------------------------- */
function buildControlNetForge() {
  const settings = getModalSettings();
  const wrap = document.createElement('div');
  wrap.className = 'aim-panel';
  wrap.innerHTML = 
    <div class="aim-panel-header">
      <span class="aim-panel-icon">?</span>
      <span class="aim-panel-title">CONTROLNET FORGE</span>
      <span class="aim-panel-badge">PRE-PROCESSOR</span>
    </div>
    
    <div class="aim-field">
      <label class="aim-label">UPLOAD BASE IMAGE</label>
      <input type="file" id="cn-file-input" accept="image/png, image/jpeg" style="display:none;" />
      <div class="aim-dropzone" id="cn-dropzone" style="cursor:pointer; text-align:center; padding:40px; border:1px dashed var(--accent); border-radius:4px;">
        Click to Upload Base Image
      </div>
      <img id="cn-preview" style="display:none; max-width:100%; max-height:400px; margin-top:10px; border-radius:4px; margin-left:auto; margin-right:auto;" />
    </div>

    <div class="aim-field">
      <label class="aim-label">CONTROLNET TYPE</label>
      <select class="aim-input" id="cn-type">
        <option value="openpose">OpenPose (Human Pose Skeletons)</option>
        <option value="canny">Canny (Crisp Edge Outlines)</option>
        <option value="depth">MiDaS (3D Depth Maps)</option>
      </select>
    </div>

    <button class="aim-btn aim-btn-generate" id="cn-generate-btn" style="width:100%;">? GENERATE VISION MAP</button>
    <div id="cn-loader" style="display:none; text-align:center; margin-top:10px; color:var(--accent);">Processing vision map via A10G... This can take up to 20 seconds on cold start.</div>

    <div id="cn-result-container" style="display:none; margin-top:20px; border-top:1px solid #334; padding-top:20px;">
      <label class="aim-label">GENERATED CONTROLNET MAP</label>
      <img id="cn-result-img" style="max-width:100%; max-height:400px; display:block; border-radius:4px; margin: 0 auto 15px auto;" />
      <div style="display:flex; gap:10px;">
        <button class="aim-btn" id="cn-send-txt2img" style="flex:1; background:rgba(6,182,212,0.1); color:var(--accent); border-color:var(--accent);">SEND TO TXT2IMG</button>
      </div>
    </div>
  ;

  let base64Image = null;
  const fileInput = wrap.querySelector('#cn-file-input');
  const dropzone = wrap.querySelector('#cn-dropzone');
  const preview = wrap.querySelector('#cn-preview');
  const resultImg = wrap.querySelector('#cn-result-img');

  dropzone.onclick = () => fileInput.click();
  preview.onclick = () => fileInput.click();
  
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      base64Image = event.target.result;
      preview.src = base64Image;
      preview.style.display = 'block';
      dropzone.style.display = 'none';
      wrap.querySelector('#cn-result-container').style.display = 'none';
    };
    reader.readAsDataURL(file);
  };

  wrap.querySelector('#cn-generate-btn').onclick = async () => {
    if (!base64Image) { alert("Please upload an image first."); return; }
    const type = wrap.querySelector('#cn-type').value;
    
    wrap.querySelector('#cn-loader').style.display = 'block';
    wrap.querySelector('#cn-generate-btn').disabled = true;
    wrap.querySelector('#cn-result-container').style.display = 'none';

    try {
      const res = await fetch(settings.preprocessorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: base64Image, processor_type: type })
      });
      const data = await res.json();
      if (data.image_b64) {
        resultImg.src = data.image_b64;
        wrap.querySelector('#cn-result-container').style.display = 'block';
        
        window._cn_global_img = data.image_b64;
        window._cn_global_type = type;
      } else {
        alert("Error generating map: " + JSON.stringify(data));
      }
    } catch (e) {
      alert("Network Error: " + e.message);
    } finally {
      wrap.querySelector('#cn-loader').style.display = 'none';
      wrap.querySelector('#cn-generate-btn').disabled = false;
    }
  };

  wrap.querySelector('#cn-send-txt2img').onclick = () => {
    document.querySelector('#aim-tab-t2i').click();
    const cnPreviewContainer = document.querySelector('#t2i-cn-container');
    if (cnPreviewContainer) {
       cnPreviewContainer.style.display = 'block';
       document.querySelector('#t2i-cn-preview').src = window._cn_global_img;
       document.querySelector('#t2i-cn-label').textContent = window._cn_global_type.toUpperCase();
    }
  };

  return wrap;
}
'''
d = d.replace('/* --- TXT2VID PANEL', cn_func + '\n/* --- TXT2VID PANEL')
f.write_text(d, 'utf-8')
