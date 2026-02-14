import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface RecentlyViewedEventsProps {
  maxDisplay?: number;
}

export const RecentlyViewedEvents: React.FC<RecentlyViewedEventsProps> = ({
  maxDisplay = 4,
}) => {
  const { recentlyViewed } = usePreferences();
  const navigate = useNavigate();

  if (recentlyViewed.length === 0) {
    return null;
  }

  const displayedEvents = recentlyViewed.slice(0, maxDisplay);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recently Viewed</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              {event.imageUrl && (
                <div className="h-32 overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader className="p-4">
                <CardTitle className="text-lg line-clamp-1">{event.name}</CardTitle>
                <CardDescription className="space-y-1">
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(event.startDateTime), "MMM d, yyyy")}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
