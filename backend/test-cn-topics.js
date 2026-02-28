const puppeteer = require('puppeteer');

(async () => {
  const username = 'mayankvk';
  console.log('Fetching CodingNinjas profile for:', username);
  
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Capture API responses
  const apiResponses = {};
  page.on('response', async (response) => {
    try {
      const url = response.url();
      const ct = response.headers()['content-type'] || '';
      if (ct.includes('json') || url.includes('api')) {
        const text = await response.text();
        if (text.startsWith('{') || text.startsWith('[')) {
          apiResponses[url] = text;
        }
      }
    } catch(e) {}
  });
  
  const targetUrl = `https://www.naukri.com/code360/profile/${username}`;
  await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 45000 });
  await new Promise(r => setTimeout(r, 6000));
  
  console.log('\n=== API Responses ===');
  for (const [url, text] of Object.entries(apiResponses)) {
    const shortUrl = url.replace(/https?:\/\/[^/]+/, '').substring(0, 80);
    console.log('URL:', shortUrl);
    try {
      const json = JSON.parse(text);
      const sample = JSON.stringify(json);
      console.log('  Size:', sample.length);
      if (sample.length > 300) {
        console.log('  Keys:', Object.keys(json).join(', '));
        // Check for topic/problem data
        const lower = sample.toLowerCase();
        if (lower.includes('topic') || lower.includes('"tag"') || lower.includes('problem') || lower.includes('category')) {
          console.log('  *** HAS RELEVANT DATA ***');
          console.log('  Sample:', sample.substring(0, 500));
        }
      } else {
        console.log('  Data:', sample);
      }
    } catch(e) {}
    console.log('');
  }
  
  // Get full page text
  const pageText = await page.evaluate(() => document.body.innerText || '');
  console.log('\n=== Page Text (' + pageText.length + ' chars) ===');
  console.log(pageText.substring(0, 3000));
  
  await browser.close();
})();
