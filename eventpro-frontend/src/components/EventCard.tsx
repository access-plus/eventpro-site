import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getEventImageUrl } from "@/lib/utils";
import type { Event } from "@/types/api";

interface EventCardProps {
  event: Event;
  index?: number;
}

function toDate(value: string | number | undefined | unknown): Date | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Jackson array format [year, month, day, hour, min, sec, nano]
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value.map(Number);
    const date = new Date(y, m - 1, d, h, min, s);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
}

function safeFormatDate(value: string | number | undefined | unknown, formatStr: string, fallback: string): string {
  const d = toDate(value);
  if (!d) return fallback;
  return format(d, formatStr);
}

export const EventCard = ({ event, index = 0 }: EventCardProps) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const startRaw = event.startTime ?? event.startDateTime ?? (event as { start_time?: string }).start_time ?? "";

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-400 dark:bg-emerald-400 text-white backdrop-blur-md border border-emerald-300/50 dark:border-emerald-300/30 badge-glow-published";
      case "DRAFT":
        return "bg-muted/80 backdrop-blur-md text-muted-foreground";
      case "CANCELLED":
        return "bg-destructive/90 backdrop-blur-md text-destructive-foreground";
      case "COMPLETED":
        return "bg-accent/80 backdrop-blur-md text-accent-foreground";
      default:
        return "bg-secondary/80 backdrop-blur-md text-secondary-foreground";
    }
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      "Music": "from-pink-500/40 to-purple-500/40",
      "Sports": "from-green-500/40 to-emerald-500/40",
      "Technology": "from-blue-500/40 to-cyan-500/40",
      "Business": "from-slate-500/40 to-gray-500/40",
      "Arts": "from-orange-500/40 to-red-500/40",
      "Food & Drink": "from-amber-500/40 to-yellow-500/40",
      "Health & Wellness": "from-teal-500/40 to-green-500/40",
      "Education": "from-indigo-500/40 to-blue-500/40",
      "Entertainment": "from-purple-500/40 to-pink-500/40",
    };
    return colors[category || ""] || "from-primary/30 to-primary-glow/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card
        className="h-full min-h-[420px] flex flex-col overflow-hidden cursor-pointer group relative border-border/50 bg-card/80 dark:bg-card/80 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {/* Image Section: ~60% of card height */}
        <div className="relative min-h-[252px] overflow-hidden flex-[0_0_60%]">
          {event.imageUrl && !imgError ? (
            <img
              src={getEventImageUrl(event.imageUrl) ?? ""}
              alt={event.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`relative w-full h-full min-h-[252px] flex items-center justify-center overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(event.categoryName || event.category)}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
              <Ticket className="relative h-24 w-24 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] animate-pulse" />
            </div>
          )}

          {/* Gradient overlay: transparent top → dark bottom so badges and overlays stay readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

          {/* Status Badge - only show if status exists */}
          {event.status && (
            <div className="absolute top-3 right-3">
              <Badge className={`${getStatusColor(event.status)} shadow-md uppercase tracking-wider text-xs font-semibold`}>
                {event.status}
              </Badge>
            </div>
          )}

          {/* Category Badge - glassmorphism */}
          {(event.categoryName || event.category) && (
            <div className="absolute top-3 left-3">
              <Badge variant="outline" className="bg-white/25 dark:bg-black/30 backdrop-blur-md border-white/40 dark:border-white/20 badge-glow-category text-foreground font-medium">
                {event.categoryName || event.category}
              </Badge>
            </div>
          )}

          {/* Quick Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center gap-4 text-sm text-card-foreground">
              <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 border border-accent-cyan/50 shadow-[0_0_12px_hsl(var(--accent-cyan)_/_0.35),0_0_24px_hsl(var(--accent-cyan)_/_0.15)]">
                <Ticket className="h-3.5 w-3.5 text-accent-cyan" />
                <span className="font-medium text-accent-cyan">View Tickets</span>
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
        <div className="flex-1 min-h-0 flex flex-col p-5 space-y-4">
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
                  {safeFormatDate(startRaw, "EEEE, MMM d", "Date TBD")}
                </p>
                <p className="text-muted-foreground text-xs">
                  {safeFormatDate(startRaw, "yyyy", "—")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium text-foreground">
                {safeFormatDate(startRaw, "h:mm a", "Time TBD")}
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

          {/* CTA Button - gradient, glow + 5% scale on hover; press state shrinks + darkens */}
          <Button
            className="w-full bg-gradient-to-r from-primary via-primary to-primary-glow text-primary-foreground shadow-md hover:shadow-lg hover:shadow-glow hover:brightness-110 hover:scale-[1.05] active:scale-[0.98] active:brightness-95 transition-all duration-300 group-hover:shadow-glow group-hover:scale-[1.05] group/btn"
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
