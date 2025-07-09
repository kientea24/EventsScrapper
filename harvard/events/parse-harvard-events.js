import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

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

// Helper function to parse event date and check if it's from today onwards
function isEventFromTodayOnwards(eventDate) {
  if (!eventDate) return false;
  
  const today = getCurrentDateForFiltering();
  today.setHours(0, 0, 0, 0);
  
  // Try to parse the event date
  const dateMatch = eventDate.match(/([A-Za-z]+ \d{1,2},? \d{4})/);
  if (dateMatch) {
    const parsedDate = new Date(dateMatch[1]);
    parsedDate.setHours(0, 0, 0, 0);
    const isFromTodayOnwards = parsedDate >= today;
    
    if (!isFromTodayOnwards) {
      console.log(`❌ Filtered out past event: ${eventDate} (before ${today.toLocaleDateString()})`);
    }
    
    return isFromTodayOnwards;
  }
  
  // If we can't parse the date, include it (better to show than hide)
  console.log(`⚠️ Could not parse date for event: ${eventDate} - including it`);
  return true;
}

// Download the current XML feed from Harvard Gazette
async function downloadHarvardGazetteXML() {
  const xmlUrl = 'https://news.harvard.edu/gazette/harvard-events/events-calendar/.xml';
  
  console.log('📡 Attempting to download current Harvard Gazette XML feed...');
  console.log(`🔗 URL: ${xmlUrl}`);
  
  try {
    const response = await fetch(xmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    let xmlData = await response.text();
    
    // Check if we got HTML instead of XML
    if (xmlData.includes('<!DOCTYPE html>') || xmlData.includes('<html')) {
      throw new Error('Received HTML instead of XML feed');
    }
    
    console.log(`✅ Downloaded ${xmlData.length} characters of XML data`);
    
    // Clean up malformed HTML entities and tags
    xmlData = cleanXMLData(xmlData);
    
    // Save the downloaded XML for backup
    const backupPath = path.join(__dirname, '../testing/trumba-xml-current');
    fs.writeFileSync(backupPath, xmlData);
    console.log(`💾 Saved current XML to: ${backupPath}`);
    
    return xmlData;
    
  } catch (error) {
    console.error('❌ Error downloading XML feed:', error.message);
    console.log('🔄 Falling back to cached XML file...');
    
    // Fallback to cached file if download fails
    const cachedPath = path.join(__dirname, '../testing/trumba-xml');
    if (fs.existsSync(cachedPath)) {
      const cachedData = fs.readFileSync(cachedPath, 'utf8');
      console.log('✅ Using cached XML file');
      return cleanXMLData(cachedData);
    } else {
      throw new Error('No XML data available (download failed and no cache)');
    }
  }
}

// Clean up malformed XML/HTML data
function cleanXMLData(xmlData) {
  console.log('🧹 Cleaning XML data...');
  
  // Replace common HTML entities that cause XML parsing issues
  const replacements = [
    ['&raquo;', '»'],
    ['&laquo;', '«'],
    ['&nbsp;', ' '],
    ['&amp;', '&'],
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&quot;', '"'],
    ['&#39;', "'"],
    ['&rsquo;', "'"],
    ['&lsquo;', "'"],
    ['&rdquo;', '"'],
    ['&ldquo;', '"'],
    ['&hellip;', '...'],
    ['&mdash;', '—'],
    ['&ndash;', '–'],
    ['&copy;', '©'],
    ['&reg;', '®'],
    ['&trade;', '™']
  ];
  
  let cleanedData = xmlData;
  
  // Apply replacements
  for (const [entity, replacement] of replacements) {
    cleanedData = cleanedData.replace(new RegExp(entity, 'g'), replacement);
  }
  
  // Fix common malformed HTML tags
  cleanedData = cleanedData
    .replace(/<img([^>]*?)(?:\/>|>)/g, '<img$1 />') // Fix self-closing img tags
    .replace(/<br([^>]*?)(?:\/>|>)/g, '<br$1 />') // Fix self-closing br tags
    .replace(/<hr([^>]*?)(?:\/>|>)/g, '<hr$1 />') // Fix self-closing hr tags
    .replace(/<([^>]*?)>/g, (match, content) => {
      // Skip if it's already a self-closing tag
      if (content.endsWith('/')) return match;
      // Skip if it's a closing tag
      if (content.startsWith('/')) return match;
      // Skip if it's a valid opening tag
      if (!content.includes(' ')) return match;
      // For tags with attributes, ensure they're properly closed
      return match;
    });
  
  console.log('✅ XML data cleaned');
  return cleanedData;
}

// Parse the XML file and extract events
async function parseHarvardEvents() {
  try {
    console.log("=== Parsing Harvard Events Data ===\n");
    
    // Download the current XML feed
    const xmlData = await downloadHarvardGazetteXML();
    
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    
    // Get all event entries
    const entries = xmlDoc.getElementsByTagName('entry');
    console.log(`Found ${entries.length} total events in the XML feed\n`);
    
    const events = [];
    const today = getCurrentDateForFiltering();
    
    console.log(`📅 Filtering events from ${today.toLocaleDateString()} onwards...`);
    
    // Extract data from each event
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      try {
        const event = {
          id: getTextContent(entry, 'id'),
          title: getTextContent(entry, 'title'),
          published: getTextContent(entry, 'published'),
          updated: getTextContent(entry, 'updated'),
          content: getTextContent(entry, 'content'),
          link: getAttributeValue(entry, 'link', 'href'),
          weblink: getTextContent(entry, 'gc:weblink')
        };
        
        // Parse the content to extract structured information
        const parsedContent = parseEventContent(event.content);
        event.parsed = parsedContent;
        
        // Check if this event is from today onwards
        const eventDate = parsedContent.date || event.title;
        if (isEventFromTodayOnwards(eventDate)) {
          events.push(event);
          
          // Log first few events for preview
          if (events.length <= 5) {
            console.log(`Event ${events.length}:`);
            console.log(`  Title: ${event.title}`);
            console.log(`  Date: ${parsedContent.date || 'N/A'}`);
            console.log(`  Location: ${parsedContent.location || 'N/A'}`);
            console.log(`  Classification: ${parsedContent.classification || 'N/A'}`);
            console.log(`  Cost: ${parsedContent.cost || 'N/A'}`);
            console.log('');
          }
        }
        
      } catch (error) {
        console.error(`Error parsing event ${i + 1}:`, error.message);
      }
    }
    
    console.log(`✅ Found ${events.length} events from today onwards (filtered from ${entries.length} total events)`);
    
    // Save parsed events to JSON in the correct format
    const formattedEvents = events.map((event, index) => {
      // Extract image URL from content if available
      const imgMatch = event.content.match(/<img[^>]+src="([^"]+)"/);
      const imageUrl = imgMatch ? imgMatch[1] : "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80";
      
      // Extract tags from classification
      const tags = event.parsed?.classification 
        ? event.parsed.classification.replace(/&nbsp;/g, '').split(',').map(tag => tag.trim())
        : ['Event'];
      
      // Extract date from content
      const dateMatch = event.content.match(/([A-Za-z]+ \d{1,2},? \d{4})/);
      const date = dateMatch ? dateMatch[1] : event.parsed?.date || 'TBD';
      
      return {
        id: `harvard-gazette-${index}`,
        title: event.title,
        university: "Harvard University",
        location: event.parsed?.location || 'Harvard University',
        dates: date,
        description: event.parsed?.description || event.title,
        image: imageUrl,
        type: "event",
        tags: tags,
        link: event.link,
        weblink: event.weblink,
        organization: event.parsed?.organization,
        source: "Harvard Gazette"
      };
    });
    
    const outputPath = path.join(__dirname, 'parsed-harvard-events.json');
    fs.writeFileSync(outputPath, JSON.stringify(formattedEvents, null, 2));
    console.log(`✓ Saved ${formattedEvents.length} parsed events to ${outputPath}`);
    
    // Generate summary statistics
    generateEventStats(events);
    
    return events;
    
  } catch (error) {
    console.error("Error parsing events:", error);
    throw error;
  }
}

