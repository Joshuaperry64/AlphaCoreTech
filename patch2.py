import pathlib
f = pathlib.Path('src/pages/aimodals.js')
d = f.read_text('utf-8')

inject_ui = '''
    <div class="aim-field" id="t2i-cn-container" style="display:none; padding:10px; border:1px solid var(--accent); border-radius:4px; margin-bottom:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <label class="aim-label" style="margin:0;">ACTIVE CONTROLNET: <span id="t2i-cn-label" style="color:var(--accent);"></span></label>
        <button class="aim-btn aim-btn-sm" id="t2i-cn-clear" style="padding:2px 8px; font-size:0.75rem; background:rgba(255,50,50,0.1); border-color:#ff4444; color:#ff4444;">X CLEAR</button>
      </div>
      <img id="t2i-cn-preview" style="max-width:150px; border-radius:4px; margin-top:10px;" />
    </div>
'''

d = d.replace('    <div class="aim-row">', inject_ui + '\n    <div class="aim-row">')

payload_inject = '''  if (window._cn_global_img && window._cn_global_type && document.querySelector('#t2i-cn-container').style.display !== 'none') {
    payload.control_image_b64 = window._cn_global_img;
    payload.control_type = window._cn_global_type;
    payload.controlnet_conditioning_scale = 1.0;
  }'''

# Find the payload object definition and inject this after it.
payload_start = "    const payload = {"
payload_end = "      lora: loraStr\n    };"

idx1 = d.find(payload_start)
idx2 = d.find(payload_end, idx1) + len(payload_end)

d = d[:idx2] + "\n" + payload_inject + "\n" + d[idx2:]

clear_logic = '''
  const clearBtn = wrap.querySelector('#t2i-cn-clear');
  if (clearBtn) {
    clearBtn.onclick = () => {
      wrap.querySelector('#t2i-cn-container').style.display = 'none';
      window._cn_global_img = null;
      window._cn_global_type = null;
    };
  }
'''

d = d.replace('  wrap.querySelector(\'#t2i-generate-btn\').addEventListener(\'click\',', clear_logic + '\n  wrap.querySelector(\'#t2i-generate-btn\').addEventListener(\'click\',')

f.write_text(d, 'utf-8')
