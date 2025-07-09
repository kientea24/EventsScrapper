# Harvard Events Scraper

A comprehensive event scraping and processing system for Harvard University events from multiple sources.

## 🚀 Quick Start

```bash
# Start the development server (runs all scrapers automatically)
npm run dev

# Run all scrapers and processors manually
npm run refresh

# Run individual components
npm run scrape:all      # Scrape all sources
npm run combine         # Combine and deduplicate events
npm run process:times   # Group events by time
```

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server (automatically runs scrapers)
- `npm run dev:fresh` - Fresh scrape + dev server
- `npm run refresh` - Run all scrapers and processors
- `npm run refresh:full` - Full refresh + start dev server

### Scraping
- `npm run scrape:all` - Scrape Harvard Gazette and Harvard Engage
- `npm run scrape:gazette` - Scrape Harvard Gazette events only
- `npm run scrape:engage` - Scrape Harvard Engage events only

### Processing
- `npm run combine` - Combine and deduplicate events from all sources
- `npm run process:times` - Extract times and group events by date/time

## 🔧 Features

### Smart Date Handling
- **Current Date Detection**: Automatically detects the most current date for filtering
- **Multi-format Support**: Handles various date formats from different sources
- **Timezone Awareness**: Accounts for timezone differences in date filtering

### Duplicate Prevention
- **Cross-source Deduplication**: Removes duplicates between Harvard Gazette and Harvard Engage
- **Smart Matching**: Uses title + date + location for accurate duplicate detection
- **Source Preference**: Harvard Engage events take precedence over Gazette events

### Time Grouping
- **Time Extraction**: Extracts times from both descriptions and date fields
- **Grouped Display**: Events with the same time are grouped together
- **Sorted Timeline**: Events are sorted chronologically by date and time

### Enhanced Scraping
- **Robust Error Handling**: Continues processing even if one source fails
- **Automatic Cleanup**: Removes old files before scraping
- **Comprehensive Logging**: Detailed progress and error reporting

## 📊 Data Flow

1. **Scraping Phase**
   - Harvard Gazette: Parses XML feed for events
   - Harvard Engage: Scrapes web interface with Puppeteer
   - Automatic deduplication within each source

2. **Combination Phase**
   - Merges events from all sources
   - Cross-source deduplication
   - Date filtering (current period onwards)
   - Source preference (Engage > Gazette)

3. **Time Processing Phase**
   - Extracts times from event descriptions and dates
   - Groups events by date and time
   - Creates sorted timeline
   - Generates grouped display format

## 📁 Output Files

- `all-harvard-events.json` - Combined and deduplicated events
- `harvard-events-grouped-by-date.json` - Events grouped by date and time
- `harvard-events-sorted-by-time.json` - Chronologically sorted events
- `last-update.json` - Metadata about the last update

## 🎯 Key Improvements

### Fixed Issues
- ✅ **Duplicate Engage Events**: Implemented robust deduplication logic
- ✅ **Missing Current Events**: Smart date filtering ensures current events are included
- ✅ **Time Grouping**: Events with same times are now properly grouped
- ✅ **Date Accuracy**: Enhanced date parsing for multiple formats

### New Features
- 🆕 **Automated Pipeline**: All scripts run automatically with `npm run dev`
- 🆕 **Smart Date Detection**: Gets the most current date regardless of timezone
- 🆕 **Enhanced Error Handling**: Graceful failure handling for individual scrapers
- 🆕 **Comprehensive Logging**: Detailed progress reporting for debugging

## 🔍 Troubleshooting

### Common Issues
1. **Events Missing**: Check if date filtering is too restrictive
2. **Duplicates Still Appear**: Verify deduplication logic is working
3. **Times Not Grouped**: Ensure time extraction patterns match your data

### Debug Commands
```bash
# Check current events
cat harvard/events/all-harvard-events.json | jq '.[0:5]'

# Check grouped events
cat harvard/events/harvard-events-grouped-by-date.json | jq 'keys[0:5]'

# Check for duplicates
grep "Farmers' Market" harvard/events/all-harvard-events.json
```

## 📈 Performance

- **Scraping**: ~30 seconds for both sources
- **Processing**: ~5 seconds for combination and time grouping
- **Total Pipeline**: ~45 seconds end-to-end
- **Memory Usage**: Minimal, processes events in streams

## 🤝 Contributing

To add new event sources:
1. Create a scraper in `harvard/scraping/`
2. Add it to the `run-all-scrapers.js` pipeline
3. Update the deduplication logic in `combine-all-events.js`
4. Test with `npm run refresh`
