import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, ExternalLink } from "lucide-react";

interface EventPanelProps {
  event: {
    id: string;
    title: string;
    dateTime?: string;
    dates?: string;
    location?: string;
    locationVenue?: string;
    locationAddress?: string;
    locationCity?: string;
    fullLocation?: string;
    host?: string;
    categories?: string[];
    image?: string;
    description?: string;
    tags?: string[];
    eventLink?: string;
    link?: string;
    source?: string;
  };
}

const EventPanel: React.FC<EventPanelProps> = ({ event }) => {
  const {
    title,
    dateTime,
    dates,
    location,
    locationVenue,
    locationAddress,
    locationCity,
    fullLocation,
    host,
    categories,
    image,
    description,
    tags,
    eventLink,
    link,
    source,
  } = event;

  // Compose location string for map
  const mapQuery = encodeURIComponent(
    locationAddress || location || fullLocation || locationVenue || "Harvard University"
  );
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <Card className="overflow-hidden bg-white mb-6">
      {image && (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-between">
          {title}
          {source && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {source}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-sm text-gray-600 mt-2">
          <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0" />
          <span>{dateTime || dates}</span>
        </CardDescription>
        {(location || fullLocation || locationVenue) && (
          <CardDescription className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <MapPin className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <span>{location || fullLocation || locationVenue}</span>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 underline hover:text-blue-800"
            >
              View Map
            </a>
          </CardDescription>
        )}
        {host && (
          <CardDescription className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Users className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <span>{host}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {description && (
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-800 mb-1">About Event</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{description}</p>
          </div>
        )}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 mb-4">
            {tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-3 mt-4">
          {eventLink && (
            <a
              href={eventLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-6 py-2 text-base font-semibold shadow-md">
                <ExternalLink className="h-5 w-5" />
                Register
              </Button>
            </a>
          )}
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="flex items-center gap-2 px-6 py-2 text-base font-semibold">
                <ExternalLink className="h-5 w-5" />
                View Event Page
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventPanel; 