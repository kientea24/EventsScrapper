const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables for backend");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Batch insert events with conflict resolution
const batchInsertEvents = async (events) => {
  try {
    // Map events to match Supabase schema
    const mappedEvents = events.map(ev => ({
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
    
    const { data, error } = await supabase
      .from("events")
      .upsert(mappedEvents, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error batch inserting events:", error);
    throw error;
  }
};

module.exports = { batchInsertEvents }; 