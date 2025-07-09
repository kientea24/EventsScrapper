const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function scrapeHarvardEngage() {
  console.log('🔄 Starting Harvard Engage scraper (HTML with JS rendering)...');
  
  const apiKey = 'Zu89UGXLUpDHq1gPiskfK0fVXHevlIGFOoZ7mCJb1qizVpgmMkgKyfjnh4G3xIjM2fS5Pt3voyJ1JFsniz';
  const scrapingFishUrl = 'https://app.scrapingfish.com/api/scrape';

  const payload = {
    api_key: apiKey,
    url: 'https://engage.gsas.harvard.edu/events',
    render_js: true,
    wait_for: '.event-item, .event-card, .event, [data-testid="event"], .card, .activity',
    timeout: 60000,
    custom_js: `
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
        for (const selector of loadMoreSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              if (element.offsetParent !== null && element.style.display !== 'none') {
                element.click();
                clicked = true;
                console.log('Clicked load more button:', element.textContent);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } catch (e) {
            // Ignore errors for specific selectors
          }
        }
        
        // Also try clicking any button with load/show more text
        const allButtons = document.querySelectorAll('button, a, .btn');
        for (const button of allButtons) {
          const text = button.textContent.toLowerCase();
          if ((text.includes('load more') || text.includes('show more') || text.includes('next')) && 
              button.offsetParent !== null && button.style.display !== 'none') {
            button.click();
            clicked = true;
            console.log('Clicked button:', button.textContent);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        return clicked;
      }
      
      // Scroll to bottom to trigger lazy loading
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Try to click load more buttons multiple times
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        const clicked = await clickLoadMoreButtons();
        if (!clicked) {
          console.log('No more load more buttons found, stopping');
          break;
        }
        attempts++;
        console.log('Load more attempt:', attempts);
        
        // Scroll again after clicking
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Final scroll to make sure everything is loaded
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return the final HTML
      return document.documentElement.outerHTML;
    `,
    country: 'us'
  };

  try {
    console.log('📡 Making HTML scraping request to Harvard Engage...');
    
    const response = await fetch(scrapingFishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Scraping Fish error: ${data.error}`);
    }

    console.log('✅ Received HTML response from Harvard Engage');
    console.log('📊 Response status:', data.status);
    console.log('📄 Response length:', data.content?.length || 0);

    // Save raw HTML response
    const rawOutputPath = path.join(__dirname, '../events/harvard-engage-html-raw.html');
    fs.writeFileSync(rawOutputPath, data.content || '');
    console.log('💾 Saved raw HTML to:', rawOutputPath);

    // Parse events from HTML
    const events = parseEventsFromHTML(data.content || '');
    console.log(`🎉 Found ${events.length} events in HTML`);

    // Save parsed events
    const outputPath = path.join(__dirname, '../events/parsed-harvard-engage.json');
    fs.writeFileSync(outputPath, JSON.stringify(events, null, 2));
    console.log('💾 Saved parsed events to:', outputPath);

    return events;

  } catch (error) {
    console.error('❌ Error scraping Harvard Engage:', error.message);
    return null;
  }
}

function parseEventsFromHTML(html) {
  const events = [];
  
  // Common patterns for event extraction from Harvard Engage
  const eventSelectors = [
    // Look for various event container patterns
    /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    /<li[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    // Look for card-based layouts
    /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    // Look for any div with event-related classes
    /<div[^>]*class="[^"]*(?:event|activity|program)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    // Look for CampusGroups specific patterns
    /<div[^>]*class="[^"]*campus-group[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*group-card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
  ];
  
  // Extract event blocks
  for (const selector of eventSelectors) {
    let match;
    while ((match = selector.exec(html)) !== null) {
      const eventBlock = match[1];
      
      // Extract event details from the block
      const event = extractEventDetails(eventBlock);
      if (event && event.title) {
        events.push(event);
      }
    }
  }
  
  // If no events found with selectors, try a more general approach
  if (events.length === 0) {
    console.log('🔍 No events found with selectors, trying general extraction...');
    
    // Look for any text that might be event titles
    const titlePatterns = [
      /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi,
      /<a[^>]*>([^<]+)<\/a>/gi,
      /<span[^>]*>([^<]+)<\/span>/gi,
    ];
    
    for (const pattern of titlePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const title = match[1].trim();
        if (title.length > 10 && title.length < 200) { // Reasonable title length
          events.push({
            title: title,
            raw_html: eventBlock || html.substring(0, 500),
            timestamp: new Date().toISOString(),
            url: 'https://engage.gsas.harvard.edu/events'
          });
        }
      }
    }
  }
  
  // Remove duplicates based on title
  const uniqueEvents = events.filter((event, index, self) => 
    index === self.findIndex(e => e.title === event.title)
  );
  
  return uniqueEvents;
}

function extractEventDetails(eventBlock) {
  const event = {
    title: '',
    date: '',
    location: '',
    description: '',
    image: '',
    link: '',
    raw_html: eventBlock,
    timestamp: new Date().toISOString(),
    url: 'https://engage.gsas.harvard.edu/events'
  };
  
  // Extract title
  const titlePatterns = [
    /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
    /<a[^>]*>([^<]+)<\/a>/i,
    /<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.title = match[1].trim();
      break;
    }
  }
  
  // Extract date
  const datePatterns = [
    /<time[^>]*>([^<]+)<\/time>/i,
    /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/div>/i,
    /(\w+ \d{1,2},? \d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{4}-\d{2}-\d{2})/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.date = match[1].trim();
      break;
    }
  }
  
  // Extract location
  const locationPatterns = [
    /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/div>/i,
    /<address[^>]*>([^<]+)<\/address>/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.location = match[1].trim();
      break;
    }
  }
  
  // Extract description
  const descPatterns = [
    /<p[^>]*>([^<]+)<\/p>/i,
    /<span[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i,
  ];
  
  for (const pattern of descPatterns) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.description = match[1].trim();
      break;
    }
  }
  
  // Extract image
  const imgMatch = eventBlock.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
  if (imgMatch) {
    event.image = imgMatch[1];
  }
  
  // Extract link
  const linkMatch = eventBlock.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
  if (linkMatch) {
    event.link = linkMatch[1];
  }
  
  return event;
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