// Helper function to get text content from XML elements
function getTextContent(parent, tagName) {
  const element = parent.getElementsByTagName(tagName)[0];
  return element ? element.textContent : '';
}

// Helper function to get attribute value from XML elements
function getAttributeValue(parent, tagName, attributeName) {
  const element = parent.getElementsByTagName(tagName)[0];
  return element ? element.getAttribute(attributeName) : '';
}

// Parse the HTML content to extract structured information
function parseEventContent(content) {
  const parsed = {};
  
  // Extract location (usually first line)
  const lines = content.split('<br />');
  if (lines.length > 0) {
    parsed.location = lines[0].trim();
  }
  
  // Extract date (usually second line)
  if (lines.length > 1) {
    parsed.date = lines[1].trim();
  }
  
  // Extract classification
  const classificationMatch = content.match(/Gazette Classification.*?:(.*?)<br/);
  if (classificationMatch) {
    parsed.classification = classificationMatch[1].trim();
  }
  
  // Extract organization/sponsor
  const orgMatch = content.match(/Organization\/Sponsor.*?:(.*?)<br/);
  if (orgMatch) {
    parsed.organization = orgMatch[1].trim();
  }
  
  // Extract cost
  const costMatch = content.match(/Cost.*?:(.*?)<br/);
  if (costMatch) {
    parsed.cost = costMatch[1].trim();
  }
  
  // Extract contact info
  const contactMatch = content.match(/Contact Info.*?:(.*?)<br/);
  if (contactMatch) {
    parsed.contact = contactMatch[1].trim();
  }
  
  // Extract more info link
  const moreInfoMatch = content.match(/More info.*?:(.*?)<br/);
  if (moreInfoMatch) {
    parsed.moreInfo = moreInfoMatch[1].trim();
  }
  
  // Extract speakers
  const speakerMatch = content.match(/Speaker\(s\).*?:(.*?)<br/);
  if (speakerMatch) {
    parsed.speakers = speakerMatch[1].trim();
  }
  
  // Clean up HTML tags from text
  parsed.description = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  return parsed;
}

