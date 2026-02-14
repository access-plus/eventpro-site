import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Ticket, X } from "lucide-react";
import { apiService } from "@/lib/api";
import type { Event } from "@/types/api";
import { EventCard } from "@/components/EventCard";

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
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevSearchQueryRef = useRef<string>("");
  const prevCategoryRef = useRef<string | undefined>(undefined);
  const isInitialMount = useRef(true);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      let data: Event[];

      if (selectedCategory) {
        data = await apiService.getEventsByCategory(selectedCategory);
      } else {
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

  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevSearchQueryRef.current = searchQuery;
      prevCategoryRef.current = selectedCategory;
      loadEvents();
      return;
    }

    const searchQueryChanged = searchQuery !== prevSearchQueryRef.current;
    const categoryChanged = selectedCategory !== prevCategoryRef.current;

    prevSearchQueryRef.current = searchQuery;
    prevCategoryRef.current = selectedCategory;

    if (categoryChanged) {
      loadEvents();
      return;
    }

    if (searchQueryChanged) {
      if (searchQuery.length > 0) {
        searchDebounceTimerRef.current = setTimeout(() => {
          loadEvents();
        }, 500);
      } else {
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
    setSelectedCategory(value || undefined);
    setSearchQuery("");
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery("");
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
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
