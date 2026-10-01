const fs = require('fs');
const content = fs.readFileSync('src/pages/transfer.js', 'utf8');

const hasInventoryState = content.includes('inventory: {');
const hasAudioClink = content.includes('playCoinClink');
const hasWasherStage = content.includes("state.stage === 'washing_machines'");

console.log('hasInventoryState:', hasInventoryState);
console.log('hasAudioClink:', hasAudioClink);
console.log('hasWasherStage:', hasWasherStage);
