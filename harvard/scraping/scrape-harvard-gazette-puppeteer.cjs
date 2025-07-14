const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeHarvardGazette() {
  console.log('🔄 Starting Harvard Gazette scraper (Puppeteer)...');
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu'],
      timeout: 120000 // 2 minutes timeout
    });
    
    const page = await browser.newPage();
    
    // Set longer timeouts
    await page.setDefaultNavigationTimeout(120000); // 2 minutes
    await page.setDefaultTimeout(120000); // 2 minutes
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
    
    // Navigate to Harvard Gazette events page
    console.log('🌐 Navigating to Harvard Gazette events page...');
    await page.goto('https://news.harvard.edu/gazette/harvard-events/events-calendar/', {
      waitUntil: 'networkidle2',
      timeout: 120000
    });
    
    console.log('✅ Loaded Harvard Gazette events page');
    
    // Wait for the page to fully load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Scroll to load all events
    console.log('📜 Scrolling to load all events...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get all event card links from the main page
    const eventLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="trumbaEmbed=view%3devent"]'));
      // Only unique event links
      const seen = new Set();
      return anchors
        .map(a => a.getAttribute('href'))
        .filter(href => {
          if (!href) return false;
          if (seen.has(href)) return false;
          seen.add(href);
          return true;
        });
    });
    console.log(`🔗 Found ${eventLinks.length} event links.`);

    // Visit each event detail page and extract required fields
    const events = [];
    // Scrape each event detail page
    console.log(`🔍 Scraping ${eventLinks.length} event detail pages...`);
    
    for (let i = 0; i < eventLinks.length; i++) {
      const link = eventLinks[i];
      console.log(`📄 Scraping event ${i + 1}/${eventLinks.length}: ${link}`);
      
      try {
        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        // Navigate to event detail page with retry
        let detailPage;
        let retries = 2;
        while (retries > 0) {
          try {
            detailPage = await browser.newPage();
            await detailPage.setDefaultNavigationTimeout(120000);
            await detailPage.setDefaultTimeout(120000);
            await detailPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
            
            await detailPage.goto(link, {
              waitUntil: 'networkidle2',
              timeout: 120000
            });
            
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 3000));
            break;
          } catch (err) {
            console.error(`❌ Error navigating to event ${i + 1} (attempt ${3 - retries}/3):`, err.message);
            retries--;
            if (detailPage) await detailPage.close();
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }

        // Extract details from the event detail page
        const event = await detailPage.evaluate(() => {
          // Title
          const title = document.querySelector('h1, h2, .event-title, .MuiTypography-h3, .trumba-event-title')?.innerText?.trim() || '';
          if (title.toLowerCase() === 'sections') return null; // Skip non-events

          // Helper function to extract section content
          function extractSection(sectionName) {
            // Look for the section by various patterns
            const patterns = [
              new RegExp(`${sectionName}\\s*([\\s\\S]*?)(?=\\n\\s*(?:Where|When|Details|Organization|Cost|More info|Contact|$))`, 'i'),
              new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n\\s*(?:Where|When|Details|Organization|Cost|More info|Contact|$))`, 'i'),
              new RegExp(`${sectionName}\\s*([\\s\\S]*?)(?=\\n\\s*[A-Z][a-z]+:)`, 'i')
            ];
            
            // Get all text content
            const allText = document.body.innerText;
            
            for (const pattern of patterns) {
              const match = allText.match(pattern);
              if (match && match[1]) {
                return match[1].trim();
              }
            }
            return '';
          }

          // Extract location from 'Where' section
          let locationVenue = '';
          let locationAddress = '';
          let locationCity = '';
          let fullLocation = '';
          let location = '';
          
          const whereSection = extractSection('Where');
          if (whereSection) {
            fullLocation = whereSection;
            // Split by line breaks or common separators
            const lines = whereSection.split(/\n|\r|,?\s*Cambridge/i).filter(line => line.trim());
            if (lines.length >= 2) {
              locationVenue = lines[0].trim();
              locationAddress = lines[1].trim();
              locationCity = 'Cambridge';
            } else if (whereSection.includes(',')) {
              const parts = whereSection.split(',');
              locationVenue = parts[0].trim();
              locationAddress = parts[1]?.trim() || '';
              locationCity = parts[2]?.trim() || 'Cambridge';
            } else {
              locationVenue = whereSection;
            }
            location = [locationVenue, locationAddress, locationCity].filter(Boolean).join('\n');
          }

          // Extract date/time from 'When' section
          let dateTime = '';
          const whenSection = extractSection('When');
          if (whenSection) {
            dateTime = whenSection.replace(/\n+/g, ' ').trim();
          }

          // Extract description from 'Details' section
          let description = '';
          const detailsSection = extractSection('Details');
          if (detailsSection) {
            description = detailsSection.replace(/\n+/g, '\n').trim();
          }

          // Extract organization from 'Organization' section
          let host = '';
          const orgSection = extractSection('Organization');
          if (orgSection) {
            host = orgSection.replace(/\n+/g, ' ').trim();
          }

          // Extract categories from 'Classification' section
          let categories = [];
          const classificationSection = extractSection('Classification');
          if (classificationSection) {
            categories = classificationSection.split(/\n|,/).map(s => s.trim()).filter(Boolean);
          }

          // Image (try to get the main event image)
          let image = '';
          const imgEl = document.querySelector('img');
          if (imgEl && imgEl.src) image = imgEl.src;

          return { title, dateTime, location, locationVenue, locationAddress, locationCity, fullLocation, description, categories, host, image };
        });
        if (!event) {
          await detailPage.close();
          continue;
        }
        
        // Add link and id
        event.link = link;
        event.id = link.split('eventid%3d').pop()?.split('&')[0] || `gazette-${i}`;
        event.source = "Harvard Gazette"; // Add source field
        
        events.push(event);
        
        // Close the detail page
        await detailPage.close();
        
      } catch (err) {
        console.error('❌ Error scraping event detail:', link, err.message);
        if (detailPage) await detailPage.close();
      }
    }

    // Save parsed events
    const outputPath = path.join(__dirname, '../events/parsed-harvard-gazette.json');
    fs.writeFileSync(outputPath, JSON.stringify(events, null, 2));
    console.log('💾 Saved parsed events to:', outputPath);
    return events;
    
  } catch (error) {
    console.error('❌ Error scraping Harvard Gazette:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the scraper if called directly
if (require.main === module) {
  scrapeHarvardGazette()
    .then(events => {
      if (events) {
        console.log(`✅ Successfully scraped ${events.length} Harvard Gazette events`);
      } else {
        console.log('❌ Failed to scrape Harvard Gazette events');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Error running Harvard Gazette scraper:', error);
      process.exit(1);
    });
}

module.exports = { scrapeHarvardGazette }; 