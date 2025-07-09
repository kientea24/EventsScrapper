const fs = require('fs');
const path = require('path');

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

// Function to extract time from description
function extractTimeFromDescription(description) {
  // Common time patterns - try range patterns first
  const rangePatterns = [
    // 9am – 5pm, 7 – 9pm, 9:30 – 11pm (with en dash)
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[–—]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi,
    // 9am to 5pm, 7pm to 9pm
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+to\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi,
    // 9am-5pm (no spaces with regular dash)
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)-(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi
  ];

  // Try range patterns first
  for (const pattern of rangePatterns) {
    const match = pattern.exec(description);
    if (match) {
      return {
        startTime: match[1].trim(),
        endTime: match[2].trim(),
        timeString: `${match[1].trim()} – ${match[2].trim()}`
      };
    }
  }

  // If no range found, look for single time
  const singleTimePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/gi;
  const singleMatch = singleTimePattern.exec(description);
  if (singleMatch) {
    return {
      startTime: singleMatch[1].trim(),
      endTime: null,
      timeString: singleMatch[1].trim()
    };
  }

  return null;
}

// Function to extract time from Harvard Engage dates field
function extractTimeFromEngageDates(dates) {
  if (!dates) return null;
  
  // Harvard Engage format: "Tuesday, July 8 at 11:30AM EDT"
  const engageTimePattern = /at\s+(\d{1,2}:\d{2}[AP]M)/i;
  const match = dates.match(engageTimePattern);
  
  if (match) {
    return {
      startTime: match[1].trim(),
      endTime: null,
      timeString: match[1].trim()
    };
  }
  
  return null;
}

// Function to extract time from any event
function extractTimeFromEvent(event) {
  // For Harvard Engage events, try the dates field first
  if (event.source === 'Harvard Engage') {
    const engageTime = extractTimeFromEngageDates(event.dates);
    if (engageTime) {
      return engageTime;
    }
  }
  
  // Then try the description field
  return extractTimeFromDescription(event.description);
}

// Function to convert time to 24-hour format for sorting
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  
  const cleanTime = timeStr.toLowerCase().replace(/\s+/g, '');
  let time = cleanTime;
  let period = '';
  
  if (cleanTime.includes('am') || cleanTime.includes('pm')) {
    period = cleanTime.slice(-2);
    time = cleanTime.slice(0, -2);
  }
  
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'pm' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'am' && hours === 12) {
    hour24 = 0;
  }
  
  return hour24 * 60 + (minutes || 0);
}

// Function to parse date string
function parseDate(dateStr) {
  const date = new Date(dateStr);
  return {
    date: date,
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
    month: date.toLocaleDateString('en-US', { month: 'long' }),
    day: date.getDate(),
    year: date.getFullYear()
  };
}

