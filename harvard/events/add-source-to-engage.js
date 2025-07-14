import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addSourceToEngage() {
  console.log('🔄 Adding source field to Harvard Engage events...');
  
  try {
    const engagePath = path.join(__dirname, 'parsed-harvard-engage.json');
    if (fs.existsSync(engagePath)) {
      const engageEvents = JSON.parse(fs.readFileSync(engagePath, 'utf8'));
      console.log(`📝 Found ${engageEvents.length} Harvard Engage events`);
      
      // Add source field to each event
      const updatedEvents = engageEvents.map(event => ({
        ...event,
        source: "Harvard Engage"
      }));
      
      // Save updated events
      fs.writeFileSync(engagePath, JSON.stringify(updatedEvents, null, 2));
      console.log(`✅ Added source field to ${updatedEvents.length} Harvard Engage events`);
    }
  } catch (error) {
    console.log('❌ Error adding source field:', error.message);
  }
}

addSourceToEngage(); 