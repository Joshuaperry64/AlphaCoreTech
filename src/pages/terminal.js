/**
 * Substrate Interactive CLI Terminal Page
 * Full interactive command terminal environment for AlphaCore system management.
 */

import { createElement } from '../components/utils.js';
import { applyTheme } from '../components/theme-switcher.js';
import { showToast } from '../components/toast.js';

export default function TerminalPage() {
  const container = createElement('div', { class: 'terminal-page-container' });

  container.innerHTML = `
    <div class="section-header">
      <h1 class="glitch" data-text="// CLI_TERMINAL">// CLI_TERMINAL</h1>
      <div class="header-line"></div>
      <p class="aim-subtitle">Interactive AlphaCore virtual kernel terminal. Execute commands, invoke subroutines, manage themes, and view live state.</p>
    </div>

    <!-- Quick Macro Command Chips -->
    <div class="panel" style="margin-bottom:15px; padding:10px 15px; background:rgba(10,15,25,0.85); border:1px solid rgba(6,182,212,0.3); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
      <span style="font-family:'Orbitron',sans-serif; font-size:0.8rem; color:var(--accent,#06b6d4); font-weight:bold;">MACRO SHORTCUTS:</span>
      <button class="aim-btn aim-btn-sm btn-term-macro" data-cmd="status">SYS STATUS</button>
      <button class="aim-btn aim-btn-sm btn-term-macro" data-cmd="ping">PING ENDPOINT</button>
      <button class="aim-btn aim-btn-sm btn-term-macro" data-cmd="subroutines">LIST SUBS</button>
      <button class="aim-btn aim-btn-sm btn-term-macro" data-cmd="theme amber">THEME AMBER</button>
      <button class="aim-btn aim-btn-sm btn-term-macro" data-cmd="clear">CLEAR CONSOLE</button>
    </div>

    <div class="panel" style="background:rgba(5,10,18,0.95); border:1px solid var(--border-accent, rgba(6,182,212,0.4)); padding:18px; font-family:'Share Tech Mono',monospace;">
      <!-- Terminal Output Display Box -->
      <div id="term-viewport" style="min-height:380px; max-height:480px; overflow-y:auto; background:rgba(0,0,0,0.7); border:1px solid rgba(255,255,255,0.08); padding:15px; border-radius:4px; font-size:0.88rem; line-height:1.6; color:#ccc;">
        <div style="color:var(--accent,#06b6d4); font-weight:bold;">ALPHACORE SUBSTRATE V4.0 VIRTUAL KERNEL SHELL</div>
        <div style="color:#666;">Type 'help' or click macro shortcuts above to view available commands.</div>
        <div style="margin-bottom:10px;">----------------------------------------------------------------------</div>
      </div>

      <!-- Input Form -->
      <form id="term-input-form" style="display:flex; align-items:center; gap:10px; margin-top:15px; background:rgba(0,0,0,0.4); padding:8px 12px; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
        <span style="color:var(--accent,#06b6d4); font-weight:bold;">[ALPHACORE-KERNEL ~]$</span>
        <input type="text" id="term-input" autocomplete="off" spellcheck="false" placeholder="Type command..." style="flex:1; background:transparent; border:none; outline:none; color:#fff; font-family:'Share Tech Mono',monospace; font-size:0.9rem;" />
        <button type="submit" class="aim-btn aim-btn-sm" style="background:var(--accent,#06b6d4); color:#000; font-weight:bold;">
          EXECUTE
        </button>
      </form>
    </div>
  `;

  const viewport = container.querySelector('#term-viewport');
  const form = container.querySelector('#term-input-form');
  const input = container.querySelector('#term-input');

  const history = [];
  let historyIdx = -1;

  function appendLine(html, color = '#ccc') {
    const line = document.createElement('div');
    line.style.color = color;
    line.innerHTML = html;
    viewport.appendChild(line);
    viewport.scrollTop = viewport.scrollHeight;
  }

  function processCommand(cmd) {
    const q = cmd.trim();
    if (!q) return;

    appendLine(`<span style="color:var(--accent,#06b6d4); font-weight:bold;">[ALPHACORE-KERNEL ~]$</span> ${q}`, '#fff');

    history.push(q);
    historyIdx = history.length;

    const parts = q.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (mainCmd) {
      case 'help':
        appendLine('Available CLI Terminal Commands:', '#06b6d4');
        appendLine('  <strong>help</strong> - Show this command reference menu');
        appendLine('  <strong>status</strong> - View active system matrix, profile, and clearance status');
        appendLine('  <strong>ping</strong> - Measure network and neural endpoint response time');
        appendLine('  <strong>subroutines</strong> - List all available subroutines');
        appendLine('  <strong>run &lt;SUB-ID&gt;</strong> - Execute specified subroutine module');
        appendLine('  <strong>logs</strong> - Display recent system security event logs');
        appendLine('  <strong>theme &lt;cyan|amber|emerald|violet|crimson&gt;</strong> - Switch color theme');
        appendLine('  <strong>eval &lt;expression&gt;</strong> - Evaluate mathematical expression');
        appendLine('  <strong>clear</strong> - Clear console output viewport');
        appendLine('  <strong>echo &lt;message&gt;</strong> - Output message to viewport');
        break;

      case 'status':
        const profile = sessionStorage.getItem('current_profile') || 'CREATOR';
        appendLine(`[SYS STATUS] Profile: <span style="color:#10b981;">${profile.toUpperCase()}</span> | Clearance: <span style="color:#06b6d4;">ADMIN_S_6</span> | Core: <span style="color:#a855f7;">ALPHA v4.0</span>`, '#eee');
        break;

      case 'ping':
        const latency = Math.floor(4 + Math.random() * 8);
        appendLine(`PING neural-modal-app.modal.run (127.0.0.1): 64 bytes time=<span style="color:#10b981;">${latency}ms</span>`, '#10b981');
        break;

      case 'subroutines':
        appendLine('Active Subroutines available for dispatch:', '#06b6d4');
        appendLine('  [SUB-01] SYNAPSE_PRUNING_V4 (NEURAL)');
        appendLine('  [SUB-02] QUANTUM_ENTANGLEMENT_SYNC (CRYPTO)');
        appendLine('  [SUB-03] HEURISTIC_OVERDRIVE (PERF)');
        appendLine('  [SUB-04] LOG_PURGE_AND_ROTATE (SEC)');
        break;

      case 'run':
        if (!arg) {
          appendLine('ERROR: Please specify a subroutine ID (e.g. run SUB-01)', '#ef4444');
        } else {
          appendLine(`[ACK] Executing subroutine module ${arg.toUpperCase()}...`, '#10b981');
          setTimeout(() => appendLine(`[✓] Subroutine ${arg.toUpperCase()} executed successfully.`, '#10b981'), 400);
        }
        break;

      case 'logs':
        appendLine('Displaying last 3 system event logs:', '#06b6d4');
        appendLine('  [LOG-8801] AUTH: User session verified for role CREATOR.');
        appendLine('  [LOG-8802] NEURAL: Neural handshake established with 128 threads.');
        appendLine('  [LOG-8803] PERF: Throttled frame loop to 12 FPS.');
        break;

      case 'theme':
        if (['cyan', 'amber', 'emerald', 'violet', 'crimson'].includes(arg.toLowerCase())) {
          applyTheme(arg.toLowerCase());
          appendLine(`Theme updated to: <span style="color:var(--accent,#06b6d4); font-weight:bold;">${arg.toUpperCase()} PROTOCOL</span>`, '#10b981');
        } else {
          appendLine('ERROR: Valid themes are cyan, amber, emerald, violet, crimson.', '#ef4444');
        }
        break;

      case 'eval':
        try {
          const result = eval(arg);
          appendLine(`Result: <span style="color:#10b981; font-weight:bold;">${result}</span>`, '#10b981');
        } catch (e) {
          appendLine(`EVAL ERROR: ${e.message}`, '#ef4444');
        }
        break;

      case 'clear':
        viewport.innerHTML = '';
        break;

      case 'echo':
        appendLine(arg || '', '#eee');
        break;

      default:
        appendLine(`Command not recognized: '${mainCmd}'. Type 'help' for available commands.`, '#ef4444');
        break;
    }
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const cmd = input.value;
    input.value = '';
    processCommand(cmd);
  };

  input.onkeydown = (e) => {
    if (e.key === 'ArrowUp') {
      if (historyIdx > 0) {
        historyIdx--;
        input.value = history[historyIdx] || '';
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIdx < history.length - 1) {
        historyIdx++;
        input.value = history[historyIdx] || '';
      } else {
        historyIdx = history.length;
        input.value = '';
      }
    }
  };

  // Macro Shortcut Buttons
  container.querySelectorAll('.btn-term-macro').forEach(btn => {
    btn.onclick = () => {
      const cmd = btn.getAttribute('data-cmd');
      processCommand(cmd);
    };
  });

  return container;
}
