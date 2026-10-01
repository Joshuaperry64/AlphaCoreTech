const fs = require('fs');
let content = fs.readFileSync('src/pages/transfer.test.js', 'utf8');
content = content.replace("el.querySelector('#btn-initiate-payment')", "el.querySelector('#btn-initiate-deposit')");
fs.writeFileSync('src/pages/transfer.test.js', content, 'utf8');
