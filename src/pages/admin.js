import { createElement } from '../components/utils.js';

const ADMIN_PIN = '142352002672167566';

function PinPad({ onSuccess }) {
  const wrap = createElement('div', { class: 'pinpad-wrap' });
  const input = createElement('input', { type: 'password', class: 'pinpad-input', maxlength: 18, placeholder: 'Enter Admin PIN...' });
  const btn = createElement('button', { class: 'pinpad-btn' }, 'UNLOCK');
  const msg = createElement('div', { class: 'pinpad-msg' });
  btn.onclick = () => {
    if (input.value === ADMIN_PIN) {
      onSuccess();
    } else {
      msg.textContent = 'Access Denied';
      input.value = '';
    }
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });
  wrap.appendChild(input);
  wrap.appendChild(btn);
  wrap.appendChild(msg);
  return wrap;
}

export default function AdminPanel() {
  const container = createElement('div', { class: 'admin-panel-page' });
  let unlocked = false;
  const state = {
    features: {
      intro: true,
      glitchPixel: true,
      overload: true,
      runpod: false
    }
  };
  function renderPanel() {
    container.innerHTML = '';
    const title = createElement('h1', { class: 'glitch', 'data-text': '// ADMIN_PANEL' }, '// ADMIN_PANEL');
    const featureToggles = createElement('div', { class: 'panel', style: 'margin-top:24px;' });
    featureToggles.appendChild(createElement('h2', {}, 'Feature Toggles'));
    Object.keys(state.features).forEach(key => {
      const label = createElement('label', { style: 'display:block;margin:8px 0;' });
      const cb = createElement('input', { type: 'checkbox', checked: state.features[key] });
      cb.onchange = () => {
        state.features[key] = cb.checked;
      };
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + key));
      featureToggles.appendChild(label);
    });
    // RunPod test
    const runpodTest = createElement('div', { class: 'panel', style: 'margin-top:24px;' });
    runpodTest.appendChild(createElement('h2', {}, 'RunPod Endpoint Test'));
    const testBtn = createElement('button', { class: 'runpod-test-btn' }, 'Test RunPod');
    const testResult = createElement('div', { class: 'runpod-test-result', style: 'margin-top:8px;' });
    testBtn.onclick = async () => {
      testResult.textContent = 'Testing...';
      try {
        const res = await fetch('/.netlify/functions/runpod', { method: 'POST', body: JSON.stringify({ test: true }) });
        const data = await res.json();
        testResult.textContent = 'Success: ' + JSON.stringify(data);
      } catch (e) {
        testResult.textContent = 'Error: ' + e.message;
      }
    };
    runpodTest.appendChild(testBtn);
    runpodTest.appendChild(testResult);
    container.appendChild(title);
    container.appendChild(featureToggles);
    container.appendChild(runpodTest);
  }
  function renderLock() {
    container.innerHTML = '';
    container.appendChild(PinPad({ onSuccess: () => {
      unlocked = true;
      renderPanel();
    }}));
  }
  renderLock();
  return container;
}
