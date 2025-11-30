import { useEffect, useState } from "react";
import type { Event } from "@/types/api";

const STORAGE_KEY = "eventpro_recently_viewed";
const MAX_RECENT_EVENTS = 6;

interface RecentlyViewedEvent {
  id: string;
  name: string;
  imageUrl?: string;
  startDateTime: string;
  venue?: string;
  viewedAt: number;
}

export const useRecentlyViewed = () => {
  const [recentEvents, setRecentEvents] = useState<RecentlyViewedEvent[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    loadRecentEvents();
  }, []);

  const loadRecentEvents = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const events = JSON.parse(stored) as RecentlyViewedEvent[];
        // Sort by viewedAt descending
        const sorted = events.sort((a, b) => b.viewedAt - a.viewedAt);
        setRecentEvents(sorted);
      }
    } catch (error) {
      console.error("Failed to load recent events:", error);
      setRecentEvents([]);
    }
  };

  const addRecentEvent = (event: Event) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let events: RecentlyViewedEvent[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists
      events = events.filter((e) => e.id !== event.id);

      // Add new event at the beginning
      const newEvent: RecentlyViewedEvent = {
        id: event.id,
        name: event.name,
        imageUrl: event.imageUrl,
        startDateTime: event.startDateTime,
        venue: event.venue,
        viewedAt: Date.now(),
      };

      events.unshift(newEvent);

      // Keep only the last MAX_RECENT_EVENTS
      events = events.slice(0, MAX_RECENT_EVENTS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      setRecentEvents(events);
    } catch (error) {
      console.error("Failed to save recent event:", error);
    }
  };

  const clearRecentEvents = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecentEvents([]);
    } catch (error) {
      console.error("Failed to clear recent events:", error);
    }
  };

  const removeRecentEvent = (eventId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      let events: RecentlyViewedEvent[] = JSON.parse(stored);
      events = events.filter((e) => e.id !== eventId);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      setRecentEvents(events);
    } catch (error) {
      console.error("Failed to remove recent event:", error);
    }
  };

  return {
    recentEvents,
    addRecentEvent,
    clearRecentEvents,
    removeRecentEvent,
    hasRecentEvents: recentEvents.length > 0,
  };
};
