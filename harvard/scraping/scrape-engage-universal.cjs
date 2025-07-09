const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Scraping Fish API configuration
const API_KEY = 'Zu89UGXLUpDHq1gPiskfK0fVXHevlIGFOoZ7mCJb1qizVpgmMkgKyfjnh4G3xIjM2fS5Pt3voyJ1JFsniz';
const BASE_URL = 'https://api.scrapingfish.com/scrape';

// University configurations for different Engage implementations
const UNIVERSITY_CONFIGS = {
  'harvard': {
    name: 'Harvard University',
    domain: 'engage.gsas.harvard.edu',
    apiEndpoint: 'https://engage.gsas.harvard.edu/api/discovery/event/search',
    eventsUrl: 'https://engage.gsas.harvard.edu/events',
    source: 'Harvard Engage',
    tags: ['Harvard Engage', 'Harvard'],
    defaultImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80',
    customSelectors: {
      eventContainer: ['.event-item', '.event-card', '.event', '[data-testid="event"]'],
      title: ['h1', 'h2', 'h3', '.event-title', '.title'],
      date: ['.date', '.event-date', 'time'],
      location: ['.location', '.event-location', 'address'],
      description: ['.description', '.event-description', 'p'],
      image: ['img[src*="event"]', '.event-image img'],
      link: ['a[href*="event"]', '.event-link a']
    }
  },
  'mit': {
    name: 'MIT',
    domain: 'engage.mit.edu',
    apiEndpoint: 'https://engage.mit.edu/api/discovery/event/search',
    eventsUrl: 'https://engage.mit.edu/events',
    source: 'MIT Engage',
    tags: ['MIT Engage', 'MIT'],
    defaultImage: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80',
    customSelectors: {
      eventContainer: ['.event-item', '.event-card', '.event', '[data-testid="event"]'],
      title: ['h1', 'h2', 'h3', '.event-title', '.title'],
      date: ['.date', '.event-date', 'time'],
      location: ['.location', '.event-location', 'address'],
      description: ['.description', '.event-description', 'p'],
      image: ['img[src*="event"]', '.event-image img'],
      link: ['a[href*="event"]', '.event-link a']
    }
  },
  'stanford': {
    name: 'Stanford University',
    domain: 'engage.stanford.edu',
    apiEndpoint: 'https://engage.stanford.edu/api/discovery/event/search',
    eventsUrl: 'https://engage.stanford.edu/events',
    source: 'Stanford Engage',
    tags: ['Stanford Engage', 'Stanford'],
    defaultImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80',
    customSelectors: {
      eventContainer: ['.event-item', '.event-card', '.event', '[data-testid="event"]'],
      title: ['h1', 'h2', 'h3', '.event-title', '.title'],
      date: ['.date', '.event-date', 'time'],
      location: ['.location', '.event-location', 'address'],
      description: ['.description', '.event-description', 'p'],
      image: ['img[src*="event"]', '.event-image img'],
      link: ['a[href*="event"]', '.event-link a']
    }
  },
  'yale': {
    name: 'Yale University',
    domain: 'engage.yale.edu',
    apiEndpoint: 'https://engage.yale.edu/api/discovery/event/search',
    eventsUrl: 'https://engage.yale.edu/events',
    source: 'Yale Engage',
    tags: ['Yale Engage', 'Yale'],
    defaultImage: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80',
    customSelectors: {
      eventContainer: ['.event-item', '.event-card', '.event', '[data-testid="event"]'],
      title: ['h1', 'h2', 'h3', '.event-title', '.title'],
      date: ['.date', '.event-date', 'time'],
      location: ['.location', '.event-location', 'address'],
      description: ['.description', '.event-description', 'p'],
      image: ['img[src*="event"]', '.event-image img'],
      link: ['a[href*="event"]', '.event-link a']
    }
  },
  'princeton': {
    name: 'Princeton University',
    domain: 'engage.princeton.edu',
    apiEndpoint: 'https://engage.princeton.edu/api/discovery/event/search',
    eventsUrl: 'https://engage.princeton.edu/events',
    source: 'Princeton Engage',
    tags: ['Princeton Engage', 'Princeton'],
    defaultImage: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&q=80',
    customSelectors: {
      eventContainer: ['.event-item', '.event-card', '.event', '[data-testid="event"]'],
      title: ['h1', 'h2', 'h3', '.event-title', '.title'],
      date: ['.date', '.event-date', 'time'],
      location: ['.location', '.event-location', 'address'],
      description: ['.description', '.event-description', 'p'],
      image: ['img[src*="event"]', '.event-image img'],
      link: ['a[href*="event"]', '.event-link a']
    }
  }
};

