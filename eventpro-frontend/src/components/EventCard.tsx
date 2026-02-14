import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { Event } from "@/types/api";

interface EventCardProps {
  event: Event;
  index?: number;
}

export const EventCard = ({ event, index = 0 }: EventCardProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-primary text-primary-foreground";
      case "DRAFT":
        return "bg-muted text-muted-foreground";
      case "CANCELLED":
        return "bg-destructive text-destructive-foreground";
      case "COMPLETED":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      "Music": "from-pink-500/20 to-purple-500/20",
      "Sports": "from-green-500/20 to-emerald-500/20",
      "Technology": "from-blue-500/20 to-cyan-500/20",
      "Business": "from-slate-500/20 to-gray-500/20",
      "Arts": "from-orange-500/20 to-red-500/20",
      "Food & Drink": "from-amber-500/20 to-yellow-500/20",
      "Health & Wellness": "from-teal-500/20 to-green-500/20",
      "Education": "from-indigo-500/20 to-blue-500/20",
      "Entertainment": "from-purple-500/20 to-pink-500/20",
    };
    return colors[category || ""] || "from-primary/20 to-primary-glow/20";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Card
        className="h-full overflow-hidden cursor-pointer group relative border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {/* Image Section with Overlay */}
        <div className="relative h-52 overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getCategoryColor(event.categoryName || event.category)} flex items-center justify-center`}>
              <Ticket className="h-16 w-16 text-primary/40" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {/* Status Badge - only show if status exists */}
          {event.status && (
            <div className="absolute top-3 right-3">
              <Badge className={`${getStatusColor(event.status)} shadow-md`}>
                {event.status}
              </Badge>
            </div>
          )}

          {/* Category Badge */}
          {(event.categoryName || event.category) && (
            <div className="absolute top-3 left-3">
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-border/50">
                {event.categoryName || event.category}
              </Badge>
            </div>
          )}

          {/* Quick Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-4 text-sm text-card-foreground">
              <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
                <Ticket className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">View Tickets</span>
              </div>
              {(event.addressCity || event.venue) && (
                <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="line-clamp-1 max-w-[120px]">
                    {event.addressCity || event.venue}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {event.name}
          </h3>

          {/* Description */}
          {event.description && (
            <p className="text-muted-foreground text-sm line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Event Details */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {format(new Date(event.startTime || event.startDateTime || new Date()), "EEEE, MMM d")}
                </p>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(event.startTime || event.startDateTime || new Date()), "yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium text-foreground">
                {format(new Date(event.startTime || event.startDateTime || new Date()), "h:mm a")}
              </p>
            </div>

            {(event.addressCity || event.venue) && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <p className="font-medium text-foreground line-clamp-1">
                  {event.addressCity && event.addressState
                    ? `${event.addressCity}, ${event.addressState}`
                    : event.venue || event.addressCity || ""}
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button
            className="w-full bg-gradient-primary shadow-md hover:shadow-lg transition-shadow group/btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/events/${event.id}`);
            }}
          >
            <Ticket className="mr-2 h-4 w-4 transition-transform group-hover/btn:rotate-12" />
            Get Tickets
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
