import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bell, Calendar, CheckCircle2, Clock, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import OpportunityCard from "@/components/OpportunityCard";
import { UserOpportunity } from "@/types/opportunity";

interface Application {
  id: string;
  title: string;
  organization: string;
  status: "pending" | "reviewing" | "interview" | "accepted" | "rejected";
  progress: number;
  deadline?: string;
  logo: string;
}

interface Deadline {
  id: string;
  title: string;
  date: string;
  daysLeft: number;
  type: string;
}

interface Recommendation {
  id: string;
  title: string;
  organization: string;
  type: string;
  location: string;
  image: string;
  match: number;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const PersonalDashboard = () => {
  const [activeTab, setActiveTab] = useState("applications");

  // Mock data for user opportunities
  const userOpportunities: UserOpportunity[] = [
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
      deadline: "2024-06-15",
      imageUrl:
        "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
      tags: ["Leadership", "Global", "Career"],
      applicationStatus: "reviewing",
      appliedDate: "2024-01-15",
      progress: 60,
    },
    {
      id: "2",
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
      tags: ["Research", "Science", "Summer"],
      applicationStatus: "pending",
      appliedDate: "2024-01-20",
      progress: 30,
    },
    {
      id: "3",
      title: "Tech for Good Fellowship",
      organization: "Google.org",
      description:
        "Use your tech skills to solve global challenges while traveling to project sites around the world.",
      location: "Multiple Locations",
      type: "travel",
      category: "Social Impact",
      duration: "12 months",
      deadline: "2024-03-31",
      imageUrl:
        "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&q=80",
      tags: ["Technology", "Social Impact", "Travel"],
      applicationStatus: "interview",
      appliedDate: "2024-01-10",
      progress: 80,
    },
  ];

  // Mock data
  const applications: Application[] = [
    {
      id: "1",
      title: "Global Leadership Program",
      organization: "Microsoft",
      status: "reviewing",
      progress: 60,
      deadline: "2023-06-15",
      logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=microsoft",
    },
    {
      id: "2",
      title: "Summer Research Fellowship",
      organization: "Stanford University",
      status: "pending",
      progress: 30,
      deadline: "2023-06-30",
      logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=stanford",
    },
    {
      id: "3",
      title: "International Exchange Program",
      organization: "Cultural Exchange Network",
      status: "interview",
      progress: 80,
      deadline: "2023-05-20",
      logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=exchange",
    },
  ];

  const deadlines: Deadline[] = [
    {
      id: "1",
      title: "Google Summer Internship",
      date: "2023-05-15",
      daysLeft: 5,
      type: "Application",
    },
    {
      id: "2",
      title: "Tokyo Exchange Program",
      date: "2023-05-22",
      daysLeft: 12,
      type: "Document Submission",
    },
    {
      id: "3",
      title: "Leadership Summit Registration",
      date: "2023-06-01",
      daysLeft: 22,
      type: "Registration",
    },
  ];

  const recommendations: Recommendation[] = [
    {
      id: "1",
      title: "Global Tech Fellowship",
      organization: "Google",
      type: "Fellowship",
      location: "Multiple Locations",
      image:
        "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&q=80",
      match: 95,
    },
    {
      id: "2",
      title: "Sustainable Development Internship",
      organization: "United Nations",
      type: "Internship",
      location: "New York, USA",
      image:
        "https://images.unsplash.com/photo-1526958097901-5e6d742d3371?w=600&q=80",
      match: 88,
    },
    {
      id: "3",
      title: "Digital Marketing Bootcamp",
      organization: "Marketing Institute",
      type: "Training",
      location: "Remote",
      image:
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80",
      match: 82,
    },
  ];

  const notifications: Notification[] = [
    {
      id: "1",
      title: "Application Update",
      description: "Your Microsoft application has moved to the review stage!",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "2",
      title: "Deadline Reminder",
      description: "Google Summer Internship application due in 5 days",
      time: "Yesterday",
      read: false,
    },
    {
      id: "3",
      title: "New Recommendation",
      description: "We found a new opportunity that matches your profile",
      time: "3 days ago",
      read: true,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "reviewing":
        return "bg-blue-500";
      case "interview":
        return "bg-purple-500";
      case "accepted":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="w-full p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Your Dashboard
          </h1>
          <p className="text-gray-600">
            Track your applications, deadlines, and discover new opportunities
          </p>
        </div>
        <div className="relative">
          <Button variant="outline" className="rounded-full p-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notifications.filter((n) => !n.read).length}
            </span>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="opportunities"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="opportunities" className="text-sm">
            My Opportunities
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-sm">
            Applications
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="text-sm">
            Deadlines
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="text-sm">
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm">
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="relative">
                <OpportunityCard opportunity={opportunity} />
                <div className="absolute top-2 left-2">
                  <Badge
                    className={`${getStatusColor(opportunity.applicationStatus)} text-white text-xs`}
                  >
                    {getStatusText(opportunity.applicationStatus)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={app.logo} alt={app.organization} />
                        <AvatarFallback>
                          {app.organization.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{app.title}</CardTitle>
                        <CardDescription>{app.organization}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusColor(app.status)} text-white`}
                    >
                      {getStatusText(app.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Application Progress</span>
                        <span>{app.progress}%</span>
                      </div>
                      <Progress value={app.progress} className="h-2" />
                    </div>
                    {app.deadline && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>
                          Deadline:{" "}
                          {new Date(app.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      Continue Application
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                Stay on track with your applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${deadline.daysLeft <= 7 ? "bg-red-100" : "bg-blue-100"}`}
                      >
                        <Calendar
                          className={`h-5 w-5 ${deadline.daysLeft <= 7 ? "text-red-500" : "text-blue-500"}`}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{deadline.title}</h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>{deadline.type}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {new Date(deadline.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={
                        deadline.daysLeft <= 7 ? "bg-red-500" : "bg-blue-500"
                      }
                    >
                      {deadline.daysLeft} days left
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <Card
                key={rec.id}
                className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="h-40 w-full overflow-hidden">
                  <img
                    src={rec.image}
                    alt={rec.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                      {rec.match}% Match
                    </Badge>
                  </div>
                  <CardDescription>{rec.organization}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Badge variant="outline" className="mr-2">
                      {rec.type}
                    </Badge>
                    <span>{rec.location}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    View Opportunity
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Your Notifications</CardTitle>
              <CardDescription>
                Stay updated on your applications and opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${notification.read ? "bg-white" : "bg-purple-50 border-purple-100"}`}
                  >
                    <div className="flex justify-between">
                      <h4 className="font-medium">{notification.title}</h4>
                      <span className="text-xs text-gray-500">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.description}
                    </p>
                    <div className="flex justify-end mt-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalDashboard;
