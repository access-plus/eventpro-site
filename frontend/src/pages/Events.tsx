import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Search, Ticket, X } from "lucide-react";
import { apiService } from "@/lib/api";
import type { Event } from "@/types/api";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getEventImageUrl } from "@/lib/utils";

// Common event categories (can be replaced with API call if endpoint exists)
const EVENT_CATEGORIES = [
  "Music",
  "Sports",
  "Technology",
  "Business",
  "Arts",
  "Food & Drink",
  "Health & Wellness",
  "Education",
  "Entertainment",
  "Other",
];

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevSearchQueryRef = useRef<string>("");
  const prevCategoryRef = useRef<string | undefined>(undefined);
  const isInitialMount = useRef(true);

  // Memoize loadEvents to prevent unnecessary recreations
  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      let data: Event[];
      
      if (selectedCategory) {
        // Load events by category
        data = await apiService.getEventsByCategory(selectedCategory);
      } else {
        // Load events with optional search keyword
        data = await apiService.getEvents(1, 20, searchQuery || undefined);
      }
      
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // Consolidated useEffect that handles both searchQuery and selectedCategory
  useEffect(() => {
    // Clear any existing timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    // On initial mount, load immediately without debounce
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevSearchQueryRef.current = searchQuery;
      prevCategoryRef.current = selectedCategory;
      loadEvents();
      return;
    }

    // Determine what actually changed
    const searchQueryChanged = searchQuery !== prevSearchQueryRef.current;
    const categoryChanged = selectedCategory !== prevCategoryRef.current;
    
    // Update refs for next comparison
    prevSearchQueryRef.current = searchQuery;
    prevCategoryRef.current = selectedCategory;

    // If category changed, execute immediately (no debounce)
    // This handles the case where category change also clears searchQuery
    if (categoryChanged) {
      loadEvents();
      return;
    }

    // If only search query changed, debounce it
    if (searchQueryChanged) {
      // Debounce search queries (only if searchQuery is not empty)
      if (searchQuery.length > 0) {
        searchDebounceTimerRef.current = setTimeout(() => {
          loadEvents();
        }, 500);
      } else {
        // Empty search query - execute immediately
        loadEvents();
      }
    }

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, [searchQuery, selectedCategory, loadEvents]);

  const handleCategoryChange = (value: string) => {
    // Radix UI Select doesn't allow empty strings, so we use undefined for "All Categories"
    setSelectedCategory(value || undefined);
    setSearchQuery(""); // Clear search when category changes
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery("");
  };

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-primary";
      case "DRAFT":
        return "bg-muted";
      case "CANCELLED":
        return "bg-destructive";
      case "COMPLETED":
        return "bg-accent";
      default:
        return "bg-secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Discover Events
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Find and book tickets for amazing events
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={!!selectedCategory}
              />
            </div>
            <Select 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(selectedCategory || searchQuery) && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card className="p-12 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">
              {(searchQuery || selectedCategory)
                ? "Try adjusting your search or filters"
                : "Check back soon for new events"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="h-full hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  {event.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={getEventImageUrl(event.imageUrl) ?? ""}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl line-clamp-2">
                        {event.name}
                      </CardTitle>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    {event.description && (
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(event.startDateTime), "PPP")}
                      </span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    )}
                    <Button 
                      className="w-full bg-gradient-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                    >
                      <Ticket className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
