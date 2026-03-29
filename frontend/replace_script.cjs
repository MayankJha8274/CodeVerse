const fs = require('fs');
const path = 'C:/Users/mayan/OneDrive/Desktop/CodeVerse/CODEVERSE-PROJECT/frontend/src/components/society/SocietyLeaderboardTab.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace chartData block
content = content.replace(/const chartData = useMemo\(\(\) => \{[\s\S]*?return \{ topUsers, metricsComparison, radarData \};\s*\}, \[sortedRankings\]\);\r?\n\r?\n/, '');

// Replace maxVals block
content = content.replace(/const maxVals = useMemo\(\(\) => \{[\s\S]*?\}, \[data\]\);\r?\n\r?\n/, '');

// Replace Charts View JSX
const start = content.indexOf('{/* Charts View */}');
const end = content.indexOf('{/* Table View */}');

if (start !== -1 && end !== -1) {
  content = content.substring(0, start) + `{/* Charts View */}
      {viewMode === 'charts' && (
        <div className="space-y-6">
          <SocietyAnalyticsTab societyId={societyId} />
        </div>
      )}

      ` + content.substring(end);
}

fs.writeFileSync(path, content, 'utf8');
console.log('DONE');