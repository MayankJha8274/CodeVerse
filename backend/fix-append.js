const fs = require('fs');
const file = 'src/controllers/append.js';
const data = fs.readFileSync(file, 'utf16le');
fs.writeFileSync(file, data, 'utf8');
console.log('Fixed append.js');