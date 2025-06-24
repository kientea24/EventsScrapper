import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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

  const defaultPrograms: Program[] = [
    {
      id: "1",
      title: "Semester in Paris",
      university: "Harvard University",
      location: "Paris, France",
      dates: "Fall 2023",
      description:
        "Immerse yourself in French culture while studying at Sciences Po Paris. Open to all liberal arts majors.",
      image:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80",
      type: "study",
      tags: ["Europe", "Language", "Liberal Arts"],
    },
    {
      id: "2",
      title: "Marine Biology Research",
      university: "Harvard University",
      location: "Great Barrier Reef, Australia",
      dates: "Summer 2023",
      description:
        "Join our research team studying coral reef conservation and marine ecosystems.",
      image:
        "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=600&q=80",
      type: "research",
      tags: ["Science", "Environmental", "Field Work"],
    },
    {
      id: "3",
      title: "Global Leadership Summit",
      university: "Harvard University",
      location: "Cambridge, MA",
      dates: "April 15-17, 2023",
      description:
        "Connect with industry leaders and fellow students at this annual leadership conference.",
      image:
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
      type: "event",
      tags: ["Networking", "Leadership", "Career"],
    },
    {
      id: "4",
      title: "Tokyo Tech Exchange",
      university: "Harvard University",
      location: "Tokyo, Japan",
      dates: "Spring 2023",
      description:
        "Study engineering and computer science at one of Japan's premier technical institutions.",
      image:
        "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&q=80",
      type: "study",
      tags: ["Asia", "Engineering", "Tech"],
    },
    {
      id: "5",
      title: "Climate Change Research Initiative",
      university: "Harvard University",
      location: "Multiple Locations",
      dates: "Year-round",
      description:
        "Participate in ongoing climate research with opportunities for field work and data analysis.",
      image:
        "https://images.unsplash.com/photo-1569950044272-a6fe7c9957a1?w=600&q=80",
      type: "research",
      tags: ["Environmental", "Data Science", "Global"],
    },
    {
      id: "6",
      title: "Entrepreneurship Hackathon",
      university: "Harvard University",
      location: "Cambridge, MA",
      dates: "March 10-12, 2023",
      description:
        "A 48-hour innovation challenge to develop and pitch startup ideas with mentorship from industry experts.",
      image:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80",
      type: "event",
      tags: ["Entrepreneurship", "Innovation", "Competition"],
    },
  ];

  // Combine default programs with external events
  const [allPrograms, setAllPrograms] = useState<Program[]>(defaultPrograms);

  useEffect(() => {
    if (externalEvents.length > 0) {
      setAllPrograms((prev) => [...prev, ...externalEvents]);
    }
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
      );

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
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
                    <div className="space-y-8">
                      {campusEvents.map((program, index) => (
                        <TimelineEventCard
                          key={program.id}
                          program={program}
                          isLast={index === campusEvents.length - 1}
                          onEdit={(updatedProgram) => {
                            setAllPrograms((prev) =>
                              prev.map((p) =>
                                p.id === updatedProgram.id ? updatedProgram : p,
                              ),
                            );
                          }}
                          onDelete={(programId) => {
                            setAllPrograms((prev) =>
                              prev.filter((p) => p.id !== programId),
                            );
                          }}
                        />
                      ))}
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
              <CardContent className="pt-0">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map(
                    (_, index) => (
                      <div key={`empty-${index}`} className="h-8"></div>
                    ),
                  )}
                  {Array.from({ length: getDaysInMonth(currentMonth) }).map(
                    (_, index) => {
                      const day = index + 1;
                      const isToday =
                        new Date().getDate() === day &&
                        new Date().getMonth() === currentMonth.getMonth() &&
                        new Date().getFullYear() === currentMonth.getFullYear();
                      const isSelected = selectedDate === day;

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(day)}
                          className={`h-8 w-8 text-sm rounded transition-colors ${
                            isToday
                              ? "bg-blue-600 text-white"
                              : isSelected
                                ? "bg-purple-100 text-purple-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming/Past Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md bg-white text-gray-900 shadow-sm transition-colors">
                Upcoming
              </button>
              <button className="flex-1 py-2 px-3 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 transition-colors">
                Past
              </button>
            </div>
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

interface EventCardProps {
  program: Program;
}

const EventCard = ({ program }: EventCardProps) => {
  return (
    <Card className="bg-white border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={program.image}
              alt={program.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {program.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{program.dates}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{program.location}</span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
              >
                Register
              </Button>
            </div>
            <p className="text-sm text-gray-700 mb-3">{program.description}</p>
            <div className="flex flex-wrap gap-2">
              {program.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface TimelineEventCardProps {
  program: Program;
  isLast: boolean;
  onEdit?: (program: Program) => void;
  onDelete?: (programId: string) => void;
}

const TimelineEventCard = ({
  program,
  isLast,
  onEdit,
  onDelete,
}: TimelineEventCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProgram, setEditedProgram] = useState(program);

  const handleSave = () => {
    if (onEdit) {
      onEdit(editedProgram);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && confirm("Are you sure you want to delete this event?")) {
      onDelete(program.id);
    }
  };
  return (
    <div className="relative flex items-start space-x-6 pb-8">
      {/* Timeline dot */}
      <div className="relative z-10 flex-shrink-0">
        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Calendar className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Event content */}
      <div className="flex-1 min-w-0">
        <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex">
            {/* Event image */}
            <div className="w-24 h-24 flex-shrink-0">
              <img
                src={program.image}
                alt={program.title}
                className="w-full h-full object-cover rounded-l-lg"
              />
            </div>

            {/* Event details */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editedProgram.title}
                        onChange={(e) =>
                          setEditedProgram({
                            ...editedProgram,
                            title: e.target.value,
                          })
                        }
                        className="font-semibold text-lg"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={editedProgram.dates}
                          onChange={(e) =>
                            setEditedProgram({
                              ...editedProgram,
                              dates: e.target.value,
                            })
                          }
                          placeholder="Date"
                          className="flex-1"
                        />
                        <Input
                          value={editedProgram.location}
                          onChange={(e) =>
                            setEditedProgram({
                              ...editedProgram,
                              location: e.target.value,
                            })
                          }
                          placeholder="Location"
                          className="flex-1"
                        />
                      </div>
                      <textarea
                        value={editedProgram.description}
                        onChange={(e) =>
                          setEditedProgram({
                            ...editedProgram,
                            description: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded text-sm"
                        rows={2}
                      />
                      <Input
                        value={editedProgram.tags.join(", ")}
                        onChange={(e) =>
                          setEditedProgram({
                            ...editedProgram,
                            tags: e.target.value
                              .split(", ")
                              .filter((t) => t.trim()),
                          })
                        }
                        placeholder="Tags (comma separated)"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">
                        {program.title}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="font-medium text-purple-600">
                          {program.dates}
                        </span>
                        <span className="mx-2">•</span>
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{program.location}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {program.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {program.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="ml-4 flex flex-col gap-2">
                  {!isEditing && (
                    <>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                      >
                        Register
                      </Button>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="text-xs px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDelete}
                          className="text-xs px-2 text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
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

export default UniversityPortal;
