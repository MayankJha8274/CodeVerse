const fs = require('fs');
const filepath = 'c:/Users/mayan/OneDrive/Desktop/CodeVerse/CODEVERSE-PROJECT/frontend/src/pages/SocietyDetailPage.jsx';
let content = fs.readFileSync(filepath, 'utf8');

// Update routing functions to check for room prefix
content = content.replace(/navigate\(\`\/societies\/\${societyId}\/\${tabId}\`, \{ replace: true \}\);/g, 
  "const isRoomRoute = window.location.pathname.includes('/rooms/');\n    navigate(`/${isRoomRoute ? 'rooms' : 'societies'}/${societyId}/${tabId}`, { replace: true });");

content = content.replace(/navigate\('\/societies'\);/g, 
  "navigate(window.location.pathname.includes('/rooms/') ? '/rooms' : '/societies');");

content = content.replace(/if \(\!confirm\('Are you sure you want to leave this society\?'\)\) return;/g, 
  "if (!confirm(`Are you sure you want to leave this ${window.location.pathname.includes('/rooms/') ? 'room' : 'society'}?`)) return;");

content = content.replace(/onClick=\{\(\) \=\> navigate\('\/societies'\)\}/g,
  "onClick={() => navigate(window.location.pathname.includes('/rooms/') ? '/rooms' : '/societies')}");

content = content.replace(/Back to Societies/g,
  "{window.location.pathname.includes('/rooms/') ? 'Back to Rooms' : 'Back to Societies'}");

content = content.replace(/const allTabs = isAdmin \? \[\.\.\.TABS\, \{ id: 'admin', label: 'Admin', icon: BarChart3 \}\] : TABS;/g,
  `const isRoom = society?.type === 'room' || window.location.pathname.includes('/rooms/');
  const baseTabs = TABS.filter(t => {
    if (t.id === 'chat' && society?.settings?.enableChat === false) return false;
    if (t.id === 'events' && society?.settings?.enableEvents === false) return false;
    if (t.id === 'leaderboard' && society?.settings?.enableLeaderboard === false) return false;
    
    // Rooms specifically hide events and announcements
    if (isRoom && ['events', 'announcements'].includes(t.id)) return false;

    return true;
  });

  const allTabs = isAdmin ? [...baseTabs, { id: 'admin', label: 'Admin', icon: Settings }] : baseTabs;`);

fs.writeFileSync(filepath, content);
console.log('Done society detail page edits.');
