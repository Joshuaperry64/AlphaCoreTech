const fs = require('fs');

let transferCode = fs.readFileSync('src/pages/transfer.js', 'utf8');

const statePattern = /let state = \{\s*stage: 'wash_laundry',[\s\S]*?guestWarningModalActive: false\s*\};/;

const newState = `let state = {
    stage: 'wash_laundry',
    amount: 25.00,
    paymentAuthorized: false,
    washerLoaded: false,
    washerTraveled: false,
    dryerLoaded: false,
    dryerTraveled: false,
    laundryReceived: false,
    tokensHeld: 0,
    depositId: null,
    cardInserting: false,
    selectedDestination: initialDest,
    selectedDestinationName: initialDestName,
    customDestinationId: '',
    verifiedCustomInfo: null,
    donationConfirmModalActive: false,
    donationConfirmed: false,
    onboardingModalActive: false,
    guestWarningModalActive: false,
    inventory: {
      coins: 0,
      laundry_load: 1,
      dryer_sheets: 1,
      detergent: 1,
      clean_laundry: 0
    },
    machines: {
      W1: { active: false, timeRem: 0 },
      W2: { active: false, timeRem: 0 },
      D1: { active: false, timeRem: 0 },
      D2: { active: false, timeRem: 0 }
    }
  };`;

transferCode = transferCode.replace(statePattern, newState);
fs.writeFileSync('src/pages/transfer.js', transferCode);
console.log('State patched with inventory and machines');
