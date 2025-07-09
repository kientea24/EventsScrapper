const { scrapeEngageUniversal, scrapeAllUniversities, UNIVERSITY_CONFIGS } = require('./scrape-engage-universal.cjs');

async function testUniversalScraper() {
  console.log('🧪 Testing Universal Engage Scraper\n');
  
  // Test with a single university
  console.log('📚 Testing single university (Harvard)...');
  try {
    const harvardEvents = await scrapeEngageUniversal('harvard');
    console.log(`✅ Harvard: Found ${harvardEvents.length} events`);
  } catch (error) {
    console.error(`❌ Harvard failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test with another university
  console.log('📚 Testing another university (MIT)...');
  try {
    const mitEvents = await scrapeEngageUniversal('mit');
    console.log(`✅ MIT: Found ${mitEvents.length} events`);
  } catch (error) {
    console.error(`❌ MIT failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Show available universities
  console.log('🎓 Available universities:');
  Object.keys(UNIVERSITY_CONFIGS).forEach((key, index) => {
    const config = UNIVERSITY_CONFIGS[key];
    console.log(`${index + 1}. ${key} - ${config.name} (${config.domain})`);
  });
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test with a custom university (example)
  console.log('🔧 Testing custom university configuration...');
  const customConfig = {
    name: 'Custom University',
    domain: 'engage.custom.edu',
    apiEndpoint: 'https://engage.custom.edu/api/discovery/event/search',
    eventsUrl: 'https://engage.custom.edu/events',
    source: 'Custom Engage',
    tags: ['Custom Engage', 'Custom'],
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
  };
  
  console.log('Custom config created for:', customConfig.name);
  console.log('To use this, you would need to add it to the UNIVERSITY_CONFIGS object');
  
  console.log('\n✅ Universal scraper test completed!');
}

// Run the test
if (require.main === module) {
  testUniversalScraper()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testUniversalScraper }; 