async function scrapeEngageUniversal(universityKey = 'harvard') {
  const config = UNIVERSITY_CONFIGS[universityKey];
  if (!config) {
    throw new Error(`Unknown university: ${universityKey}. Available: ${Object.keys(UNIVERSITY_CONFIGS).join(', ')}`);
  }

  console.log(`🚀 Starting ${config.name} Engage Events Scraping...`);
  let allEvents = [];
  let usedApi = false;

  // 1. Try API approach first
  try {
    console.log(`🔍 Trying API endpoint for ${config.name} Engage events...`);
    const apiEvents = await tryApiEndpoint(config);
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
      console.log(`📄 Scraping ${config.name} Engage page ${page} (HTML)...`);
      try {
        const events = await scrapePageWithRetry(page, retryCount, config);
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

  console.log(`🎉 ${config.name} Engage scraping completed! Total events found: ${allEvents.length}`);
  
  // Save the raw scraped data
  const rawDataPath = path.join(__dirname, `../events/${universityKey}-engage-raw.json`);
  fs.writeFileSync(rawDataPath, JSON.stringify(allEvents, null, 2));
  console.log(`💾 Raw data saved to: ${rawDataPath}`);
  
  // Parse and save structured data
  const parsedEvents = parseAndStructureEngageEvents(allEvents, config);
  const parsedDataPath = path.join(__dirname, `../events/parsed-${universityKey}-engage.json`);
  fs.writeFileSync(parsedDataPath, JSON.stringify(parsedEvents, null, 2));
  console.log(`💾 Parsed data saved to: ${parsedDataPath}`);
  
  return parsedEvents;
}

// Try to fetch events from the Engage API endpoint
async function tryApiEndpoint(config) {
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
      url: config.apiEndpoint,
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
  const apiRawPath = path.join(__dirname, `../events/${config.domain.replace(/\./g, '-')}-api-raw.json`);
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
      source: config.source
    }));
  }
  return [];
}

