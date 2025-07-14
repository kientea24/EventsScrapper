#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Manually refreshing Harvard events...');

try {
  // Run Engage scraper (HTML, not API)
  console.log('Running Engage scraper...');
  execSync('node harvard/scraping/scrape-engage-universal.cjs harvard', { stdio: 'inherit' });

  // Run Gazette scraper (HTML)
  console.log('Running Gazette scraper...');
  execSync('node harvard/scraping/scrape-harvard-engage-robust.cjs', { stdio: 'inherit' });

  // Optionally, run other scrapers here...

  // Combine all results into all-harvard-events.json
  console.log('Combining all events...');
  execSync('node harvard/events/combine-all-events.js', { stdio: 'inherit' });
  
  console.log('✅ Events refreshed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to refresh events:', error.message);
  process.exit(1);
} 