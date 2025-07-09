import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  Settings,
  User,
  Send,
  CheckCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import OpportunityExplorer from "./OpportunityExplorer";
import UniversityPortal from "./UniversityPortal";
import PersonalDashboard from "./PersonalDashboard";

// Import the parsed Harvard events
import harvardEventsData from "../../harvard/events/all-harvard-events.json";

const Home = ({ initialSignedInState = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignedIn, setIsSignedIn] = useState(initialSignedInState);

  useEffect(() => {
    // Check if user came from authentication with signed in state
    if (location.state?.isSignedIn) {
      setIsSignedIn(true);
    }
  }, [location.state]);
  const [activeTab, setActiveTab] = useState("university");
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    location: "",
    date: "",
    description: "",
    tags: "",
  });
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      user: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      verified: true,
      message:
        "Just found an amazing research fellowship at MIT! They're looking for students in AI/ML. Application deadline is next month. DM me for details! 🚀",
      timestamp: "2 hours ago",
      type: "opportunity",
    },
    {
      id: 2,
      user: "Marcus Johnson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
      verified: true,
      message:
        "Google Summer of Code applications are open! Perfect for CS students. I participated last year and it was life-changing. Happy to share my experience!",
      timestamp: "4 hours ago",
      type: "opportunity",
    },
    {
      id: 3,
      user: "Elena Rodriguez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=elena",
      verified: true,
      message:
        "Fulbright scholarship applications closing soon! Don't miss out on this incredible opportunity to study abroad. I'm a current recipient - AMA!",
      timestamp: "6 hours ago",
      type: "opportunity",
    },
    {
      id: 4,
      user: "David Kim",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      verified: true,
      message:
        "Tesla internship program just opened! They're hiring for multiple positions across engineering and business. Great opportunity for hands-on experience.",
      timestamp: "8 hours ago",
      type: "opportunity",
    },
  ]);

  const [createdEvents, setCreatedEvents] = useState<any[]>([]);

  // Transform Harvard events data to match the Program interface
  const transformHarvardEvents = () => {
    // Helper to extract time from description (for Gazette)
    function extractTimeFromDescription(description) {
      if (!description) return null;
      // Try to match time ranges first (e.g., 9am – 5pm, 7:30pm - 9pm, etc.)
      const rangePatterns = [
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[–—-]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+to\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
      ];
      for (const pattern of rangePatterns) {
        const match = description.match(pattern);
        if (match) {
          return `${match[1].trim()} – ${match[2].trim()}`;
        }
      }
      // Single time (e.g., 7pm, 9:30am)
      const singlePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i;
      const singleMatch = description.match(singlePattern);
      if (singleMatch) {
        return singleMatch[1].trim();
      }
      return null;
    }

    // Helper to extract time from Engage dates field
    function extractTimeFromDates(dates) {
      if (!dates) return null;
      // e.g., "Thursday, July 10 at 9:00AM EDT"
      const match = dates.match(/at\s+(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (match) {
        return match[1].replace(/\s+/, '').toLowerCase();
      }
      // e.g., "9am", "7pm", "9:30am"
      const altMatch = dates.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
      if (altMatch) {
        return altMatch[1].trim();
      }
      return null;
    }

    return harvardEventsData.map((event, index) => {
      let time = null;
      if (event.source && event.source.toLowerCase().includes('gazette')) {
        time = extractTimeFromDescription(event.description);
      } else if (event.source && event.source.toLowerCase().includes('engage')) {
        time = extractTimeFromDates(event.dates);
      } else {
        // fallback: try both
        time = extractTimeFromDates(event.dates) || extractTimeFromDescription(event.description);
      }
      return {
        id: event.id || `harvard-${index}`,
        title: event.title || "Untitled Event",
        university: event.university || "Harvard University",
        location: event.location || "Location TBD",
        dates: event.dates || "Date TBD",
        description: event.description || "No description available",
        image: event.image || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
        type: (event.type as "event") || "event",
        tags: event.tags || [],
        link: event.link,
        weblink: event.weblink,
        organization: event.organization,
        source: event.source,
        time // <-- new field
      };
    });
  };

  // Load Harvard events as external events
  useEffect(() => {
    try {
      const harvardEvents = transformHarvardEvents();
      console.log(`Loaded ${harvardEvents.length} Harvard events`);
      setCreatedEvents(harvardEvents);
    } catch (error) {
      console.error('Error loading Harvard events:', error);
      setCreatedEvents([]);
    }
  }, []);

  const handleCreateEvent = () => {
    if (
      newEvent.title &&
      newEvent.location &&
      newEvent.date &&
      newEvent.description
    ) {
      // Create a new event object
      const eventObject = {
        id: `event-${Date.now()}`,
        title: newEvent.title,
        university: "Harvard University",
        location: newEvent.location,
        dates: newEvent.date,
        description: newEvent.description,
        image:
          "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
        type: "event" as const,
        tags: newEvent.tags
          ? newEvent.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      // Add to created events
      setCreatedEvents((prev) => [...prev, eventObject]);

      // Reset form
      setNewEvent({
        title: "",
        location: "",
        date: "",
        description: "",
        tags: "",
      });
      setIsCreateEventOpen(false);

      // Show success message
      alert("Event created successfully and added to the timeline!");
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        user: "Alex Thompson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user123",
        verified: true,
        message: chatMessage,
        timestamp: "Just now",
        type: "opportunity",
      };
      setChatMessages([newMessage, ...chatMessages]);
      setChatMessage("");
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                G
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-purple-600"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
              >
                Join Free
              </Button>
            </div>
          </div>
        </header>
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-teal-600 bg-clip-text text-transparent">
                Never Miss That
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Life-Changing Opportunity
              </span>
              <br />
              <span className="text-gray-800">Again</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {" "}
              Helping students and professionals navigate their careers with one
              less search at a time. See all that's happening in your university
              and organization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                🚀 Join Free - Start Discovering
              </Button>
              <p className="text-sm text-gray-500">
                ✨ No credit card required • 100% Free forever
              </p>
            </div>
          </div>
        </div>
        {/* Features Preview */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl mb-4">
                📅
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Organization Events
              </h3>
              <p className="text-gray-600">
                See all events happening in your organization. Stay connected
                with your university, company, and professional networks all in
                one place.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-teal-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-4">
                ⏰
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Never Miss Deadlines
              </h3>
              <p className="text-gray-600">
                Smart notifications and deadline tracking ensure you never miss
                another application deadline. Stay organized and ahead of the
                game.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-100">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl mb-4">
                🌍
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Global Community
              </h3>
              <p className="text-gray-600">
                Connect with verified students and professionals sharing real
                opportunities. Learn from success stories and insider tips.
              </p>
            </div>
          </div>
        </div>
        {/* Life-Changing Opportunities Showcase */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-teal-600 bg-clip-text text-transparent">
                  Opportunities That Changed Everything
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Real stories from our community members who found their
                breakthrough moments through our platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Success Story Card 1 */}
              <div className="group relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <span className="text-2xl">🚀</span>
                  </div>
                </div>
                <div className="mb-4">
                  <Avatar className="h-12 w-12 border-2 border-white/30 mb-3">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"
                      alt="Sarah"
                    />
                    <AvatarFallback className="bg-white/20 text-white">
                      SC
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-bold mb-1">Sarah Chen</h3>
                  <p className="text-white/80 text-sm">
                    Stanford University → Google AI
                  </p>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-4">
                  &quot;Found a Google AI research internship through the
                  platform that led to a full-time offer. This opportunity
                  completely changed my career trajectory.&quot;
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white border-white/30">
                    💰 $180K+ Starting Salary
                  </Badge>
                  <span className="text-white/70 text-xs">2 months ago</span>
                </div>
              </div>

              {/* Success Story Card 2 */}
              <div className="group relative bg-gradient-to-br from-teal-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <span className="text-2xl">🌍</span>
                  </div>
                </div>
                <div className="mb-4">
                  <Avatar className="h-12 w-12 border-2 border-white/30 mb-3">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=marcus"
                      alt="Marcus"
                    />
                    <AvatarFallback className="bg-white/20 text-white">
                      MJ
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-bold mb-1">Marcus Johnson</h3>
                  <p className="text-white/80 text-sm">
                    MIT → Fulbright Scholar
                  </p>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-4">
                  &quot;Discovered a Fulbright scholarship opportunity I never
                  knew existed. Now I'm researching renewable energy in Germany
                  with full funding.&quot;
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white border-white/30">
                    🎓 Full PhD Funding
                  </Badge>
                  <span className="text-white/70 text-xs">4 months ago</span>
                </div>
              </div>

              {/* Success Story Card 3 */}
              <div className="group relative bg-gradient-to-br from-pink-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="absolute top-4 right-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <span className="text-2xl">💡</span>
                  </div>
                </div>
                <div className="mb-4">
                  <Avatar className="h-12 w-12 border-2 border-white/30 mb-3">
                    <AvatarImage
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=elena"
                      alt="Elena"
                    />
                    <AvatarFallback className="bg-white/20 text-white">
                      ER
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-bold mb-1">Elena Rodriguez</h3>
                  <p className="text-white/80 text-sm">
                    Berkeley → Y Combinator
                  </p>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-4">
                  &quot;Found my co-founder through a startup fellowship posted
                  here. We just got accepted to Y Combinator with $500K
                  funding!&quot;
                </p>
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white border-white/30">
                    💰 $500K Funding
                  </Badge>
                  <span className="text-white/70 text-xs">1 month ago</span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Your Life-Changing Opportunity is Waiting
              </h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Join 50,000+ students and professionals who've transformed their
                careers through opportunities they discovered on our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  🌟 Start Your Journey - Join Free
                </Button>
                <div className="flex items-center gap-2 text-white/80">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">
                    No credit card • 100% Free • Instant access
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <footer className="bg-white/90 backdrop-blur-sm border-t border-purple-100 py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  G
                </div>
                <span className="text-sm font-medium text-gray-600">
                  Global Opportunities Hub © 2023
                </span>
              </div>
              <div className="flex gap-6">
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-purple-600"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-purple-600"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-purple-600"
                >
                  Terms
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-600 hover:text-purple-600"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-purple-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              G
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-4">
            <nav className="flex items-center justify-center space-x-1">
              <Button
                variant={activeTab === "university" ? "default" : "ghost"}
                onClick={() => setActiveTab("university")}
                className={
                  activeTab === "university"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }
              >
                Your Portal
              </Button>
              <Button
                variant={activeTab === "explorer" ? "default" : "ghost"}
                onClick={() => setActiveTab("explorer")}
                className={
                  activeTab === "explorer"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }
              >
                Opportunity Explorer
              </Button>
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                onClick={() => setActiveTab("dashboard")}
                className={
                  activeTab === "dashboard"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }
              >
                My Dashboard
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Dialog
              open={isCreateEventOpen}
              onOpenChange={setIsCreateEventOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white px-4 py-2 font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">
                    Create New Event
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Add a new event to the platform. Fill out the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-gray-900">
                      Event Title
                    </Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      placeholder="Enter event title"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location" className="text-gray-900">
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={newEvent.location}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, location: e.target.value })
                      }
                      placeholder="Enter location"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date" className="text-gray-900">
                      Date
                    </Label>
                    <Input
                      id="date"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                      placeholder="e.g., March 15-17, 2024"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-gray-900">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your event"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags" className="text-gray-900">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      value={newEvent.tags}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, tags: e.target.value })
                      }
                      placeholder="Enter tags separated by commas"
                      className="bg-white border-gray-200 text-gray-900"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateEventOpen(false)}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateEvent}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                  >
                    Create Event
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-purple-600"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-purple-600"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9 border-2 border-purple-200">
              <AvatarImage
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user123"
                alt="User"
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          {activeTab === "university" && (
            <UniversityPortal externalEvents={createdEvents} />
          )}
          {activeTab === "explorer" && (
            <div>
              <OpportunityExplorer />
              <div className="mt-8 border-t border-purple-100 pt-8">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Community Hub
                </h3>
                <div className="flex flex-col h-[600px]">
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800">
                        Opportunity Sharing Hub
                      </h4>
                      <p className="text-sm text-gray-600">
                        Share and discover opportunities with verified community
                        members
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {chatMessages.length} Active Shares
                    </Badge>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10 border-2 border-purple-200">
                            <AvatarImage src={msg.avatar} alt={msg.user} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              {msg.user
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-800">
                                {msg.user}
                              </h4>
                              {msg.verified && (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                Verified
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {msg.timestamp}
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {msg.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                💡 Interested
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                📩 Message
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                              >
                                🔗 Share
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-purple-100 bg-white rounded-b-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8 border-2 border-purple-200">
                        <AvatarImage
                          src="https://api.dicebear.com/7.x/avataaars/svg?seed=user123"
                          alt="You"
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                          AT
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex space-x-2">
                        <Input
                          placeholder="Share an opportunity you found..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSendMessage()
                          }
                          className="flex-1 border-purple-200 focus:border-purple-400"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!chatMessage.trim()}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        💡 Tip: Include application deadlines and contact info
                        for better engagement
                      </p>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          Verified Profile
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "dashboard" && <PersonalDashboard />}
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                G
              </div>
              <span className="text-sm font-medium text-gray-600">
                Global Opportunities Hub © 2023
              </span>
            </div>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-purple-600"
              >
                About
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-purple-600"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-purple-600"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-purple-600"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
