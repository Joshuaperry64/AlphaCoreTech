/**
 * AlphaCore "THE LAB" — Experimental Neural Matrix & Synthesis Forge
 * Specialized staging ground for next-generation AI architectures, experimental models,
 * custom tool pipelines, and advanced user-driven AI workflows.
 */

import { createElement } from '../components/utils.js';
import { showToast } from '../components/toast.js';

export default function TheLabPage() {
  const container = createElement('div', { class: 'thelab-page slide-up' });

  container.innerHTML = `
    <div class="section-header">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
        <div>
          <h1 class="glitch" data-text="// THE_LAB">// THE_LAB</h1>
          <div class="header-line"></div>
          <p class="aim-subtitle">EXPERIMENTAL NEURAL MATRIX & ADVANCED SYNTHESIS FORGE</p>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:rgba(0,255,100,0.1); border:1px solid #00ff66; color:#00ff66; padding:4px 10px; border-radius:3px; letter-spacing:1px;">
            ● LAB ONLINE
          </span>
          <span style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; background:rgba(6,182,212,0.1); border:1px solid var(--accent,#06b6d4); color:var(--accent,#06b6d4); padding:4px 10px; border-radius:3px; letter-spacing:1px;">
            CORE v4.7
          </span>
        </div>
      </div>
    </div>

    <!-- Quick Telemetry & Lab Status Bar -->
    <div class="panel" style="margin-bottom:20px; padding:16px 20px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3);">
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
        <div style="border-left:2px solid var(--accent,#06b6d4); padding-left:12px;">
          <div style="font-size:0.7rem; color:#888; letter-spacing:1px; font-family:'Share Tech Mono',monospace;">FORGE STATUS</div>
          <div style="font-size:1rem; font-weight:bold; color:#fff; font-family:'Orbitron',sans-serif; margin-top:2px;">ARMED & STAGED</div>
        </div>
        <div style="border-left:2px solid #00ff66; padding-left:12px;">
          <div style="font-size:0.7rem; color:#888; letter-spacing:1px; font-family:'Share Tech Mono',monospace;">MODAL BACKEND</div>
          <div style="font-size:1rem; font-weight:bold; color:#00ff66; font-family:'Orbitron',sans-serif; margin-top:2px;">SYNCED (josh64perry)</div>
        </div>
        <div style="border-left:2px solid #a855f7; padding-left:12px;">
          <div style="font-size:0.7rem; color:#888; letter-spacing:1px; font-family:'Share Tech Mono',monospace;">ACTIVE MATRIX</div>
          <div style="font-size:1rem; font-weight:bold; color:#a855f7; font-family:'Orbitron',sans-serif; margin-top:2px;">EXPERIMENTAL PROTOCOL</div>
        </div>
        <div style="border-left:2px solid #f59e0b; padding-left:12px;">
          <div style="font-size:0.7rem; color:#888; letter-spacing:1px; font-family:'Share Tech Mono',monospace;">CLEARANCE</div>
          <div style="font-size:1rem; font-weight:bold; color:#f59e0b; font-family:'Orbitron',sans-serif; margin-top:2px;">CREATOR / ARCHITECT</div>
        </div>
      </div>
    </div>

    <!-- Main Lab Grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:24px;">
      
      <!-- Primary Experiment Dock -->
      <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div class="panel-title" style="font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff; display:flex; align-items:center; gap:8px;">
            <span>🔬</span> // PRIMARY_EXPERIMENT_DOCK
          </div>
          <span style="font-size:0.7rem; background:rgba(6,182,212,0.2); color:var(--accent,#06b6d4); padding:2px 8px; border-radius:3px;">
            STAGE 1
          </span>
        </div>
        
        <p style="font-size:0.85rem; color:#aaa; line-height:1.6; margin-bottom:20px;">
          Welcome to <strong style="color:#fff;">THE LAB</strong>. This specialized environment is isolated from core production workflows, giving you unfiltered generative, computational, and synthesis freedom for experimental pipelines.
        </p>

        <div id="lab-workspace-area" style="background:rgba(0,0,0,0.5); border:1px dashed rgba(6,182,212,0.4); border-radius:6px; padding:30px 20px; text-align:center;">
          <div style="font-size:2.5rem; margin-bottom:12px;">⚡</div>
          <div style="font-family:'Orbitron',sans-serif; font-size:1.1rem; color:#fff; margin-bottom:8px; letter-spacing:1px;">
            LAB ENGINE READY FOR INTEGRATION
          </div>
          <p style="font-size:0.85rem; color:#888; max-width:480px; margin:0 auto 20px auto; line-height:1.5;">
            The interface and routing are initialized. Stand by for the upcoming module specification to connect directly into this staging dock.
          </p>
          <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">
            <button id="btn-ping-lab" class="aim-btn aim-btn-sm" style="background:rgba(6,182,212,0.15); border-color:var(--accent,#06b6d4); color:var(--accent,#06b6d4);">
              ⚡ PING LAB TELEMETRY
            </button>
            <button id="btn-inspect-cache" class="aim-btn aim-btn-sm" style="background:rgba(0,255,100,0.15); border-color:#00ff66; color:#00ff66;">
              💾 INSPECT VOLUME ASSETS
            </button>
          </div>
        </div>
      </div>

      <!-- Lab Subsystems & Experimental Channels -->
      <div class="panel" style="background:rgba(8,12,20,0.85); border:1px solid rgba(6,182,212,0.3); padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div class="panel-title" style="font-family:'Orbitron',sans-serif; font-size:1rem; color:#fff; display:flex; align-items:center; gap:8px;">
            <span>🧬</span> // SUBSYSTEM_VECTORS
          </div>
          <span style="font-size:0.7rem; background:rgba(168,85,247,0.2); color:#a855f7; padding:2px 8px; border-radius:3px;">
            ACTIVE
          </span>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="background:rgba(0,0,0,0.4); padding:12px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.85rem; font-weight:bold; color:#fff;">CHECKPOINT & LORA FORGE</div>
              <div style="font-size:0.75rem; color:#888;">Direct interface into /hf-hub-cache persistent memory.</div>
            </div>
            <span style="color:#00ff66; font-size:0.8rem; font-family:'Share Tech Mono',monospace;">ONLINE</span>
          </div>

          <div style="background:rgba(0,0,0,0.4); padding:12px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.85rem; font-weight:bold; color:#fff;">NEURAL INFERENCE BUS</div>
              <div style="font-size:0.75rem; color:#888;">Low-latency SSE streaming router for custom generation payloads.</div>
            </div>
            <span style="color:#00ff66; font-size:0.8rem; font-family:'Share Tech Mono',monospace;">ONLINE</span>
          </div>

          <div style="background:rgba(0,0,0,0.4); padding:12px 14px; border-radius:4px; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.85rem; font-weight:bold; color:#fff;">EXPERIMENTAL RUNTIME PIPELINE</div>
              <div style="font-size:0.75rem; color:#888;">Reserved sandbox ready to mount the new big function.</div>
            </div>
            <span style="color:var(--accent,#06b6d4); font-size:0.8rem; font-family:'Share Tech Mono',monospace;">STANDBY</span>
          </div>
        </div>

        <div style="margin-top:20px; padding:12px; background:rgba(6,182,212,0.05); border:1px solid rgba(6,182,212,0.2); border-radius:4px;">
          <div style="font-size:0.75rem; color:var(--accent,#06b6d4); font-weight:bold; margin-bottom:4px;">// ARCHITECT_NOTE</div>
          <div style="font-size:0.8rem; color:#ccc; line-height:1.5;">
            The Lab tab is linked into the AlphaCore router, sidebar navigation, and command matrix. Ready for your instructions on the upcoming core functionality.
          </div>
        </div>
      </div>
    </div>

    <!-- Live Console Output Dock -->
    <div class="panel" style="background:rgba(4,7,12,0.95); border:1px solid rgba(6,182,212,0.25); padding:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:var(--accent,#06b6d4);">
          // THE_LAB // REALTIME_CONSOLE
        </div>
        <button id="btn-clear-lab-log" style="background:transparent; border:none; color:#666; font-size:0.75rem; cursor:pointer; font-family:'Share Tech Mono',monospace;">
          [CLEAR LOG]
        </button>
      </div>
      <div id="lab-console-output" style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:#00ff66; height:120px; overflow-y:auto; background:rgba(0,0,0,0.6); padding:12px; border-radius:4px; border:1px solid rgba(255,255,255,0.05); line-height:1.6;">
        <div>[${new Date().toLocaleTimeString()}] ALPHACORE LAB ENGINE INITIALIZED...</div>
        <div>[${new Date().toLocaleTimeString()}] PERSISTENT VOLUME: /hf-hub-cache (MOUNTED)</div>
        <div>[${new Date().toLocaleTimeString()}] ENDPOINT ROUTE: /thelab (READY FOR WORKLOAD DEPLOYMENT)</div>
      </div>
    </div>
  `;

  // Attach interactive events
  const consoleOutput = container.querySelector('#lab-console-output');
  const addLog = (msg, color = '#00ff66') => {
    if (!consoleOutput) return;
    const line = document.createElement('div');
    line.style.color = color;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  };

  const pingBtn = container.querySelector('#btn-ping-lab');
  if (pingBtn) {
    pingBtn.onclick = () => {
      addLog('PINGING LAB NEURAL CONTROLLER...', 'var(--accent, #06b6d4)');
      setTimeout(() => {
        addLog('LAB LATENCY: 12ms // ALL SUBSYSTEMS NOMINAL', '#00ff66');
        showToast('SUCCESS', 'Lab controller responsive.');
      }, 300);
    };
  }

  const inspectBtn = container.querySelector('#btn-inspect-cache');
  if (inspectBtn) {
    inspectBtn.onclick = () => {
      addLog('INSPECTING MODAL VOLUME /hf-hub-cache...', '#f59e0b');
      window.location.hash = '#/assets';
    };
  }

  const clearLogBtn = container.querySelector('#btn-clear-lab-log');
  if (clearLogBtn) {
    clearLogBtn.onclick = () => {
      if (consoleOutput) consoleOutput.innerHTML = '';
    };
  }

  return container;
}
