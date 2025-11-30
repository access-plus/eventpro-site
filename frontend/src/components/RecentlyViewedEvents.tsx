import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Clock, Calendar, MapPin, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface RecentlyViewedEventsProps {
  showClearAll?: boolean;
  maxDisplay?: number;
}

export const RecentlyViewedEvents = ({ 
  showClearAll = true,
  maxDisplay 
}: RecentlyViewedEventsProps) => {
  const navigate = useNavigate();
  const { recentEvents, clearRecentEvents, removeRecentEvent, hasRecentEvents } = useRecentlyViewed();

  if (!hasRecentEvents) {
    return null;
  }

  const displayEvents = maxDisplay ? recentEvents.slice(0, maxDisplay) : recentEvents;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recently Viewed
            </CardTitle>
            <CardDescription>
              Events you've checked out recently
            </CardDescription>
          </div>
          {showClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentEvents}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              <Card 
                className="cursor-pointer hover:shadow-md transition-all overflow-hidden"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentEvent(event.id);
                  }}
                  className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Event Image */}
                {event.imageUrl ? (
                  <div className="h-32 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-card flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold line-clamp-2 text-sm">
                    {event.name}
                  </h4>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {format(new Date(event.startDateTime), "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    {event.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    )}
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    Viewed {formatTimeAgo(event.viewedAt)}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return format(timestamp, "MMM d");
}
