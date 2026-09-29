import { createElement } from '../components/utils.js';

export default function TransferPage() {
  const container = createElement('div', { className: 'page-container' });
  container.style.cssText = 'padding: 20px; max-width: 600px; margin: 0 auto; color: #fff; font-family: "Share Tech Mono", monospace;';

  container.innerHTML = `
    <h1 style="font-family: 'Orbitron', sans-serif; color: #10b981; border-bottom: 1px solid #10b981; padding-bottom: 10px; margin-bottom: 20px;">
      // SECURE PUSH-TO-CARD
    </h1>
    
    <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); padding: 20px; border-radius: 4px; margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 10px; color: #ccc;">TARGET CHARGE AMOUNT (USD) [MIN $10.00]</label>
      <input type="number" id="transfer-input" placeholder="0.00" min="10" step="0.01" 
        style="width: 100%; background: #000; border: 1px solid #10b981; color: #10b981; padding: 12px; font-size: 1.5rem; font-family: 'Share Tech Mono', monospace; outline: none; box-sizing: border-box;">
    </div>

    <div style="background: #050505; border: 1px solid #333; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
      <h3 style="font-family: 'Orbitron', sans-serif; margin-top: 0; color: #06b6d4; font-size: 1rem;">NETWORK FEE ROUTING</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #888;">
        <span>Stripe Capture (2.9% + $0.30):</span>
        <span id="fee-capture">-$0.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #888;">
        <span>AlphaCore Platform Fee (10%):</span>
        <span id="fee-alpha">-$0.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #888;">
        <span>Connect Routing (0.25% + $0.25):</span>
        <span id="fee-connect">-$0.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #888; border-bottom: 1px dashed #333; padding-bottom: 10px;">
        <span>Instant Payout (1.5% / $0.50 Min):</span>
        <span id="fee-instant">-$0.00</span>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 1.2rem; color: #fff;">
        <strong>DESTINATION RECEIVES:</strong>
        <strong id="final-payout" style="color: #10b981;">$0.00</strong>
      </div>
    </div>

    <button id="execute-transfer-btn" class="aim-btn" style="width: 100%; padding: 15px; font-size: 1.1rem; background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981;" disabled>
      INITIATE SECURE TRANSFER
    </button>

    <!-- Hidden until clientSecret is generated -->
    <div id="stripe-ui-container" style="display: none; margin-top: 20px; background: #fff; padding: 20px; border-radius: 4px;">
      <div id="payment-element"></div>
      <button id="submit-payment-btn" class="aim-btn" style="width: 100%; margin-top: 20px; padding: 15px; background: #06b6d4; border-color: #06b6d4; color: #000; font-weight: bold;">
        AUTHORIZE FUNDS
      </button>
      <div id="payment-message" style="color: #ef4444; margin-top: 10px; font-family: sans-serif; display: none;"></div>
    </div>
  `;

  const input = container.querySelector('#transfer-input');
  const executeBtn = container.querySelector('#execute-transfer-btn');
  const stripeContainer = container.querySelector('#stripe-ui-container');
  const submitBtn = container.querySelector('#submit-payment-btn');
  const messageEl = container.querySelector('#payment-message');

  const elCapture = container.querySelector('#fee-capture');
  const elAlpha = container.querySelector('#fee-alpha');
  const elConnect = container.querySelector('#fee-connect');
  const elInstant = container.querySelector('#fee-instant');
  const elPayout = container.querySelector('#final-payout');

  let stripe, elements;

  input.addEventListener('input', (e) => {
    stripeContainer.style.display = 'none';
    executeBtn.style.display = 'block';
    executeBtn.textContent = 'INITIATE SECURE TRANSFER';

    const rawVal = parseFloat(e.target.value);
    if (isNaN(rawVal) || rawVal < 10) {
      elCapture.textContent = '-$0.00';
      elAlpha.textContent = '-$0.00';
      elConnect.textContent = '-$0.00';
      elInstant.textContent = '-$0.00';
      elPayout.textContent = '$0.00';
      elPayout.style.color = '#ef4444';
      executeBtn.disabled = true;
      return;
    }

    const captureFee = (rawVal * 0.029) + 0.30;
    const platformFee = rawVal * 0.10;
    const remainder = rawVal - captureFee - platformFee;

    let payout = (remainder - 0.75) / 1.0025;
    let instantFee = 0.50;
    let connectFee = (payout * 0.0025) + 0.25;

    if (payout >= 33.33) {
      payout = (remainder - 0.25) / 1.0175;
      instantFee = payout * 0.015;
      connectFee = (payout * 0.0025) + 0.25;
    }

    if (payout < 0) payout = 0;

    elCapture.textContent = `-$${captureFee.toFixed(2)}`;
    elAlpha.textContent = `-$${platformFee.toFixed(2)}`;
    elConnect.textContent = `-$${connectFee.toFixed(2)}`;
    elInstant.textContent = `-$${instantFee.toFixed(2)}`;
    elPayout.textContent = `$${payout.toFixed(2)}`;
    elPayout.style.color = '#10b981';
    
    executeBtn.disabled = false;
  });

  executeBtn.addEventListener('click', async () => {
    const rawVal = parseFloat(input.value);
    if (!rawVal || rawVal < 10) return;

    executeBtn.textContent = 'ESTABLISHING SECURE UPLINK...';
    executeBtn.disabled = true;

    try {
      const response = await fetch('https://josh627764--alphacore-stripe-fastapi-app.modal.run/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: rawVal })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Transfer API rejected request');
      }

      if (data.clientSecret) {
        stripe = Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd'); 
        
        const appearance = { theme: 'night' };
        elements = stripe.elements({ appearance, clientSecret: data.clientSecret });
        
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        executeBtn.style.display = 'none';
        stripeContainer.style.display = 'block';
      }
    } catch (err) {
      console.error('Stripe Uplink Error:', err);
      executeBtn.textContent = 'CONNECTION FAILED // RETRY';
      executeBtn.style.color = '#ff003c';
      executeBtn.style.borderColor = '#ff003c';
      executeBtn.disabled = false;
    }
  });

  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = 'PROCESSING...';
    messageEl.style.display = 'none';

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, 
      },
    });

    if (error) {
      messageEl.textContent = error.message;
      messageEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'AUTHORIZE FUNDS';
    }
  });

  return container;
}