async function scrapePageWithRetry(page, retryCount, config) {
  const strategies = [
    // Strategy 1: Full page with custom JS
    {
      name: 'Full page with custom JS',
      config: {
        api_key: API_KEY,
        url: config.eventsUrl,
        render_js: true,
        wait_for: config.customSelectors.eventContainer.join(', ') || '.event-item, .event-card, .event, [data-testid="event"], .card, article',
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
        url: config.eventsUrl,
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
        url: config.eventsUrl,
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
      const events = parseEngageEventsFromHTML(data.result, config);
      
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

function parseEngageEventsFromHTML(html, config) {
  const events = [];
  
  // Save a sample of the HTML for debugging
  const sampleHtml = html.substring(0, 2000);
  const debugPath = path.join(__dirname, `../events/${config.domain.replace(/\./g, '-')}-sample.html`);
  fs.writeFileSync(debugPath, sampleHtml);
  
  // Use university-specific selectors if available, otherwise fall back to generic ones
  const eventSelectors = [
    // University-specific selectors
    ...config.customSelectors.eventContainer.map(selector => 
      new RegExp(`<div[^>]*class="[^"]*${selector.replace(/\./g, '')}[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`, 'gi')
    ),
    // Generic Engage patterns
    /<div[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    /<li[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    /<div[^>]*class="[^"]*card[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*(?:event|activity|program|item)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
  ];
  
  // Extract event blocks
  for (const selector of eventSelectors) {
    let match;
    while ((match = selector.exec(html)) !== null) {
      const eventBlock = match[1];
      
      // Extract event details from the block
      const event = extractEventDetails(eventBlock, config);
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
            url: config.eventsUrl
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

function extractEventDetails(eventBlock, config) {
  const event = {
    title: '',
    date: '',
    location: '',
    description: '',
    image: '',
    link: '',
    raw_html: eventBlock,
    timestamp: new Date().toISOString(),
    url: config.eventsUrl
  };
  
  // Extract title using university-specific selectors
  const titleSelectors = [
    ...config.customSelectors.title.map(selector => new RegExp(`<${selector}[^>]*>([^<]+)<\/${selector}>`, 'i')),
    /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i,
    /<a[^>]*>([^<]+)<\/a>/i,
    /<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i,
  ];
  
  for (const pattern of titleSelectors) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.title = match[1].trim();
      break;
    }
  }
  
  // Extract date using university-specific selectors
  const dateSelectors = [
    ...config.customSelectors.date.map(selector => new RegExp(`<${selector}[^>]*>([^<]+)<\/${selector}>`, 'i')),
    /<time[^>]*>([^<]+)<\/time>/i,
    /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/div>/i,
    /(\w+ \d{1,2},? \d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/i,
  ];
  
  for (const pattern of dateSelectors) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.date = match[1].trim();
      break;
    }
  }
  
  // Extract location using university-specific selectors
  const locationSelectors = [
    ...config.customSelectors.location.map(selector => new RegExp(`<${selector}[^>]*>([^<]+)<\/${selector}>`, 'i')),
    /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/div>/i,
    /<address[^>]*>([^<]+)<\/address>/i,
  ];
  
  for (const pattern of locationSelectors) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.location = match[1].trim();
      break;
    }
  }
  
  // Extract description using university-specific selectors
  const descSelectors = [
    ...config.customSelectors.description.map(selector => new RegExp(`<${selector}[^>]*>([^<]+)<\/${selector}>`, 'i')),
    /<p[^>]*>([^<]+)<\/p>/i,
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i,
    /<span[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/span>/i,
  ];
  
  for (const pattern of descSelectors) {
    const match = eventBlock.match(pattern);
    if (match && match[1].trim().length > 0) {
      event.description = match[1].trim();
      break;
    }
  }
  
  // Extract image using university-specific selectors
  const imgSelectors = [
    ...config.customSelectors.image.map(selector => new RegExp(`<img[^>]*src="([^"]+)"[^>]*>`, 'i')),
    /<img[^>]*src="([^"]+)"[^>]*>/i,
  ];
  
  for (const pattern of imgSelectors) {
    const match = eventBlock.match(pattern);
    if (match) {
      event.image = match[1];
      break;
    }
  }
  
  // Extract link using university-specific selectors
  const linkSelectors = [
    ...config.customSelectors.link.map(selector => new RegExp(`<a[^>]*href="([^"]+)"[^>]*>`, 'i')),
    /<a[^>]*href="([^"]+)"[^>]*>/i,
  ];
  
  for (const pattern of linkSelectors) {
    const match = eventBlock.match(pattern);
    if (match) {
      event.link = match[1];
      break;
    }
  }
  
  return event;
}

function parseAndStructureEngageEvents(rawEvents, config) {
  // Structure the events in a format similar to Harvard Gazette events
  return rawEvents.map((event, index) => ({
    id: `${config.domain.replace(/\./g, '-')}-${index}`,
    title: event.title || `${config.name} Engage Event`,
    university: config.name,
    location: event.location || `${config.name} Campus`,
    dates: event.date || 'TBD',
    description: event.description || `${config.name} Engage Event`,
    image: event.image || config.defaultImage,
    type: 'event',
    tags: config.tags,
    link: event.link || config.eventsUrl,
    weblink: event.weblink || event.link || config.eventsUrl,
    cost: event.cost,
    organization: event.organization || config.source,
    source: config.source
  }));
}

// Function to scrape all universities
async function scrapeAllUniversities() {
  const results = {};
  
  for (const [universityKey, config] of Object.entries(UNIVERSITY_CONFIGS)) {
    console.log(`\n🎓 Starting scraping for ${config.name}...`);
    try {
      const events = await scrapeEngageUniversal(universityKey);
      results[universityKey] = {
        success: true,
        events: events,
        count: events.length
      };
      console.log(`✅ ${config.name}: ${events.length} events scraped successfully`);
    } catch (error) {
      console.error(`❌ ${config.name}: Failed to scrape - ${error.message}`);
      results[universityKey] = {
        success: false,
        error: error.message,
        events: [],
        count: 0
      };
    }
    
    // Wait between universities to be respectful
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  // Save combined results
  const combinedPath = path.join(__dirname, '../events/all-universities-engage.json');
  fs.writeFileSync(combinedPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Combined results saved to: ${combinedPath}`);
  
  return results;
}

// Run the scraper
if (require.main === module) {
  const universityKey = process.argv[2] || 'harvard';
  const scrapeAll = process.argv[3] === '--all';
  
  if (scrapeAll) {
    scrapeAllUniversities()
      .then(() => {
        console.log('✅ All universities scraping completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ All universities scraping failed:', error);
        process.exit(1);
      });
  } else {
    scrapeEngageUniversal(universityKey)
      .then(() => {
        console.log(`✅ ${universityKey} Engage Events scraping completed successfully!`);
        process.exit(0);
      })
      .catch((error) => {
        console.error(`❌ ${universityKey} Engage Events scraping failed:`, error);
        process.exit(1);
      });
  }
}

module.exports = { 
  scrapeEngageUniversal, 
  scrapeAllUniversities, 
  UNIVERSITY_CONFIGS 
}; 