const fs = require('fs');

const originalFile = fs.readFileSync('transfer_original.js', 'utf8');
const modifiedFile = fs.readFileSync('src/pages/transfer.js', 'utf8');

const startPattern = /else if \(state\.stage === 'cash_to_coin'\) \{/;
const endPattern = /else if \(state\.stage === 'washing_machines'\) \{/;

const originalMatch = originalFile.match(new RegExp(startPattern.source + '[\\s\\S]*?' + endPattern.source));
const modifiedMatch = modifiedFile.match(new RegExp(startPattern.source + '[\\s\\S]*?' + endPattern.source));

if (!originalMatch || !modifiedMatch) {
  console.error('Could not find patterns');
  process.exit(1);
}

let originalCashToCoin = originalMatch[0];

// Let's extract the inventory setup logic to make sure the tokens dispensed add to inventory
const submitPayBtnPattern = /const submitPayBtn = bodyBox\.querySelector\('#submit-payment-btn'\);\s*const payMsgEl = bodyBox\.querySelector\('#payment-message'\);\s*if \(submitPayBtn\) \{[\s\S]*?\} else \{[\s\S]*?state\.paymentAuthorized = true;\s*state\.tokensHeld \+= maxTokens\(state\.amount\);\s*laundromatAudio\.playCoinClink\(\);\s*playSFX\('success'\);\s*render\(\);\s*\}\s*\};\s*\}/;

const submitPayReplacement = `const submitPayBtn = bodyBox.querySelector('#submit-payment-btn');
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
              payMsgEl.textContent = \`[!] \${error.message}\`;
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
            if (state.inventory) {
                state.inventory.coins += maxTokens(state.amount);
            }
            laundromatAudio.playCoinClink();
            playSFX('success');
            render();
          }
        };
      }`;

originalCashToCoin = originalCashToCoin.replace(submitPayBtnPattern, submitPayReplacement);

const newFileContent = modifiedFile.replace(modifiedMatch[0], originalCashToCoin);
fs.writeFileSync('src/pages/transfer.js', newFileContent, 'utf8');
console.log('Restored original cash_to_coin section with inventory gamification attached');
