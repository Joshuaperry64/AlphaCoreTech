const fs = require('fs');

let transferCode = fs.readFileSync('src/pages/transfer.js', 'utf8');

const washerPattern = /else if \(state\.stage === 'washing_machines'\) \{[\s\S]*?bodyBox\.innerHTML = `[\s\S]*?`;[\s\S]*?const btnDryer = bodyBox\.querySelector\('#btn-proceed-dryer'\);[\s\S]*?\}\s*\}/;

const newWasher = `else if (state.stage === 'washing_machines') {
      const isWasherBusy = state.machines.W1.active || state.machines.W2.active;
      const allLoaded = state.inventory.laundry_load === 0 && !isWasherBusy;
      const canProceed = state.inventory.clean_laundry > 0 && !isWasherBusy;
      
      bodyBox.innerHTML = \`
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #38bdf8; font-family: 'Orbitron', sans-serif; text-transform: uppercase; letter-spacing: 2px;">VORTEX WASHERS</h2>
          <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;">
            <span style="background: rgba(16,185,129,0.1); border: 1px solid #10b981; padding: 5px 10px; border-radius: 4px; color: #10b981; font-size: 0.85rem;">
              🧺 DIRTY LOADS: \${state.inventory.laundry_load}
            </span>
            <span style="background: rgba(56,189,248,0.1); border: 1px solid #38bdf8; padding: 5px 10px; border-radius: 4px; color: #38bdf8; font-size: 0.85rem;">
              🧼 DETERGENT: \${state.inventory.detergent}
            </span>
            <span style="background: rgba(245,158,11,0.1); border: 1px solid #f59e0b; padding: 5px 10px; border-radius: 4px; color: #fbbf24; font-size: 0.85rem;">
              🪙 TOKENS: \${state.inventory.coins}
            </span>
          </div>
          
          <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
            \${renderWasherUnit('W1', state.machines.W1)}
            \${renderWasherUnit('W2', state.machines.W2)}
          </div>
          
          \${isWasherBusy ? \`
            <div style="margin-top: 20px;">
              <button id="btn-time-travel" class="aim-btn" style="padding: 12px 24px; background: rgba(139,92,246,0.2); border-color: #8b5cf6; color: #c4b5fd; font-weight: bold; cursor: pointer; border-radius: 4px; animation: pulse 2s infinite;">
                ⏳ TIME TRAVEL (SKIP 1 HOUR)
              </button>
            </div>
          \` : ''}
          
          <button id="btn-proceed-dryer" class="aim-btn" style="width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem; background: \${canProceed ? 'rgba(56,189,248,0.2)' : '#1e293b'}; border-color: \${canProceed ? '#38bdf8' : '#334155'}; color: \${canProceed ? '#38bdf8' : '#64748b'}; font-weight: bold; cursor: \${canProceed ? 'pointer' : 'not-allowed'}; border-radius: 4px;" \${!canProceed ? 'disabled' : ''}>
            \${canProceed ? 'PROCEED TO DRYERS ➔' : (allLoaded ? 'NO DIRTY LAUNDRY REMAINING' : 'WASH LAUNDRY TO PROCEED')}
          </button>
        </div>
      \`;

      function renderWasherUnit(id, mState) {
        const canLoad = !mState.active && state.inventory.laundry_load > 0 && state.inventory.detergent > 0 && state.inventory.coins > 0;
        return \`
          <div style="background: #020617; border: 1px solid \${mState.active ? '#38bdf8' : '#1e293b'}; padding: 15px; border-radius: 8px; width: 220px; text-align: center; position: relative; overflow: hidden;">
            <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 10px;">UNIT #\${id}</div>
            
            <div style="width: 120px; height: 120px; margin: 0 auto 15px auto; border: 4px solid \${mState.active ? '#38bdf8' : '#334155'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #000; box-shadow: \${mState.active ? 'inset 0 0 20px rgba(56,189,248,0.5), 0 0 15px rgba(56,189,248,0.3)' : 'none'};">
              \${mState.active ? \`
                <div style="width: 90px; height: 90px; border-radius: 50%; background: radial-gradient(circle, rgba(56,189,248,0.8) 0%, rgba(2,6,23,1) 100%); animation: spin 2s linear infinite;"></div>
              \` : \`
                <div style="width: 90px; height: 90px; border-radius: 50%; background: #0f172a;"></div>
              \`}
            </div>
            
            <div style="background: #000; border: 1px solid #334155; padding: 5px; margin-bottom: 10px; font-family: monospace; color: \${mState.active ? '#38bdf8' : '#10b981'};">
              STATUS: \${mState.active ? 'WASHING (' + mState.timeRem + 'm)' : 'IDLE'}
            </div>
            
            <button class="aim-btn btn-load-washer" data-id="\${id}" style="width: 100%; padding: 8px; font-size: 0.8rem; background: \${canLoad ? 'rgba(16,185,129,0.1)' : 'transparent'}; border-color: \${canLoad ? '#10b981' : '#334155'}; color: \${canLoad ? '#10b981' : '#64748b'}; cursor: \${canLoad ? 'pointer' : 'not-allowed'};" \${!canLoad ? 'disabled' : ''}>
              🧺 LOAD DIRTY (1)
            </button>
          </div>
        \`;
      }

      bodyBox.querySelectorAll('.btn-load-washer').forEach(btn => {
        btn.onclick = (e) => {
          const id = e.target.getAttribute('data-id');
          if (state.inventory.laundry_load > 0 && state.inventory.detergent > 0 && state.inventory.coins > 0) {
            state.inventory.laundry_load--;
            state.inventory.detergent--;
            state.inventory.coins--;
            state.machines[id].active = true;
            state.machines[id].timeRem = 45; // 45 mins
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
          
          ['W1', 'W2'].forEach(id => {
            if (state.machines[id].active) {
              state.machines[id].active = false;
              state.machines[id].timeRem = 0;
              state.inventory.clean_laundry++;
            }
          });
          
          render();
        };
      }

      const btnDryer = bodyBox.querySelector('#btn-proceed-dryer');
      if (btnDryer && !btnDryer.disabled) {
        btnDryer.onclick = () => {
          laundromatAudio.playCoinClink();
          playSFX('navigate');
          state.stage = 'dryer_machines';
          render();
        };
      }
    }`;

transferCode = transferCode.replace(washerPattern, newWasher);
fs.writeFileSync('src/pages/transfer.js', transferCode);
console.log('Washer stage gamification patched.');
