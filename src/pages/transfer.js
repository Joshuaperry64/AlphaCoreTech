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

    <div style="background: #050505; border: 1px solid #333; padding: 20px; border-radius: 4px;">
      <h3 style="font-family: 'Orbitron', sans-serif; margin-top: 0; color: #06b6d4; font-size: 1rem;">NETWORK FEE ROUTING</h3>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #888;">
        <span>Stripe Capture (2.9% + $0.30):</span>
        <span id="fee-capture">-$0.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #888;">
        <span>AlphaCore Platform Fee:</span>
        <span id="fee-alpha">-$1.00</span>
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

    <button id="execute-transfer-btn" class="aim-btn" style="width: 100%; margin-top: 20px; padding: 15px; font-size: 1.1rem; background: rgba(16, 185, 129, 0.1); border-color: #10b981; color: #10b981;" disabled>
      INITIATE SECURE TRANSFER
    </button>
  `;

  const input = container.querySelector('#transfer-input');
  const executeBtn = container.querySelector('#execute-transfer-btn');

  // Math references
  const elCapture = container.querySelector('#fee-capture');
  const elAlpha = container.querySelector('#fee-alpha');
  const elConnect = container.querySelector('#fee-connect');
  const elInstant = container.querySelector('#fee-instant');
  const elPayout = container.querySelector('#final-payout');

  input.addEventListener('input', (e) => {
    const rawVal = parseFloat(e.target.value);
    if (isNaN(rawVal) || rawVal < 10) {
      elCapture.textContent = '-$0.00';
      elConnect.textContent = '-$0.00';
      elInstant.textContent = '-$0.00';
      elPayout.textContent = '$0.00';
      elPayout.style.color = '#ef4444';
      executeBtn.disabled = true;
      return;
    }

    const captureFee = (rawVal * 0.029) + 0.30;
    const platformFee = 1.00;
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

  // Execution Logic
  executeBtn.addEventListener('click', async () => {
    const rawVal = parseFloat(input.value);
    executeBtn.textContent = 'AUTHORIZING...';
    executeBtn.disabled = true;

    try {
      // Fetch the PaymentIntent from your Modal backend
      const response = await fetch('https://joshuaperry64--alphacore-stripe-fastapi-app.modal.run/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: rawVal })
      });

      const { clientSecret } = await response.json();

      if (!clientSecret) throw new Error("Failed to retrieve system intent.");

      // Initialize Stripe with Live Key
      const stripe = Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd'); 
      const elements = stripe.elements();
      
      // Mount the secure card element
      const cardContainer = createElement('div');
      cardContainer.style.cssText = 'background: #000; border: 1px solid #10b981; padding: 15px; margin-top: 20px; border-radius: 4px;';
      const cardElement = elements.create('card', {
        style: { base: { color: '#10b981', fontFamily: '"Share Tech Mono", monospace', fontSize: '16px' } }
      });
      
      executeBtn.insertAdjacentElement('beforebegin', cardContainer);
      cardElement.mount(cardContainer);

      executeBtn.textContent = 'CONFIRM TRANSFER';
      executeBtn.disabled = false;

      // Process the final charge
      const newBtn = executeBtn.cloneNode(true);
      executeBtn.parentNode.replaceChild(newBtn, executeBtn);
      
      newBtn.addEventListener('click', async () => {
        newBtn.textContent = 'PROCESSING IN MATRIX...';
        newBtn.disabled = true;

        const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement }
        });

        if (error) {
          alert(`TRANSFER FAILED: ${error.message}`);
          newBtn.textContent = 'CONFIRM TRANSFER';
          newBtn.disabled = false;
        } else if (paymentIntent.status === 'succeeded') {
          newBtn.style.background = 'rgba(16, 185, 129, 0.2)';
          newBtn.textContent = 'TRANSFER SECURED // FUNDS ROUTED';
        }
      });

    } catch (err) {
      console.error(err);
      alert('SYSTEM ERROR: Could not connect to payment matrix.');
      executeBtn.textContent = 'INITIATE SECURE TRANSFER';
      executeBtn.disabled = false;
    }
  });

  return container;
}
