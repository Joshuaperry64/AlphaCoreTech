/**
 * Port Entry Point: bR0k3nC0Re
 * Web-Ported Cyberpunk Component for AlphaCoreTech Subroutines Console.
 */

export const id = 'port-br0k3nc0re';
export const name = 'bR0k3nC0Re';
export const category = 'Security & Cyber';
export const version = '2.0.0-uplink';
export const description = 'Remote uplink to the bR0k3nC0Re desktop AI suite. [RESTRICTED: ARCHITECT CLEARANCE ONLY]';
export const pythonSourcePath = 'bR0k3nC0Re/main.py';

let activeInstance = null;

export function render(container, options = {}) {
  if (!container) return { destroy: () => {} };
  destroy();

  const userPin = localStorage.getItem('alphacore_pin') || '';

  // Initial Locked State UI
  container.innerHTML = `
    <div class="port-br0k3nc0re-app" style="height: 100%; display: flex; flex-direction: column; background: rgba(5,0,10,0.95); border: 1px solid rgba(139,92,246,0.4); border-radius: 6px; padding: 20px; color: #e2e8f0; font-family: 'Share Tech Mono', monospace; box-shadow: inset 0 0 40px rgba(139,92,246,0.05);">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(139,92,246,0.3); padding-bottom: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="margin: 0; font-family: 'Orbitron', sans-serif; font-size: 1.4rem; color: #a78bfa; text-shadow: 0 0 10px rgba(167,139,250,0.5); display: flex; align-items: center; gap: 8px;">
            <span>⚡ ${name}</span>
            <span style="font-size: 0.75rem; background: rgba(139,92,246,0.15); color: #c4b5fd; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(139,92,246,0.4);">REMOTE UPLINK</span>
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #aaa;">${description}</p>
        </div>
      </div>

      <!-- Authentication Box -->
      <div id="br0k3n-auth-box" style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
        <h3 style="color: #ef4444; font-family: 'Orbitron', sans-serif; letter-spacing: 2px; margin: 0 0 8px 0;">RESTRICTED ACCESS</h3>
        <p style="color: #888; max-width: 400px; margin: 0 0 20px 0;">This module interfaces directly with the native AI Core desktop suite. It is hard-locked to the <strong>Architect</strong> profile.</p>
        
        <div style="display: flex; gap: 8px; width: 100%; max-width: 300px;">
          <input type="password" id="br0k3n-pin" placeholder="ENTER ARCHITECT PIN..." value="${userPin}" style="flex-grow: 1; background: rgba(0,0,0,0.6); border: 1px solid rgba(139,92,246,0.3); border-radius: 4px; padding: 10px; color: #fff; font-family: 'Share Tech Mono', monospace; text-align: center; outline: none;" />
        </div>
        <button id="br0k3n-btn-auth" style="margin-top: 12px; width: 100%; max-width: 300px; background: rgba(139,92,246,0.15); border: 1px solid #a78bfa; color: #a78bfa; padding: 12px; border-radius: 4px; cursor: pointer; font-family: 'Orbitron', sans-serif; font-weight: bold; transition: all 0.2s;">
          AUTHORIZE UPLINK
        </button>
        <div id="br0k3n-auth-status" style="margin-top: 16px; font-size: 0.85rem; color: #ef4444; min-height: 20px;"></div>
      </div>

      <!-- Authenticated Dashboard (Hidden by default) -->
      <div id="br0k3n-dashboard" style="display: none; flex-grow: 1; flex-direction: column; gap: 16px;">
        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 12px; border-radius: 4px; color: #34d399; font-size: 0.9rem;">
          > IDENTITY VERIFIED: <strong>ARCHITECT</strong>. UPLINK ESTABLISHED.
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; flex-grow: 1;">
          <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(139,92,246,0.2); border-radius: 4px; padding: 16px; display: flex; flex-direction: column;">
            <h4 style="color: #c4b5fd; margin: 0 0 12px 0; border-bottom: 1px dashed rgba(139,92,246,0.2); padding-bottom: 8px;">// CORE MODULES</h4>
            <button class="br0k3n-dash-btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 10px; margin-bottom: 8px; text-align: left; cursor: pointer;">> INIT CONVERSATION AI</button>
            <button class="br0k3n-dash-btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 10px; margin-bottom: 8px; text-align: left; cursor: pointer;">> INIT STORY GENERATOR</button>
            <button class="br0k3n-dash-btn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #ccc; padding: 10px; margin-bottom: 8px; text-align: left; cursor: pointer;">> RUNPOD FLUX CLIENT</button>
            <button class="br0k3n-dash-btn" style="background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.3); color: #fca5a5; padding: 10px; text-align: left; cursor: pointer;">> [LOCKED] ENGAGE EXCLUSIVES</button>
          </div>
          
          <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(139,92,246,0.2); border-radius: 4px; padding: 16px; display: flex; flex-direction: column;">
            <h4 style="color: #c4b5fd; margin: 0 0 12px 0; border-bottom: 1px dashed rgba(139,92,246,0.2); padding-bottom: 8px;">// UPLINK TERMINAL</h4>
            <div id="br0k3n-terminal" style="flex-grow: 1; background: #000; padding: 10px; font-size: 0.8rem; color: #a78bfa; overflow-y: auto;">
              > Establishing secure socket to local Qt6 desktop...<br/>
              > Ping timeout. Ensure bR0k3nC0Re/main.py is running locally.
            </div>
          </div>
        </div>
      </div>

    </div>
  \`;

  const authBox = container.querySelector('#br0k3n-auth-box');
  const dashboard = container.querySelector('#br0k3n-dashboard');
  const btnAuth = container.querySelector('#br0k3n-btn-auth');
  const pinInput = container.querySelector('#br0k3n-pin');
  const authStatus = container.querySelector('#br0k3n-auth-status');
  const terminal = container.querySelector('#br0k3n-terminal');

  // Hover effect for auth button
  btnAuth.addEventListener('mouseenter', () => btnAuth.style.background = 'rgba(139,92,246,0.3)');
  btnAuth.addEventListener('mouseleave', () => btnAuth.style.background = 'rgba(139,92,246,0.15)');

  // Hover effect for dashboard buttons
  const dashBtns = container.querySelectorAll('.br0k3n-dash-btn');
  dashBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(139,92,246,0.2)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(255,255,255,0.05)');
    btn.addEventListener('click', () => {
      terminal.innerHTML += \`<br/><span style="color:#ef4444;">> ERR: Native execution blocked by browser sandbox. Use local client.</span>\`;
      terminal.scrollTop = terminal.scrollHeight;
    });
  });

  // Authentication Logic
  btnAuth.addEventListener('click', async () => {
    const pin = pinInput.value.trim();
    if (!pin) {
      authStatus.textContent = "> PIN REQUIRED.";
      return;
    }

    authStatus.innerHTML = '<span style="color: #a78bfa;">> VERIFYING CLEARANCE...</span>';
    btnAuth.disabled = true;
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enforce the 'admin' role which is tied to the Architect profile
        body: JSON.stringify({ pin, requiredRole: 'admin' })
      });
      
      const data = await res.json();
      
      if (data.valid && data.pinObj && data.pinObj.label === 'Architect') {
        authBox.style.display = 'none';
        dashboard.style.display = 'flex';
        if (options.onLog) options.onLog('[bR0k3nC0Re] Architect uplink authorized.', '#34d399');
      } else {
        authStatus.textContent = \`> ACCESS DENIED. STRICT ARCHITECT CLEARANCE REQUIRED.\`;
        if (options.onLog) options.onLog(\`[bR0k3nC0Re] Auth failed: Profile was \${data.pinObj?.label || 'unknown'}\`, '#ef4444');
      }
    } catch (err) {
      authStatus.textContent = "> NETWORK ERROR. CANNOT REACH AUTH SERVER.";
    } finally {
      btnAuth.disabled = false;
    }
  });

  activeInstance = {
    destroy: () => {
      container.innerHTML = '';
      activeInstance = null;
    }
  };

  return activeInstance;
}

export async function execute(params = {}) {
  return {
    success: false,
    output: \`[\${name}] Headless execution locked. Architect clearance required.\`,
  };
}

export function destroy() {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
    activeInstance = null;
  }
}

export default { id, name, category, version, description, pythonSourcePath, render, execute, destroy };
