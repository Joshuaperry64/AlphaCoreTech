
function h(tag, props = {}) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'className') el.className = v;
    else if (k === 'textContent') el.textContent = v;
    else if (k === 'innerHTML') el.innerHTML = v;
    else if (k === 'type') el.type = v;
    else if (k === 'placeholder') el.placeholder = v;
    else if (k === 'id') el.id = v;
    else el.setAttribute(k, v);
  }
  return el;
}
import { playSFX } from '../components/audio.js';

// --- Laundromat Audio Engine ---
class LaundromatAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMusicPlaying = false;
  }
  init() {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      } catch(e){}
    }
  }
  playCoinDrop() { playSFX('coinDrop'); }
  playMachineStart() { playSFX('machineStart'); }
  playSuccess() { playSFX('success'); }
  playError() { playSFX('error'); }
  playTimeTravel() { playSFX('warp'); }
}

export default function TransferPage() {
  const container = h('div', { className: 'page-container laundry-page' });
  container.style.cssText = 'padding: 0; margin: 0 auto; color: #fff; font-family: "Share Tech Mono", monospace; min-height: 80vh; background: #000; position: relative; overflow: hidden;';

  const audio = new LaundromatAudioEngine();

  // --- Game State ---
  const state = {
    view: 'LOBBY',
    inventory: {
      coins: 0,
      wetClothes: 0,
      cleanClothes: 0,
      detergent: 5,
      dryerSheets: 5
    },
    washers: [
      { id: 1, status: 'IDLE', load: 0, timeRemaining: 0, interval: null, prepped: false },
      { id: 2, status: 'IDLE', load: 0, timeRemaining: 0, interval: null, prepped: false }
    ],
    dryers: [
      { id: 1, status: 'IDLE', load: 0, timeRemaining: 0, interval: null, prepped: false },
      { id: 2, status: 'IDLE', load: 0, timeRemaining: 0, interval: null, prepped: false }
    ],
    stripeSession: null,
    stripeInstance: null,
    elementsInstance: null,
    receiptData: null
  };

  // --- Layout Elements ---
  const topNav = h('div', { className: 'laundry-nav' });
  topNav.style.cssText = 'padding: 15px; background: #111; border-bottom: 2px solid #333; display: flex; justify-content: space-between; align-items: center; z-index: 10; position: relative;';
  
  const invDisplay = h('div', { className: 'inventory-display' });
  invDisplay.style.cssText = 'display: flex; gap: 15px; font-size: 1.1rem;';

  const viewControls = h('div', { className: 'view-controls' });
  
  const viewport = h('div', { className: 'laundry-viewport' });
  viewport.style.cssText = 'padding: 20px; min-height: 70vh; position: relative; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #1a1a2e 0%, #000 100%); transition: all 0.5s;';

  container.appendChild(topNav);
  container.appendChild(viewport);
  
  topNav.appendChild(invDisplay);
  topNav.appendChild(viewControls);

  // --- Update UI ---
  function updateNav() {
    invDisplay.innerHTML = `
      <span>🪙 Coins: ${state.inventory.coins}</span>
      <span>💧 Detergent: ${state.inventory.detergent}</span>
      <span>🧦 Wet Clothes: ${state.inventory.wetClothes}</span>
      <span>🧺 Clean Clothes: ${state.inventory.cleanClothes}</span>
    `;

    viewControls.innerHTML = '';
    const views = ['LOBBY', 'CHANGER', 'WASHERS', 'DRYERS', 'BATHROOM'];
    views.forEach(v => {
      const btn = h('button', { textContent: v });
      btn.style.cssText = `margin-left: 10px; padding: 5px 10px; background: ${state.view === v ? '#06b6d4' : '#222'}; border: 1px solid #444; color: #fff; cursor: pointer;`;
      btn.onclick = () => setView(v);
      viewControls.appendChild(btn);
    });
  }

  // --- Stripe Backend Hook ---
  async function handleStripePayment(amount, dest) {
    try {
      const response = await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          profile: sessionStorage.getItem('current_profile') || 'Guest',
          destination: dest || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'API Error');
      return data;
    } catch(err) {
      console.error(err);
      return null;
    }
  }

  // --- Views ---
  function setView(newView) {
    state.view = newView;
    updateNav();
    renderViewport();
  }

  function renderViewport() {
    viewport.innerHTML = '';
    if (state.view === 'LOBBY') {
      const title = h('h1', { textContent: 'THE LAUNDROMAT' });
      title.style.cssText = 'font-size: 4rem; color: #06b6d4; text-shadow: 0 0 15px rgba(6,182,212,0.5); position: absolute; top: 10%; margin: 0;';
      
      const instructions = h('div', { innerHTML: '<p>1. Get Coins at Changer</p><p>2. Wash Clothes</p><p>3. Dry Clothes</p><p>4. Collect Clean Receipt</p>' });
      instructions.style.cssText = 'color: #aaa; text-align: center; font-size: 1.5rem; margin-top: 60px; line-height: 1.5;';
      
      viewport.appendChild(title);
      viewport.appendChild(instructions);
    } 
    else if (state.view === 'CHANGER') {
      renderCoinChanger();
    }
    else if (state.view === 'WASHERS') {
      renderMachines(state.washers, 'WASHER', '🪙 Insert Coins', 'coins', 'wetClothes', '💧 Add Detergent', 'detergent');
    }
    else if (state.view === 'DRYERS') {
      renderMachines(state.dryers, 'DRYER', '🧦 Insert Wet Clothes', 'wetClothes', 'cleanClothes', '🧻 Add Dryer Sheet', 'dryerSheets');
    }
    else if (state.view === 'BATHROOM') {
      const mirror = h('div', { textContent: '🪞 You look at yourself in the mirror. It\'s been a long night of money laundering. Time is a flat circle.' });
      mirror.style.cssText = 'font-size: 2rem; color: #888; text-align: center; max-width: 600px; line-height: 1.6; padding: 40px; border: 4px dashed #444; border-radius: 20px; background: rgba(0,0,0,0.5);';
      viewport.appendChild(mirror);
    }
  }

  // --- Coin Changer (Stripe UI) ---
  function renderCoinChanger() {
    const changer = h('div');
    changer.style.cssText = 'background: #222; border: 4px solid #444; border-radius: 10px; padding: 30px; width: 450px; text-align: center; box-shadow: 0 0 40px rgba(0,0,0,0.8); z-index: 5;';
    
    const title = h('h2', { textContent: 'COIN CHANGER' });
    title.style.margin = '0 0 20px 0';
    changer.appendChild(title);

    const inputAmt = h('input', { type: 'number', placeholder: 'Amount (USD) - Min $0.50' });
    inputAmt.style.cssText = 'width: 90%; padding: 15px; margin: 10px 0; background: #000; color: #0f0; border: 2px solid #0f0; font-family: inherit; text-align: center; font-size: 1.5rem; border-radius: 5px;';
    
    const inputDest = h('input', { type: 'text', placeholder: 'Destination Acct (optional)' });
    inputDest.style.cssText = 'width: 90%; padding: 10px; margin: 10px 0; background: #000; color: #fff; border: 1px solid #444; font-family: inherit; text-align: center; border-radius: 5px;';

    const cardContainer = h('div', { id: 'stripe-card-element' });
    cardContainer.style.cssText = 'background: #111; padding: 20px; margin: 15px 0; border: 1px solid #333; display: none; min-height: 150px;';

    const btnGet = h('button', { textContent: 'INSERT CARD' });
    btnGet.style.cssText = 'padding: 15px 30px; background: #06b6d4; color: #000; border: none; font-weight: bold; cursor: pointer; font-size: 1.2rem; width: 100%; border-radius: 5px; margin-top: 10px;';

    changer.appendChild(inputAmt);
    changer.appendChild(inputDest);
    changer.appendChild(cardContainer);
    changer.appendChild(btnGet);

    let clientSecret = null;

    btnGet.onclick = async () => {
      audio.init();
      if (btnGet.textContent === 'INSERT CARD') {
        const amt = parseFloat(inputAmt.value);
        if (!amt || amt < 0.5) return alert('Minimum $0.50');
        
        btnGet.textContent = 'CONNECTING TO BANK...';
        btnGet.disabled = true;
        
        const res = await handleStripePayment(amt, inputDest.value);
        if (res && res.clientSecret) {
          clientSecret = res.clientSecret;
          state.receiptData = res;
          
          if (window.Stripe) {
            state.stripeInstance = window.Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd', { stripeAccount: res.destination });
            state.elementsInstance = state.stripeInstance.elements({ appearance: { theme: 'night' }, clientSecret });
            const cardElement = state.elementsInstance.create('payment');
            cardElement.mount(cardContainer);
            cardContainer.style.display = 'block';
            
            btnGet.textContent = 'DISPENSE COINS';
            btnGet.disabled = false;
          }
        } else {
          btnGet.textContent = 'INSERT CARD';
          btnGet.disabled = false;
          alert('Failed to connect to Stripe.');
        }
      } else if (btnGet.textContent === 'DISPENSE COINS') {
        btnGet.disabled = true;
        btnGet.textContent = 'PROCESSING...';
        
        const { error } = await state.stripeInstance.confirmPayment({
          elements: state.elementsInstance,
          redirect: 'if_required'
        });

        if (error) {
          alert(error.message);
          btnGet.disabled = false;
          btnGet.textContent = 'DISPENSE COINS';
          audio.playError();
        } else {
          const amt = parseInt(inputAmt.value);
          
          // Animate coins popping out
          changer.innerHTML = '';
          const successTitle = h('h2', { textContent: '🪙 CLINK CLINK CLINK 🪙' });
          successTitle.style.color = '#10b981';
          changer.appendChild(successTitle);
          
          const coinBtn = h('button', { textContent: `Collect ${amt} Coins` });
          coinBtn.style.cssText = 'padding: 20px; background: #10b981; color: #000; border: none; font-weight: bold; cursor: pointer; font-size: 1.5rem; width: 100%; margin-top: 20px; border-radius: 10px; animation: pulse 1s infinite;';
          changer.appendChild(coinBtn);

          coinBtn.onclick = () => {
            state.inventory.coins += amt;
            updateNav();
            renderViewport();
            audio.playCoinDrop();
          };
        }
      }
    };

    viewport.appendChild(changer);
  }

  // --- Machines (Washers / Dryers) ---
  function renderMachines(machineList, type, loadActionText, reqInvItem, outputItem, prepActionText, prepInvItem) {
    const container = h('div');
    container.style.cssText = 'display: flex; gap: 60px;';

    machineList.forEach(m => {
      const machine = h('div');
      machine.style.cssText = 'background: #ccc; width: 280px; height: 420px; border-radius: 20px; border: 6px solid #888; position: relative; display: flex; flex-direction: column; align-items: center; padding-top: 30px; box-shadow: inset -10px -10px 30px rgba(0,0,0,0.3), 0 20px 50px rgba(0,0,0,0.6);';

      // Machine Door / Window
      const door = h('div');
      const isRunning = m.status === 'RUNNING';
      const isDone = m.status === 'FINISHED';
      
      let spinAnim = isRunning ? 'spin 1.5s linear infinite' : 'none';
      let windowBg = isRunning ? '#1e3a8a' : (isDone ? '#064e3b' : '#111');
      if (type === 'DRYER' && isRunning) windowBg = '#9a3412';

      door.style.cssText = `width: 180px; height: 180px; border-radius: 50%; border: 20px solid #ddd; background: ${windowBg}; margin-bottom: 25px; display: flex; justify-content: center; align-items: center; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 5px 15px rgba(0,0,0,0.3);`;
      
      const clothes = h('div', { textContent: m.load > 0 ? (type === 'WASHER' ? '🪙👕' : '🧦👕') : '' });
      clothes.style.cssText = `font-size: 4rem; animation: ${spinAnim}; transition: all 0.5s;`;
      door.appendChild(clothes);
      machine.appendChild(door);

      // Status Screen
      const screen = h('div');
      screen.style.cssText = 'background: #000; color: #0f0; width: 85%; padding: 10px; text-align: center; border-radius: 5px; margin-bottom: 20px; border: 3px inset #444; font-family: monospace; font-size: 1.1rem;';
      screen.textContent = m.status === 'RUNNING' ? `TIME: ${m.timeRemaining}s` : `STATUS: ${m.status}\nLOAD: ${m.load}`;
      machine.appendChild(screen);

      // Controls
      const controls = h('div');
      controls.style.cssText = 'display: flex; flex-direction: column; gap: 8px; width: 85%;';

      if (m.status === 'IDLE') {
        const btnLoad = h('button', { textContent: loadActionText });
        btnLoad.style.cssText = 'padding: 8px; font-weight: bold; font-size: 1rem; border-radius: 4px;';
        btnLoad.onclick = () => {
          if (state.inventory[reqInvItem] > 0) {
            state.inventory[reqInvItem]--;
            m.load++;
            updateNav();
            renderViewport();
          } else {
            alert(`You need more ${reqInvItem}!`);
          }
        };

        const btnPrep = h('button', { textContent: prepActionText });
        btnPrep.style.cssText = 'padding: 8px; font-weight: bold; font-size: 1rem; border-radius: 4px;';
        btnPrep.onclick = () => {
          if (state.inventory[prepInvItem] > 0) {
            state.inventory[prepInvItem]--;
            m.prepped = true;
            updateNav();
            renderViewport();
          } else {
            alert(`You need more ${prepInvItem}!`);
          }
        };

        const btnStart = h('button', { textContent: 'START' });
        btnStart.style.cssText = 'background: #10b981; color: #000; font-weight: bold; padding: 10px; font-size: 1.2rem; border-radius: 4px; margin-top: 5px; border: 2px solid #064e3b;';
        btnStart.onclick = () => {
          if (m.load === 0) return alert('Machine is empty!');
          if (!m.prepped) return alert(`Needs ${type === 'WASHER' ? 'Detergent' : 'Dryer Sheet'}!`);
          
          m.status = 'RUNNING';
          m.timeRemaining = 25; // 25 seconds real time
          audio.playMachineStart();
          
          m.interval = setInterval(() => {
            m.timeRemaining--;
            if (m.timeRemaining <= 0) {
              clearInterval(m.interval);
              m.status = 'FINISHED';
              audio.playSuccess();
            }
            if (state.view === type + 'S') {
              renderViewport(); // re-render to update timer if we are looking at it
            }
          }, 1000);
          
          renderViewport();
        };

        controls.appendChild(btnLoad);
        controls.appendChild(btnPrep);
        controls.appendChild(btnStart);
      } 
      else if (m.status === 'RUNNING') {
        const btnTimeTravel = h('button', { textContent: '⏳ TIME TRAVEL' });
        btnTimeTravel.style.cssText = 'background: #8b5cf6; color: #fff; font-weight: bold; border: none; padding: 15px; border-radius: 5px; font-size: 1.1rem; animation: pulse 2s infinite;';
        btnTimeTravel.onclick = () => {
          m.timeRemaining = 1; // skip to end
          audio.playTimeTravel();
        };
        controls.appendChild(btnTimeTravel);
      }
      else if (m.status === 'FINISHED') {
        const btnCollect = h('button', { textContent: `Take ${type === 'WASHER' ? 'Wet' : 'Clean'} Clothes` });
        btnCollect.style.cssText = 'background: #06b6d4; color: #000; font-weight: bold; padding: 15px; border-radius: 5px; font-size: 1.1rem;';
        btnCollect.onclick = () => {
          state.inventory[outputItem] += m.load;
          m.load = 0;
          m.status = 'IDLE';
          m.prepped = false;
          
          if (type === 'DRYER') {
             showReceipt();
          }
          
          updateNav();
          renderViewport();
        };
        controls.appendChild(btnCollect);
      }

      machine.appendChild(controls);
      container.appendChild(machine);
    });

    viewport.appendChild(container);
  }

  function showReceipt() {
    const modal = h('div');
    modal.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; color: #000; padding: 40px; width: 350px; box-shadow: 0 0 100px rgba(255,255,255,0.8); font-family: monospace; z-index: 100; border-top: 15px solid #ddd; font-size: 1.1rem;';
    
    modal.innerHTML = `
      <h2 style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; font-size: 2rem; margin-top: 0;">RECEIPT</h2>
      <p><b>Laundromat:</b> AlphaCore</p>
      <p><b>Destination:</b> ${state.receiptData ? state.receiptData.destination : 'N/A'}</p>
      <p><b>Status:</b> WASHED & DRIED</p>
      <p style="text-align: center; margin-top: 30px; font-style: italic;">Thank you for doing laundry.</p>
      <button id="close-receipt" style="margin-top: 30px; width: 100%; padding: 15px; background: #000; color: #fff; cursor: pointer; font-weight: bold; font-size: 1.2rem; border-radius: 5px;">TAKE RECEIPT</button>
    `;
    
    viewport.appendChild(modal);
    
    modal.querySelector('#close-receipt').onclick = () => {
      viewport.removeChild(modal);
    };
  }

  // Global CSS injected once
  if (!document.getElementById('laundry-game-styles')) {
    const style = document.createElement('style');
    style.id = 'laundry-game-styles';
    style.textContent = `
      @keyframes spin { 100% { transform: rotate(360deg); } }
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      .laundry-viewport button { font-family: "Share Tech Mono", monospace; cursor: pointer; transition: all 0.2s; }
      .laundry-viewport button:hover { filter: brightness(1.2); }
      .laundry-page * { box-sizing: border-box; }
    `;
    document.head.appendChild(style);
  }

  // Initialize
  updateNav();
  renderViewport();

  return container;
}
