// Test script to verify date parsing
const getMonthIndex = (monthName) => {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return months.indexOf(monthName.toLowerCase());
};

const normalizeEventDate = (dateString) => {
  // Handle "Month Day, Year" format (e.g., "July 3, 2025")
  const monthDayYearMatch = dateString.match(/(\w+) (\d{1,2}), (\d{4})/);
  if (monthDayYearMatch) {
    const [, month, day, year] = monthDayYearMatch;
    // Create date in UTC to avoid timezone issues
    const date = new Date(Date.UTC(parseInt(year), getMonthIndex(month), parseInt(day)));
    return date.toISOString().slice(0, 10);
  }
  
  // Handle "Month Day Year" format (e.g., "July 3 2025")
  const monthDayYearNoCommaMatch = dateString.match(/(\w+) (\d{1,2}) (\d{4})/);
  if (monthDayYearNoCommaMatch) {
    const [, month, day, year] = monthDayYearNoCommaMatch;
    // Create date in UTC to avoid timezone issues
    const date = new Date(Date.UTC(parseInt(year), getMonthIndex(month), parseInt(day)));
    return date.toISOString().slice(0, 10);
  }
  
  // Try to parse as a regular date
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  
  // Fallback: use today
  return new Date().toISOString().slice(0, 10);
};

// Test cases
const testDates = [
  "July 3, 2025",
  "July 4, 2025", 
  "July 5, 2025",
  "December 25, 2024",
  "January 1, 2025"
];

console.log("Testing date parsing:");
testDates.forEach(dateStr => {
  const normalized = normalizeEventDate(dateStr);
  const displayDate = new Date(normalized).toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  console.log(`${dateStr} -> ${normalized} -> ${displayDate}`);
}); 