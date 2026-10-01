const { readFileSync } = require('fs');

const code = readFileSync('src/pages/transfer.js', 'utf8');

console.log(code.includes('state.inventory'));
console.log(code.includes('case \'cash_to_coin\':'));
