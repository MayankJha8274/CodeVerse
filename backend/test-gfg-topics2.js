const puppeteer = require('puppeteer');

(async () => {
  const username = 'mayankjha8274';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  let submissionsData = null;
  
  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (url.includes('submissions')) {
        const text = await response.text();
        submissionsData = text;
      }
    } catch(e) {}
  });
  
  console.log('Navigating to GFG practice profile...');
  await page.goto('https://www.geeksforgeeks.org/profile/' + username + '?tab=practice', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 8000));
  
  // Check the submissions API response structure
  if (submissionsData) {
    console.log('=== Submissions API Response ===');
    try {
      const json = JSON.parse(submissionsData);
      console.log('Top keys:', Object.keys(json).join(', '));
      
      if (json.result) {
        console.log('\nResult keys:', Object.keys(json.result).join(', '));
        // This is the date:count mapping
        console.log('Result sample (first 5):', JSON.stringify(Object.entries(json.result).slice(0, 5)));
      }
      
      if (json.results) {
        console.log('\nResults keys:', Object.keys(json.results).join(', '));
        // Check each difficulty category
        for (const [difficulty, problems] of Object.entries(json.results)) {
          const problemNames = Object.keys(problems);
          console.log('\n' + difficulty + ': ' + problemNames.length + ' problems');
          // Show first 3 problem details
          for (const name of problemNames.slice(0, 3)) {
            const detail = problems[name];
            console.log('  Problem:', name);
            console.log('  Detail type:', typeof detail);
            if (typeof detail === 'object' && detail !== null) {
              console.log('  Detail keys:', Object.keys(detail).join(', '));
              console.log('  Detail value:', JSON.stringify(detail).substring(0, 200));
            } else {
              console.log('  Detail value:', JSON.stringify(detail));
            }
          }
        }
      }
    } catch(e) {
      console.log('Parse error:', e.message);
      console.log('Raw data (first 500):', submissionsData.substring(0, 500));
    }
  } else {
    console.log('No submissions data captured');
  }
  
  // Also check if the page text shows any topic info after full render
  const pageText = await page.evaluate(() => document.body.innerText || '');
  console.log('\n=== Full page text (' + pageText.length + ' chars) ===');
  console.log(pageText.substring(0, 2000));
  
  await browser.close();
})();
