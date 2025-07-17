const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function scrapeHarvardEngage() {
  console.log('🔄 Starting Harvard Engage scraper (Puppeteer)...');
  
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
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📡 Navigating to Harvard Engage...');
    
    // Navigate with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await page.goto('https://engage.gsas.harvard.edu/events', { 
          waitUntil: 'networkidle2',
          timeout: 120000 
        });
        break;
      } catch (error) {
        retries--;
        console.log(`⚠️ Navigation attempt failed, retries left: ${retries}`);
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Function to click "Load More" buttons
    async function clickLoadMoreButtons() {
      const loadMoreSelectors = [
        'button:contains("Load More")',
        'button:contains("Show More")',
        'button:contains("Next")',
        'a:contains("Load More")',
        'a:contains("Show More")',
        '.btn:contains("Load More")',
        '.btn:contains("Show More")',
        '[data-testid="load-more"]',
        '[aria-label*="load more"]',
        '[aria-label*="show more"]'
      ];
      
      let clicked = false;
      
      // Try clicking buttons with specific text
      const allButtons = await page.$$('button, a, .btn');
      for (const button of allButtons) {
        try {
          const text = await button.evaluate(el => el.textContent.toLowerCase());
          if ((text.includes('load more') || text.includes('show more') || text.includes('next'))) {
            const isVisible = await button.evaluate(el => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && 
                     window.getComputedStyle(el).display !== 'none' &&
                     window.getComputedStyle(el).visibility !== 'hidden';
            });
            
            if (isVisible) {
                             await button.click();
               clicked = true;
               console.log('Clicked button with text:', text);
               await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (e) {
          // Ignore errors for individual buttons
        }
      }
      
      return clicked;
    }
    
    // Scroll and load more content
    console.log('📜 Scrolling and loading more content...');
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
             // Scroll to bottom
       await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
       await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try to click load more buttons
      const clicked = await clickLoadMoreButtons();
      if (!clicked) {
        console.log('No more load more buttons found, stopping');
        break;
      }
      
      attempts++;
      console.log('Load more attempt:', attempts);
    }
    
         // Final scroll
     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
     await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get all event card links from the main page
    const eventLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href^="/event/"]'));
      // Only unique event links
      const seen = new Set();
      return anchors
        .map(a => a.getAttribute('href'))
        .filter(href => {
          if (!href) return false;
          if (seen.has(href)) return false;
          seen.add(href);
          return true;
        })
        .map(href => 'https://engage.gsas.harvard.edu' + href);
    });
    console.log(`🔗 Found ${eventLinks.length} event links.`);

    // Limit to 5 events for testing
    const limitedEventLinks = eventLinks.slice(0, 5);
    console.log(`🔢 Limiting to ${limitedEventLinks.length} events for testing`);

    // Visit each event detail page and extract required fields
    const events = [];
    // Scrape each event detail page
    console.log(`🔍 Scraping ${limitedEventLinks.length} event detail pages...`);
    
    for (let i = 0; i < limitedEventLinks.length; i++) {
      const link = limitedEventLinks[i];
      console.log(`📄 Scraping event ${i + 1}/${limitedEventLinks.length}: ${link}`);
      
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
            await detailPage.setDefaultNavigationTimeout(60000); // 1 minute for detail pages
            await detailPage.setDefaultTimeout(60000);
            await detailPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            await detailPage.goto(link, { 
              waitUntil: 'domcontentloaded',
              timeout: 60000 
            });
            break;
          } catch (error) {
            retries--;
            console.log(`⚠️ Detail page navigation failed, retries left: ${retries}`);
            if (detailPage) await detailPage.close();
            if (retries === 0) {
              console.log(`❌ Failed to load event detail page: ${link}`);
              continue;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
        
        if (!detailPage) continue;

        // Extract details from the event detail page
        const event = await detailPage.evaluate(() => {
          // Title
          const title = document.querySelector('h1, h2, .event-title, .MuiTypography-h3')?.innerText?.trim() || '';
          // Date and Time
          let dateTime = '';
          const dateTimeEl = Array.from(document.querySelectorAll('div, section')).find(el => el.innerText && el.innerText.match(/Date and Time/i));
          if (dateTimeEl) {
            const dt = dateTimeEl.innerText.match(/Date and Time[\s\n]*([\s\S]*?)(Location|Description|Categories|Host Organization|RSVP|$)/i);
            if (dt && dt[1]) dateTime = dt[1].replace(/\n+/g, ' ').trim();
          }
          // Location (full address)
          let location = '';
          const locEl = Array.from(document.querySelectorAll('div, section')).find(el => el.innerText && el.innerText.match(/Location/i));
          if (locEl) {
            const loc = locEl.innerText.match(/Location[\s\n]*([\s\S]*?)(Date and Time|Description|Categories|Host Organization|RSVP|$)/i);
            if (loc && loc[1]) location = loc[1].replace(/\n+/g, ' ').trim();
          }
          // Description (try to get the main description block) - clean up and extract registration link
          let description = '';
          let eventLink = '';
          const descEl = Array.from(document.querySelectorAll('div, section, p')).find(el => el.innerText && el.innerText.match(/Description/i));
          if (descEl) {
            const desc = descEl.innerText.match(/Description[\s\n]*([\s\S]*?)(Categories|Host Organization|Location|Date and Time|RSVP|$)/i);
            if (desc && desc[1]) {
              let rawDescription = desc[1].replace(/\n+/g, '\n').trim();
              
              // Remove date information from description
              rawDescription = rawDescription.replace(/Tuesday, July \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT to Tuesday, July \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT/g, '');
              rawDescription = rawDescription.replace(/Monday, July \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT to Friday, July \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT/g, '');
              rawDescription = rawDescription.replace(/Friday, \w+ \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT to Friday, \w+ \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT/g, '');
              rawDescription = rawDescription.replace(/Tuesday, \w+ \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT to Tuesday, \w+ \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT/g, '');
              rawDescription = rawDescription.replace(/Monday, \w+ \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT to Friday, \w+ \d+ 2025 at \d{1,2}:\d{2} [AP]M EDT/g, '');
              
              // Extract registration link - look for multiple patterns
              let urlMatch = rawDescription.match(/(https?:\/\/[^\s]+)/);
              if (urlMatch) {
                eventLink = urlMatch[1];
                // Remove the URL from description
                rawDescription = rawDescription.replace(urlMatch[1], '').trim();
              } else {
                // Try to find URLs in the description text
                const urlMatches = rawDescription.match(/(https?:\/\/[^\s"']+)/g);
                if (urlMatches) {
                  // Look for registration-related URLs
                  const registrationUrl = urlMatches.find(url => 
                    url.includes('radcliffe.harvard.edu') || 
                    url.includes('register') || 
                    url.includes('event') ||
                    url.includes('harvard.edu')
                  );
                  if (registrationUrl) {
                    eventLink = registrationUrl;
                  }
                }
              }
              
              // Debug: Log if we found an event link
              if (eventLink) {
                console.log(`🔗 Found registration link for "${title}": ${eventLink}`);
              }
              
              description = rawDescription;
            }
          }
          // Categories (as array)
          let categories = [];
          const catEl = Array.from(document.querySelectorAll('div, section')).find(el => el.innerText && el.innerText.match(/Categories/i));
          if (catEl) {
            const cats = catEl.innerText.match(/Categories[\s\n]*([\s\S]*?)(Host Organization|Description|Location|Date and Time|RSVP|$)/i);
            if (cats && cats[1]) {
              categories = cats[1].split(/\n|,/).map(s => s.trim()).filter(Boolean);
            }
          }
          // Host Organization - clean up extra information
          let host = '';
          const hostEl = Array.from(document.querySelectorAll('div, section')).find(el => el.innerText && el.innerText.match(/Host Organization/i));
          if (hostEl) {
            const h = hostEl.innerText.match(/Host Organization[\s\n]*([\s\S]*?)(Categories|Description|Location|Date and Time|RSVP|$)/i);
            if (h && h[1]) {
              let rawHost = h[1].replace(/\n+/g, ' ').trim();
              // Remove extra event information from host field
              rawHost = rawHost.replace(/Other events hosted by.*$/i, '').trim();
              host = rawHost;
            }
          }
          // Image (try to get the main event image)
          let image = '';
          const imgEl = document.querySelector('img');
          if (imgEl && imgEl.src) image = imgEl.src;
          return { title, dateTime, location, description, categories, host, image, eventLink };
        });
        // Add link and id
        event.link = link;
        event.id = link.split('/').pop();
        event.source = "Harvard Engage"; // Add source field
        event.eventLink = event.eventLink || ''; // Ensure eventLink field exists
        // After setting eventLink (e.g., eventLink = urlMatch[1]; or eventLink = registrationUrl;), trim trailing periods:
        if (event.eventLink) {
          event.eventLink = event.eventLink.replace(/\.+$/, '');
        }
        events.push(event);
      } catch (err) {
        console.error('❌ Error scraping event detail:', link, err.message);
      }
    }

    // Save parsed events
    const outputPath = path.join(__dirname, '../events/parsed-harvard-engage.json');
    fs.writeFileSync(outputPath, JSON.stringify(events, null, 2));
    console.log('💾 Saved parsed events to:', outputPath);
    return events;
    
  } catch (error) {
    console.error('❌ Error scraping Harvard Engage:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function parseEventsFromHTML(html) {
  const events = [];
  const seenEvents = new Set(); // Track seen events to prevent duplicates
  
  // Specific pattern for Harvard Engage Material-UI cards
  // Look for <a href="/event/..."> containing MuiCard-root
  const eventCardPattern = /<a[^>]*href="\/event\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  
  let match;
  while ((match = eventCardPattern.exec(html)) !== null) {
    const eventId = match[1];
    const cardContent = match[2];
    
    // Only process if it contains a MuiCard-root
    if (cardContent.includes('MuiCard-root')) {
      const event = extractEventDetails(cardContent, eventId);
      if (event && event.title) {
        // Create a strict deduplication key
        const key = `${event.title}|${event.date}|${event.location}`.toLowerCase().replace(/\s+/g, ' ').trim();
        if (!seenEvents.has(key)) {
          seenEvents.add(key);
          events.push(event);
        }
      }
    }
  }
  
  console.log(`🎯 Found ${events.length} unique events after deduplication`);
  
  // Format events to match the expected structure
  return events.map((event, index) => formatEventForPortal(event, index));
}

function extractEventDetails(cardContent, eventId) {
  const event = {
    id: eventId,
    title: '',
    date: '',
    location: '',
    description: '',
    image: '',
    link: `https://engage.gsas.harvard.edu/event/${eventId}`,
    organization: '',
    raw_html: cardContent,
    timestamp: new Date().toISOString(),
    url: 'https://engage.gsas.harvard.edu/events'
  };
  
  // Extract title from h3 tag
  const titleMatch = cardContent.match(/<h3[^>]*>([^<]+)<\/h3>/i);
  if (titleMatch) {
    event.title = titleMatch[1].trim();
  }
  
  // Enhanced date extraction - look for multiple patterns
  const datePatterns = [
    // Pattern 1: Calendar icon followed by date
    /<svg[^>]*viewBox="0 0 24 24"[^>]*>[\s\S]*?<\/svg>([^<]+)/i,
    // Pattern 2: Look for date-like text with time
    /([A-Za-z]+,\s*[A-Za-z]+\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}[AP]M\s+[A-Z]+)/i,
    // Pattern 3: Look for date-like text without time
    /([A-Za-z]+,\s*[A-Za-z]+\s+\d{1,2})/i,
    // Pattern 4: Look for time patterns
    /(\d{1,2}:\d{2}[AP]M)/i
  ];
  
  for (const pattern of datePatterns) {
    const dateMatch = cardContent.match(pattern);
    if (dateMatch) {
      const dateText = dateMatch[1].trim();
      // Only use if it looks like a date/time
      if (dateText && (dateText.includes('AM') || dateText.includes('PM') || 
          dateText.includes('July') || dateText.includes('August') || 
          dateText.includes('September') || dateText.includes('October'))) {
        event.date = dateText;
        break;
      }
    }
  }
  
  // Extract location from the location icon section
  const locationMatch = cardContent.match(/<svg[^>]*viewBox="0 0 24 24"[^>]*>[\s\S]*?<\/svg>([^<]+)/gi);
  if (locationMatch && locationMatch.length > 1) {
    // The second match should be the location
    const locationText = locationMatch[1].replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '').trim();
    if (locationText && !locationText.includes('EDT') && !locationText.includes('EST') && 
        !locationText.includes('AM') && !locationText.includes('PM')) {
      event.location = locationText;
    }
  }
  
  // Extract image from background-image style
  const imageMatch = cardContent.match(/background-image:\s*url\(['"]([^'"]+)['"]\)/i);
  if (imageMatch) {
    event.image = imageMatch[1];
  } else {
    // Try alternative image extraction patterns
    const imgMatch = cardContent.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
    if (imgMatch) {
      event.image = imgMatch[1];
    }
  }
  
  // Extract organization from the bottom section with img tag
  const orgMatch = cardContent.match(/<img[^>]*alt="([^"]+)"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);
  if (orgMatch) {
    event.organization = orgMatch[2].trim();
  }
  
  // If no organization found, try alternative pattern
  if (!event.organization) {
    const altOrgMatch = cardContent.match(/<span[^>]*>([^<]+)<\/span>/gi);
    if (altOrgMatch && altOrgMatch.length > 0) {
      const lastSpan = altOrgMatch[altOrgMatch.length - 1];
      const orgText = lastSpan.replace(/<span[^>]*>([^<]+)<\/span>/i, '$1').trim();
      if (orgText && orgText.length > 3 && !orgText.includes('EDT') && !orgText.includes('EST') &&
          !orgText.includes('AM') && !orgText.includes('PM')) {
        event.organization = orgText;
      }
    }
  }
  
  return event;
}

function formatEventForPortal(event, index) {
  return {
    id: `harvard-engage-${event.id || index}`,
    title: event.title || 'Harvard Engage Event',
    university: 'Harvard University',
    location: event.location || 'Harvard Campus',
    dates: event.date || 'TBD',
    description: event.title || 'Harvard Engage Event', // Use title as description since full description isn't available in card view
    image: event.image || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80',
    type: 'event',
    tags: ['Harvard Engage'],
    link: event.link || 'https://engage.gsas.harvard.edu/events',
    weblink: event.link || 'https://engage.gsas.harvard.edu/events',
    cost: event.cost || '',
    organization: event.organization || 'Harvard Engage',
    source: 'Harvard Engage'
  };
}

// Run if called directly
if (require.main === module) {
  scrapeHarvardEngage()
    .then(events => {
      if (events) {
        console.log(`✅ Harvard Engage scraper completed. Found ${events.length} events.`);
      } else {
        console.log('❌ Harvard Engage scraper failed.');
      }
    })
    .catch(error => {
      console.error('❌ Harvard Engage scraper error:', error);
    });
}

module.exports = { scrapeHarvardEngage }; 