    else if (state.stage === 'cash_to_coin') {
      const activeFeeData = calculateFees(state.amount, feeConfig.rate) || {
        rawVal: 0,
        captureFee: 0,
        platformFee: 0,
        instantFee: 0,
        connectFee: 0,
        payout: 0,
        totalFees: 0,
        tokens: 0
      };

      const rawProfile = sessionStorage.getItem('current_profile') || 'Guest';
      const isGuest = rawProfile.toLowerCase() === 'guest';

      bodyBox.innerHTML = `
        <!-- Cyber-ATM 9000 Hardware Cabinet -->
        <div class="atm-cabinet">
          <!-- ATM Marquee Header -->
          <div class="atm-marquee">
            <div>
              <span style="font-size: 0.75rem; color: #06b6d4; font-weight: bold; letter-spacing: 2px;">// SECTOR 07 HARDWARE CHANGER</span>
              <h3 style="font-family: 'Orbitron', sans-serif; margin: 4px 0 0 0; color: #fff; font-size: clamp(1.1rem, 3.5vw, 1.35rem); display: flex; align-items: center; gap: 8px;">
                <span>🏧</span> ALPHA-ATM 9000 & COIN TERMINAL
              </h3>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; font-size: 0.75rem; color: #10b981; font-weight: bold; background: rgba(16,185,129,0.15); border: 1px solid #10b981; padding: 3px 8px; border-radius: 4px;">
                ● DIRECT STRIPE UPLINK ONLINE
              </span>
            </div>
          </div>

          <!-- CRT Display Terminal Screen -->
          <div class="atm-crt-screen">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(6,182,212,0.3); padding-bottom: 8px; margin-bottom: 14px;">
              <span style="font-size: 0.8rem; color: #38bdf8; font-family: monospace;">[TERMINAL STATUS: READY FOR INSERTION]</span>
              <span style="font-size: 0.85rem; color: #f59e0b; font-weight: bold;">EXCHANGE RATE: $1.00 = 4 HARD TOKENS</span>
            </div>

            <!-- SOURCE & DESTINATION MATRIX (High Visibility) -->
            <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(6,182,212,0.3); border-radius: 6px; padding: 14px; margin-bottom: 16px;">
              <div style="font-size: 0.8rem; color: #06b6d4; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">
                // SOURCE & DESTINATION ROUTING MATRIX
              </div>

              <!-- Source -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px;">
                <span style="color: #94a3b8;">SOURCE (FUNDING INSTRUMENT):</span>
                <span style="color: #fff; font-weight: bold;">💳 Card / Cash App (Instant Capture)</span>
              </div>

              <!-- Destination Routing Choice -->
              <div style="font-size: 0.85rem; margin-top: 10px;">
                <div style="color: #94a3b8; margin-bottom: 6px;">DESTINATION (PAYOUT RECIPIENT):</div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                  <button id="dest-mode-vault" class="aim-btn" style="padding: 10px; font-size: 0.78rem; background: ${state.selectedDestination === DONATION_ACCOUNT_ID ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}; border-color: ${state.selectedDestination === DONATION_ACCOUNT_ID ? '#10b981' : '#334155'}; color: #fff; cursor: pointer; text-align: left;">
                    <div style="font-weight: bold; color: #10b981;">🏦 AlphaCore Sutton Vault</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">Bypasses 7-Day Platform Hold</div>
                  </button>
                  <button id="dest-mode-pushtocard" class="aim-btn" style="padding: 10px; font-size: 0.78rem; background: ${state.selectedDestination !== DONATION_ACCOUNT_ID ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)'}; border-color: ${state.selectedDestination !== DONATION_ACCOUNT_ID ? '#06b6d4' : '#334155'}; color: #fff; cursor: pointer; text-align: left;">
                    <div style="font-weight: bold; color: #06b6d4;">💳 Instant Push-to-Card</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">Direct Debit Card Payout (No Acct #)</div>
                  </button>
                </div>
              </div>
            </div>

            <!-- ATM Cash Deposit Input & Token Yield -->
            <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); padding: 14px; border-radius: 6px; margin-bottom: 16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <label style="color: #94a3b8; font-size: 0.85rem; font-weight: bold;">ENTER CASH DEPOSIT AMOUNT (USD) [MIN $0.50]:</label>
                <span id="token-count-display" style="color: #f59e0b; font-weight: bold; font-size: 0.95rem;">
                  🪙 ${activeFeeData.tokens} HARD TOKENS
                </span>
              </div>
              <div style="position: relative; margin-bottom: 10px;">
                <span style="position: absolute; left: 14px; top: 11px; font-size: 1.5rem; color: #10b981;">$</span>
                <input type="number" id="cash-amount-input" value="${state.amount || ''}" placeholder="25.00" min="0.50" step="0.01"
                  style="width: 100%; min-height: 52px; background: #000; border: 1px solid #10b981; color: #10b981; padding: 12px 12px 12px 35px; font-size: 1.5rem; font-family: 'Share Tech Mono', monospace; outline: none; box-sizing: border-box; border-radius: 4px;">
              </div>
              <!-- Quick Presets -->
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${[1, 5, 10, 25, 50, 100].map(val => `
                  <button class="aim-btn btn-preset" data-val="${val}" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.05); border-color: #334155; color: #cbd5e1; cursor: pointer;">
                    $${val}.00
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Thematic Laundromat Fee Breakdown Table -->
            <div style="background: rgba(0,0,0,0.5); border: 1px solid #1e293b; padding: 14px; border-radius: 6px; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #1f293d; padding-bottom: 6px;">
                <span style="font-family: 'Orbitron', sans-serif; font-size: 0.82rem; color: #06b6d4; font-weight: bold;">
                  THEMATIC LAUNDRO-MAT FEES & VALUE LEDGER
                </span>
                <span style="font-size: 0.75rem; color: ${feeConfig.badgeColor};">${feeConfig.badge}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #888; font-size: 0.82rem;">
                <span>Water & Machine Capture (Stripe 2.9% + $0.30):</span>
                <span id="fee-capture" style="color:#cbd5e1;">-$${activeFeeData.captureFee.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.82rem; color: ${feeConfig.isExempt ? '#10b981' : '#888'};">
                <span id="fee-alpha-label">${feeConfig.detergentLabel || feeConfig.label}:</span>
                <span id="fee-alpha">${feeConfig.isExempt ? '$0.00 (VIP EXEMPT)' : `-$${activeFeeData.platformFee.toFixed(2)}`}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #888; font-size: 0.82rem; border-bottom: 1px dashed #1e293b; padding-bottom: 6px;">
                <span>Direct Express Wash Routing (Stripe Connect):</span>
                <span id="fee-connect" style="color:#cbd5e1;">-$${activeFeeData.connectFee.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 1rem; color: #fff;">
                <strong>NET CLEAN PAYOUT AVAILABLE:</strong>
                <strong id="final-payout" style="color: #10b981;">$${activeFeeData.payout.toFixed(2)}</strong>
              </div>
            </div>

            <!-- Animated Card Insertion Slot Area -->
            <div class="atm-card-slot-wrap">
              <div id="card-graphic" class="animated-credit-card ${state.cardInserting ? 'card-inserting' : ''}">
                <span>CHIP // VISA</span>
              </div>
              <div class="atm-card-slot"></div>
              <div style="font-size: 0.75rem; color: #06b6d4; font-weight: bold; margin-top: 6px;">
                ${state.cardInserting ? '⚡ READING CARD DATA & ENCRYPTING...' : '▼ CARD INSERTION SLOT ▼'}
              </div>
            </div>
          </div>

          <!-- Action Buttons Area -->
          <div style="margin-bottom: 16px;">
            <button id="btn-initiate-deposit" class="aim-btn" style="width: 100%; min-height: 52px; padding: 14px; font-size: 1.05rem; background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981; font-weight: bold; cursor: pointer; border-radius: 6px; box-shadow: 0 0 15px rgba(16,185,129,0.25);" ${(!activeFeeData || activeFeeData.rawVal < 0.50) ? 'disabled' : ''}>
              💳 INSERT CARD & DEPOSIT $${state.amount ? Number(state.amount).toFixed(2) : '0.00'}
            </button>

            <!-- Stripe Card Element Mount Container -->
            <div id="stripe-ui-container" style="display: none; margin-top: 14px; background: #020617; border: 1px solid #06b6d4; padding: 18px; border-radius: 8px;">
              <div style="color: #06b6d4; font-size: 0.85rem; font-weight: bold; margin-bottom: 12px;">// ENTER SOURCE PAYMENT CARD DETAILS:</div>
              <div id="payment-element"></div>
              <button id="submit-payment-btn" class="aim-btn" style="width: 100%; min-height: 48px; margin-top: 16px; padding: 14px; background: #06b6d4; border-color: #06b6d4; color: #000; font-weight: bold; cursor: pointer; border-radius: 4px;">
                CONFIRM DEPOSIT & DISPENSE TOKENS
              </button>
              <div id="payment-message" style="color: #ef4444; margin-top: 10px; font-family: sans-serif; display: none;"></div>
            </div>
          </div>

          <!-- Animated Coin Dispenser Tray -->
          <div class="atm-dispenser-tray">
            <div style="font-size: 0.75rem; color: #64748b; font-weight: bold; margin-bottom: 6px; letter-spacing: 1px;">
              HARD COIN TOKEN DISPENSER TRAY
            </div>
            <div id="dispenser-coins" style="font-size: 2.2rem; min-height: 45px; display: flex; align-items: center; justify-content: center; gap: 8px;">
              ${state.tokensHeld > 0 ? '<span class="coin-dispensing">🪙</span><span class="coin-dispensing">🪙</span><span class="coin-dispensing">🪙</span>' : '<span style="font-size:0.85rem; color:#475569;">[TRAY EMPTY // AWAITING DEPOSIT]</span>'}
            </div>
            ${state.tokensHeld > 0 ? `
              <button id="btn-collect-proceed" class="aim-btn" style="margin-top: 10px; padding: 10px 20px; background: rgba(245,158,11,0.2); border-color: #f59e0b; color: #fbbf24; font-weight: bold; cursor: pointer; border-radius: 4px;">
                🪙 COLLECT ${state.tokensHeld} TOKENS & PROCEED TO WASHERS ➔
              </button>
            ` : ''}
          </div>

          <!-- Push-to-Card Instant Payout Direct Gateway (The Coin Changer Cash-Out) -->
          <div style="margin-top: 20px; background: #050912; border: 1px solid #1e293b; padding: 18px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px;">
              <div>
                <span style="font-size: 0.75rem; color: #06b6d4; font-weight: bold;">// COIN CHANGER & CASH-OUT</span>
                <h4 style="font-family: 'Orbitron', sans-serif; margin: 2px 0 0 0; color: #fff; font-size: 1rem;">
                  INSTANT PUSH-TO-CARD DEBIT PAYOUT
                </h4>
              </div>
              <span style="font-size: 0.78rem; color: #10b981; font-weight: bold;">NO STRIPE ACCOUNT REQUIRED</span>
            </div>
            <p style="color: #94a3b8; font-size: 0.82rem; margin: 0 0 14px 0; line-height: 1.4;">
              Ready to cash out clean laundry? Enter any Visa or Mastercard debit card (including Cash App Cash Card or Chime). Funds arrive in under 60 seconds.
            </p>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 12px;" class="mobile-stack-columns">
              <input type="text" id="payout-card-num" placeholder="Debit Card Number (16 Digits)" maxlength="19"
                style="background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; border-radius: 4px; outline: none;">
              <input type="text" id="payout-card-exp" placeholder="MM/YY" maxlength="5"
                style="background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; border-radius: 4px; outline: none;">
              <input type="text" id="payout-card-cvc" placeholder="CVC" maxlength="4"
                style="background: #000; border: 1px solid #334155; color: #fff; padding: 10px; font-family: monospace; border-radius: 4px; outline: none;">
            </div>

            <button id="btn-execute-push-payout" class="aim-btn" style="width: 100%; min-height: 48px; padding: 12px; background: rgba(6,182,212,0.2); border-color: #06b6d4; color: #06b6d4; font-weight: bold; cursor: pointer; border-radius: 4px;">
              ⚡ EXECUTE INSTANT PAYOUT ($${activeFeeData.payout.toFixed(2)}) TO DEBIT CARD
            </button>
            <div id="payout-status-msg" style="margin-top: 10px; font-size: 0.85rem; display: none;"></div>
          </div>
        </div>

        <!-- Guest Session Security Warning Intercept Modal -->
        ${state.guestWarningModalActive ? `
          <div class="laundry-modal-overlay">
            <div class="laundry-modal-box" style="border-color: #f59e0b; box-shadow: 0 0 40px rgba(245,158,11,0.3);">
              <div style="font-size: 3rem; margin-bottom: 8px;">⚠️</div>
              <h3 style="font-family: 'Orbitron', sans-serif; color: #fbbf24; margin: 0 0 10px 0; font-size: 1.2rem;">
                GUEST PROFILE ESCROW WARNING
              </h3>
              <p style="color: #cbd5e1; font-size: 0.88rem; line-height: 1.6; text-align: left; background: rgba(0,0,0,0.5); padding: 14px; border-radius: 6px; border: 1px solid #475569; margin-bottom: 14px;">
                You are currently depositing on an anonymous <strong>Guest Profile</strong>.
                <br><br>
                • <strong>Holding Tank:</strong> If you close or refresh this page before completing your payout at the Coin Changer, unclaimed funds will be held in temporary escrow for <strong>24 hours</strong>.
                <br><br>
                • <strong>Auto-Refund Safety:</strong> After 24 hours, the system will automatically refund your deposit back to the source card.
                <br><br>
                • <strong>Non-Refundable Fees:</strong> External network transaction processing fees ($0.30 + 2.9%) cannot be refunded.
                <br><br>
                • <strong>Recommended:</strong> Authenticate with your User PIN to permanently hold balances across visits.
              </p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="btn-guest-cancel" class="aim-btn" style="flex: 1; padding: 12px; border-color: #64748b; color: #94a3b8; cursor: pointer;">
                  CANCEL
                </button>
                <button id="btn-guest-proceed" class="aim-btn" style="flex: 2; padding: 12px; background: rgba(245,158,11,0.2); border-color: #f59e0b; color: #fbbf24; font-weight: bold; cursor: pointer;">
                  I UNDERSTAND // PROCEED AS GUEST
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      `;

      // Wire Up Destination Selection
      const btnDestVault = bodyBox.querySelector('#dest-mode-vault');
      const btnDestCard = bodyBox.querySelector('#dest-mode-pushtocard');
      if (btnDestVault) {
        btnDestVault.onclick = () => {
          playSFX('click');
          state.selectedDestination = DONATION_ACCOUNT_ID;
          render();
        };
      }
      if (btnDestCard) {
        btnDestCard.onclick = () => {
          playSFX('click');
          state.selectedDestination = 'pushtocard';
          render();
        };
      }

      // Wire Up Cash Input & Presets
      const cashInput = bodyBox.querySelector('#cash-amount-input');
      const tokenDisplay = bodyBox.querySelector('#token-count-display');
      const elCapture = bodyBox.querySelector('#fee-capture');
      const elAlpha = bodyBox.querySelector('#fee-alpha');
      const elConnect = bodyBox.querySelector('#fee-connect');
      const elPayout = bodyBox.querySelector('#final-payout');
      const btnDeposit = bodyBox.querySelector('#btn-initiate-deposit');

      bodyBox.querySelectorAll('.btn-preset').forEach(btn => {
        btn.onclick = () => {
          playSFX('click');
          state.amount = parseFloat(btn.getAttribute('data-val'));
          render();
        };
      });

      if (cashInput) {
        cashInput.oninput = (e) => {
          const val = e.target.value;
          state.amount = val;
          const calc = calculateFees(val, feeConfig.rate);
          if (!calc) {
            tokenDisplay.textContent = '🪙 0 TOKENS';
            elCapture.textContent = '-$0.00';
            elAlpha.textContent = feeConfig.isExempt ? '$0.00' : '-$0.00';
            elConnect.textContent = '-$0.00';
            elPayout.textContent = '$0.00';
            elPayout.style.color = '#ef4444';
            btnDeposit.disabled = true;
            return;
          }
          tokenDisplay.textContent = `🪙 ${calc.tokens} HARD TOKENS`;
          elCapture.textContent = `-$${calc.captureFee.toFixed(2)}`;
          elAlpha.textContent = feeConfig.isExempt ? '$0.00 (VIP EXEMPT)' : `-$${calc.platformFee.toFixed(2)}`;
          elConnect.textContent = `-$${calc.connectFee.toFixed(2)}`;
          elPayout.textContent = `$${calc.payout.toFixed(2)}`;
          elPayout.style.color = '#10b981';
          btnDeposit.disabled = false;
          btnDeposit.textContent = `💳 INSERT CARD & DEPOSIT $${Number(val).toFixed(2)}`;
        };
      }

      // Wire Up Deposit Initiation & Guest Intercept
      if (btnDeposit) {
        btnDeposit.onclick = () => {
          if (isGuest && !state.guestWarningModalActive) {
            playSFX('alert');
            state.guestWarningModalActive = true;
            render();
            return;
          }
          triggerCardInsertion();
        };
      }

      // Wire Up Guest Warning Modal Buttons
      const btnGuestCancel = bodyBox.querySelector('#btn-guest-cancel');
      const btnGuestProceed = bodyBox.querySelector('#btn-guest-proceed');
      if (btnGuestCancel) {
        btnGuestCancel.onclick = () => {
          playSFX('click');
          state.guestWarningModalActive = false;
          render();
        };
      }
      if (btnGuestProceed) {
        btnGuestProceed.onclick = () => {
          playSFX('click');
          state.guestWarningModalActive = false;
          triggerCardInsertion();
        };
      }

      // Card Insertion & Stripe Elements Execution
      async function triggerCardInsertion() {
        state.cardInserting = true;
        laundromatAudio.init();
        laundromatAudio.playBillWhir();
        playSFX('transition');
        const cardGfx = bodyBox.querySelector('#card-graphic');
        if (cardGfx) cardGfx.classList.add('card-inserting');

        const stripeBox = bodyBox.querySelector('#stripe-ui-container');
        if (stripeBox) stripeBox.style.display = 'block';

        btnDeposit.disabled = true;
        btnDeposit.textContent = '⚡ ESTABLISHING SECURE STRIPE UPLINK...';

        try {
          const resp = await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/atm-deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: state.amount,
              profile: rawProfile,
              is_guest: isGuest
            })
          });

          const data = await resp.json();
          if (!resp.ok) throw new Error(data.detail || 'ATM Deposit rejected by backend.');

          state.depositId = data.depositId;

          if (data.clientSecret && window.Stripe) {
            stripeInstance = window.Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd');
            elementsInstance = stripeInstance.elements({
              clientSecret: data.clientSecret,
              appearance: { theme: 'night' }
            });
            const paymentElement = elementsInstance.create('payment');
            paymentElement.mount('#payment-element');
            btnDeposit.textContent = '💳 PAYMENT CARD INSERTED // COMPLETE BELOW';
          }
        } catch (err) {
          btnDeposit.disabled = false;
          btnDeposit.textContent = `❌ ERROR: ${err.message}`;
          playSFX('incorrect');
        }
      }

      // Wire Up Payment Submission
      const submitPayBtn = bodyBox.querySelector('#submit-payment-btn');
      const payMsgEl = bodyBox.querySelector('#payment-message');
      if (submitPayBtn) {
        submitPayBtn.onclick = async () => {
          if (!stripeInstance || !elementsInstance) return;
          submitPayBtn.disabled = true;
          submitPayBtn.textContent = 'AUTHORIZING DIRECT TRANSACTION...';
          laundromatAudio.playBillWhir();

          const { error, paymentIntent } = await stripeInstance.confirmPayment({
            elements: elementsInstance,
            redirect: 'if_required'
          });

          if (error) {
            submitPayBtn.disabled = false;
            submitPayBtn.textContent = 'RETRY PAYMENT';
            if (payMsgEl) {
              payMsgEl.textContent = `[!] ${error.message}`;
              payMsgEl.style.display = 'block';
            }
            playSFX('incorrect');
          } else {
            // Confirm deposit on backend
            try {
              await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/confirm-atm-deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentIntentId: paymentIntent.id,
                  depositId: state.depositId,
                  profile: rawProfile,
                  is_guest: isGuest,
                  amount: state.amount
                })
              });
            } catch (e) {
              console.warn('Backend confirmation note:', e);
            }

            state.paymentAuthorized = true;
            state.tokensHeld += maxTokens(state.amount);
            laundromatAudio.playCoinClink();
            playSFX('success');
            render();
          }
        };
      }

      // Helper function for max tokens
      function maxTokens(amt) {
        return Math.max(1, Math.floor(Number(amt) * 4));
      }

      // Wire Up Collect Tokens Button
      const btnCollectProceed = bodyBox.querySelector('#btn-collect-proceed');
      if (btnCollectProceed) {
        btnCollectProceed.onclick = () => {
          laundromatAudio.playCoinClink();
          playSFX('navigate');
          state.stage = 'washing_machines';
          render();
        };
      }

      // Wire Up Push-to-Card Instant Payout
      const btnPushPayout = bodyBox.querySelector('#btn-execute-push-payout');
      const cardNumInput = bodyBox.querySelector('#payout-card-num');
      const cardExpInput = bodyBox.querySelector('#payout-card-exp');
      const cardCvcInput = bodyBox.querySelector('#payout-card-cvc');
      const payoutStatusMsg = bodyBox.querySelector('#payout-status-msg');

      if (btnPushPayout) {
        btnPushPayout.onclick = async () => {
          const cardNum = (cardNumInput?.value || '').replace(/\s+/g, '');
          const cardExp = (cardExpInput?.value || '').trim();
          const cardCvc = (cardCvcInput?.value || '').trim();

          if (cardNum.length < 15 || !cardExp.includes('/') || cardCvc.length < 3) {
            alert('Please enter a valid 16-digit debit card number, MM/YY expiration, and 3-digit CVC.');
            return;
          }

          const [expMonth, expYear] = cardExp.split('/');
          btnPushPayout.disabled = true;
          btnPushPayout.textContent = '⚡ TOKENIZING DEBIT CARD & PUSHING FUNDS...';
          laundromatAudio.playBillWhir();

          try {
            if (!window.Stripe) throw new Error('Stripe.js not loaded');
            const stripeTemp = window.Stripe('pk_live_51TIaM8HHWJjCufbCSyQq4jWYfMhQdQP1SP2L2rq3ZLFefgmtGugrbOBSEsgugJxj2uDzlkeRpgOQyrSm1P3zQ9nv00x8zOLLXd');

            const tokenResult = await stripeTemp.createToken('card', {
              number: cardNum,
              exp_month: parseInt(expMonth, 10),
              exp_year: parseInt(expYear.length === 2 ? `20${expYear}` : expYear, 10),
              cvc: cardCvc
            });

            if (tokenResult.error) throw new Error(tokenResult.error.message);

            const payoutResp = await fetch('https://alphacoreprogramming--alphacore-aio-backend-alphacore-main-api.modal.run/stripe/changer-payout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: activeFeeData.payout,
                profile: rawProfile,
                depositId: state.depositId,
                cardToken: tokenResult.token.id
              })
            });

            const payoutData = await payoutResp.json();
            if (!payoutResp.ok) throw new Error(payoutData.detail || 'Push-to-card payout failed.');

            laundromatAudio.playCleanSparkle();
            laundromatAudio.playReceiptPrinter();
            playSFX('login');

            if (payoutStatusMsg) {
              payoutStatusMsg.style.display = 'block';
              payoutStatusMsg.style.color = '#10b981';
              payoutStatusMsg.innerHTML = `✅ <strong>PAYOUT SUCCESSFUL:</strong> $${activeFeeData.payout.toFixed(2)} sent directly to card ending in ${cardNum.slice(-4)} (Payout ID: ${payoutData.payoutId || 'instant_card'}).`;
            }
            btnPushPayout.textContent = '✅ PAYOUT DISPATCHED TO DEBIT CARD';
          } catch (err) {
            btnPushPayout.disabled = false;
            btnPushPayout.textContent = '⚡ RETRY PUSH-TO-CARD PAYOUT';
            if (payoutStatusMsg) {
              payoutStatusMsg.style.display = 'block';
              payoutStatusMsg.style.color = '#ef4444';
              payoutStatusMsg.textContent = `❌ ${err.message}`;
            }
            playSFX('incorrect');
          }
        };
      }
    }

    else if (state.stage === 'washing_machines') {
