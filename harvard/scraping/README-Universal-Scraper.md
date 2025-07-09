# Universal Engage Scraper

A versatile scraper for extracting events from universities using the Engage platform. This scraper can handle multiple universities and is easily configurable for new institutions.

## Features

- **Multi-University Support**: Scrape events from multiple universities using the same codebase
- **Configurable**: Easy to add new universities without modifying core scraping logic
- **Robust**: Multiple scraping strategies with fallback mechanisms
- **API + HTML**: Tries API endpoints first, falls back to HTML scraping
- **Custom Selectors**: University-specific CSS selectors for better extraction
- **Rate Limiting**: Built-in delays to be respectful to servers

## Supported Universities

Currently configured for:
- Harvard University (`harvard`)
- MIT (`mit`)
- Stanford University (`stanford`)
- Yale University (`yale`)
- Princeton University (`princeton`)
- Columbia University (`columbia`)
- UC Berkeley (`berkeley`)
- University of Chicago (`chicago`)
- New York University (`nyu`)
- University of Southern California (`usc`)

## Usage

### Scrape a Single University

```bash
# Scrape Harvard events
node scrape-engage-universal.cjs harvard

# Scrape MIT events
node scrape-engage-universal.cjs mit

# Scrape Stanford events
node scrape-engage-universal.cjs stanford
```

### Scrape All Universities

```bash
# Scrape all configured universities
node scrape-engage-universal.cjs harvard --all
```

### Programmatic Usage

```javascript
const { scrapeEngageUniversal, scrapeAllUniversities } = require('./scrape-engage-universal.cjs');

// Scrape a single university
const harvardEvents = await scrapeEngageUniversal('harvard');
console.log(`Found ${harvardEvents.length} Harvard events`);

// Scrape all universities
const allResults = await scrapeAllUniversities();
console.log('All universities scraped:', allResults);
```

## Adding a New University

To add a new university, you have two options:

### Option 1: Add to the Configuration File

Edit `university-configs.json` and add a new university entry:

```json
{
  "universities": {
    "newuniversity": {
      "name": "New University",
      "domain": "engage.newuniversity.edu",
      "apiEndpoint": "https://engage.newuniversity.edu/api/discovery/event/search",
      "eventsUrl": "https://engage.newuniversity.edu/events",
      "source": "New University Engage",
      "tags": ["New University Engage", "New University"],
      "defaultImage": "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
      "customSelectors": {
        "eventContainer": [".event-item", ".event-card", ".event", "[data-testid=\"event\"]"],
        "title": ["h1", "h2", "h3", ".event-title", ".title"],
        "date": [".date", ".event-date", "time"],
        "location": [".location", ".event-location", "address"],
        "description": [".description", ".event-description", "p"],
        "image": ["img[src*=\"event\"]", ".event-image img"],
        "link": ["a[href*=\"event\"]", ".event-link a"]
      }
    }
  }
}
```

### Option 2: Add to the Main Scraper

Edit `scrape-engage-universal.cjs` and add to the `UNIVERSITY_CONFIGS` object:

```javascript
const UNIVERSITY_CONFIGS = {
  // ... existing universities ...
  'newuniversity': {
    name: 'New University',
    domain: 'engage.newuniversity.edu',
    apiEndpoint: 'https://engage.newuniversity.edu/api/discovery/event/search',
    eventsUrl: 'https://engage.newuniversity.edu/events',
    source: 'New University Engage',
    tags: ['New University Engage', 'New University'],
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
  }
};
```

## Configuration Options

### University Configuration

Each university configuration includes:

- **name**: Full university name
- **domain**: Engage domain (e.g., `engage.university.edu`)
- **apiEndpoint**: API endpoint for event search
- **eventsUrl**: Main events page URL
- **source**: Source identifier for the scraper
- **tags**: Array of tags for categorization
- **defaultImage**: Default image URL for events without images
- **customSelectors**: CSS selectors for extracting event data

### Custom Selectors

The `customSelectors` object defines CSS selectors for extracting different parts of events:

```javascript
customSelectors: {
  eventContainer: ['.event-item', '.event-card', '.event'], // Event containers
  title: ['h1', 'h2', 'h3', '.event-title'],               // Event titles
  date: ['.date', '.event-date', 'time'],                  // Event dates
  location: ['.location', '.event-location'],              // Event locations
  description: ['.description', '.event-description'],     // Event descriptions
  image: ['img[src*="event"]', '.event-image img'],        // Event images
  link: ['a[href*="event"]', '.event-link a']              // Event links
}
```

## Scraping Strategies

The scraper uses multiple strategies to ensure reliable data extraction:

1. **API Endpoint**: Tries to fetch events via the Engage API
2. **Full Page with JS**: Renders the page with JavaScript and extracts events
3. **Simple Page Load**: Basic HTML scraping with JavaScript rendering
4. **Static HTML**: Fallback to static HTML parsing

## Output Files

For each university, the scraper generates:

- `{university}-engage-raw.json`: Raw scraped data
- `parsed-{university}-engage.json`: Structured event data
- `{university}-api-raw.json`: Raw API response (if available)
- `{university}-sample.html`: Sample HTML for debugging

For all universities:
- `all-universities-engage.json`: Combined results from all universities

## Event Data Structure

Each scraped event includes:

```javascript
{
  id: "university-engage-0",
  title: "Event Title",
  university: "University Name",
  location: "Event Location",
  dates: "Event Date",
  description: "Event Description",
  image: "Event Image URL",
  type: "event",
  tags: ["University Engage", "University"],
  link: "Event Link",
  weblink: "Event Web Link",
  cost: "Event Cost",
  organization: "Event Organization",
  source: "University Engage"
}
```

## Customization

### Adding Custom Scraping Logic

To add university-specific scraping logic, modify the `extractEventDetails` function:

```javascript
function extractEventDetails(eventBlock, config) {
  // Add custom logic for specific universities
  if (config.domain === 'engage.custom.edu') {
    // Custom extraction logic for this university
  }
  
  // ... rest of the function
}
```

### Modifying Scraping Settings

Adjust scraping behavior in the configuration:

```javascript
const scrapingSettings = {
  maxRetries: 3,                    // Number of retry attempts
  delayBetweenPages: 5000,          // Delay between page requests (ms)
  delayBetweenUniversities: 10000,  // Delay between universities (ms)
  maxPages: 5,                      // Maximum pages to scrape
  timeout: 45000                    // Request timeout (ms)
};
```

## Troubleshooting

### Common Issues

1. **No events found**: Check if the university's Engage URL is correct
2. **API errors**: The scraper will fall back to HTML scraping
3. **Rate limiting**: Increase delays between requests
4. **Selector issues**: Update custom selectors for the specific university

### Debugging

- Check the generated HTML sample files for structure analysis
- Review raw API responses for API endpoint issues
- Examine raw scraped data for extraction problems

### Testing

Use the test script to verify configurations:

```bash
node test-universal-scraper.cjs
```

## Dependencies

- `node-fetch`: For HTTP requests
- `fs`: For file operations
- `path`: For path handling

## License

This scraper is for educational and research purposes. Please respect the terms of service of the websites you're scraping and implement appropriate rate limiting.

## Contributing

To add support for a new university:

1. Research the university's Engage implementation
2. Add configuration to `university-configs.json`
3. Test with the university's domain
4. Update this README with the new university
5. Submit a pull request

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the generated debug files
3. Test with a known working university first
4. Create an issue with detailed error information 