// Generate statistics about the events
function generateEventStats(events) {
  console.log("=== Event Statistics ===\n");
  
  // Count by classification
  const classifications = {};
  const organizations = {};
  const costs = {};
  
  events.forEach(event => {
    if (event.parsed.classification) {
      const cats = event.parsed.classification.split(',').map(c => c.trim());
      cats.forEach(cat => {
        classifications[cat] = (classifications[cat] || 0) + 1;
      });
    }
    
    if (event.parsed.organization) {
      organizations[event.parsed.organization] = (organizations[event.parsed.organization] || 0) + 1;
    }
    
    if (event.parsed.cost) {
      costs[event.parsed.cost] = (costs[event.parsed.cost] || 0) + 1;
    }
  });
  
  console.log("Top Event Classifications:");
  Object.entries(classifications)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} events`);
    });
  
  console.log("\nTop Organizations:");
  Object.entries(organizations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([org, count]) => {
      console.log(`  ${org}: ${count} events`);
    });
  
  console.log("\nCost Breakdown:");
  Object.entries(costs)
    .sort(([,a], [,b]) => b - a)
    .forEach(([cost, count]) => {
      console.log(`  ${cost}: ${count} events`);
    });
  
  console.log(`\nTotal Events: ${events.length}`);
}

// Run the parser
parseHarvardEvents().catch(error => {
  console.error("Failed to parse Harvard events:", error);
  process.exit(1);
}); 