const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Scraping Fish API configuration
const API_KEY = 'Zu89UGXLUpDHq1gPiskfK0fVXHevlIGFOoZ7mCJb1qizVpgmMkgKyfjnh4G3xIjM2fS5Pt3voyJ1JFsniz';
const BASE_URL = 'https://api.scrapingfish.com/scrape';

async function scrapeHarvardEngageRobust() {
  console.log('🚀 Starting Harvard Engage Events Scraping (API + HTML)...');
  let allEvents = [];
  let usedApi = false;

  // 1. Try API approach first
  try {
    console.log('🔍 Trying API endpoint for Engage events...');
    const apiEvents = await tryApiEndpoint();
    if (apiEvents && apiEvents.length > 0) {
      console.log(`✅ Got ${apiEvents.length} events from API endpoint!`);
      allEvents = apiEvents;
      usedApi = true;
    } else {
      console.log('⚠️ API endpoint returned no events or is not accessible. Falling back to HTML scraping...');
    }
  } catch (err) {
    console.log('❌ API endpoint failed:', err.message);
    console.log('🔄 Falling back to HTML scraping...');
  }

  // 2. If API failed, use HTML scraping
  if (!usedApi) {
    let page = 1;
    let hasMoreEvents = true;
    let retryCount = 0;
    const maxRetries = 3;
    while (hasMoreEvents && page <= 5) {
      console.log(`📄 Scraping Harvard Engage page ${page} (HTML)...`);
      try {
        const events = await scrapePageWithRetry(page, retryCount);
        if (events.length === 0) {
          console.log('📝 No more events found, stopping...');
          hasMoreEvents = false;
        } else {
          console.log(`✅ Found ${events.length} events on page ${page}`);
          allEvents.push(...events);
          await new Promise(resolve => setTimeout(resolve, 5000));
          page++;
        }
      } catch (error) {
        console.error(`❌ Error scraping page ${page}:`, error.message);
        retryCount++;
        if (retryCount >= maxRetries) {
          console.log('⚠️ Max retries reached, stopping...');
          hasMoreEvents = false;
        } else {
          console.log(`🔄 Retrying in 10 seconds... (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
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

// Try to fetch events from the Engage API endpoint
async function tryApiEndpoint() {
  // This endpoint is common for CampusGroups/Engage platforms
  const apiUrl = 'https://engage.gsas.harvard.edu/api/discovery/event/search';
  const apiPayload = {
    "orderBy": "startDate",
    "status": "Approved",
    "page": 1,
    "pageSize": 100,
    "query": "",
    "types": [],
    "targetAudience": [],
    "campus": [],
    "perks": [],
    "themes": [],
    "categories": [],
    "startDate": null,
    "endDate": null
  };
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: API_KEY,
      url: apiUrl,
      method: 'POST',
      post_data: JSON.stringify(apiPayload),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 20000,
      render_js: false
    })
  });
  if (!response.ok) throw new Error(`API HTTP error: ${response.status}`);
  const data = await response.json();
  // Save raw API response for debugging
  const apiRawPath = path.join(__dirname, '../events/harvard-engage-api-raw.json');
  fs.writeFileSync(apiRawPath, JSON.stringify(data, null, 2));
  if (data.result && data.result.events && Array.isArray(data.result.events)) {
    // Map API events to our structure
    return data.result.events.map(ev => ({
      title: ev.name,
      date: ev.startDate || ev.start,
      location: ev.location || (ev.venue && ev.venue.name) || '',
      description: ev.description || '',
      image: (ev.coverPhoto && ev.coverPhoto.url) || '',
      link: ev.url || '',
      organization: (ev.organization && ev.organization.name) || '',
      tags: ev.tags || [],
      cost: ev.cost || '',
      source: 'Harvard Engage (API)'
    }));
  }
  return [];
}

async function scrapePageWithRetry(page, retryCount) {
  const strategies = [
    // Strategy 1: Full page with custom JS
    {
      name: 'Full page with custom JS',
      config: {
        api_key: API_KEY,
        url: 'https://engage.gsas.harvard.edu/events',
        render_js: true,
        wait_for: '.event-item, .event-card, .event, [data-testid="event"], .card, article',
        timeout: 45000,
        custom_js: `
          // Scroll to bottom to trigger lazy loading
          window.scrollTo(0, document.body.scrollHeight);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Look for and click "Load More" buttons
          const loadMoreButtons = document.querySelectorAll('button, a, .btn, [role="button"]');
          for (const button of loadMoreButtons) {
            const text = button.textContent.toLowerCase();
            if (text.includes('load more') || text.includes('show more') || text.includes('next') || text.includes('more')) {
              button.click();
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          // Return the updated HTML
          return document.documentElement.outerHTML;
        `
      }
    },
    // Strategy 2: Simple page load without custom JS
    {
      name: 'Simple page load',
      config: {
        api_key: API_KEY,
        url: 'https://engage.gsas.harvard.edu/events',
        render_js: true,
        wait_for: 'body',
        timeout: 30000
      }
    },
    // Strategy 3: No JS rendering (static HTML)
    {
      name: 'Static HTML',
      config: {
        api_key: API_KEY,
        url: 'https://engage.gsas.harvard.edu/events',
        render_js: false,
        timeout: 20000
      }
    }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    console.log(`  🔄 Trying strategy ${i + 1}: ${strategy.name}`);
    
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategy.config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        throw new Error('No result from API');
      }

      // Parse the HTML content
      const events = parseEngageEventsFromHTML(data.result);
      
      if (events.length > 0) {
        console.log(`  ✅ Strategy ${i + 1} successful: found ${events.length} events`);
        return events;
      } else {
        console.log(`  ⚠️ Strategy ${i + 1} returned no events`);
      }
      
    } catch (error) {
      console.log(`  ❌ Strategy ${i + 1} failed: ${error.message}`);
      
      // If this is the last strategy, throw the error
      if (i === strategies.length - 1) {
        throw error;
      }
      
      // Wait before trying next strategy
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return [];
}

function parseEngageEventsFromHTML(html) {
  const events = [];
  
  // Save a sample of the HTML for debugging
  const sampleHtml = html.substring(0, 2000);
  const debugPath = path.join(__dirname, '../events/harvard-engage-sample.html');
  fs.writeFileSync(debugPath, sampleHtml);
  
  // Common patterns for event extraction
  const eventSelectors = [
    // Look for various event container patterns
    /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    /<li[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    // Look for card-based layouts
    /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    // Look for any div with event-related classes
    /<div[^>]*class="[^"]*(?:event|activity|program|item)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    // Look for list items
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
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
      /<div[^>]*>([^<]+)<\/div>/gi,
    ];
    
    for (const pattern of titlePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const title = match[1].trim();
        if (title.length > 10 && title.length < 200 && !title.includes('script') && !title.includes('style')) {
          events.push({
            title: title,
            raw_html: html.substring(0, 500),
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
  scrapeHarvardEngageRobust()
    .then(() => {
      console.log('✅ Harvard Engage Events scraping completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Harvard Engage Events scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeHarvardEngageRobust }; 