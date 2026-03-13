import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [searchParams] = useSearchParams();
  const organizerIdFromUrl = searchParams.get("organizerId") ?? undefined;
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevSearchQueryRef = useRef<string>("");
  const prevCategoryRef = useRef<string | undefined>(undefined);
  const prevOrganizerIdRef = useRef<string | undefined>(undefined);
  const isInitialMount = useRef(true);

  const loadEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      let data: Event[];

      if (selectedCategory) {
        data = await apiService.getEventsByCategory(selectedCategory);
      } else {
        data = await apiService.getEvents(1, 20, searchQuery || undefined, organizerIdFromUrl);
      }

      setEvents(data);
    } catch (error) {
      console.error("Failed to load events:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, organizerIdFromUrl]);

  useEffect(() => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevSearchQueryRef.current = searchQuery;
      prevCategoryRef.current = selectedCategory;
      prevOrganizerIdRef.current = organizerIdFromUrl;
      loadEvents();
      return;
    }

    const searchQueryChanged = searchQuery !== prevSearchQueryRef.current;
    const categoryChanged = selectedCategory !== prevCategoryRef.current;
    const organizerIdChanged = organizerIdFromUrl !== prevOrganizerIdRef.current;

    prevSearchQueryRef.current = searchQuery;
    prevCategoryRef.current = selectedCategory;
    prevOrganizerIdRef.current = organizerIdFromUrl;

    if (categoryChanged || organizerIdChanged) {
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

  const handleCategoryChange = (category: string | undefined) => {
    setSelectedCategory(category);
    if (category) setSearchQuery("");
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery("");
  };

  const resultsLabel = () => {
    if (events.length === 0) return null;
    const count = events.length;
    const location = events[0]?.addressCity || events[0]?.venue;
    if (location) {
      return `Exploring ${count} upcoming event${count !== 1 ? "s" : ""}${location ? ` in ${location}` : ""}`;
    }
    return `Exploring ${count} upcoming event${count !== 1 ? "s" : ""}`;
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
        {/* Search area with dynamic background */}
        <div className="relative rounded-2xl overflow-hidden mb-8">
          {/* Soft purple-to-blue gradient blob + mesh */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-primary/8 to-blue-500/6 blur-3xl" />
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
            <div className="absolute -bottom-16 right-1/3 w-72 h-72 rounded-full bg-primary-glow/5 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
          </div>

          <div className="relative px-4 py-6 sm:py-8">
            {/* Header */}
            <h1 className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight text-gradient-hero mb-2">
              {organizerIdFromUrl ? "More from this organizer" : "Discover Events"}
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              {organizerIdFromUrl
                ? "Other events by the same organizer"
                : "Find and book tickets for amazing events"}
            </p>

            {/* Search bar - glassmorphism + vibrant focus */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mb-4">
              <div className="relative flex-1 group">
                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-300" />
                <div className="relative flex items-center rounded-xl border border-input bg-white/70 dark:bg-white/10 backdrop-blur-md transition-all duration-300 focus-within:border-primary focus-within:shadow-[0_0_0_2px_hsl(var(--primary)_/_0.3),0_0_20px_hsl(var(--primary)_/_0.2)]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200 pointer-events-none" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl h-12"
                    disabled={!!selectedCategory}
                  />
                </div>
              </div>
              {(selectedCategory || searchQuery) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full sm:w-auto shrink-0"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Category pills row - horizontal scroll on mobile for smooth swiping */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:thin] md:flex-wrap md:overflow-visible">
              <button
                type="button"
                onClick={() => handleCategoryChange(undefined)}
                className={`inline-flex items-center shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 snap-start ${
                  selectedCategory === undefined
                    ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground border-primary shadow-md shadow-[0_0_20px_hsl(var(--primary)_/_0.35)]"
                    : "bg-white/20 dark:bg-white/15 backdrop-blur-md border-border text-foreground hover:bg-white/30 hover:scale-105 hover:shadow-lg hover:shadow-[0_0_14px_hsl(var(--primary)_/_0.2)]"
                }`}
              >
                All
              </button>
              {EVENT_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryChange(isSelected ? undefined : category)}
                    className={`inline-flex items-center shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-2 snap-start ${
                      isSelected
                        ? "bg-gradient-to-r from-primary via-primary-glow/90 to-accent text-primary-foreground border-primary shadow-md shadow-[0_0_20px_hsl(var(--primary)_/_0.35)]"
                        : "bg-white/20 dark:bg-white/15 backdrop-blur-md border-border text-foreground hover:bg-white/30 hover:scale-105 hover:shadow-lg hover:shadow-[0_0_14px_hsl(var(--primary)_/_0.2)]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Results indicator - subtle tinted box */}
            {resultsLabel() && (
              <div className="mt-4 inline-block rounded-lg bg-primary/5 dark:bg-primary/10 px-3 py-2 border border-primary/10">
                <p className="text-sm font-semibold text-foreground">
                  {resultsLabel()}
                </p>
              </div>
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
