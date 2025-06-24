import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bot,
  Sparkles,
  Search,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Globe,
  Send,
  Loader2,
} from "lucide-react";

const AIAgentOpportunityFinder = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("quick");
  const [formData, setFormData] = useState({
    interests: "",
    location: "",
    duration: "",
    type: [] as string[],
    experience: "",
    goals: "",
    availability: "",
  });

  const handleQuickSearch = async () => {
    setIsLoading(true);
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    // In a real app, this would trigger the AI search and show results
    alert(
      "AI Agent found 12 personalized opportunities for you! Check your dashboard for results.",
    );
    setIsOpen(false);
  };

  const handleDetailedSearch = async () => {
    setIsLoading(true);
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsLoading(false);
    // In a real app, this would trigger the detailed AI search
    alert(
      "AI Agent is analyzing your profile and will send personalized recommendations to your email within 24 hours!",
    );
    setIsOpen(false);
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      type: checked
        ? [...prev.type, type]
        : prev.type.filter((t) => t !== type),
    }));
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-teal-400 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-white/20 rounded-full w-fit">
            <Bot className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6" />
            AI Opportunity Finder
          </CardTitle>
          <CardDescription className="text-white/90 text-lg">
            Don't see what you're looking for? Count on our agent to find it and
            never miss an opportunity again!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90 font-semibold px-8 py-3 text-lg shadow-lg"
              >
                <Bot className="h-5 w-5 mr-2" />
                Find My Perfect Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Bot className="h-6 w-6 text-purple-600" />
                  AI Opportunity Finder
                </DialogTitle>
                <DialogDescription>
                  Let our AI agent help you discover opportunities tailored to
                  your interests and goals.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="quick"
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Quick Search
                  </TabsTrigger>
                  <TabsTrigger
                    value="detailed"
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Detailed Profile
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="quick" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="interests">
                        What are you interested in?
                      </Label>
                      <Input
                        id="interests"
                        placeholder="e.g., technology, sustainability, healthcare, travel..."
                        value={formData.interests}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            interests: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Preferred Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Remote, Europe, Global..."
                          value={formData.location}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          placeholder="e.g., 3 months, 1 year..."
                          value={formData.duration}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              duration: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Opportunity Types</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[
                          { id: "travel", label: "Travel", icon: Globe },
                          { id: "career", label: "Career", icon: Briefcase },
                          {
                            id: "education",
                            label: "Education",
                            icon: GraduationCap,
                          },
                        ].map(({ id, label, icon: Icon }) => (
                          <div key={id} className="flex items-center space-x-2">
                            <Checkbox
                              id={id}
                              checked={formData.type.includes(id)}
                              onCheckedChange={(checked) =>
                                handleTypeChange(id, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={id}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <Icon className="h-4 w-4" />
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleQuickSearch}
                      disabled={isLoading || !formData.interests}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          AI is searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Find Opportunities
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="experience">
                        Your Background & Experience
                      </Label>
                      <Textarea
                        id="experience"
                        placeholder="Tell us about your education, work experience, skills, and achievements..."
                        value={formData.experience}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            experience: e.target.value,
                          }))
                        }
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="goals">Your Goals & Aspirations</Label>
                      <Textarea
                        id="goals"
                        placeholder="What do you hope to achieve? What are your career goals and personal interests?"
                        value={formData.goals}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            goals: e.target.value,
                          }))
                        }
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label htmlFor="availability">
                        Availability & Constraints
                      </Label>
                      <Textarea
                        id="availability"
                        placeholder="When are you available? Any constraints we should know about? (visa requirements, budget, etc.)"
                        value={formData.availability}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            availability: e.target.value,
                          }))
                        }
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI-Powered Matching
                      </h4>
                      <p className="text-sm text-purple-700">
                        Our AI will analyze your profile against thousands of
                        opportunities and send you personalized recommendations
                        via email within 24 hours.
                      </p>
                    </div>

                    <Button
                      onClick={handleDetailedSearch}
                      disabled={
                        isLoading || !formData.experience || !formData.goals
                      }
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          AI is analyzing your profile...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Get Personalized Recommendations
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              <Globe className="h-3 w-3 mr-1" />
              Global Opportunities
            </Badge>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Real-time Updates
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AIAgentOpportunityFinder;
