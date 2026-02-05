const puppeteer = require('puppeteer');

/**
 * Coding Ninjas Service using Puppeteer for JS rendering
 * Naukri Code360 is a JavaScript-heavy SPA that requires browser rendering
 */

/**
 * Fetch Coding Ninjas user statistics
 * @param {string} username - Coding Ninjas username
 * @returns {Object} User stats
 */
const fetchCodingNinjasStats = async (username) => {
  let browser = null;
  
  try {
    console.log(`🔍 Fetching Coding Ninjas stats for: ${username}`);
    
    let problemsSolved = 0;
    let score = 0;
    let contestsParticipated = 0;
    let rank = 0;
    let easy = 0;
    let moderate = 0;
    let hard = 0;
    let submissions = 0;
    
    browser = await puppeteer.launch({ 
      headless: true, 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Remove automation flags
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    
    const targetUrl = `https://www.naukri.com/code360/profile/${username}`;
    console.log(`📄 Navigating to: ${targetUrl}`);
    
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle0', 
      timeout: 45000 
    });
    
    // Wait additional time for JS to render
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Extract data from the rendered page
    const extractedData = await page.evaluate(() => {
      const getText = () => document.body.innerText || '';
      const text = getText();
      
      // Try to find the problems solved data
      const dsaMatch = text.match(/Data\s+Structures\s+&\s+Algorithms\s+(\d+)\s+Problems\s+solved\s+(\d+)\s+Easy\s+(\d+)\s+Moderate\s+(\d+)\s+Hard/i);
      const submissionsMatch = text.match(/(\d+)\s+Problem\s+submissions/i);
      
      return {
        text: text.substring(0, 5000), // First 5000 chars for debugging
        textLength: text.length,
        dsaMatch: dsaMatch ? {
          total: dsaMatch[1],
          easy: dsaMatch[2],
          moderate: dsaMatch[3],
          hard: dsaMatch[4]
        } : null,
        submissions: submissionsMatch ? submissionsMatch[1] : null
      };
    });
    
    console.log(`📊 Page text length: ${extractedData.textLength}`);
    
    if (extractedData.dsaMatch) {
      problemsSolved = parseInt(extractedData.dsaMatch.total) || 0;
      easy = parseInt(extractedData.dsaMatch.easy) || 0;
      moderate = parseInt(extractedData.dsaMatch.moderate) || 0;
      hard = parseInt(extractedData.dsaMatch.hard) || 0;
      console.log(`✅ Found: ${problemsSolved} problems (E:${easy}, M:${moderate}, H:${hard})`);
    } else {
      console.log('⚠️ Could not extract DSA data');
      console.log('Sample text:', extractedData.text.substring(0, 500));
    }
    
    if (extractedData.submissions) {
      submissions = parseInt(extractedData.submissions) || 0;
      console.log(`✅ Found: ${submissions} submissions`);
    }
    
    const stats = {
      problemsSolved,
      totalSolved: problemsSolved,
      score,
      contestsParticipated,
      rank,
      easy,
      moderate,
      hard,
      submissions
    };

    console.log(`✅ CodingNinjas: ${username} - ${problemsSolved} problems (E:${easy}, M:${moderate}, H:${hard}), ${submissions} submissions`);

    return {
      success: true,
      platform: 'codingninjas',
      username,
      stats,
      lastFetched: new Date()
    };

  } catch (error) {
    console.error(`❌ Coding Ninjas Error for ${username}:`, error.message);
    return {
      success: false,
      platform: 'codingninjas',
      username,
      error: 'Unable to fetch Coding Ninjas stats. Profile may be private or username incorrect.',
      stats: null
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
};

module.exports = {
  fetchCodingNinjasStats
};
