import React, { useState } from "react";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Globe,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import OpportunityCard from "./OpportunityCard";
import AIAgentOpportunityFinder from "./AIAgentOpportunityFinder";
import { Opportunity } from "@/types/opportunity";

const OpportunityExplorer = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilters, setSelectedFilters] = useState<{
    locations: string[];
    types: string[];
    durations: string[];
  }>({
    locations: [],
    types: [],
    durations: [],
  });

  // Mock data for opportunities
  const opportunities: Opportunity[] = [
    {
      id: "1",
      title: "Global Leadership Program",
      organization: "Microsoft",
      description:
        "A 6-month rotation program across international offices to develop leadership skills and global perspective.",
      location: "Multiple Locations",
      type: "career",
      category: "Leadership Development",
      duration: "6 months",
      deadline: "2023-12-15",
      imageUrl:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
    },
    {
      id: "2",
      title: "Digital Nomad Fellowship",
      organization: "Remote Year",
      description:
        "Work remotely while traveling to 12 different countries over the course of a year with a community of professionals.",
      location: "Global",
      type: "travel",
      category: "Remote Work",
      duration: "12 months",
      deadline: "2023-11-30",
      imageUrl:
        "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80",
    },
    {
      id: "3",
      title: "Summer Research Program",
      organization: "Stanford University",
      description:
        "Conduct research alongside faculty in cutting-edge laboratories during this intensive summer program.",
      location: "California, USA",
      type: "education",
      category: "Research",
      duration: "3 months",
      deadline: "2024-02-28",
      imageUrl:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80",
    },
    {
      id: "4",
      title: "International Business Rotation",
      organization: "Deloitte",
      description:
        "Gain international experience through this rotation program across multiple global offices.",
      location: "Various",
      type: "career",
      category: "Professional Development",
      duration: "9 months",
      deadline: "2024-01-15",
      imageUrl:
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
    },
    {
      id: "5",
      title: "Semester in Paris",
      organization: "NYU Global Programs",
      description:
        "Study abroad in the heart of Paris while earning credits toward your degree.",
      location: "Paris, France",
      type: "education",
      category: "Study Abroad",
      duration: "4 months",
      deadline: "2024-03-01",
      imageUrl:
        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    },
    {
      id: "6",
      title: "Tech for Good Fellowship",
      organization: "Google.org",
      description:
        "Use your tech skills to solve global challenges while traveling to project sites around the world.",
      location: "Multiple Locations",
      type: "travel",
      category: "Social Impact",
      duration: "12 months",
      deadline: "2023-12-31",
      imageUrl:
        "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80",
    },
  ];

  // Filter opportunities based on active tab, search query, and selected filters
  const filteredOpportunities = opportunities.filter((opportunity) => {
    // Filter by tab
    if (activeTab !== "all" && opportunity.type !== activeTab) {
      return false;
    }

    // Filter by search query
    if (
      searchQuery &&
      !opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !opportunity.organization
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      !opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filter by selected filters
    if (
      selectedFilters.locations.length > 0 &&
      !selectedFilters.locations.some((loc) =>
        opportunity.location.toLowerCase().includes(loc.toLowerCase()),
      )
    ) {
      return false;
    }

    if (
      selectedFilters.types.length > 0 &&
      !selectedFilters.types.includes(opportunity.category)
    ) {
      return false;
    }

    if (
      selectedFilters.durations.length > 0 &&
      !selectedFilters.durations.some((dur) =>
        opportunity.duration.toLowerCase().includes(dur.toLowerCase()),
      )
    ) {
      return false;
    }

    return true;
  });

  const handleFilterChange = (
    category: "locations" | "types" | "durations",
    value: string,
  ) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[category];
      return {
        ...prev,
        [category]: currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value],
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      locations: [],
      types: [],
      durations: [],
    });
    setSearchQuery("");
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-teal-400 bg-clip-text text-transparent">
            Explore Opportunities
          </h2>
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className="bg-purple-100 text-purple-700 hover:bg-purple-200"
            >
              {filteredOpportunities.length} opportunities
            </Badge>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter sidebar */}
          <div className="w-full lg:w-1/4 bg-gray-50 p-4 rounded-lg border border-gray-100 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search opportunities..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Separator className="my-4" />

            {/* Location filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              <div className="space-y-2">
                {["Global", "Europe", "North America", "Asia", "Remote"].map(
                  (location) => (
                    <div key={location} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location}`}
                        checked={selectedFilters.locations.includes(location)}
                        onCheckedChange={() =>
                          handleFilterChange("locations", location)
                        }
                      />
                      <Label
                        htmlFor={`location-${location}`}
                        className="text-sm"
                      >
                        {location}
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Program type filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4" />
                Program Type
              </h4>
              <div className="space-y-2">
                {[
                  "Leadership Development",
                  "Remote Work",
                  "Research",
                  "Professional Development",
                  "Study Abroad",
                  "Social Impact",
                ].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedFilters.types.includes(type)}
                      onCheckedChange={() => handleFilterChange("types", type)}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Duration filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Duration
              </h4>
              <div className="space-y-2">
                {[
                  "3 months",
                  "4 months",
                  "6 months",
                  "9 months",
                  "12 months",
                ].map((duration) => (
                  <div key={duration} className="flex items-center space-x-2">
                    <Checkbox
                      id={`duration-${duration}`}
                      checked={selectedFilters.durations.includes(duration)}
                      onCheckedChange={() =>
                        handleFilterChange("durations", duration)
                      }
                    />
                    <Label htmlFor={`duration-${duration}`} className="text-sm">
                      {duration}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="w-full lg:w-3/4">
            {/* AI Agent Opportunity Finder */}
            <div className="mb-8">
              <AIAgentOpportunityFinder />
            </div>

            <Tabs
              defaultValue="all"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-6 bg-gray-100 p-1">
                <TabsTrigger value="all" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  All Opportunities
                </TabsTrigger>
                <TabsTrigger value="travel" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Travel
                </TabsTrigger>
                <TabsTrigger value="career" className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  Career
                </TabsTrigger>
                <TabsTrigger
                  value="education"
                  className="flex items-center gap-1"
                >
                  <GraduationCap className="h-4 w-4" />
                  Education
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                    />
                  ))}
                </div>
                {filteredOpportunities.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No opportunities match your filters. Try adjusting your
                      criteria.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="travel" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                    />
                  ))}
                </div>
                {filteredOpportunities.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No travel opportunities match your filters.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="career" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                    />
                  ))}
                </div>
                {filteredOpportunities.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No career opportunities match your filters.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="education" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                    />
                  ))}
                </div>
                {filteredOpportunities.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No education opportunities match your filters.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityExplorer;
