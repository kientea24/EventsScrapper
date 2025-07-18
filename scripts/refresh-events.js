#!/usr/bin/env node

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

console.log("🔄 Manually refreshing Harvard events...");

try {
  // Run the scraper
  execSync("node ../harvard/scraping/run-all-scrapers.js", {
    cwd: __dirname,
    stdio: "inherit",
  });

  // If Supabase is configured, sync events to database
  if (supabase) {
    console.log("📤 Syncing events to Supabase...");

    // Read the combined events file
    const eventsPath = path.join(
      __dirname,
      "../harvard/events/all-harvard-events.json",
    );
    if (fs.existsSync(eventsPath)) {
      const eventsData = JSON.parse(fs.readFileSync(eventsPath, "utf8"));

      // TODO: Implement event syncing logic here
      // This will be implemented when the events table is created
      console.log(
        `📊 Found ${eventsData.length || 0} events to potentially sync`,
      );
    }
  } else {
    console.log("⚠️ Supabase not configured - skipping database sync");
  }

  console.log("✅ Events refreshed successfully!");
  process.exit(0);
} catch (error) {
  console.error("❌ Failed to refresh events:", error.message);
  process.exit(1);
}
