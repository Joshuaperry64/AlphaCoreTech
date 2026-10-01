const fs = require('fs');
let content = fs.readFileSync('src/pages/transfer.js', 'utf8');
content = content.replace('placeholder="25.00"', 'placeholder="0.50"');
fs.writeFileSync('src/pages/transfer.js', content, 'utf8');
