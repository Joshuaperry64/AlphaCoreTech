const fs = require('fs');

let transferCode = fs.readFileSync('src/pages/transfer.js', 'utf8');

const dryerPattern = /else if \(state\.stage === 'dryer_machines'\) \{[\s\S]*?bodyBox\.innerHTML = `[\s\S]*?`;[\s\S]*?const btnReceive = bodyBox\.querySelector\('#btn-proceed-receive'\);[\s\S]*?\}\s*\}/;

const newDryer = `else if (state.stage === 'dryer_machines') {
      const isDryerBusy = state.machines.D1.active || state.machines.D2.active;
      const allLoaded = state.inventory.clean_laundry === 0 && !isDryerBusy;
      const canProceed = state.inventory.clean_laundry === 0 && state.inventory.laundry_load === 0 && !isDryerBusy;
      
      bodyBox.innerHTML = \`
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #f59e0b; font-family: 'Orbitron', sans-serif; text-transform: uppercase; letter-spacing: 2px;">INDUSTRIAL DRYERS</h2>
          <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;">
            <span style="background: rgba(16,185,129,0.1); border: 1px solid #10b981; padding: 5px 10px; border-radius: 4px; color: #10b981; font-size: 0.85rem;">
              💧 WET LOADS: \${state.inventory.clean_laundry}
            </span>
            <span style="background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; padding: 5px 10px; border-radius: 4px; color: #f59e0b; font-size: 0.85rem;">
              📄 DRYER SHEETS: \${state.inventory.dryer_sheets}
            </span>
            <span style="background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; padding: 5px 10px; border-radius: 4px; color: #fbbf24; font-size: 0.85rem;">
              🪙 TOKENS: \${state.inventory.coins}
            </span>
          </div>
          
          <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
            \${renderDryerUnit('D1', state.machines.D1)}
            \${renderDryerUnit('D2', state.machines.D2)}
          </div>
          
          \${isDryerBusy ? \`
            <div style="margin-top: 20px;">
              <button id="btn-time-travel" class="aim-btn" style="padding: 12px 24px; background: rgba(139,92,246,0.2); border-color: #8b5cf6; color: #c4b5fd; font-weight: bold; cursor: pointer; border-radius: 4px; animation: pulse 2s infinite;">
                ⏳ TIME TRAVEL (SKIP 1 HOUR)
              </button>
            </div>
          \` : ''}
          
          <button id="btn-proceed-receive" class="aim-btn" style="width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem; background: \${canProceed ? 'rgba(16,185,129,0.2)' : '#1e293b'}; border-color: \${canProceed ? '#10b981' : '#334155'}; color: \${canProceed ? '#10b981' : '#64748b'}; font-weight: bold; cursor: \${canProceed ? 'pointer' : 'not-allowed'}; border-radius: 4px;" \${!canProceed ? 'disabled' : ''}>
            \${canProceed ? 'FINISH & COLLECT PAYOUT ➔' : (allLoaded ? 'DRYING IN PROGRESS...' : 'DRY LAUNDRY TO PROCEED')}
          </button>
        </div>
      \`;

      function renderDryerUnit(id, mState) {
        const canLoad = !mState.active && state.inventory.clean_laundry > 0 && state.inventory.dryer_sheets > 0 && state.inventory.coins > 0;
        return \`
          <div style="background: #020617; border: 1px solid \${mState.active ? '#f59e0b' : '#1e293b'}; padding: 15px; border-radius: 8px; width: 220px; text-align: center; position: relative; overflow: hidden;">
            <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px;">UNIT #\${id}</div>
            
            <div style="width: 120px; height: 120px; margin: 0 auto 15px auto; border: 4px solid \${mState.active ? '#f59e0b' : '#334155'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #000; box-shadow: \${mState.active ? 'inset 0 0 20px rgba(245,158,11,0.5), 0 0 15px rgba(245,158,11,0.3)' : 'none'};">
              \${mState.active ? \`
                <div style="width: 90px; height: 90px; border-radius: 50%; background: radial-gradient(circle, rgba(245,158,11,0.8) 0%, rgba(2,6,23,1) 100%); animation: spin 1s linear infinite reverse;"></div>
              \` : \`
                <div style="width: 90px; height: 90px; border-radius: 50%; background: #0f172a;"></div>
              \`}
            </div>
            
            <div style="background: #000; border: 1px solid #334155; padding: 5px; margin-bottom: 10px; font-family: monospace; color: \${mState.active ? '#f59e0b' : '#10b981'};">
              STATUS: \${mState.active ? 'DRYING (' + mState.timeRem + 'm)' : 'IDLE'}
            </div>
            
            <button class="aim-btn btn-load-dryer" data-id="\${id}" style="width: 100%; padding: 8px; font-size: 0.8rem; background: \${canLoad ? 'rgba(16,185,129,0.1)' : 'transparent'}; border-color: \${canLoad ? '#10b981' : '#334155'}; color: \${canLoad ? '#10b981' : '#64748b'}; cursor: \${canLoad ? 'pointer' : 'not-allowed'};" \${!canLoad ? 'disabled' : ''}>
              🧺 LOAD WET CLOTHES (1)
            </button>
          </div>
        \`;
      }

      bodyBox.querySelectorAll('.btn-load-dryer').forEach(btn => {
        btn.onclick = (e) => {
          const id = e.target.getAttribute('data-id');
          if (state.inventory.clean_laundry > 0 && state.inventory.dryer_sheets > 0 && state.inventory.coins > 0) {
            state.inventory.clean_laundry--;
            state.inventory.dryer_sheets--;
            state.inventory.coins--;
            state.machines[id].active = true;
            state.machines[id].timeRem = 60; // 60 mins
            laundromatAudio.playMachineStart();
            playSFX('success');
            render();
          } else {
            playSFX('incorrect');
          }
        };
      });

      const btnTimeTravel = bodyBox.querySelector('#btn-time-travel');
      if (btnTimeTravel) {
        btnTimeTravel.onclick = () => {
          laundromatAudio.playTimeTravel();
          playSFX('transition');
          
          ['D1', 'D2'].forEach(id => {
            if (state.machines[id].active) {
              state.machines[id].active = false;
              state.machines[id].timeRem = 0;
            }
          });
          
          render();
        };
      }

      const btnReceive = bodyBox.querySelector('#btn-proceed-receive');
      if (btnReceive && !btnReceive.disabled) {
        btnReceive.onclick = () => {
          laundromatAudio.playCleanSparkle();
          playSFX('success');
          state.stage = 'receive_laundry';
          render();
        };
      }
    }`;

transferCode = transferCode.replace(dryerPattern, newDryer);
fs.writeFileSync('src/pages/transfer.js', transferCode);
console.log('Dryer stage gamification patched.');
