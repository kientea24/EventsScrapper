import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Smart function to get the most current date for filtering
function getCurrentDateForFiltering() {
  const now = new Date();
  
  // Get current date in local timezone
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  console.log(`📅 Current date detected: ${currentDate.toLocaleDateString()}`);
  return currentDate;
}

// Enhanced date parsing function that handles various formats
function parseEventDate(dateString) {
  if (!dateString || dateString === 'TBD') return null;
  
  // Try to parse various date formats
  const patterns = [
    // Harvard Engage format: "Tuesday, July 8 at 11:30AM EDT"
    /([A-Za-z]+,\s*[A-Za-z]+\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}[AP]M\s+[A-Z]+)/,
    // Harvard Gazette format: "July 15, 2024"
    /([A-Za-z]+\s+\d{1,2},?\s+\d{4})/,
    // Other formats
    /(\d{1,2}\/\d{1,2}\/\d{4})/, // "7/15/2024"
    /(\d{4}-\d{2}-\d{2})/, // "2024-07-15"
  ];
  
  for (const pattern of patterns) {
    const match = dateString.match(pattern);
    if (match) {
      let dateToParse = match[1];
      
      // For Harvard Engage format, extract just the date part
      if (dateToParse.includes('at')) {
        // Extract "Tuesday, July 8" from "Tuesday, July 8 at 9:00AM EDT"
        const datePart = dateToParse.split(' at ')[0];
        // Remove day of week if present
        const dateMatch = datePart.match(/([A-Za-z]+\s+\d{1,2})/);
        if (dateMatch) {
          dateToParse = dateMatch[1] + ', 2025'; // Add current year
        }
      }
      
      const parsed = new Date(dateToParse);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  
  return null;
}

async function combineAllEvents() {
  console.log('🔄 Combining all Harvard events...');
  
  // Start with a clean slate - no accumulated events
  const allEvents = [];
  
  // 1. Load Harvard Gazette events
  try {
    const gazettePath = path.join(__dirname, 'parsed-harvard-events.json');
    if (fs.existsSync(gazettePath)) {
      const gazetteEvents = JSON.parse(fs.readFileSync(gazettePath, 'utf8'));
      console.log(`📰 Loaded ${gazetteEvents.length} Harvard Gazette events`);
      allEvents.push(...gazetteEvents);
    }
  } catch (error) {
    console.log('⚠️ Could not load Harvard Gazette events:', error.message);
  }
  
  // 2. Load Harvard Engage events
  try {
    const engagePath = path.join(__dirname, 'parsed-harvard-engage.json');
    if (fs.existsSync(engagePath)) {
      const engageEvents = JSON.parse(fs.readFileSync(engagePath, 'utf8'));
      console.log(`🎓 Loaded ${engageEvents.length} Harvard Engage events`);
      allEvents.push(...engageEvents);
    }
  } catch (error) {
    console.log('⚠️ Could not load Harvard Engage events:', error.message);
  }
  

  
  // 3. Filter and sort events by date (current day onwards)
  const today = getCurrentDateForFiltering();
  today.setHours(0, 0, 0, 0);
  
  console.log(`📅 Today's date for filtering: ${today.toISOString()}`);
  console.log(`📅 Today's date (local): ${today.toLocaleDateString()}`);

  // Deduplicate events by title + normalized date + location
  // If same event exists in multiple sources, prefer Harvard Engage
  const eventMap = new Map();
  for (const event of allEvents) {
    // Normalize date to handle different formats
    let normDate = (event.dates || '').replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Handle Harvard Engage format: "Tuesday, July 8 at 11:30AM EDT" -> "july 8"
    const engageMatch = normDate.match(/([a-z]+ \d{1,2})/);
    if (engageMatch) {
      normDate = engageMatch[1];
    }
    
    // Handle Harvard Gazette format: "July 8, 2025" -> "july 8"
    const gazetteMatch = normDate.match(/([a-z]+ \d{1,2})/);
    if (gazetteMatch) {
      normDate = gazetteMatch[1];
    }
    
    // Create a more robust key that includes source to prevent cross-source duplicates
    const eventKey = `${event.title}|${normDate}|${event.location}`.toLowerCase();
    const sourceKey = `${eventKey}|${event.source}`;
    
    // Debug logging for Farmers' Market events
    if (event.title.toLowerCase().includes('farmers')) {
      console.log(`🔍 Processing: ${event.title}`);
      console.log(`   Source: ${event.source}`);
      console.log(`   Date: "${event.dates}" -> "${normDate}"`);
      console.log(`   Location: "${event.location}"`);
      console.log(`   Event Key: "${eventKey}"`);
      console.log(`   Source Key: "${sourceKey}"`);
    }
    
    // First, check if we have this exact event from this source
    if (eventMap.has(sourceKey)) {
      console.log(`🧹 Removed duplicate ${event.source}: ${event.title}`);
      continue;
    }
    
    // Then check if we have the same event from a different source
    if (eventMap.has(eventKey)) {
      const existingEvent = eventMap.get(eventKey);
      // If current event is Harvard Engage and existing is not, replace it
      if (event.source === 'Harvard Engage' && existingEvent.source !== 'Harvard Engage') {
        console.log(`🧹 Replaced ${existingEvent.source} with Harvard Engage: ${event.title}`);
        eventMap.delete(eventKey); // Remove the old entry
        eventMap.set(eventKey, event);
      } else if (event.source === 'Harvard Engage' && existingEvent.source === 'Harvard Engage') {
        console.log(`🧹 Removed duplicate Harvard Engage: ${event.title}`);
      } else {
        console.log(`🧹 Removed duplicate ${event.source}: ${event.title}`);
      }
    } else {
      // New event, add it
      eventMap.set(eventKey, event);
    }
  }
  
  const dedupedEvents = Array.from(eventMap.values());

  // FINAL DEDUPLICATION: Remove any remaining duplicates across all sources (including Engage self-dupes)
  const finalEventMap = new Map();
  for (const event of dedupedEvents) {
    let normDate = (event.dates || '').replace(/\s+/g, ' ').trim().toLowerCase();
    // Normalize Engage and Gazette date formats
    const engageMatch = normDate.match(/([a-z]+ \d{1,2})/);
    if (engageMatch) normDate = engageMatch[1];
    const gazetteMatch = normDate.match(/([a-z]+ \d{1,2})/);
    if (gazetteMatch) normDate = gazetteMatch[1];
    const key = `${event.title}|${normDate}|${event.location}`.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!finalEventMap.has(key)) {
      finalEventMap.set(key, event);
    }
  }
  const finalDedupedEvents = Array.from(finalEventMap.values());
  console.log(`🧹 Final deduplication: ${finalDedupedEvents.length} unique events remain.`);

  console.log(`🧹 Deduplicated events: ${finalDedupedEvents.length} (from ${allEvents.length})`);

  const filteredEvents = finalDedupedEvents
    .filter(event => {
      // Keep events with TBD dates (ongoing events)
      if (!event.dates || event.dates === 'TBD') {
        console.log(`✅ Keeping event with TBD date: ${event.title}`);
        return true;
      }
      
      // Try to parse the date using the improved parseEventDate function
      const eventDate = parseEventDate(event.dates);
      if (eventDate) {
        eventDate.setHours(0, 0, 0, 0);
        
        // Only keep events from today onwards (no past events)
        const isFromTodayOnwards = eventDate >= today;
        
        if (!isFromTodayOnwards) {
          console.log(`❌ Filtered out past event: ${event.title} (${event.dates})`);
        } else {
          console.log(`✅ Keeping current event: ${event.title} (${event.dates})`);
        }
        
        return isFromTodayOnwards;
      }
      
      // If we can't parse the date, include it (better to show than hide)
      console.log(`⚠️ Could not parse date for event: ${event.title} (${event.dates}) - including it`);
      return true;
    })
    .sort((a, b) => {
      const dateA = parseEventDate(a.dates);
      const dateB = parseEventDate(b.dates);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateA - dateB;
    });
  
  console.log(`✅ Combined ${filteredEvents.length} events (filtered from ${allEvents.length} total)`);
  
  // 4. Save combined events
  const combinedPath = path.join(__dirname, 'all-harvard-events.json');
  fs.writeFileSync(combinedPath, JSON.stringify(filteredEvents, null, 2));
  console.log(`💾 Saved combined events to: ${combinedPath}`);
  
  // 5. Update last update timestamp
  const now = new Date();
  const lastUpdate = {
    timestamp: now.toISOString(),
    humanReadable: now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    totalEvents: filteredEvents.length,
    sources: {
      gazette: allEvents.filter(e => e.source === 'Harvard Gazette').length,
      engage: allEvents.filter(e => e.source === 'Harvard Engage').length
    },
    dateRange: {
      from: today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      to: 'Ongoing'
    }
  };
  
  const lastUpdatePath = path.join(__dirname, 'last-update.json');
  fs.writeFileSync(lastUpdatePath, JSON.stringify(lastUpdate, null, 2));
  console.log(`📅 Updated timestamp: ${lastUpdate.timestamp}`);
  
  return filteredEvents;
}

// Run the combiner
if (import.meta.url === `file://${process.argv[1]}`) {
  combineAllEvents()
    .then(() => {
      console.log('✅ Event combination completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Event combination failed:', error);
      process.exit(1);
    });
}

export { combineAllEvents }; 