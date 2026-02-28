const puppeteer = require('puppeteer');

(async () => {
  const username = 'mayankjha8274';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
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
  
  console.log('Navigating to GFG practice profile...');
  await page.goto('https://www.geeksforgeeks.org/profile/' + username + '?tab=practice', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));
  
  console.log('=== All JSON API Responses ===');
  for (const [url, text] of Object.entries(apiResponses)) {
    const shortUrl = url.replace(/https?:\/\/[^/]+/, '').substring(0, 80);
    console.log('URL:', shortUrl);
    
    try {
      const json = JSON.parse(text);
      const sample = JSON.stringify(json);
      if (sample.length > 300) {
        const keys = typeof json === 'object' ? Object.keys(json).join(', ') : 'array';
        console.log('  Keys:', keys);
        console.log('  Size:', sample.length);
        
        const lower = sample.toLowerCase();
        if (lower.includes('topic') || lower.includes('"tag"') || lower.includes('category')) {
          console.log('  *** HAS TOPIC/TAG DATA ***');
          console.log('  Sample:', sample.substring(0, 500));
        }
      } else {
        console.log('  Data:', sample);
      }
    } catch(e) {
      console.log('  Not JSON, len:', text.length);
    }
    console.log('');
  }
  
  // Extract page text to check for topic display
  const pageData = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const html = document.body.innerHTML || '';
    
    // Look for __NEXT_DATA__ which might contain all page data
    const nextDataEl = document.querySelector('#__NEXT_DATA__');
    let nextData = null;
    if (nextDataEl) {
      try {
        nextData = JSON.parse(nextDataEl.textContent);
      } catch(e) {}
    }
    
    // Look for topic/tag related elements
    const topicElements = [];
    document.querySelectorAll('[class*="tag"], [class*="topic"], [class*="chip"], [class*="pill"]').forEach(el => {
      topicElements.push({
        tag: el.tagName,
        className: el.className.substring(0, 100),
        text: el.textContent.trim().substring(0, 100)
      });
    });
    
    return {
      textLength: text.length,
      textSample: text.substring(0, 3000),
      hasNextData: !!nextData,
      nextDataKeys: nextData ? Object.keys(nextData).join(', ') : 'none',
      topicElements: topicElements.slice(0, 30),
    };
  });
  
  console.log('=== Page Text Analysis ===');
  console.log('Text length:', pageData.textLength);
  console.log('Has __NEXT_DATA__:', pageData.hasNextData);
  console.log('Next data keys:', pageData.nextDataKeys);
  console.log('Topic-related elements:', pageData.topicElements.length);
  if (pageData.topicElements.length > 0) {
    pageData.topicElements.forEach(el => {
      console.log('  ', el.tag, '|', el.className.substring(0, 60), '|', el.text.substring(0, 80));
    });
  }
  console.log('\nText sample:\n', pageData.textSample);
  
  await browser.close();
})();
