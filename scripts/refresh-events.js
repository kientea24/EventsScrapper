#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Manually refreshing Harvard events...');

try {
  // Run the scraper
  execSync('node ../harvard/scraping/run-all-scrapers.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('✅ Events refreshed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to refresh events:', error.message);
  process.exit(1);
} 