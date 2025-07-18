#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🔄 Manually refreshing Harvard events...");

try {
  // Run Engage scraper (HTML, not API)
  console.log("Running Engage scraper...");
  execSync("node harvard/scraping/scrape-engage-universal.cjs harvard", {
    stdio: "inherit",
  });

  // Run Gazette scraper (HTML)
  console.log("Running Gazette scraper...");
  execSync("node harvard/scraping/scrape-harvard-engage-robust.cjs", {
    stdio: "inherit",
  });

  // Optionally, run other scrapers here...

  // Combine all results into all-harvard-events.json
  console.log("Combining all events...");
  execSync("node harvard/events/combine-all-events.js", { stdio: "inherit" });

  // If Supabase is configured, prepare for syncing
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (supabaseUrl && supabaseServiceKey) {
    console.log("📤 Supabase configured - events ready for sync");

    // Read the combined events file
    const eventsPath = path.join(
      __dirname,
      "../harvard/events/all-harvard-events.json",
    );
    if (fs.existsSync(eventsPath)) {
      const eventsData = JSON.parse(fs.readFileSync(eventsPath, "utf8"));
      console.log(
        `📊 Found ${eventsData.length || 0} events ready for database sync`,
      );

      // TODO: Implement event syncing logic here
      // This will be implemented when the events table is created
    }
  } else {
    console.log("⚠️ Supabase not configured - skipping database preparation");
  }

  console.log("✅ Events refreshed successfully!");
  process.exit(0);
} catch (error) {
  console.error("❌ Failed to refresh events:", error.message);
  process.exit(1);
}
