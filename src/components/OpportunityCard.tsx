import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, Calendar, MapPin, Clock } from "lucide-react";
import { Opportunity } from "@/types/opportunity";

interface OpportunityCardProps {
  opportunity?: Opportunity;
  title?: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  dates?: string;
  deadline?: string;
  organization?: string;
  tags?: string[];
  isSaved?: boolean;
  onApply?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

const OpportunityCard = ({
  opportunity,
  title = "Summer Tech Fellowship",
  description = "Join our 10-week immersive program for emerging tech leaders in beautiful Barcelona.",
  imageUrl = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80",
  location = "Barcelona, Spain",
  dates = "Jun 15 - Aug 30, 2023",
  deadline = "2024-05-15",
  organization = "TechGlobal Initiative",
  tags = ["Technology", "Fellowship", "Summer"],
  isSaved = false,
  onApply = () => console.log("Apply clicked"),
  onSave = () => console.log("Save clicked"),
  onShare = () => console.log("Share clicked"),
}: OpportunityCardProps) => {
  // Use opportunity prop if provided, otherwise use individual props
  const cardData = opportunity || {
    title,
    description,
    imageUrl,
    location,
    dates,
    deadline,
    organization,
    tags,
  };
  return (
    <Card className="w-full max-w-sm h-auto min-h-[420px] overflow-hidden transition-all hover:shadow-lg bg-white flex flex-col">
      <Link
        to={`/opportunity/${cardData.id || "1"}`}
        className="flex-1 flex flex-col"
      >
        <div className="relative h-40 overflow-hidden">
          <img
            src={cardData.imageUrl}
            alt={cardData.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/30"></div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault();
                onSave();
              }}
            >
              <Heart
                className={`h-4 w-4 ${isSaved ? "fill-rose-500 text-rose-500" : "text-gray-600"}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.preventDefault();
                onShare();
              }}
            >
              <Share2 className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>

        <CardHeader className="pb-2 pt-4 flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            {cardData.organization}
          </div>
          <h3 className="font-bold text-lg line-clamp-2">{cardData.title}</h3>
        </CardHeader>

        <CardContent className="pb-2 flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
            {cardData.description}
          </p>

          <div className="flex flex-wrap gap-1 mt-3">
            {cardData.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {cardData.tags && cardData.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{cardData.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-3">
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{cardData.location}</span>
            </div>
            {cardData.dates && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{cardData.dates}</span>
              </div>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="font-medium text-red-600 truncate">
                Deadline: {new Date(cardData.deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardFooter className="pt-0 flex-shrink-0">
        <Button
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          onClick={(e) => {
            e.preventDefault();
            onApply();
          }}
        >
          Quick Apply
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OpportunityCard;
