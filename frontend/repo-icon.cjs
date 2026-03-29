const fs = require('fs');
let c = fs.readFileSync('c:/Users/mayan/OneDrive/Desktop/CodeVerse/CODEVERSE-PROJECT/frontend/src/pages/SocietiesPage.jsx', 'utf8');
c = c.replace(/<Building2 className="w-6 h-6 text-amber-500" \/> \{entityType === 'room' \? 'Rooms' : 'Societies'\}/g, "{entityType === 'room' ? <Hash className=\"w-6 h-6 text-amber-500\" /> : <Building2 className=\"w-6 h-6 text-amber-500\" />} {entityType === 'room' ? 'Rooms' : 'Societies'}");
fs.writeFileSync('c:/Users/mayan/OneDrive/Desktop/CodeVerse/CODEVERSE-PROJECT/frontend/src/pages/SocietiesPage.jsx', c);
