import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAllScrapers() {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  console.log('🚀 Starting all Harvard event scrapers...');
  console.log(`📅 Target date range: ${today} and onwards\n`);
  
  // Clean up old event files before scraping
  console.log('🧹 Cleaning up old event files...');
  const fs = await import('fs');
  const path = await import('path');
  const eventsDir = path.join(__dirname, '../events');
  
  const filesToClean = [
    'parsed-harvard-events.json',
    'parsed-harvard-engage.json',
    'all-harvard-events.json',
    'harvard-engage-html-raw.html',
    'last-update.json',
    'harvard-events-grouped-by-date.json',
    'harvard-events-sorted-by-time.json'
  ];
  
  // Also clean up any other parsed files that might exist
  const allFiles = fs.readdirSync(eventsDir);
  const parsedFiles = allFiles.filter(file => 
    file.startsWith('parsed-') || 
    file.startsWith('harvard-') ||
    file === 'all-harvard-events.json' ||
    file === 'last-update.json'
  );
  
  [...filesToClean, ...parsedFiles].forEach(file => {
    const filePath = path.join(eventsDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted old file: ${file}`);
    }
  });
  console.log('✅ Cleanup completed\n');
  
  try {
    // 1. Run Harvard Gazette scraper
    console.log('📰 Running Harvard Gazette scraper...');
    execSync('node ../events/parse-harvard-events.js', { 
      cwd: __dirname, 
      stdio: 'inherit' 
    });
    console.log('✅ Harvard Gazette scraper completed\n');
    
    // 2. Run Harvard Engage scraper
    console.log('🎓 Running Harvard Engage scraper...');
    try {
      execSync('node scrape-harvard-engage-puppeteer.cjs', { 
        cwd: __dirname, 
        stdio: 'inherit' 
      });
      console.log('✅ Harvard Engage scraper completed\n');
    } catch (error) {
      console.log('⚠️ Harvard Engage scraper failed, continuing with other sources...\n');
    }
    
    // 3. Combine all events
    console.log('🔄 Combining all events...');
    execSync('node ../events/combine-all-events.js', { 
      cwd: __dirname, 
      stdio: 'inherit' 
    });
    console.log('✅ Event combination completed\n');
    
    // 4. Process events by time
    console.log('⏰ Processing events by time...');
    execSync('node ../events/extract-and-order-events-by-time.cjs', { 
      cwd: __dirname, 
      stdio: 'inherit' 
    });
    console.log('✅ Time processing completed\n');
    
    console.log('🎉 All scrapers and processors completed successfully!');
    console.log(`📅 Events updated for: ${today} and onwards`);
    
  } catch (error) {
    console.error('❌ Error running scrapers:', error.message);
    process.exit(1);
  }
}

// Run the master scraper
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllScrapers();
}

export { runAllScrapers }; 