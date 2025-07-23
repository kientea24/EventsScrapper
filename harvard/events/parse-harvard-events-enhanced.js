import { DOMParser } from '@xmldom/xmldom';
import fs from 'fs';
import path from 'path';

// Helper function to get current date for filtering
function getCurrentDateForFiltering() {
  const now = new Date();
  // Set to beginning of current day
  now.setHours(0, 0, 0, 0);
  return now;
}

// Helper function to check if event date is from today onwards
function isEventFromTodayOnwards(eventDate) {
  if (!eventDate || eventDate === 'undefined' || eventDate === 'TBD') {
    return true; // Include events with no date
  }
  
  const today = getCurrentDateForFiltering();
  
  // Try to parse various date formats
  const dateFormats = [
    /([A-Za-z]+ \d{1,2},? \d{4})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /([A-Za-z]+ \d{1,2} \d{4})/,
    /(\d{1,2} [A-Za-z]+ \d{4})/
  ];
  
  for (const format of dateFormats) {
    const match = eventDate.match(format);
    if (match) {
      try {
        const eventDateObj = new Date(match[1]);
        if (isNaN(eventDateObj.getTime())) continue;
        
        // Set to beginning of day for comparison
        eventDateObj.setHours(0, 0, 0, 0);
        
        console.log(`📅 Current date detected: ${today.toLocaleDateString()}`);
        console.log(`📅 Event date: ${eventDateObj.toLocaleDateString()}`);
        
        return eventDateObj >= today;
      } catch (error) {
        console.log(`⚠️ Could not parse date for event: ${eventDate} - including it`);
        return true; // Include if we can't parse the date
      }
    }
  }
  
  console.log(`⚠️ Could not parse date for event: ${eventDate} - including it`);
  return true; // Include if we can't parse the date
}

// Enhanced function to download Harvard Gazette XML from multiple months
async function downloadHarvardGazetteXMLEnhanced() {
  const baseUrl = 'https://news.harvard.edu/gazette/harvard-events/events-calendar/.xml';
  
  console.log('📡 Attempting to download Harvard Gazette XML feeds from multiple months...');
  
  const allXmlData = [];
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  
  // Try to get events from current month and next 3 months
  const monthsToTry = [];
  for (let i = 0; i < 4; i++) {
    const month = (currentMonth + i) % 12 || 12;
    const year = currentYear + Math.floor((currentMonth + i - 1) / 12);
    monthsToTry.push({ month, year });
  }
  
  for (const { month, year } of monthsToTry) {
    const url = `${baseUrl}?month=${month}&year=${year}`;
    console.log(`🔗 Trying URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        },
        timeout: 30000
      });
      
      if (!response.ok) {
        console.log(`❌ HTTP error for month ${month}/${year}: ${response.status}`);
        continue;
      }
      
      let xmlData = await response.text();
      
      // Check if we got HTML instead of XML
      if (xmlData.includes('<!DOCTYPE html>') || xmlData.includes('<html')) {
        console.log(`❌ Received HTML instead of XML for month ${month}/${year}`);
        continue;
      }
      
      // Check if we got any entries
      const entryCount = (xmlData.match(/<entry>/g) || []).length;
      if (entryCount > 0) {
        console.log(`✅ Downloaded ${xmlData.length} characters with ${entryCount} entries for ${month}/${year}`);
        allXmlData.push(xmlData);
      } else {
        console.log(`⚠️ No entries found for month ${month}/${year}`);
      }
      
    } catch (error) {
      console.error(`❌ Error downloading XML for month ${month}/${year}:`, error.message);
    }
  }
  
  if (allXmlData.length === 0) {
    console.log('🔄 Falling back to original single XML feed...');
    try {
      const response = await fetch(baseUrl, {
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
      
      console.log(`✅ Downloaded ${xmlData.length} characters of XML data from fallback`);
      allXmlData.push(xmlData);
      
    } catch (error) {
      console.error('❌ Error downloading fallback XML feed:', error.message);
      throw new Error('No XML data available');
    }
  }
  
  // Combine all XML data
  const combinedXml = allXmlData.join('\n');
  console.log(`📊 Combined ${allXmlData.length} XML feeds into ${combinedXml.length} characters`);
  
  // Clean up malformed HTML entities and tags
  const cleanedXml = cleanXMLData(combinedXml);
  
  // Save the downloaded XML for backup
  const backupPath = path.join(__dirname, '../testing/trumba-xml-enhanced');
  fs.writeFileSync(backupPath, cleanedXml);
  console.log(`💾 Saved enhanced XML to: ${backupPath}`);
  
  return cleanedXml;
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
    .replace(/<hr([^>]*?)(?:\/>|>)/g, '<hr$1 />'); // Fix self-closing hr tags
  
  console.log('✅ XML data cleaned');
  return cleanedData;
}

// Parse the XML file and extract events
async function parseHarvardEventsEnhanced() {
  try {
    console.log("=== Parsing Harvard Events Data (Enhanced) ===\n");
    
    // Download the enhanced XML feed
    const xmlData = await downloadHarvardGazetteXMLEnhanced();
    
    // Parse XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
    
    // Get all event entries
    const entries = xmlDoc.getElementsByTagName('entry');
    console.log(`Found ${entries.length} total events in the enhanced XML feed\n`);
    
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
        id: `harvard-gazette-enhanced-${index}`,
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
    
    const outputPath = path.join(__dirname, 'parsed-harvard-events-enhanced.json');
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

// Run the enhanced parser
parseHarvardEventsEnhanced().catch(error => {
  console.error("Failed to parse Harvard events:", error);
  process.exit(1);
}); 