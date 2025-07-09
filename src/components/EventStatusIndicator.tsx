import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Calendar, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';

interface LastUpdate {
  timestamp: string;
  humanReadable: string;
  totalEvents: number;
  sources: {
    gazette: number;
    gsas: number;
  };
  dateRange: {
    from: string;
    to: string;
  };
}

const EventStatusIndicator: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState<LastUpdate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLastUpdate = async () => {
    try {
      const response = await fetch('/harvard/events/last-update.json');
      if (response.ok) {
        const data = await response.json();
        setLastUpdate(data);
        setError(null);
      } else {
        setError('Could not load update status');
      }
    } catch (err) {
      setError('Failed to load update status');
    }
  };

  const refreshEvents = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/refresh-events', {
        method: 'POST',
      });
      if (response.ok) {
        await loadLastUpdate();
      } else {
        setError('Failed to refresh events');
      }
    } catch (err) {
      setError('Failed to refresh events');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLastUpdate();
  }, []);

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">Error loading status</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadLastUpdate}
              className="text-red-600 border-red-300 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lastUpdate) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500 animate-spin" />
            <span className="text-sm text-gray-600">Loading status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                Last updated: {lastUpdate.humanReadable}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {lastUpdate.totalEvents} events
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600">
                {lastUpdate.dateRange.from} onwards
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshEvents}
            disabled={isRefreshing}
            className="text-green-600 border-green-300 hover:bg-green-100"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventStatusIndicator; 