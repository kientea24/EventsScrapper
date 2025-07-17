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
    
    // Check for iframes (Trumba calendar is likely embedded)
    console.log('🔍 Looking for embedded calendar iframe...');
    const iframes = await page.$$('iframe');
    console.log(`Found ${iframes.length} iframes`);
    
    let eventLinks = [];
    
    // Try to extract links from iframes first
    for (let i = 0; i < iframes.length; i++) {
      try {
        console.log(`Checking iframe ${i + 1}/${iframes.length}`);
        const frame = iframes[i];
        const frameContent = await frame.contentFrame();
        
        if (frameContent) {
          // Wait for iframe to load
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try to find event links in the iframe
          const frameLinks = await frameContent.evaluate(() => {
            const selectors = [
              'a[href*="trumbaEmbed=view%3devent"]',
              'a[href*="eventid"]',
              'a[href*="view%3devent"]',
              '.event a',
              '.event-card a',
              'a[href*="event"]'
            ];
            
            let anchors = [];
            for (const selector of selectors) {
              const found = Array.from(document.querySelectorAll(selector));
              if (found.length > 0) {
                console.log(`Found ${found.length} links with selector: ${selector}`);
                anchors = found;
                break;
              }
            }
            
            return anchors.map(a => a.href).filter(href => href && href.includes('event'));
          });
          
          if (frameLinks.length > 0) {
            console.log(`Found ${frameLinks.length} event links in iframe ${i + 1}`);
            eventLinks = frameLinks;
            break;
          }
        }
      } catch (err) {
        console.log(`Error checking iframe ${i + 1}: ${err.message}`);
      }
    }
    
    // If no links found in iframes, try the main page
    if (eventLinks.length === 0) {
      console.log('No event links found in iframes, trying main page...');
      eventLinks = await page.evaluate(() => {
        // Try multiple selectors to find event links
        const selectors = [
          'a[href*="trumbaEmbed=view%3devent"]',
          'a[href*="event"]',
          'a[href*="gazette"]',
          'a[href*="trumba"]',
          '.event a',
          '.event-card a',
          'a[href*="view%3devent"]'
        ];
        
        let anchors = [];
        for (const selector of selectors) {
          const found = Array.from(document.querySelectorAll(selector));
          if (found.length > 0) {
            console.log(`Found ${found.length} links with selector: ${selector}`);
            anchors = found;
            break;
          }
        }
        
        // If no links found with specific selectors, try to get all links and filter
        if (anchors.length === 0) {
          anchors = Array.from(document.querySelectorAll('a[href]'));
          console.log(`Total links found: ${anchors.length}`);
          // Log first few links for debugging
          anchors.slice(0, 5).forEach((a, i) => {
            console.log(`Link ${i}: ${a.href} - ${a.textContent?.trim()}`);
          });
        }
        
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
    }
    
    console.log(`🔗 Found ${eventLinks.length} event links.`);
    
    // Debug: log the first few links
    if (eventLinks.length > 0) {
      console.log('First few links found:');
      eventLinks.slice(0, 3).forEach((link, i) => {
        console.log(`  ${i + 1}: ${link}`);
      });
    }
    
    // Get more events to ensure we have current ones
    // Remove or comment out any .slice(0, 10), .slice(0, 30), or similar event limiting on eventLinks or limitedEventLinks
    const limitedEventLinks = eventLinks.slice(0, 5);
    console.log(`🔢 Limiting to ${limitedEventLinks.length} events for testing`);

    // Visit each event detail page and extract required fields
    const events = [];
    // Scrape each event detail page
    console.log(`�� Scraping ${limitedEventLinks.length} event detail pages...`);
    
    for (let i = 0; i < limitedEventLinks.length; i++) {
      const link = limitedEventLinks[i];
      console.log(`📄 Scraping event ${i + 1}/${limitedEventLinks.length}: ${link}`);
      
      try {
        // Add delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
        // Convert relative URLs to absolute URLs
        let fullUrl = link;
        if (link.startsWith('/')) {
          fullUrl = `https://news.harvard.edu${link}`;
        } else if (!link.startsWith('http')) {
          fullUrl = `https://news.harvard.edu/${link}`;
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
            
            await detailPage.goto(fullUrl, {
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
        let event = await detailPage.evaluate(async (isFirst) => {
          // Debug: log the page content structure
          console.log('Page title:', document.title);
          console.log('Page URL:', window.location.href);
          
          // Check if we're in an iframe
          const iframes = document.querySelectorAll('iframe');
          console.log(`Found ${iframes.length} iframes on event detail page`);
          
          // If there are iframes, try to get content from the first iframe
          if (iframes.length > 0) {
            console.log('Event detail page has iframes, content likely embedded');
            // Return a flag to indicate we need to handle iframe content
            return { hasIframes: true, iframeCount: iframes.length };
          }
          
          // Title - try multiple selectors
          const titleSelectors = [
            'h1', 'h2', '.event-title', '.MuiTypography-h3', '.trumba-event-title',
            '.event-detail-title', '.title', '[data-testid="event-title"]',
            '.event-name', '.event-header h1', '.event-header h2', '.event-header .title',
            '.trumba-event-name', '.event-detail h1', '.event-detail h2',
            '.event-info h1', '.event-info h2', '.event-info .title'
          ];
          let title = '';
          for (const selector of titleSelectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim()) {
              title = el.innerText.trim();
              console.log('Found title with selector:', selector, 'Value:', title);
              break;
            }
          }
          
          // If no title found with selectors, try to find any text that looks like an event title
          if (!title || title.toLowerCase() === 'harvard events' || title.toLowerCase() === 'sections') {
            console.log('No valid title found with selectors, trying alternative methods...');
            
            // Look for any text that might be an event title
            const allText = document.body.innerText;
            const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            console.log('First 10 lines of page text:', lines.slice(0, 10));
            
            // Look for lines that might be event titles (not too long, not generic)
            for (const line of lines) {
              if (line.length > 5 && line.length < 100 && 
                  !line.toLowerCase().includes('harvard events') &&
                  !line.toLowerCase().includes('sections') &&
                  !line.toLowerCase().includes('where') &&
                  !line.toLowerCase().includes('when') &&
                  !line.toLowerCase().includes('details') &&
                  !line.toLowerCase().includes('organization') &&
                  !line.toLowerCase().includes('classification') &&
                  !line.toLowerCase().includes('cost') &&
                  !line.toLowerCase().includes('contact') &&
                  !line.toLowerCase().includes('more info')) {
                title = line;
                console.log('Found potential title from text analysis:', title);
                break;
              }
            }
          }
          
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
            console.log('Page text content (first 500 chars):', allText.substring(0, 500));
            
            for (const pattern of patterns) {
              const match = allText.match(pattern);
              if (match && match[1]) {
                console.log(`Found ${sectionName} section:`, match[1].substring(0, 100));
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

          // Extract description from 'Details' section and cut off at LINK
          let description = '';
          let eventLink = '';
          const detailsSection = extractSection('Details');
          if (detailsSection) {
            // Split at "LINK" to separate description from link
            const linkIndex = detailsSection.indexOf('LINK');
            if (linkIndex !== -1) {
              description = detailsSection.substring(0, linkIndex).replace(/\n+/g, '\n').trim();
              // Extract the link after "LINK"
              const afterLink = detailsSection.substring(linkIndex + 4).trim();
              // Find the actual URL (look for http or www)
              const urlMatch = afterLink.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
              if (urlMatch) {
                eventLink = urlMatch[1];
                // If it starts with www, add https://
                if (eventLink.startsWith('www.')) {
                  eventLink = 'https://' + eventLink;
                }
              }
            } else {
              description = detailsSection.replace(/\n+/g, '\n').trim();
            }
          }
          
          // Also try to extract link from "More info" section
          if (!eventLink) {
            const moreInfoSection = extractSection('More info');
            if (moreInfoSection) {
              const urlMatch = moreInfoSection.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
              if (urlMatch) {
                eventLink = urlMatch[1];
                if (eventLink.startsWith('www.')) {
                  eventLink = 'https://' + eventLink;
                }
              }
            }
          }
          
          // Try to extract link from the entire iframe text if still not found
          if (!eventLink) {
            const urlMatch = iframeText.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
            if (urlMatch) {
              eventLink = urlMatch[1];
              if (eventLink.startsWith('www.')) {
                eventLink = 'https://' + eventLink;
              }
            }
          }
          
          // Debug: Log if we found an event link
          if (eventLink) {
            console.log(`🔗 Found event link for "${title}": ${eventLink}`);
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

          console.log('Extracted event data:', {
            title: title.substring(0, 50),
            locationVenue: locationVenue.substring(0, 30),
            dateTime: dateTime.substring(0, 30),
            hasDescription: !!description,
            hasHost: !!host
          });

          return { title, dateTime, location, locationVenue, locationAddress, locationCity, fullLocation, description, categories, host, image, eventLink };
        }, i === 0);
        
        // If the page has iframes, try to extract content from the iframe
        if (event && event.hasIframes) {
          console.log(`Event detail page has ${event.iframeCount} iframes, extracting from iframe #1...`);
          
          const iframes = await detailPage.$$('iframe');
          if (iframes.length > 1) {
            const frame = iframes[1]; // Use iframe #1 (second iframe)
            const frameContent = await frame.contentFrame();
            if (frameContent) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              const allText = await frameContent.evaluate(() => document.body.innerText);
              const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
              // Parse fields from lines
              let title = '';
              let dateTime = '';
              let location = '';
              let locationVenue = '';
              let locationAddress = '';
              let locationCity = '';
              let fullLocation = '';
              let description = '';
              let eventLink = '';
              let categories = [];
              let host = '';
              let image = '';
              // Find title (first non-empty, non-generic line after 'opens in new window')
              for (let j = 1; j < lines.length; j++) {
                if (lines[j] && !lines[j].toLowerCase().includes('opens in new window')) {
                  title = lines[j];
                  break;
                }
              }
              // Find date/time, location, and other fields
              for (let j = 2; j < lines.length; j++) {
                if (lines[j].startsWith('WHEN')) {
                  dateTime = lines[j].replace('WHEN', '').replace(/\t+/g, ' ').trim();
                }
                if (lines[j].startsWith('WHERE')) {
                  locationVenue = lines[j].replace('WHERE', '').replace(/\t+/g, ' ').trim();
                  // Next lines may be address/city
                  if (lines[j+1]) locationAddress = lines[j+1];
                  if (lines[j+2]) locationCity = lines[j+2];
                  fullLocation = [locationVenue, locationAddress, locationCity].filter(Boolean).join(', ');
                }
                if (lines[j].startsWith('GAZETTE CLASSIFICATION')) {
                  categories = lines[j].replace('GAZETTE CLASSIFICATION', '').replace(/\t+/g, ' ').split(',').map(s => s.trim()).filter(Boolean);
                }
                if (lines[j].startsWith('ORGANIZATION/SPONSOR')) {
                  host = lines[j].replace('ORGANIZATION/SPONSOR', '').replace(/\t+/g, ' ').trim();
                }
                if (lines[j].startsWith('DETAILS')) {
                  // Description is everything after DETAILS until LINK
                  const detailsText = lines.slice(j+1).join(' ');
                  const linkIndex = detailsText.indexOf('LINK');
                  if (linkIndex !== -1) {
                    description = detailsText.substring(0, linkIndex).trim();
                    // Extract the link after "LINK"
                    const afterLink = detailsText.substring(linkIndex + 4).trim();
                    // Find the actual URL (look for http or www)
                    const urlMatch = afterLink.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/);
                    if (urlMatch) {
                      eventLink = urlMatch[1];
                      // If it starts with www, add https://
                      if (eventLink.startsWith('www.')) {
                        eventLink = 'https://' + eventLink;
                      }
                    }
                  } else {
                    description = detailsText;
                  }
                  break;
                }
              }
              event = {
                title,
                dateTime,
                location: fullLocation,
                locationVenue,
                locationAddress,
                locationCity,
                fullLocation,
                description,
                categories,
                host,
                image,
                eventLink,
                link,
                id: link,
                source: 'Harvard Gazette'
              };
            }
          }
          if (!event || !event.title) {
            await detailPage.close();
            continue;
          }
        }
        
        if (!event || !event.title) {
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
        // Only close detailPage if it exists
        if (typeof detailPage !== 'undefined' && detailPage) {
          try { await detailPage.close(); } catch (e) {}
        }
        // Skip to next event on error
        continue;
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