import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Share2,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Send,
  Building,
  Users,
} from "lucide-react";
import { Opportunity } from "@/types/opportunity";

interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface Reaction {
  type: string;
  count: number;
  isActive: boolean;
  emoji: string;
}

const OpportunityDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "Sarah Chen",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      content:
        "This looks like an amazing opportunity! Has anyone applied before? Would love to hear about the application process.",
      timestamp: "2 hours ago",
      likes: 5,
      isLiked: false,
    },
    {
      id: "2",
      author: "Alex Rodriguez",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      content:
        "I participated in a similar program last year. The experience was incredible! Happy to answer any questions about what to expect.",
      timestamp: "4 hours ago",
      likes: 12,
      isLiked: true,
    },
    {
      id: "3",
      author: "Emma Thompson",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      content:
        "What are the language requirements for this program? The description mentions international locations but doesn't specify.",
      timestamp: "1 day ago",
      likes: 3,
      isLiked: false,
    },
  ]);

  const [reactions, setReactions] = useState<Reaction[]>([
    { type: "like", count: 24, isActive: false, emoji: "👍" },
    { type: "love", count: 8, isActive: true, emoji: "❤️" },
    { type: "excited", count: 15, isActive: false, emoji: "🤩" },
    { type: "interested", count: 31, isActive: false, emoji: "🤔" },
  ]);

  // Mock opportunity data - in real app, this would be fetched based on ID
  const opportunity: Opportunity = {
    id: id || "1",
    title: "Global Leadership Program",
    organization: "Microsoft",
    description:
      "A comprehensive 6-month rotation program designed for emerging leaders who want to develop their skills while gaining international experience. Participants will work across multiple offices, collaborate with diverse teams, and contribute to real-world projects that impact millions of users globally. This program combines professional development with cultural immersion, offering mentorship from senior leaders and the opportunity to build a global network of peers.",
    location: "Multiple Locations (Seattle, London, Singapore)",
    type: "career",
    category: "Leadership Development",
    duration: "6 months",
    deadline: "2024-06-15",
    dates: "September 2024 - March 2025",
    imageUrl:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
    tags: [
      "Leadership",
      "Global",
      "Career",
      "Technology",
      "Mentorship",
      "Networking",
    ],
  };

  const handleReaction = (reactionType: string) => {
    setReactions((prev) =>
      prev.map((reaction) => {
        if (reaction.type === reactionType) {
          return {
            ...reaction,
            count: reaction.isActive ? reaction.count - 1 : reaction.count + 1,
            isActive: !reaction.isActive,
          };
        }
        return reaction;
      }),
    );
  };

  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
        content: newComment,
        timestamp: "Just now",
        likes: 0,
        isLiked: false,
      };
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
    }
  };

  const handleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked,
          };
        }
        return comment;
      }),
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Opportunities
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Opportunity Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <Card className="overflow-hidden bg-white">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={opportunity.imageUrl}
                  alt={opportunity.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/50"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {opportunity.title}
                  </h1>
                  <div className="flex items-center text-white/90 text-sm">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{opportunity.organization}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Details Section */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Opportunity Details</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  {opportunity.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                    <span>{opportunity.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                    <span>{opportunity.dates}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-red-500" />
                    <span className="font-medium text-red-600">
                      Deadline:{" "}
                      {new Date(opportunity.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-purple-500" />
                    <span>{opportunity.duration}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {opportunity.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-purple-100 text-purple-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reactions Section */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Community Reactions</span>
                  <Badge variant="outline">
                    {reactions.reduce((sum, r) => sum + r.count, 0)} reactions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {reactions.map((reaction) => (
                    <Button
                      key={reaction.type}
                      variant={reaction.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleReaction(reaction.type)}
                      className={`flex items-center gap-1 ${reaction.isActive ? "bg-purple-500 hover:bg-purple-600" : "hover:bg-purple-50"}`}
                    >
                      <span>{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Questions & Discussion</span>
                  <Badge variant="outline">{comments.length} comments</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Ask a question or share your thoughts..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>{comment.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.author}
                            </span>
                            <span className="text-xs text-gray-500">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {comment.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCommentLike(comment.id)}
                            className={`text-xs h-6 px-2 ${comment.isLiked ? "text-purple-600" : "text-gray-500"}`}
                          >
                            <ThumbsUp
                              className={`h-3 w-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`}
                            />
                            {comment.likes}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2 text-gray-500"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Action Panel */}
          <div className="space-y-4">
            <Card className="bg-white sticky top-4">
              <CardHeader>
                <CardTitle>Apply Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm font-medium text-red-600">
                    Application Deadline
                  </p>
                  <p className="text-lg font-bold text-red-700">
                    {new Date(opportunity.deadline).toLocaleDateString()}
                  </p>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3">
                  Start Application
                </Button>

                <Button variant="outline" className="w-full">
                  Save for Later
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  <p>Application typically takes 15-20 minutes</p>
                </div>
              </CardContent>
            </Card>

            {/* Similar Opportunities */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Similar Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <img
                      src={`https://images.unsplash.com/photo-157316471398${item}-8665fc963095?w=60&q=80`}
                      alt="Opportunity"
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Tech Fellowship Program
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Google • Remote
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetails;
