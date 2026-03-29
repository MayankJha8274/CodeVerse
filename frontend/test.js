const fs = require('fs');
const path = 'C:/Users/mayan/OneDrive/Desktop/CodeVerse/CODEVERSE-PROJECT/frontend/src/components/society/SocietyLeaderboardTab.jsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/\{\/\* Charts View \*\/\}[\s\S]*?\{\/\* Table View \*\/\}/, 
\{/* Charts View */}
      {viewMode === 'charts' && (
        <div className="space-y-6">
          <SocietyAnalyticsTab societyId={societyId} />
        </div>
      )}

      {/* Table View *}\/\);

fs.writeFileSync(path, c, 'utf8');
