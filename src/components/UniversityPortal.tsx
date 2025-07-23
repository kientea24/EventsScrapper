import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  Calendar,
  BookOpen,
  Beaker,
  Users,
  Clock,
  Globe,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
// Removed Select imports since we're using native select
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import EventPanel from "./EventPanel";

interface Program {
  id: string;
  title: string;
  university: string;
  location: string;
  dates: string;
  description: string;
  image: string;
  type: "study" | "research" | "event";
  tags: string[];
  link?: string;
  weblink?: string;
  cost?: string;
  organization?: string;
  source?: string;
  time?: string; // Added time field
  locationVenue?: string; // Added for Gazette events
  locationAddress?: string; // Added for Gazette events
  locationCity?: string; // Added for Gazette events
}

interface UniversityPortalProps {
  onEventCreate?: (event: Program) => void;
  externalEvents?: Program[];
}

const UniversityPortal = ({
  onEventCreate,
  externalEvents = [],
}: UniversityPortalProps = {}) => {
  const [selectedUniversity, setSelectedUniversity] =
    useState<string>("Harvard University");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  // Mock data for university programs
  const universities = [
    "Harvard University",
    "Stanford University",
    "MIT",
    "Yale University",
    "Princeton University",
    "Columbia University",
    "UC Berkeley",
    "University of Chicago",
  ];

  // Use only externalEvents (from Supabase) as the event source
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  useEffect(() => {
    setAllPrograms(externalEvents || []);
  }, [externalEvents]);

  // Helper function to parse dates for sorting
  const parseEventDate = (dateString: string) => {
    // Handle different date formats
    if (dateString.includes("-")) {
      // Format like "April 15-17, 2023" or "March 10-12, 2023"
      const parts = dateString.split(",");
      if (parts.length === 2) {
        const year = parts[1].trim();
        const monthDay = parts[0].trim();
        const monthName = monthDay.split(" ")[0];
        const day = monthDay.split(" ")[1].split("-")[0];
        return new Date(`${monthName} ${day}, ${year}`);
      }
    }

    // Handle formats like "Fall 2023", "Spring 2023", "Summer 2023"
    if (dateString.includes("Fall")) {
      const year = dateString.split(" ")[1];
      return new Date(`September 1, ${year}`);
    }
    if (dateString.includes("Spring")) {
      const year = dateString.split(" ")[1];
      return new Date(`January 1, ${year}`);
    }
    if (dateString.includes("Summer")) {
      const year = dateString.split(" ")[1];
      return new Date(`June 1, ${year}`);
    }
    if (dateString.includes("Year-round")) {
      return new Date(); // Current date for year-round programs
    }

    // Try to parse as a regular date
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Filter programs based on selected university and tab
  const filterPrograms = (type: "study" | "research" | "event") => {
    console.log(`Filtering programs for type: ${type}, university: ${selectedUniversity}`);
    console.log(`Total programs: ${allPrograms.length}`);
    console.log(`Selected sources: ${selectedSources}`);
    
    const filtered = allPrograms
      .filter(
        (program) =>
          program.university === selectedUniversity && program.type === type,
      )
      .filter(
        (program) =>
          searchQuery === "" ||
          program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          program.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          program.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          program.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      )
      .filter((program) => {
        // Add debugging to see what's happening
        console.log(`Filtering event: "${program.title}" (source: "${program.source}")`);
        console.log(`Selected sources: [${selectedSources.join(', ')}]`);
        
        if (selectedSources.length === 0 || selectedSources.length === 2) {
          // No filters or both checked: show all
          console.log(`  -> Including (no filter or both checked)`);
          return true;
        }
        
        // Only one checked: show only that source
        const hasMatchingSource = program.source && selectedSources.includes(program.source);
        console.log(`  -> Including: ${hasMatchingSource} (source match: ${hasMatchingSource})`);
        return hasMatchingSource;
      });

    console.log(`Filtered programs: ${filtered.length}`);
    if (selectedSources.length > 0) {
      const sourceCounts = filtered.reduce((acc, program) => {
        acc[program.source || 'unknown'] = (acc[program.source || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('Source breakdown:', sourceCounts);
    }

    // Sort events by date (earliest first)
    if (type === "event") {
      return filtered.sort((a, b) => {
        const dateA = parseEventDate(a.dates);
        const dateB = parseEventDate(b.dates);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return filtered;
  };

  const studyAbroads = filterPrograms("study");
  const researchPositions = filterPrograms("research");
  const campusEvents = filterPrograms("event");

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Helper to normalize event date to YYYY-MM-DD
  const normalizeEventDate = (dateString: string) => {
    // Handle Harvard Engage format: "Thursday, July 10 at 9:00AM EDT"
    const engageMatch = dateString.match(/([A-Za-z]+,\s*[A-Za-z]+\s+\d{1,2})\s+at\s+\d{1,2}:\d{2}[AP]M\s+[A-Z]+/);
    if (engageMatch) {
      const datePart = engageMatch[1]; // "Thursday, July 10"
      const monthDayMatch = datePart.match(/([A-Za-z]+)\s+(\d{1,2})/);
      if (monthDayMatch) {
        const [, month, day] = monthDayMatch;
        // Use current year for Harvard Engage events
        const year = new Date().getFullYear();
        const date = new Date(Date.UTC(year, getMonthIndex(month), parseInt(day)));
        return date.toISOString().slice(0, 10);
      }
    }
    
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

  // Helper function to get month index
  const getMonthIndex = (monthName: string) => {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return months.indexOf(monthName.toLowerCase());
  };

  // Group events by normalized date
  const groupEventsByDay = (events: Program[]) => {
    const grouped: { [date: string]: Program[] } = {};
    events.forEach((event) => {
      const day = normalizeEventDate(event.dates);
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(event);
    });
    // Sort keys chronologically
    const sortedKeys = Object.keys(grouped).sort();
    return { grouped, sortedKeys };
  };

  // Infinite scroll state
  const [daysToShow, setDaysToShow] = useState(7);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Calendar day selection state
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Helper to create a strict deduplication key for an event
  const getEventDedupKey = (event: Program) => {
    return [
      (event.title || '').trim().toLowerCase(),
      normalizeEventDate(event.dates),
      (event.location || '').trim().toLowerCase(),
    ].join('|');
  };

  // Deduplicate events by strict key (title|date|location)
  const deduplicateEvents = (events: Program[]) => {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = getEventDedupKey(event);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Filter events by source first
  const filteredEvents = campusEvents
    .filter((program) => {
      if (selectedSources.length === 0 || selectedSources.length === 2) {
        // No filters or both checked: show all
        return true;
      }
      
      // Only one checked: show only that source
      return program.source && selectedSources.includes(program.source);
    });

  // Apply frontend deduplication before grouping
  const dedupedFilteredEvents = deduplicateEvents(filteredEvents);

  // Group filtered events by day
  const { grouped, sortedKeys } = groupEventsByDay(dedupedFilteredEvents);

  // Filter events based on selected calendar day
  const getFilteredEvents = () => {
    if (!selectedCalendarDay) {
      return sortedKeys.slice(0, daysToShow);
    }
    return sortedKeys.filter(day => day === selectedCalendarDay);
  };

  const filteredEventDays = getFilteredEvents();

  // Infinite scroll: load more days when bottom is reached
  const handleLoadMore = useCallback(() => {
    if (selectedCalendarDay) return; // Don't load more when filtering
    setDaysToShow((prev) => Math.min(prev + 1, sortedKeys.length));
  }, [sortedKeys.length, selectedCalendarDay]);

  // Handle calendar day click
  const handleCalendarDayClick = (day: string) => {
    if (selectedCalendarDay === day) {
      setSelectedCalendarDay(null); // Unfilter
    } else {
      setSelectedCalendarDay(day); // Filter to this day
    }
  };

  // Check if a calendar day has events
  const hasEventsOnDay = (day: string) => {
    return sortedKeys.includes(day);
  };

  // Get events for a specific calendar day
  const getEventsForCalendarDay = (day: string) => {
    return grouped[day] || [];
  };

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        handleLoadMore();
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  // Add error boundary
  if (!allPrograms || allPrograms.length === 0) {
    console.log('No programs available');
  }

  return (
    <div className="w-full bg-white min-h-screen">
      {/* University Banner */}
      <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-12 mb-8 rounded-2xl mx-6 mt-6">
        <div className="absolute top-6 right-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <span className="text-2xl">🚀</span>
          </div>
        </div>

        <div className="max-w-4xl relative">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-6">
              Join the best place in the world to learn real AI skills.
            </h1>
            <p className="text-white/90 text-xl mb-8">
              Learn, Earn and Build 100% free ✨
            </p>
          </div>

          {/* School Profile - Bottom Left */}
          <div className="absolute bottom-0 left-0 flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-bold text-lg">H</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Harvard University
              </h2>
              <div className="flex items-center text-white/80 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                <span>Cambridge — 2:30 PM EST</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by keyword, location, or interest..."
              className="pl-10 bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Events</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </Button>
              <Button
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
              >
                <Users className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1">
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="mb-8 bg-gray-100">
                <TabsTrigger
                  value="events"
                  className="flex items-center gap-2 data-[state=active]:bg-white text-gray-600 data-[state=active]:text-gray-900"
                >
                  <Users className="h-4 w-4" />
                  Events
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-purple-100 text-purple-700"
                  >
                    {campusEvents.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="study"
                  className="flex items-center gap-2 data-[state=active]:bg-white text-gray-600 data-[state=active]:text-gray-900"
                >
                  <BookOpen className="h-4 w-4" />
                  Study Abroad
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-purple-100 text-purple-700"
                  >
                    {studyAbroads.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="research"
                  className="flex items-center gap-2 data-[state=active]:bg-white text-gray-600 data-[state=active]:text-gray-900"
                >
                  <Beaker className="h-4 w-4" />
                  Research
                  <Badge
                    variant="secondary"
                    className="ml-1 bg-purple-100 text-purple-700"
                  >
                    {researchPositions.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="study" className="mt-0">
                {studyAbroads.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyAbroads.map((program) => (
                      <ProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No study abroad programs found. Try changing your search or university selection." />
                )}
              </TabsContent>

              <TabsContent value="research" className="mt-0">
                {researchPositions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {researchPositions.map((program) => (
                      <ProgramCard key={program.id} program={program} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No research positions found. Try changing your search or university selection." />
                )}
              </TabsContent>

              <TabsContent value="events" className="mt-0">
                {campusEvents.length > 0 ? (
                  <div className="relative">
                    {/* Source filter checkboxes */}
                    <div className="mb-6 flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes("Harvard Gazette")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSources(prev => [...prev, "Harvard Gazette"]);
                            } else {
                              setSelectedSources(prev => prev.filter(s => s !== "Harvard Gazette"));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Harvard Gazette</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes("Harvard Engage")}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSources(prev => [...prev, "Harvard Engage"]);
                            } else {
                              setSelectedSources(prev => prev.filter(s => s !== "Harvard Engage"));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Harvard Engage</span>
                      </label>
                    </div>
                    
                    {/* Timeline line - moved down to avoid overlap with filters */}
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
                    <div className="space-y-12" key={`events-${selectedSources.join('-')}`}>
                      {filteredEventDays.map((day, idx) => (
                        <div key={day} className="space-y-8">
                          <div className="flex items-center gap-2 mb-2 ml-16 mt-8">
                            <span className="text-lg font-bold text-purple-700">
                              {new Date(day).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <Badge className="bg-purple-100 text-purple-700">{grouped[day].length} event{grouped[day].length > 1 ? 's' : ''}</Badge>
                          </div>
                          {renderDayEvents(grouped[day])}
                        </div>
                      ))}
                      {/* Infinite scroll loader */}
                      {!selectedCalendarDay && daysToShow < sortedKeys.length && (
                        <div ref={loadMoreRef} className="flex justify-center py-8">
                          <Button variant="outline" disabled>
                            Loading more days...
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No campus events found. Try changing your search or university selection." />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar with Calendar */}
          <div className="w-80 space-y-6">
            {/* Mini Calendar */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {monthNames[currentMonth.getMonth()]}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigateMonth("prev")}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigateMonth("next")}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <div
                      key={day}
                      className="h-8 flex items-center justify-center text-gray-500 font-medium"
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map(
                    (_, index) => (
                      <div key={`empty-${index}`} className="h-8"></div>
                    ),
                  )}
                  {Array.from({ length: getDaysInMonth(currentMonth) }).map(
                    (_, index) => {
                      const day = index + 1;
                      const dateString = `${currentMonth.getFullYear()}-${String(
                        currentMonth.getMonth() + 1,
                      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const hasEvents = hasEventsOnDay(dateString);
                      const isSelected = selectedCalendarDay === dateString;
                      const isToday = dateString === new Date().toISOString().slice(0, 10);

                      return (
                        <Button
                          key={day}
                          size="sm"
                          variant="ghost"
                          className={`h-8 w-8 p-0 text-xs relative ${
                            isSelected
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : hasEvents
                              ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                              : isToday
                              ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          onClick={() => handleCalendarDayClick(dateString)}
                        >
                          {day}
                          {hasEvents && !isSelected && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full"></div>
                          )}
                        </Button>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected Day Info */}
            {selectedCalendarDay && (
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(selectedCalendarDay).toLocaleDateString(undefined, { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCalendarDay(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getEventsForCalendarDay(selectedCalendarDay).map((event) => (
                      <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {event.location}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {event.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProgramCardProps {
  program: Program;
}

const ProgramCard = ({ program }: ProgramCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col bg-white border-gray-200">
      <div className="h-48 overflow-hidden">
        <img
          src={program.image}
          alt={program.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-gray-900">
          {program.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="h-3.5 w-3.5" /> {program.location}
        </CardDescription>
        <CardDescription className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="h-3.5 w-3.5" /> {program.dates}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-700">{program.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {program.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white">
          Learn More
        </Button>
      </CardFooter>
    </Card>
  );
};

interface EmptyStateProps {
  message: string;
}

const EmptyState = ({ message }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Search className="h-12 w-12 text-gray-400" />
          </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Results Found
                </h3>
      <p className="text-gray-600 max-w-md">{message}</p>
                </div>
  );
};

// --- Minimalist TimelineEventCard with location popover and controls ---
interface TimelineEventCardProps {
  program: Program;
  isLast: boolean;
  onDelete?: (id: string) => void;
}

const TimelineEventCard = ({ program, isLast, onDelete }: TimelineEventCardProps) => {
  const [open, setOpen] = useState(false);
  const isTBD = !program.time || program.time.trim().toLowerCase() === 'tbd';
  // For Gazette events, extract only the venue name (first part before a digit, comma, or 'Cambridge'), and remove weekdays
  let locationDisplay = program.location || '';
  let locationVenue = '';
  let locationAddress = '';
  let locationMapUrl = '';
  let showMapLink = false;
  if (program.source && program.source.toLowerCase().includes('gazette')) {
    // For Gazette events, check if it has a full address pattern
    if (locationDisplay.includes(',') || locationDisplay.includes('St.') || locationDisplay.includes('Ave.') || locationDisplay.includes('Cambridge')) {
      // Full address detected - split like Engage events
      const parts = locationDisplay.split(/(?=\d)/); // Split before first digit
      if (parts.length > 1) {
        locationVenue = parts[0].trim();
        locationAddress = parts.slice(1).join('').trim();
        // Check for "View Map" link
        if (locationAddress.includes('View Map')) {
          const mapParts = locationAddress.split('View Map');
          locationAddress = mapParts[0].trim();
          locationMapUrl = `https://maps.google.com/?q=${encodeURIComponent(locationAddress)}`;
          showMapLink = true;
    }
      } else {
        locationDisplay = locationDisplay.replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, '').trim();
        const match = locationDisplay.match(/^[^\d,\n<]+/);
        if (match) {
          locationDisplay = match[0].trim();
        }
        locationDisplay = locationDisplay.replace(/Harvard University|Harvard Yard/gi, '').trim();
      }
    } else {
      // Apply existing Gazette logic for simple locations
      locationDisplay = locationDisplay.replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, '').trim();
      const match = locationDisplay.match(/^[^\d,\n<]+/);
      if (match) {
        locationDisplay = match[0].trim();
      }
      locationDisplay = locationDisplay.replace(/Harvard University|Harvard Yard/gi, '').trim();
    }
  } else if (program.source && program.source.toLowerCase().includes('engage')) {
    // Engage logic unchanged
    const parts = locationDisplay.split(/(?=\d)/);
    if (parts.length > 1) {
      locationVenue = parts[0].trim();
      locationAddress = parts.slice(1).join('').trim();
      if (locationAddress.includes('View Map')) {
        const mapParts = locationAddress.split('View Map');
        locationAddress = mapParts[0].trim();
        locationMapUrl = `https://maps.google.com/?q=${encodeURIComponent(locationAddress)}`;
        showMapLink = true;
    }
    }
  }
  // For Engage and all other events, show full address as is (do not modify, do not split)
  return (
    <>
      <div className="relative flex items-stretch pb-2">
        {/* Timeline column: vertical line and dot, fixed width */}
        <div className="relative flex flex-col items-center" style={{ width: 48, minWidth: 48 }}>
          {/* Vertical timeline line (runs full height except for last event) */}
          <div className="absolute left-1/2 top-0 w-1 h-full bg-gradient-to-b from-purple-200 to-pink-100" style={{ transform: 'translateX(-50%)', zIndex: 0, borderRadius: 2, opacity: 0.7 }} />
      {/* Timeline dot */}
          <div className="relative z-10 mt-2 mb-1">
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow" />
        </div>
          {/* Time badge (if not TBD) */}
          {!isTBD && (
            <div className="relative z-10 px-2 py-0.5 rounded bg-white border border-purple-200 text-purple-700 font-semibold text-xs shadow-sm mt-1 mb-2">
              {program.time}
      </div>
          )}
        </div>
        {/* Event content and location, grid layout for alignment */}
        <div className="flex-1 grid grid-cols-[minmax(0,1fr)_minmax(120px,220px)_auto] gap-4 items-stretch">
          {/* Main event info */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150 p-2 gap-3 min-h-[64px]">
            {/* Small event image */}
              <img
                src={program.image}
                alt={program.title}
              className="w-12 h-12 object-cover rounded-md flex-shrink-0 border border-gray-100"
              />
            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {/* Event title as clickable, opens details sheet */}
                <button
                  onClick={() => setOpen(true)}
                  className="font-semibold text-purple-700 text-sm truncate hover:underline focus:outline-none bg-transparent border-none p-0 m-0 cursor-pointer"
                  tabIndex={0}
                  type="button"
                >
                        {program.title}
                </button>
                      </div>
              {/* Date (if not TBD) */}
              {!isTBD && (
                <span className="text-xs text-gray-500 font-medium mr-2">{program.dates}</span>
              )}
              {/* Minimal description, 1-2 lines only */}
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{program.description}</p>
                        </div>
                      </div>
          {/* Location column, vertically padded, always wraps, never truncates */}
          <div className="flex flex-col justify-center items-start px-3 py-3 bg-white border border-gray-200 rounded-lg min-w-[120px] max-w-[220px] text-xs text-blue-800 font-medium whitespace-pre-line break-words" style={{minHeight: '2.2em'}}>
            {program.source && program.source.toLowerCase().includes('engage') ? (
              <span>{program.location.replace(' View Map', '')}</span>
            ) : program.source && program.source.toLowerCase().includes('gazette') ? (
              program.locationVenue || program.locationAddress || program.locationCity ? (
                <>
                  {program.locationVenue && <span>{program.locationVenue}</span>}
                  {program.locationAddress && <span>{program.locationAddress}</span>}
                  {program.locationCity && <span>{program.locationCity}</span>}
                </>
              ) : locationVenue && locationAddress ? (
                <>
                  <span>{locationVenue}</span>
                  <span>{locationAddress}</span>
                  {program.locationCity && <span>{program.locationCity}</span>}
                </>
              ) : (
                <span>{locationDisplay}</span>
              )
            ) : (
              <span>{program.location}</span>
                  )}
                </div>
          {/* Delete button, vertically centered */}
          <div className="flex items-center h-full">
            <button
              className="px-2 py-1 rounded border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 focus:outline-none"
              onClick={() => onDelete && onDelete(program.id)}
              type="button"
                        >
                          Delete
            </button>
                      </div>
                </div>
              </div>
      {/* Event Details Sheet (now uses EventPanel) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="max-w-lg w-full p-0 bg-white overflow-y-auto">
          <EventPanel event={program} />
        </SheetContent>
      </Sheet>
    </>
  );
};
// --- END Minimalist TimelineEventCard with location popover and controls ---

// --- Grouping and rendering logic update ---
// When rendering events for a day, group TBD events first (no time), then timed events sorted by time
const renderDayEvents = (events: Program[]) => {
  // TBD events: no time or time is empty/null
  const tbdEvents = events.filter(e => !e.time || e.time.trim().toLowerCase() === 'tbd');
  // Timed events: have a time
  const timedEvents = events.filter(e => e.time && e.time.trim().toLowerCase() !== 'tbd');
  // Sort timed events by time (assume 12-hour format, fallback to string sort)
  const parseTime = (t: string) => {
    if (!t) return 0;
    const match = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (!match) return 0;
    let hour = parseInt(match[1], 10);
    let min = match[2] ? parseInt(match[2], 10) : 0;
    const pm = match[3] && match[3].toLowerCase() === 'pm';
    if (pm && hour !== 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
    return hour * 60 + min;
  };
  timedEvents.sort((a, b) => parseTime(a.time) - parseTime(b.time));
  // Render: TBD events (no heading), then timed events (with time badge)
  return [
    ...tbdEvents.map((program, idx) => (
      <TimelineEventCard key={program.id} program={program} isLast={false} />
    )),
    ...timedEvents.map((program, idx) => (
      <TimelineEventCard key={program.id} program={program} isLast={idx === timedEvents.length - 1} />
    )),
  ];
};
// --- END Grouping and rendering logic update ---

export default UniversityPortal;
