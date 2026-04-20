const { fetchPlatformData } = require('./src/services/aggregationService');

const PLATFORMS = [
  { name: 'leetcode', username: 'rajeev_3' },
  { name: 'github', username: 'torvalds' },
  { name: 'codeforces', username: 'tourist' },
  { name: 'codechef', username: 'gennady.korotkevich' },
  { name: 'geeksforgeeks', username: 'sandeep-jain' },
  { name: 'hackerrank', username: 'demo' },
  { name: 'codingninjas', username: 'nikitabohra' }
];

const runTests = async () => {
  console.log('Testing fetchPlatformData for 7 platforms...\n');
  for (const p of PLATFORMS) {
    console.log(`\n===================`);
    console.log(`Testing ${p.name} (${p.username})`);
    try {
      const res = await fetchPlatformData(p.name, p.username);
      if (res && res.success) {
        console.log('  ✅ SUCCESS');
      } else {
        console.log(`  ❌ FAILED: ${res?.error}`);
        console.error(res);
      }
    } catch (e) {
      console.log(`  ❌ EXCEPTION: ${e.message}`);
    }
  }
  process.exit(0);
};

runTests();
