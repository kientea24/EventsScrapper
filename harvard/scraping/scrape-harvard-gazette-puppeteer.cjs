const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeHarvardGazette() {
  console.log('📰 Starting Harvard Gazette scraper with Puppeteer (Pagination Only)...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
    
    // Navigate to the Harvard Gazette events page
    console.log('🔗 Navigating to Harvard Gazette events page...');
    await page.goto('https://news.harvard.edu/gazette/harvard-events/events-calendar/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('📄 Page loaded, starting pagination...');
    
    // Wait for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if there are any iframes on the page
    const iframes = await page.$$('iframe');
    console.log(`🔍 Found ${iframes.length} iframes on the page`);
    
    // First, call the XML scraper to get initial events from page 1
    console.log('📡 Calling XML scraper for initial events (page 1)...');
    try {
      const { execSync } = require('child_process');
      execSync('node ../events/parse-harvard-events.js', { 
        cwd: path.join(__dirname, '../scraping'),
        stdio: 'pipe'
      });
      console.log('✅ XML scraper completed for initial events');
    } catch (error) {
      console.log('⚠️ XML scraper failed for initial events:', error.message);
    }
    
    // Load the initial events to see the count
    try {
      const initialEvents = JSON.parse(fs.readFileSync(path.join(__dirname, '../events/parsed-harvard-events.json'), 'utf8'));
      console.log(`📊 Loaded ${initialEvents.length} events from XML scraper (page 1)`);
    } catch (error) {
      console.log('⚠️ Could not read initial events file:', error.message);
    }
    
    // Now navigate through pages and call XML scraper for each page
    console.log('🔄 Starting pagination to get events from multiple pages...');
    
    const maxPages = 5; // Limit to 5 pages for testing
    let pageNumber = 1;
    
    while (pageNumber <= maxPages) {
      console.log(`📄 Processing page ${pageNumber}...`);
      
      // Wait for any new XHR responses
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try to click next page button (not next month)
      try {
        const nextPageSelectors = [
          'a[id="ctl04_ctl07_ctl00_lnk2NextPg"]', // Exact ID from the element you provided
          'a[title="Next Page"]',
          'a[aria-label="Next Page"]',
          'a.right[role="button"]',
          'a[href*="javascript:Nav"]',
          'a[class*="right"]',
          'a[class*="next"]',
          '.twPagerBtn.right',
          'a[onclick*="scrollIntoView"]',
          'a[onclick*="mySpud.container.scrollIntoView"]',
          'a[onclick*="Nav("]',
          'a[href*="date="]',
          // More specific selectors for "Next Page" (not "Next Month")
          'a[title="Next Page"][aria-label="Next Page"]',
          'a[aria-label="Next Page"][class*="right"]',
          'a[class="twPagerBtn right"]',
          'a[id*="lnk2NextPg"][class*="right"]',
          'a[onclick*="Nav"][title="Next Page"]',
          'a[href*="javascript:Nav"][title="Next Page"]'
        ];
        
        let nextButton = null;
        let targetFrame = null;
        
        // First try to find the button in the main page
        for (const selector of nextPageSelectors) {
          nextButton = await page.$(selector);
          if (nextButton) {
            console.log(`➡️ Found next page button with selector: ${selector}`);
            break;
          }
        }
        
        // If not found in main page, check inside iframes
        if (!nextButton) {
          console.log('🔍 Checking iframes for navigation elements...');
          const iframes = await page.$$('iframe');
          
          for (let i = 0; i < iframes.length; i++) {
            try {
              const frame = iframes[i];
              const frameElement = await frame.contentFrame();
              if (frameElement) {
                console.log(`🔍 Checking iframe ${i + 1} for navigation...`);
                
                // First try to find the specific "Next Page" button
                for (const selector of nextPageSelectors) {
                  const frameButtons = await frameElement.$$(selector);
                  if (frameButtons.length > 0) {
                    // Check if this is actually a "Next Page" button by examining its properties
                    const buttonInfo = await frameElement.evaluate((button) => {
                      return {
                        title: button.title || '',
                        'aria-label': button.getAttribute('aria-label') || '',
                        text: button.textContent.trim(),
                        onclick: button.getAttribute('onclick') || '',
                        href: button.href || '',
                        id: button.id || '',
                        className: button.className || ''
                      };
                    }, frameButtons[0]);
                    
                    console.log(`🔍 Button info: ${JSON.stringify(buttonInfo)}`);
                    
                    // Check if this looks like a "Next Page" button (not "Next Month")
                    if (buttonInfo.title === 'Next Page' || 
                        buttonInfo['aria-label'] === 'Next Page' ||
                        buttonInfo.id.includes('lnk2NextPg')) {
                      nextButton = frameButtons[0];
                      targetFrame = frameElement;
                      console.log(`➡️ Found "Next Page" button in iframe ${i + 1} with selector: ${selector}`);
                      break;
                    } else {
                      console.log(`⚠️ Found button but it's not "Next Page": ${buttonInfo.title}`);
                    }
                  }
                }
                
                if (nextButton) break;
              }
            } catch (error) {
              console.log(`⚠️ Could not access iframe ${i + 1}: ${error.message}`);
            }
          }
        }
        
        if (nextButton) {
          console.log('➡️ Clicking next page button...');
          
          try {
            // Get current date before clicking to detect if we're changing months
            const currentDateBefore = await page.evaluate(() => {
              const dateElement = document.querySelector('h1, h2, h3, .date, [class*="date"]');
              return dateElement ? dateElement.textContent.trim() : '';
            });
            console.log(`📅 Current date before click: ${currentDateBefore}`);
            
            // Re-find the frame and button to avoid detachment issues
            const iframes = await page.$$('iframe');
            let targetFrame = null;
            let nextButton = null;
            
            // Find the correct iframe and button
            for (let i = 0; i < iframes.length; i++) {
              try {
                const frame = iframes[i];
                const frameElement = await frame.contentFrame();
                if (frameElement) {
                  const frameButtons = await frameElement.$$('a[id="ctl04_ctl07_ctl00_lnk2NextPg"]');
                  if (frameButtons.length > 0) {
                    targetFrame = frameElement;
                    nextButton = frameButtons[0];
                    console.log(`🔄 Re-found "Next Page" button in iframe ${i + 1}`);
                    break;
                  }
                }
              } catch (error) {
                console.log(`⚠️ Could not access iframe ${i + 1}: ${error.message}`);
              }
            }
            
            if (targetFrame && nextButton) {
              console.log('🔄 Clicking button inside iframe...');
              
              // Scroll the button into view before clicking
              await targetFrame.evaluate((button) => {
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, nextButton);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Try to execute the onclick JavaScript directly if it exists
              const onclick = await targetFrame.evaluate((button) => button.getAttribute('onclick'), nextButton);
              if (onclick && onclick.includes('Nav(')) {
                console.log('🔄 Executing Nav() function directly in iframe...');
                try {
                  await targetFrame.evaluate((onclickCode) => {
                    eval(onclickCode);
                  }, onclick);
                  console.log('✅ Nav() function executed successfully in iframe');
                } catch (error) {
                  console.log('⚠️ Failed to execute Nav() function in iframe, trying regular click...');
                  await nextButton.click();
                }
              } else {
                // Click the button normally in iframe
                await nextButton.click();
              }
            } else {
              console.log('⚠️ Could not re-find the button, trying direct Nav execution...');
              // Try to execute Nav function directly
              await page.evaluate(() => {
                if (typeof Nav === 'function') {
                  // Try to navigate to next day
                  const today = new Date();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const nextDate = tomorrow.getFullYear().toString() + 
                                 (tomorrow.getMonth() + 1).toString().padStart(2, '0') + 
                                 tomorrow.getDate().toString().padStart(2, '0');
                  Nav(`date=${nextDate}`);
                }
              });
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for new content to load
            
            // Scroll to bottom to ensure all content is loaded
            console.log('📜 Scrolling to bottom to load all content...');
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Scroll back to top
            await page.evaluate(() => {
              window.scrollTo(0, 0);
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if the date changed to detect if we clicked "Next Month" instead of "Next Page"
            const currentDateAfter = await page.evaluate(() => {
              const dateElement = document.querySelector('h1, h2, h3, .date, [class*="date"]');
              return dateElement ? dateElement.textContent.trim() : '';
            });
            console.log(`📅 Current date after click: ${currentDateAfter}`);
            
            // If the month changed, we clicked the wrong button
            if (currentDateBefore && currentDateAfter && 
                currentDateBefore !== currentDateAfter && 
                (currentDateBefore.includes('July') && currentDateAfter.includes('August') ||
                 currentDateBefore.includes('August') && currentDateAfter.includes('September'))) {
              console.log('⚠️ WARNING: Clicked "Next Month" button instead of "Next Page"!');
              console.log('🔄 Looking for the correct "Next Page" button...');
              // We need to find the correct "Next Page" button
              return false; // Signal that we need to find the correct button
            }
          } catch (error) {
            console.log(`❌ Error clicking next page button: ${error.message}`);
            return false; // Signal that we need to try a different approach
          }
          
          // After clicking next page, call the XML scraper to get events for this page
          console.log('📡 Calling XML scraper for current page...');
          try {
            const { execSync } = require('child_process');
            execSync('node ../events/parse-harvard-events.js', { 
              cwd: path.join(__dirname, '../scraping'),
              stdio: 'pipe'
            });
            console.log('✅ XML scraper completed for current page');
            
            // Load the updated events to see the count
            try {
              const updatedEvents = JSON.parse(fs.readFileSync(path.join(__dirname, '../events/parsed-harvard-events.json'), 'utf8'));
              console.log(`📊 Updated events count: ${updatedEvents.length}`);
            } catch (error) {
              console.log('⚠️ Could not read updated events file:', error.message);
            }
          } catch (error) {
            console.log('⚠️ XML scraper failed for current page:', error.message);
          }
          
          pageNumber++;
        } else {
          console.log('❌ No next page button found, stopping pagination');
          break;
        }
      } catch (error) {
        console.log('❌ Error during pagination:', error.message);
        break;
      }
    }
    
    console.log('✅ Pagination completed successfully!');
    console.log('📊 All events have been collected by the XML scraper');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during scraping:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

// Run the scraper
scrapeHarvardGazette()
  .then(success => {
    console.log(`✅ Harvard Gazette pagination completed successfully!`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Harvard Gazette pagination failed:', error);
    process.exit(1);
  });