// Main function to process events
function processEventsByTime() {
  try {
    // Load events from the combined file
    const eventsPath = path.join(__dirname, 'all-harvard-events.json');
    const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    
    console.log(`📊 Loaded ${events.length} total events`);
    
    // Filter events to only include those from today onwards
    const today = getCurrentDateForFiltering();
    console.log(`📅 Filtering events from ${today.toLocaleDateString()} onwards...`);
    
    const currentEvents = events.filter(event => {
      if (!event.dates || event.dates === 'TBD') {
        console.log(`✅ Keeping event with TBD date: ${event.title}`);
        return true;
      }
      
      return isEventFromTodayOnwards(event.dates);
    });
    
    console.log(`✅ Found ${currentEvents.length} current events (filtered from ${events.length} total events)`);
    
    if (currentEvents.length === 0) {
      console.log('⚠️ No current events found. Creating empty grouped file.');
      const emptyResult = {};
      const groupedOutputPath = path.join(__dirname, 'harvard-events-grouped-by-date.json');
      const sortedOutputPath = path.join(__dirname, 'harvard-events-sorted-by-time.json');
      fs.writeFileSync(groupedOutputPath, JSON.stringify(emptyResult, null, 2));
      fs.writeFileSync(sortedOutputPath, JSON.stringify(emptyResult, null, 2));
      return;
    }
    
    // Process each event
    const processedEvents = currentEvents.map(event => {
      const timeInfo = extractTimeFromEvent(event);
      const dateInfo = parseDate(event.dates);
      
      return {
        ...event,
        timeInfo,
        dateInfo,
        hasTime: !!timeInfo,
        sortTime: timeInfo ? timeToMinutes(timeInfo.startTime) : 0
      };
    });
    
    // Group events by date
    const eventsByDate = {};
    
    processedEvents.forEach(event => {
      const dateKey = event.dates;
      
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = {
          dateInfo: event.dateInfo,
          events: []
        };
      }
      
      eventsByDate[dateKey].events.push(event);
    });
    
    // Sort events within each date by time
    Object.keys(eventsByDate).forEach(dateKey => {
      eventsByDate[dateKey].events.sort((a, b) => {
        if (a.hasTime && b.hasTime) {
          return a.sortTime - b.sortTime;
        } else if (a.hasTime && !b.hasTime) {
          return -1; // Events with time come first
        } else if (!a.hasTime && b.hasTime) {
          return 1;
        } else {
          return 0; // Both have no time, maintain original order
        }
      });
    });
    
    // Group events by time within each date
    const eventsByTimeAndDate = {};
    
    Object.keys(eventsByDate).forEach(dateKey => {
      const dateData = eventsByDate[dateKey];
      eventsByTimeAndDate[dateKey] = {
        dateInfo: dateData.dateInfo,
        timeGroups: {}
      };
      
      dateData.events.forEach(event => {
        if (event.hasTime) {
          const timeKey = event.timeInfo.timeString;
          if (!eventsByTimeAndDate[dateKey].timeGroups[timeKey]) {
            eventsByTimeAndDate[dateKey].timeGroups[timeKey] = [];
          }
          eventsByTimeAndDate[dateKey].timeGroups[timeKey].push(event);
        } else {
          // Events without time go to "No specific time" group
          if (!eventsByTimeAndDate[dateKey].timeGroups['No specific time']) {
            eventsByTimeAndDate[dateKey].timeGroups['No specific time'] = [];
          }
          eventsByTimeAndDate[dateKey].timeGroups['No specific time'].push(event);
        }
      });
    });
    
    // Sort time groups within each date
    Object.keys(eventsByTimeAndDate).forEach(dateKey => {
      const timeGroups = eventsByTimeAndDate[dateKey].timeGroups;
      const sortedTimeGroups = {};
      
      // Get all time keys and sort them
      const timeKeys = Object.keys(timeGroups).sort((a, b) => {
        if (a === 'No specific time') return 1;
        if (b === 'No specific time') return -1;
        
        // Convert times to minutes for sorting
        const timeA = timeToMinutes(a);
        const timeB = timeToMinutes(b);
        return timeA - timeB;
      });
      
      // Rebuild the object with sorted keys
      timeKeys.forEach(timeKey => {
        sortedTimeGroups[timeKey] = timeGroups[timeKey];
      });
      
      eventsByTimeAndDate[dateKey].timeGroups = sortedTimeGroups;
    });
    
    // Save the processed data
    const groupedOutputPath = path.join(__dirname, 'harvard-events-grouped-by-date.json');
    fs.writeFileSync(groupedOutputPath, JSON.stringify(eventsByTimeAndDate, null, 2));
    
    // Create a summary
    const summary = {
      totalEvents: events.length,
      eventsWithTime: processedEvents.filter(e => e.hasTime).length,
      eventsWithoutTime: processedEvents.filter(e => !e.hasTime).length,
      uniqueDates: Object.keys(eventsByDate).length,
      dateRange: {
        earliest: Object.keys(eventsByDate).sort()[0],
        latest: Object.keys(eventsByDate).sort().slice(-1)[0]
      }
    };
    
    console.log('Processing complete!');
    console.log('Summary:', summary);
    console.log(`Output saved to: ${groupedOutputPath}`);
    
    // Also create a sorted timeline version
    const timelineEvents = processedEvents
      .filter(e => e.hasTime)
      .sort((a, b) => {
        const dateA = new Date(a.dates);
        const dateB = new Date(b.dates);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA - dateB;
        }
        return a.sortTime - b.sortTime;
      });
    
    const sortedOutputPath = path.join(__dirname, 'harvard-events-sorted-by-time.json');
    fs.writeFileSync(sortedOutputPath, JSON.stringify(timelineEvents, null, 2));
    console.log(`Timeline saved to: ${sortedOutputPath}`);
    
    return { eventsByTimeAndDate, timelineEvents, summary };
    
  } catch (error) {
    console.error('Error processing events:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  processEventsByTime();
}

module.exports = { processEventsByTime, extractTimeFromDescription, timeToMinutes }; 