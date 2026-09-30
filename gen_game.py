import json
import re

# We will generate a complete vanilla JS game for transfer.js
game_code = '''import { createElement } from '../components/utils.js';
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
  const container = createElement('div', { className: 'page-container laundry-page' });
  container.style.cssText = 'padding: 0; margin: 0 auto; color: #fff; font-family: "Share Tech Mono", monospace; min-height: 80vh; background: #000; position: relative; overflow: hidden;';

  const audio = new LaundromatAudioEngine();

  // --- Game State ---
  const state = {
    view: 'LOBBY', // LOBBY, CHANGER, WASHERS, DRYERS, BATHROOM
    inventory: {
      coins: 0,
      wetClothes: 0,
      cleanClothes: 0,
      detergent: 5,
      dryerSheets: 5
    },
    washers: [
      { id: 1, status: 'IDLE', load: 0, timeRemaining: 0, interval: null },
      { id: 2, status: 'IDLE', load: 0, timeRemaining: 0, interval: null }
    ],
    dryers: [
      { id: 1, status: 'IDLE', load: 0, timeRemaining: 0, interval: null },
      { id: 2, status: 'IDLE', load: 0, timeRemaining: 0, interval: null }
    ],
    stripeSession: null,
    stripeInstance: null,
    elementsInstance: null,
    receiptData: null
  };

  // --- Layout Elements ---
  const topNav = createElement('div', { className: 'laundry-nav' });
  topNav.style.cssText = 'padding: 15px; background: #111; border-bottom: 2px solid #333; display: flex; justify-content: space-between; align-items: center;';
  
  const invDisplay = createElement('div', { className: 'inventory-display' });
  invDisplay.style.cssText = 'display: flex; gap: 15px; font-size: 1.1rem;';

  const viewControls = createElement('div', { className: 'view-controls' });
  
  const viewport = createElement('div', { className: 'laundry-viewport' });
  viewport.style.cssText = 'padding: 20px; min-height: 60vh; position: relative; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #1a1a2e 0%, #000 100%); transition: all 0.5s;';

  container.appendChild(topNav);
  container.appendChild(viewport);
  
  topNav.appendChild(invDisplay);
  topNav.appendChild(viewControls);

  // --- Update UI ---
  function updateNav() {
    invDisplay.innerHTML = 
      <span>?? Coins: \</span>
      <span>?? Detergent: \</span>
      <span>?? Wet Clothes: \</span>
      <span>?? Clean Clothes: \</span>
    ;

    viewControls.innerHTML = '';
    const views = ['LOBBY', 'CHANGER', 'WASHERS', 'DRYERS', 'BATHROOM'];
    views.forEach(v => {
      const btn = createElement('button', { textContent: v });
      btn.style.cssText = margin-left: 10px; padding: 5px 10px; background: \; border: 1px solid #444; color: #fff; cursor: pointer;;
      btn.onclick = () => { setView(v); };
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
          destination: dest
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
      const title = createElement('h1', { textContent: 'THE LAUNDROMAT' });
      title.style.cssText = 'font-size: 3rem; color: #06b6d4; text-shadow: 0 0 15px rgba(6,182,212,0.5); position: absolute; top: 10%;';
      
      const instructions = createElement('div', { innerHTML: '<p>1. Get Coins at Changer</p><p>2. Wash Clothes</p><p>3. Dry Clothes</p><p>4. Collect Clean Receipt</p>' });
      instructions.style.cssText = 'color: #aaa; text-align: center; font-size: 1.2rem; margin-top: 60px;';
      
      viewport.appendChild(title);
      viewport.appendChild(instructions);
    } 
    else if (state.view === 'CHANGER') {
      renderCoinChanger();
    }
    else if (state.view === 'WASHERS') {
      renderMachines(state.washers, 'WASHER', '?? Insert Coins', 'coins', 'wetClothes', '?? Add Detergent');
    }
    else if (state.view === 'DRYERS') {
      renderMachines(state.dryers, 'DRYER', '?? Insert Wet Clothes', 'wetClothes', 'cleanClothes', '?? Add Dryer Sheet');
    }
    else if (state.view === 'BATHROOM') {
      const mirror = createElement('div', { textContent: '?? You look at yourself in the mirror. It\\'s been a long night of money laundering.' });
      mirror.style.cssText = 'font-size: 1.5rem; color: #aaa; text-align: center; max-width: 400px;';
      viewport.appendChild(mirror);
    }
  }

  // --- Coin Changer (Stripe UI) ---
  function renderCoinChanger() {
    const changer = createElement('div');
    changer.style.cssText = 'background: #222; border: 4px solid #444; border-radius: 10px; padding: 30px; width: 400px; text-align: center; box-shadow: 0 0 30px rgba(0,0,0,0.8);';
    
    const title = createElement('h2', { textContent: 'COIN CHANGER' });
    changer.appendChild(title);

    const inputAmt = createElement('input', { type: 'number', placeholder: 'Amount (USD)' });
    inputAmt.style.cssText = 'width: 90%; padding: 10px; margin: 10px 0; background: #000; color: #0f0; border: 1px solid #0f0; font-family: inherit; text-align: center; font-size: 1.2rem;';
    
    const inputDest = createElement('input', { type: 'text', placeholder: 'Destination Acct (optional)' });
    inputDest.style.cssText = 'width: 90%; padding: 10px; margin: 10px 0; background: #000; color: #fff; border: 1px solid #444; font-family: inherit; text-align: center;';

    const cardContainer = createElement('div', { id: 'stripe-card-element' });
    cardContainer.style.cssText = 'background: #111; padding: 15px; margin: 15px 0; border: 1px solid #333; display: none;';

    const btnGet = createElement('button', { textContent: 'INSERT CARD' });
    btnGet.style.cssText = 'padding: 15px 30px; background: #06b6d4; color: #000; border: none; font-weight: bold; cursor: pointer; font-size: 1.2rem; width: 100%;';

    changer.appendChild(inputAmt);
    changer.appendChild(inputDest);
    changer.appendChild(cardContainer);
    changer.appendChild(btnGet);

    let clientSecret = null;

    btnGet.onclick = async () => {
      if (btnGet.textContent === 'INSERT CARD') {
        const amt = parseFloat(inputAmt.value);
        if (!amt || amt < 0.5) return alert('Minimum .50');
        
        btnGet.textContent = 'CONNECTING...';
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
        } else {
          // Success! Add coins to inventory
          const amt = parseInt(inputAmt.value);
          
          // Animate coins popping out
          changer.innerHTML = '';
          const successTitle = createElement('h2', { textContent: '?? CLINK CLINK CLINK ??' });
          successTitle.style.color = '#10b981';
          changer.appendChild(successTitle);
          
          const coinBtn = createElement('button', { textContent: Collect \ Coins });
          coinBtn.style.cssText = 'padding: 15px 30px; background: #10b981; color: #000; border: none; font-weight: bold; cursor: pointer; font-size: 1.2rem; width: 100%; margin-top: 20px; animation: pulse 1s infinite;';
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
  function renderMachines(machineList, type, loadActionText, reqInvItem, outputItem, prepActionText) {
    const container = createElement('div');
    container.style.cssText = 'display: flex; gap: 40px;';

    machineList.forEach(m => {
      const machine = createElement('div');
      machine.style.cssText = 'background: #ddd; width: 250px; height: 350px; border-radius: 20px; border: 4px solid #aaa; position: relative; display: flex; flex-direction: column; align-items: center; padding-top: 20px; box-shadow: inset -10px -10px 20px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.5);';

      // Machine Door / Window
      const door = createElement('div');
      const isRunning = m.status === 'RUNNING';
      const isDone = m.status === 'FINISHED';
      
      let spinAnim = isRunning ? 'spin 2s linear infinite' : 'none';
      let windowBg = isRunning ? '#1e3a8a' : (isDone ? '#064e3b' : '#111');
      if (type === 'DRYER' && isRunning) windowBg = '#7c2d12';

      door.style.cssText = width: 150px; height: 150px; border-radius: 50%; border: 15px solid #ccc; background: \; margin-bottom: 20px; display: flex; justify-content: center; align-items: center; overflow: hidden;;
      
      const clothes = createElement('div', { textContent: m.load > 0 ? '????' : '' });
      clothes.style.cssText = ont-size: 3rem; animation: \;;
      door.appendChild(clothes);
      machine.appendChild(door);

      // Status Screen
      const screen = createElement('div');
      screen.style.cssText = 'background: #000; color: #0f0; width: 80%; padding: 10px; text-align: center; border-radius: 5px; margin-bottom: 15px; border: 2px inset #333; font-family: monospace;';
      screen.textContent = m.status === 'RUNNING' ? TIME: \s : STATUS: \\\nLOAD: \;
      machine.appendChild(screen);

      // Controls
      const controls = createElement('div');
      controls.style.cssText = 'display: flex; flex-direction: column; gap: 5px; width: 80%;';

      if (m.status === 'IDLE') {
        const btnLoad = createElement('button', { textContent: loadActionText });
        btnLoad.onclick = () => {
          if (state.inventory[reqInvItem] > 0) {
            state.inventory[reqInvItem]--;
            m.load++;
            updateNav();
            renderViewport();
          }
        };

        const btnPrep = createElement('button', { textContent: prepActionText });
        btnPrep.onclick = () => {
          const supply = type === 'WASHER' ? 'detergent' : 'dryerSheets';
          if (state.inventory[supply] > 0) {
            state.inventory[supply]--;
            m.prepped = true;
            updateNav();
            renderViewport();
          }
        };

        const btnStart = createElement('button', { textContent: 'START' });
        btnStart.style.cssText = 'background: #10b981; color: #000; font-weight: bold; padding: 5px;';
        btnStart.onclick = () => {
          if (m.load === 0) return alert('Machine is empty!');
          if (!m.prepped) return alert(Needs \!);
          
          m.status = 'RUNNING';
          m.timeRemaining = 15;
          audio.playMachineStart();
          
          m.interval = setInterval(() => {
            m.timeRemaining--;
            if (m.timeRemaining <= 0) {
              clearInterval(m.interval);
              m.status = 'FINISHED';
            }
            renderViewport(); // re-render to update timer
          }, 1000);
          
          renderViewport();
        };

        controls.appendChild(btnLoad);
        controls.appendChild(btnPrep);
        controls.appendChild(btnStart);
      } 
      else if (m.status === 'RUNNING') {
        const btnTimeTravel = createElement('button', { textContent: '? TIME TRAVEL' });
        btnTimeTravel.style.cssText = 'background: #8b5cf6; color: #fff; font-weight: bold; border: none; padding: 10px; animation: pulse 2s infinite;';
        btnTimeTravel.onclick = () => {
          m.timeRemaining = 1; // skip to end
          audio.playTimeTravel();
        };
        controls.appendChild(btnTimeTravel);
      }
      else if (m.status === 'FINISHED') {
        const btnCollect = createElement('button', { textContent: Take \ Clothes });
        btnCollect.style.cssText = 'background: #06b6d4; color: #000; font-weight: bold; padding: 10px;';
        btnCollect.onclick = () => {
          state.inventory[outputItem] += m.load;
          m.load = 0;
          m.status = 'IDLE';
          m.prepped = false;
          
          if (type === 'DRYER') {
             // Generate Receipt !
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
    const modal = createElement('div');
    modal.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; color: #000; padding: 30px; width: 300px; box-shadow: 0 0 50px rgba(255,255,255,0.5); font-family: monospace; z-index: 100; border-top: 10px solid #ddd;';
    
    modal.innerHTML = 
      <h2 style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px;">RECEIPT</h2>
      <p>Laundromat: AlphaCore</p>
      <p>Destination: \</p>
      <p>Status: WASHED & DRIED</p>
      <p>Thank you for doing laundry.</p>
      <button id="close-receipt" style="margin-top: 20px; width: 100%; padding: 10px; background: #000; color: #fff; cursor: pointer;">TAKE RECEIPT</button>
    ;
    
    viewport.appendChild(modal);
    
    modal.querySelector('#close-receipt').onclick = () => {
      viewport.removeChild(modal);
    };
  }

  // Global CSS injected once
  if (!document.getElementById('laundry-game-styles')) {
    const style = document.createElement('style');
    style.id = 'laundry-game-styles';
    style.textContent = 
      @keyframes spin { 100% { transform: rotate(360deg); } }
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      .laundry-viewport button { font-family: "Share Tech Mono", monospace; cursor: pointer; transition: all 0.2s; }
      .laundry-viewport button:hover { filter: brightness(1.2); }
    ;
    document.head.appendChild(style);
  }

  // Initialize
  updateNav();
  renderViewport();
  audio.init();

  return container;
}
'''

with open('src/pages/transfer.js', 'w', encoding='utf-8') as f:
    f.write(game_code)
