const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Scraping Fish API configuration
const API_KEY = 'Zu89UGXLUpDHq1gPiskfK0fVXHevlIGFOoZ7mCJb1qizVpgmMkgKyfjnh4G3xIjM2fS5Pt3voyJ1JFsniz';
const BASE_URL = 'https://api.scrapingfish.com/scrape';

async function scrapeHarvardEngage() {
  console.log('🚀 Starting Harvard Engage Events Scraping...');
  
  const allEvents = [];
  let page = 1;
  let hasMoreEvents = true;
  
  while (hasMoreEvents && page <= 10) { // Limit to 10 pages to avoid infinite loops
    console.log(`📄 Scraping Harvard Engage page ${page}...`);
    
    try {
      // Scrape the current page
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: API_KEY,
          url: 'https://engage.gsas.harvard.edu/events',
          render_js: true,
          wait_for: '.event-item, .event-card, .event, [data-testid="event"]', // Wait for various event selectors
          timeout: 30000,
          // Add custom JavaScript to handle pagination
          custom_js: `
            // Scroll to bottom to trigger lazy loading
            window.scrollTo(0, document.body.scrollHeight);
            
            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Look for and click "Load More" buttons
            const loadMoreButtons = document.querySelectorAll('button, a, .btn');
            for (const button of loadMoreButtons) {
              const text = button.textContent.toLowerCase();
              if (text.includes('load more') || text.includes('show more') || text.includes('next')) {
                button.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            // Return the updated HTML
            return document.documentElement.outerHTML;
          `
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        console.log('❌ No result from API');
        break;
      }

      // Parse the HTML content
      const events = parseEngageEventsFromHTML(data.result);
      
      if (events.length === 0) {
        console.log('📝 No more events found, stopping...');
        hasMoreEvents = false;
      } else {
        console.log(`✅ Found ${events.length} events on page ${page}`);
        allEvents.push(...events);
        
        // Check if there's more content to load
        const hasMoreContent = await checkForMoreContent(data.result);
        if (!hasMoreContent) {
          console.log('📝 No more content to load, stopping...');
          hasMoreEvents = false;
        } else {
          // Wait a bit before next request
          await new Promise(resolve => setTimeout(resolve, 3000));
          page++;
        }
      }
      
    } catch (error) {
      console.error(`❌ Error scraping page ${page}:`, error.message);
      hasMoreEvents = false;
    }
  }

  console.log(`🎉 Harvard Engage scraping completed! Total events found: ${allEvents.length}`);
  
  // Save the raw scraped data
  const rawDataPath = path.join(__dirname, '../events/harvard-engage-raw.json');
  fs.writeFileSync(rawDataPath, JSON.stringify(allEvents, null, 2));
  console.log(`💾 Raw data saved to: ${rawDataPath}`);
  
  // Parse and save structured data
  const parsedEvents = parseAndStructureEngageEvents(allEvents);
  const parsedDataPath = path.join(__dirname, '../events/parsed-harvard-engage.json');
  fs.writeFileSync(parsedDataPath, JSON.stringify(parsedEvents, null, 2));
  console.log(`💾 Parsed data saved to: ${parsedDataPath}`);
  
  return parsedEvents;
}

function parseEngageEventsFromHTML(html) {
  const events = [];
  
  // Common patterns for event extraction
  const eventSelectors = [
    // Look for various event container patterns
    /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    /<li[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    // Look for card-based layouts
    /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    // Look for any div with event-related classes
    /<div[^>]*class="[^"]*(?:event|activity|program)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
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
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i,
    /<span[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/span>/i,
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

async function checkForMoreContent(html) {
  // Check if there's more content to load
  const moreContentPatterns = [
    /load\s*more/gi,
    /show\s*more/gi,
    /load\s*additional/gi,
    /pagination/gi,
    /next\s*page/gi,
    /more\s*events/gi,
    /view\s*all/gi
  ];
  
  return moreContentPatterns.some(pattern => pattern.test(html));
}

function parseAndStructureEngageEvents(rawEvents) {
  // Structure the events in a format similar to Harvard Gazette events
  return rawEvents.map((event, index) => ({
    id: `harvard-engage-${index}`,
    title: event.title || 'Harvard Engage Event',
    university: 'Harvard University',
    location: event.location || 'Harvard Campus',
    dates: event.date || 'TBD',
    description: event.description || 'Harvard Engage Event',
    image: event.image || 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80',
    type: 'event',
    tags: ['Harvard Engage', 'Harvard'],
    link: event.link || 'https://engage.gsas.harvard.edu/events',
    weblink: event.weblink || event.link || 'https://engage.gsas.harvard.edu/events',
    cost: event.cost,
    organization: event.organization || 'Harvard Engage',
    source: 'Harvard Engage'
  }));
}

// Run the scraper
if (require.main === module) {
  scrapeHarvardEngage()
    .then(() => {
      console.log('✅ Harvard Engage Events scraping completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Harvard Engage Events scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeHarvardEngage }; 