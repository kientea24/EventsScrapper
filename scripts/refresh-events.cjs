#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
require('dotenv').config();

console.log("🔄 Combining events and pushing to Supabase...");

(async () => {
  try {
    // 1. Combine all events (this includes the combine logic)
    console.log("🔄 Combining all Harvard events...");
    
    const allEvents = [];
    
    // Load Harvard Gazette events
    try {
      const gazettePath = path.join(__dirname, '../harvard/events/parsed-harvard-events.json');
      if (fs.existsSync(gazettePath)) {
        const gazetteEvents = JSON.parse(fs.readFileSync(gazettePath, 'utf8'));
        console.log(`📰 Loaded ${gazetteEvents.length} Harvard Gazette events`);
        allEvents.push(...gazetteEvents);
      }
    } catch (error) {
      console.log('⚠️ Could not load Harvard Gazette events:', error.message);
    }
    
    // Load Harvard Engage events
    try {
      const engagePath = path.join(__dirname, '../harvard/events/parsed-harvard-engage.json');
      if (fs.existsSync(engagePath)) {
        const engageEvents = JSON.parse(fs.readFileSync(engagePath, 'utf8'));
        console.log(`🎓 Loaded ${engageEvents.length} Harvard Engage events`);
        allEvents.push(...engageEvents);
      }
    } catch (error) {
      console.log('⚠️ Could not load Harvard Engage events:', error.message);
    }
    
    // Filter and deduplicate events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`📅 Filtering events from ${today.toLocaleDateString()} onwards...`);
    
    // Deduplicate events by title + date + location
    const eventMap = new Map();
    for (const event of allEvents) {
      let normDate = (event.dates || event.dateTime || '').replace(/\s+/g, ' ').trim().toLowerCase();
      
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
      
      const eventKey = `${event.title}|${normDate}|${event.location}`.toLowerCase();
      
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, event);
      }
    }
    
    const dedupedEvents = Array.from(eventMap.values());
    
    // Filter out past events
    const filteredEvents = dedupedEvents.filter(event => {
      const dateField = event.dates || event.dateTime || '';
      
      // Keep events with TBD dates
      if (!dateField || dateField === 'TBD') {
        return true;
      }
      
      // Try to parse the date
      const patterns = [
        /([A-Za-z]+,\s*[A-Za-z]+\s+\d{1,2}\s+at\s+\d{1,2}:\d{2}[AP]M\s+[A-Z]+)/,
        /([A-Za-z]+\s+\d{1,2},?\s+\d{4})/,
        /(\d{1,2}\/\d{1,2}\/\d{4})/,
        /(\d{4}-\d{2}-\d{2})/,
      ];
      
      for (const pattern of patterns) {
        const match = dateField.match(pattern);
        if (match) {
          let dateToParse = match[1];
          
          if (dateToParse.includes('at')) {
            const datePart = dateToParse.split(' at ')[0];
            const dateMatch = datePart.match(/([A-Za-z]+\s+\d{1,2})/);
            if (dateMatch) {
              const currentYear = new Date().getFullYear();
              dateToParse = dateMatch[1] + ', ' + currentYear;
            }
          }
          
          const parsed = new Date(dateToParse);
          if (!isNaN(parsed.getTime())) {
            parsed.setHours(0, 0, 0, 0);
            return parsed >= today;
          }
        }
      }
      
      // If we can't parse the date, include it
      return true;
    });
    
    console.log(`✅ Combined ${filteredEvents.length} events (filtered from ${allEvents.length} total)`);
    
    // Save combined events
    const combinedPath = path.join(__dirname, '../harvard/events/all-harvard-events.json');
    fs.writeFileSync(combinedPath, JSON.stringify(filteredEvents, null, 2));
    console.log(`💾 Saved combined events to: ${combinedPath}`);
    
    // 2. Push to Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      console.log("📤 Pushing events to Supabase...");
      
      try {
        console.log("📡 Creating Supabase client...");
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );
        
        // Delete all existing events from Supabase
        console.log("🗑️ Deleting all existing events from Supabase...");
        const { error: deleteError } = await supabase
          .from("events")
          .delete()
          .neq("id", ""); // Delete all records
          
        if (deleteError) {
          console.error("❌ Failed to delete existing events:", deleteError.message);
          throw deleteError;
        }
        console.log("✅ All existing events deleted from Supabase");
        
        console.log("🔄 Mapping events to Supabase schema...");
        // Map events to match Supabase schema
        const mappedEvents = filteredEvents.map(ev => ({
          id: ev.id,
          title: ev.title,
          date_time: ev.dateTime || ev.dates || '',
          location: ev.location || '',
          location_venue: ev.locationVenue || '',
          location_address: ev.locationAddress || '',
          location_city: ev.locationCity || '',
          full_location: ev.fullLocation || '',
          description: ev.description || '',
          categories: ev.categories || [],
          host: ev.host || '',
          image: ev.image || '',
          event_link: ev.eventLink || '',
          link: ev.link || '',
          source: ev.source || '',
          created_at: ev.created_at,
          updated_at: ev.updated_at
        }));
        
        console.log(`📤 Uploading ${mappedEvents.length} events to Supabase...`);
        const { data, error } = await supabase
          .from("events")
          .insert(mappedEvents)
          .select();
          
        if (error) throw error;
        console.log("✅ Events uploaded to Supabase!");
        console.log(`📊 Uploaded ${data.length} events to database`);
      } catch (err) {
        console.error("❌ Failed to upload events to Supabase:", err.message);
      }
    } else {
      console.log("⚠️ Supabase not configured - skipping database upload");
    }

    console.log("✅ Events combined and pushed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to combine and push events:", error.message);
    process.exit(1);
  }
})(); 
