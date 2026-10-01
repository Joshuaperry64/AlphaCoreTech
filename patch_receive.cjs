const fs = require('fs');

let transferCode = fs.readFileSync('src/pages/transfer.js', 'utf8');

// Replace receive_laundry logic
const receivePattern = /else if \(state\.stage === 'receive_laundry'\) \{[\s\S]*?bodyBox\.innerHTML = `[\s\S]*?`;[\s\S]*?const btnRestart = bodyBox\.querySelector\('#btn-restart'\);[\s\S]*?btnRestart\.onclick[\s\S]*?\}\s*\}/;

const newReceive = `else if (state.stage === 'receive_laundry') {
      const isArchitect = feeConfig.profileName === 'Architect';
      const cleanValue = (state.amount * 0.98).toFixed(2);
      bodyBox.innerHTML = \`
        <div style="text-align: center; padding: 20px;">
          <h2 style="color: #10b981; font-family: 'Orbitron', sans-serif;">🎉 LAUNDRY COMPLETE 🎉</h2>
          <p style="color: #cbd5e1; margin-bottom: 20px;">Your cycles have finished successfully.</p>
          
          <div style="background: #050912; border: 1px solid #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
            <h4 style="color: #38bdf8; margin: 0 0 10px 0;">INVENTORY REPORT</h4>
            <ul style="list-style: none; padding: 0; color: #94a3b8; font-size: 0.9rem;">
              <li style="margin-bottom: 5px;">🪙 Remaining Tokens: <strong style="color: #fff;">\${state.inventory.coins}</strong></li>
              <li style="margin-bottom: 5px;">🧺 Clean Laundry Loads: <strong style="color: #fff;">\${state.inventory.clean_laundry}</strong></li>
              <li style="margin-bottom: 5px;">💵 Clean Value: <strong style="color: #10b981;">$\${cleanValue}</strong></li>
            </ul>
          </div>

          <div style="background: rgba(16,185,129,0.1); border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #10b981; margin: 0 0 10px 0;">FINAL PAYOUT READY</h3>
            <p style="color: #fff; font-size: 0.85rem; margin: 0;">
              Your funds have been successfully washed and routed to your selected destination.
            </p>
          </div>

          <button id="btn-restart" class="aim-btn" style="width: 100%; padding: 15px; background: #334155; border-color: #475569; color: #fff; font-weight: bold; cursor: pointer; border-radius: 4px;">
            🔄 START NEW CYCLE
          </button>
        </div>
      \`;

      const btnRestart = bodyBox.querySelector('#btn-restart');
      if (btnRestart) {
        btnRestart.onclick = () => {
          playSFX('navigate');
          state.stage = 'laundromat_hub';
          state.amount = 25.00;
          state.paymentAuthorized = false;
          state.washerLoaded = false;
          state.washerTraveled = false;
          state.dryerLoaded = false;
          state.dryerTraveled = false;
          state.laundryReceived = false;
          state.tokensHeld = 0;
          
          state.inventory = {
            coins: 0,
            laundry_load: 1,
            dryer_sheets: 1,
            detergent: 1,
            clean_laundry: 0
          };
          state.machines = {
            W1: { active: false, timeRem: 0 },
            W2: { active: false, timeRem: 0 },
            D1: { active: false, timeRem: 0 },
            D2: { active: false, timeRem: 0 }
          };
          render();
        };
      }
    }`;

transferCode = transferCode.replace(receivePattern, newReceive);
fs.writeFileSync('src/pages/transfer.js', transferCode);
console.log('Receive stage gamification patched.');
