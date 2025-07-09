const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function scrapeHarvardEngage() {
  console.log('🔄 Starting Harvard Engage scraper (Puppeteer)...');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36');
    
    console.log('📡 Navigating to Harvard Engage...');
    await page.goto('https://engage.gsas.harvard.edu/events', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    console.log('⏳ Waiting for page to load...');
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
    
    console.log('📄 Extracting HTML content...');
    const html = await page.content();
    
    // Save raw HTML
    const rawOutputPath = path.join(__dirname, '../events/harvard-engage-html-raw.html');
    fs.writeFileSync(rawOutputPath, html);
    console.log('💾 Saved raw HTML to:', rawOutputPath);
    
    // Parse events from HTML
    const events = parseEventsFromHTML(html);
    console.log(`🎉 Found ${events.length} events in HTML`);
    
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